import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Circle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface Room {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface Occupancy {
  room_id: string;
  appointment_id: string;
  patient_name: string;
  professional_name: string;
  procedure_name: string | null;
  start_time: string;
  end_time: string;
  status: string;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [occupancy, setOccupancy] = useState<Record<string, Occupancy>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    fetchOccupancy();
    const interval = setInterval(() => {
      setNow(new Date());
      fetchOccupancy();
    }, 30000);
    const channel = supabase
      .channel('rooms-occupancy')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchOccupancy())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointment_sessions' }, () => fetchOccupancy())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await (supabase as any).from('rooms').select('*').order('name');
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return; }
    setRooms(data || []);
    setLoading(false);
  };

  const fetchOccupancy = async () => {
    // Usa horário de Brasília independente do fuso do navegador/servidor
    const brNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const today = format(brNow, 'yyyy-MM-dd');
    const currentTime = format(brNow, 'HH:mm:ss');

    // Main appointments occupying rooms right now
    const { data: appts } = await (supabase as any)
      .from('appointments')
      .select(`
        id, room_id, start_time, end_time, status,
        patient:patients(full_name),
        professional:professionals(full_name),
        procedure:procedures(name)
      `)
      .not('room_id', 'is', null)
      .eq('appointment_date', today)
      .lte('start_time', currentTime)
      .gte('end_time', currentTime)
      .not('status', 'in', '(cancelado,faltou,finalizado)');

    // Sessions
    const { data: sess } = await (supabase as any)
      .from('appointment_sessions')
      .select(`
        appointment_id, session_date, start_time, end_time, status,
        appointment:appointments!inner(
          id, room_id, status,
          patient:patients(full_name),
          professional:professionals(full_name),
          procedure:procedures(name)
        )
      `)
      .eq('session_date', today)
      .lte('start_time', currentTime)
      .gte('end_time', currentTime)
      .not('status', 'in', '(cancelado,faltou,finalizado)');

    const map: Record<string, Occupancy> = {};
    (appts || []).forEach((a: any) => {
      if (!a.room_id) return;
      map[a.room_id] = {
        room_id: a.room_id,
        appointment_id: a.id,
        patient_name: a.patient?.full_name || '—',
        professional_name: a.professional?.full_name || '—',
        procedure_name: a.procedure?.name || null,
        start_time: a.start_time,
        end_time: a.end_time,
        status: a.status,
      };
    });
    (sess || []).forEach((s: any) => {
      const roomId = s.appointment?.room_id;
      if (!roomId || map[roomId]) return;
      map[roomId] = {
        room_id: roomId,
        appointment_id: s.appointment.id,
        patient_name: s.appointment?.patient?.full_name || '—',
        professional_name: s.appointment?.professional?.full_name || '—',
        procedure_name: s.appointment?.procedure?.name || null,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
      };
    });
    setOccupancy(map);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, description: description || null, active };
    const { error } = editing
      ? await (supabase as any).from('rooms').update(payload).eq('id', editing.id)
      : await (supabase as any).from('rooms').insert([payload]);
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return; }
    toast({ title: editing ? 'Sala atualizada!' : 'Sala cadastrada!' });
    setDialogOpen(false);
    setEditing(null); setName(''); setDescription(''); setActive(true);
    fetchRooms();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await (supabase as any).from('rooms').delete().eq('id', deleteId);
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
    else { toast({ title: 'Sala removida!' }); fetchRooms(); }
    setDeleteId(null);
  };

  const openEdit = (r: Room) => {
    setEditing(r); setName(r.name); setDescription(r.description || ''); setActive(r.active);
    setDialogOpen(true);
  };
  const openNew = () => {
    setEditing(null); setName(''); setDescription(''); setActive(true);
    setDialogOpen(true);
  };

  const occupiedCount = Object.keys(occupancy).length;
  const availableCount = rooms.filter(r => r.active && !occupancy[r.id]).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salas</h1>
          <p className="text-muted-foreground">
            Ocupação em tempo real • {format(now, 'HH:mm')} • {availableCount} livres · {occupiedCount} ocupadas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Sala</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Sala' : 'Nova Sala'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Sala 01" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Andar, equipamentos, observações..." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={active} onCheckedChange={setActive} />
                <Label>Ativa</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sala</TableHead>
              <TableHead>Ocupação atual</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
            ) : rooms.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center">Nenhuma sala cadastrada</TableCell></TableRow>
            ) : rooms.map((r) => {
              const occ = occupancy[r.id];
              const isOccupied = !!occ;
              return (
                <TableRow key={r.id} className={isOccupied ? 'bg-red-50/50' : ''}>
                  <TableCell className="font-medium">
                    <div>{r.name}</div>
                    {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                    {!r.active && <span className="text-xs text-muted-foreground">(Inativa)</span>}
                  </TableCell>
                  <TableCell>
                    {!r.active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs bg-muted text-muted-foreground">
                        <Circle className="h-2 w-2 fill-current" /> Inativa
                      </span>
                    ) : isOccupied ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs bg-red-100 text-red-700 font-medium">
                          <Circle className="h-2 w-2 fill-current animate-pulse" /> Ocupada
                        </span>
                        {occ.procedure_name && (
                          <div className="text-xs text-muted-foreground">{occ.procedure_name}</div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs bg-green-100 text-green-700 font-medium">
                        <Circle className="h-2 w-2 fill-current" /> Livre
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{occ?.professional_name || '—'}</TableCell>
                  <TableCell className="text-sm">{occ?.patient_name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {occ ? `${occ.start_time?.slice(0,5)} - ${occ.end_time?.slice(0,5)}` : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Editar"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)} title="Remover" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        A sala só é liberada quando o agendamento for marcado como <strong>Finalizado</strong> (ou Cancelado / Faltou) na agenda.
      </p>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover esta sala? Agendamentos vinculados ficarão sem sala.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
