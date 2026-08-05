import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, DollarSign, Home, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Room {
  id: string;
  name: string;
  room_number: string | null;
  address: string | null;
  tenant_name: string | null;
  tenant_contact: string | null;
  monthly_value: number;
  due_day: number | null;
  notes: string | null;
  active: boolean;
}

const emptyForm = {
  name: '',
  room_number: '',
  address: '',
  tenant_name: '',
  tenant_contact: '',
  monthly_value: 0,
  due_day: 5,
  notes: '',
  active: true,
};

export default function SubleasedRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [receiveRoom, setReceiveRoom] = useState<Room | null>(null);
  const [receiveDate, setReceiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [receiveAmount, setReceiveAmount] = useState(0);
  const { toast } = useToast();

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('subleased_rooms')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    setRooms((data ?? []) as Room[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: Room) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      room_number: r.room_number ?? '',
      address: r.address ?? '',
      tenant_name: r.tenant_name ?? '',
      tenant_contact: r.tenant_contact ?? '',
      monthly_value: Number(r.monthly_value),
      due_day: r.due_day ?? 5,
      notes: r.notes ?? '',
      active: r.active,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name) {
      toast({ title: 'Informe o nome / identificação da sala', variant: 'destructive' });
      return;
    }
    const payload = {
      name: form.name,
      room_number: form.room_number || null,
      address: form.address || null,
      tenant_name: form.tenant_name || null,
      tenant_contact: form.tenant_contact || null,
      monthly_value: form.monthly_value,
      due_day: form.due_day || null,
      notes: form.notes || null,
      active: form.active,
    };
    const { error } = editingId
      ? await (supabase as any).from('subleased_rooms').update(payload).eq('id', editingId)
      : await (supabase as any).from('subleased_rooms').insert([payload]);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingId ? 'Sala atualizada' : 'Sala cadastrada' });
    setDialogOpen(false);
    fetch();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await (supabase as any).from('subleased_rooms').delete().eq('id', deleteId);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'Sala excluída' });
    setDeleteId(null);
    fetch();
  };

  const openReceive = (r: Room) => {
    setReceiveRoom(r);
    setReceiveAmount(Number(r.monthly_value));
    setReceiveDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const confirmReceive = async () => {
    if (!receiveRoom) return;
    const { error } = await supabase.from('cash_flow_entries').insert([{
      entry_type: 'entrada',
      category: 'Sala Sublocada',
      description: `Aluguel - ${receiveRoom.name} (${receiveRoom.tenant_name})`,
      amount: receiveAmount,
      entry_date: receiveDate,
    }]);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Recebimento lançado no Fluxo de Caixa' });
    setReceiveRoom(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Home className="h-6 w-6" /> Salas Sublocadas</h1>
          <p className="text-sm text-muted-foreground">Cadastre as salas sublocadas. Os recebimentos são lançados no Fluxo de Caixa.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova Sala</Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sala</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Locatário</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="text-right">Valor mensal</TableHead>
              <TableHead>Venc.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : rooms.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Nenhuma sala cadastrada.</TableCell></TableRow>
            ) : rooms.map((r, i) => (
              <TableRow key={r.id} className={i % 2 ? 'bg-muted/30' : ''}>
                <TableCell className="font-medium">
                  {r.name}{r.room_number ? <span className="text-muted-foreground"> · nº {r.room_number}</span> : null}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.address || '-'}</TableCell>
                <TableCell>{r.tenant_name || '-'}</TableCell>
                <TableCell className="text-sm">{r.tenant_contact || '-'}</TableCell>
                <TableCell className="text-right font-mono">R$ {Number(r.monthly_value).toFixed(2)}</TableCell>
                <TableCell>{r.due_day ? `Dia ${r.due_day}` : '-'}</TableCell>
                <TableCell><Badge variant={r.active ? 'default' : 'secondary'}>{r.active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => openReceive(r)} title="Registrar recebimento">
                      <DollarSign className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Sala' : 'Nova Sala'}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <div><Label>Nome / Identificação *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Nº da sala</Label><Input value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} /></div>
            </div>
            <div>
              <Label>CEP</Label>
              <Input
                placeholder="00000-000"
                maxLength={9}
                onChange={async (e) => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 8);
                  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
                  e.target.value = v;
                  const digits = v.replace(/\D/g, '');
                  if (digits.length === 8) {
                    try {
                      const r = await window.fetch(`https://viacep.com.br/ws/${digits}/json/`);
                      const d = await r.json();
                      if (!d.erro) {
                        const addr = `${d.logradouro}${d.bairro ? ', ' + d.bairro : ''} - ${d.localidade}/${d.uf}`;
                        setForm(f => ({ ...f, address: addr }));
                      }
                    } catch {}
                  }
                }}
              />
            </div>
            <div><Label>Endereço</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Locatário</Label><Input value={form.tenant_name} onChange={e => setForm({ ...form, tenant_name: e.target.value })} /></div>
              <div><Label>Contato</Label><Input value={form.tenant_contact} onChange={e => setForm({ ...form, tenant_contact: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor mensal (R$)</Label><CurrencyInput value={form.monthly_value} onChange={v => setForm({ ...form, monthly_value: v })} /></div>
              <div><Label>Dia de vencimento</Label><Input type="number" min={1} max={31} value={form.due_day} onChange={e => setForm({ ...form, due_day: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
              Ativa
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={save}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={!!receiveRoom} onOpenChange={(o) => !o && setReceiveRoom(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Recebimento</DialogTitle></DialogHeader>
          {receiveRoom && (
            <div className="grid gap-3">
              <p className="text-sm text-muted-foreground">
                <strong>{receiveRoom.name}</strong> — {receiveRoom.tenant_name}
              </p>
              <div><Label>Valor recebido (R$)</Label><CurrencyInput value={receiveAmount} onChange={setReceiveAmount} /></div>
              <div><Label>Data do recebimento</Label><Input type="date" value={receiveDate} onChange={e => setReceiveDate(e.target.value)} /></div>
              <p className="text-xs text-muted-foreground">Será lançado como entrada no Fluxo de Caixa (categoria "Sala Sublocada").</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReceiveRoom(null)}>Cancelar</Button>
                <Button onClick={confirmReceive}>Lançar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sala?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
