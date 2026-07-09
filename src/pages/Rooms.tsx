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
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Room {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    const { data, error } = await (supabase as any).from('rooms').select('*').order('name');
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return; }
    setRooms(data || []);
    setLoading(false);
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salas</h1>
          <p className="text-muted-foreground">Cadastre as salas da clínica utilizadas nos agendamentos</p>
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
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
            ) : rooms.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">Nenhuma sala cadastrada</TableCell></TableRow>
            ) : rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.description || '-'}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs ${r.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.active ? 'Ativa' : 'Inativa'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Editar"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)} title="Remover" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
