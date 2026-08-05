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

interface Tenant {
  id: string;
  name: string;
  document: string | null;
  contact: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
}

interface Room {
  id: string;
  name: string;
  room_number: string | null;
  address: string | null;
  tenant_id: string | null;
  monthly_value: number;
  due_day: number | null;
  notes: string | null;
  active: boolean;
  tenant?: Tenant;
}

const emptyRoomForm = {
  name: '',
  room_number: '',
  address: '',
  tenant_id: '',
  monthly_value: 0,
  due_day: 5,
  notes: '',
  active: true,
};

const emptyTenantForm = {
  name: '',
  document: '',
  contact: '',
  email: '',
  notes: '',
  active: true,
};

export default function SubleasedRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Room state
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  
  // Tenant state
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);

  const [receiveRoom, setReceiveRoom] = useState<Room | null>(null);
  const [receiveDate, setReceiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [receiveAmount, setReceiveAmount] = useState(0);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [roomsRes, tenantsRes] = await Promise.all([
      (supabase as any).from('subleased_rooms').select('*, tenant:subleased_tenants(*)').order('created_at', { ascending: false }),
      (supabase as any).from('subleased_tenants').select('*').order('name', { ascending: true })
    ]);

    if (roomsRes.error) toast({ title: 'Erro ao buscar salas', description: roomsRes.error.message, variant: 'destructive' });
    if (tenantsRes.error) toast({ title: 'Erro ao buscar locatários', description: tenantsRes.error.message, variant: 'destructive' });

    setRooms((roomsRes.data ?? []) as Room[]);
    setTenants((tenantsRes.data ?? []) as Tenant[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Room Actions
  const openNewRoom = () => { setEditingRoomId(null); setRoomForm(emptyRoomForm); setRoomDialogOpen(true); };
  const openEditRoom = (r: Room) => {
    setEditingRoomId(r.id);
    setRoomForm({
      name: r.name,
      room_number: r.room_number ?? '',
      address: r.address ?? '',
      tenant_id: r.tenant_id ?? '',
      monthly_value: Number(r.monthly_value),
      due_day: r.due_day ?? 5,
      notes: r.notes ?? '',
      active: r.active,
    });
    setRoomDialogOpen(true);
  };

  const saveRoom = async () => {
    if (!roomForm.name) {
      toast({ title: 'Informe o nome / identificação da sala', variant: 'destructive' });
      return;
    }
    const payload = {
      ...roomForm,
      tenant_id: roomForm.tenant_id || null,
    };
    const { error } = editingRoomId
      ? await (supabase as any).from('subleased_rooms').update(payload).eq('id', editingRoomId)
      : await (supabase as any).from('subleased_rooms').insert([payload]);
    
    if (error) {
      toast({ title: 'Erro ao salvar sala', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingRoomId ? 'Sala atualizada' : 'Sala cadastrada' });
    setRoomDialogOpen(false);
    fetchData();
  };

  const removeRoom = async () => {
    if (!deleteRoomId) return;
    const { error } = await (supabase as any).from('subleased_rooms').delete().eq('id', deleteRoomId);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'Sala excluída' });
    setDeleteRoomId(null);
    fetchData();
  };

  // Tenant Actions
  const openNewTenant = () => { setEditingTenantId(null); setTenantForm(emptyTenantForm); setTenantDialogOpen(true); };
  const openEditTenant = (t: Tenant) => {
    setEditingTenantId(t.id);
    setTenantForm({
      name: t.name,
      document: t.document ?? '',
      contact: t.contact ?? '',
      email: t.email ?? '',
      notes: t.notes ?? '',
      active: t.active,
    });
    setTenantDialogOpen(true);
  };

  const saveTenant = async () => {
    if (!tenantForm.name) {
      toast({ title: 'Informe o nome do locatário', variant: 'destructive' });
      return;
    }
    const { error } = editingTenantId
      ? await (supabase as any).from('subleased_tenants').update(tenantForm).eq('id', editingTenantId)
      : await (supabase as any).from('subleased_tenants').insert([tenantForm]);
    
    if (error) {
      toast({ title: 'Erro ao salvar locatário', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editingTenantId ? 'Locatário atualizado' : 'Locatário cadastrado' });
    setTenantDialogOpen(false);
    fetchData();
  };

  const removeTenant = async () => {
    if (!deleteTenantId) return;
    const { error } = await (supabase as any).from('subleased_tenants').delete().eq('id', deleteTenantId);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: 'Locatário excluído' });
    setDeleteTenantId(null);
    fetchData();
  };

  const openReceive = (r: Room) => {
    setReceiveRoom(r);
    setReceiveAmount(Number(r.monthly_value));
    setReceiveDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const confirmReceive = async () => {
    if (!receiveRoom) return;
    const tName = receiveRoom.tenant?.name || 'N/A';
    const { error } = await supabase.from('cash_flow_entries').insert([{
      entry_type: 'entrada',
      category: 'Sala Sublocada',
      description: `Aluguel - ${receiveRoom.name} (${tName})`,
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
          <p className="text-sm text-muted-foreground">Gerencie as salas sublocadas e locatários.</p>
        </div>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="rooms" className="flex items-center gap-2"><Home className="h-4 w-4" /> Salas</TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2"><Users className="h-4 w-4" /> Locatários</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={openNewRoom}><Plus className="h-4 w-4 mr-2" /> Nova Sala</Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sala</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Locatário</TableHead>
                  <TableHead className="text-right">Valor mensal</TableHead>
                  <TableHead>Venc.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : rooms.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Nenhuma sala cadastrada.</TableCell></TableRow>
                ) : rooms.map((r, i) => (
                  <TableRow key={r.id} className={i % 2 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium">
                      {r.name}{r.room_number ? <span className="text-muted-foreground"> · nº {r.room_number}</span> : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.address || '-'}</TableCell>
                    <TableCell>
                      {r.tenant?.name ? (
                        <div className="flex flex-col">
                          <span>{r.tenant.name}</span>
                          <span className="text-xs text-muted-foreground">{r.tenant.contact}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">R$ {Number(r.monthly_value).toFixed(2)}</TableCell>
                    <TableCell>{r.due_day ? `Dia ${r.due_day}` : '-'}</TableCell>
                    <TableCell><Badge variant={r.active ? 'default' : 'secondary'}>{r.active ? 'Ativa' : 'Inativa'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline" onClick={() => openReceive(r)} title="Registrar recebimento">
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditRoom(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteRoomId(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={openNewTenant}><Plus className="h-4 w-4 mr-2" /> Novo Locatário</Button>
          </div>

          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : tenants.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhum locatário cadastrado.</TableCell></TableRow>
                ) : tenants.map((t, i) => (
                  <TableRow key={t.id} className={i % 2 ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.document || '-'}</TableCell>
                    <TableCell>{t.contact || '-'}</TableCell>
                    <TableCell>{t.email || '-'}</TableCell>
                    <TableCell><Badge variant={t.active ? 'default' : 'secondary'}>{t.active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => openEditTenant(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTenantId(t.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Room Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingRoomId ? 'Editar Sala' : 'Nova Sala'}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-[1fr_140px] gap-3">
              <div><Label>Nome / Identificação *</Label><Input value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} /></div>
              <div><Label>Nº da sala</Label><Input value={roomForm.room_number} onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })} /></div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={roomForm.address} onChange={e => setRoomForm({ ...roomForm, address: e.target.value })} />
            </div>
            <div>
              <Label>Locatário</Label>
              <Select value={roomForm.tenant_id} onValueChange={v => setRoomForm({ ...roomForm, tenant_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um locatário" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.filter(t => t.active).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor mensal (R$)</Label><CurrencyInput value={roomForm.monthly_value} onChange={v => setRoomForm({ ...roomForm, monthly_value: v })} /></div>
              <div><Label>Dia de vencimento</Label><Input type="number" min={1} max={31} value={roomForm.due_day} onChange={e => setRoomForm({ ...roomForm, due_day: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={roomForm.notes} onChange={e => setRoomForm({ ...roomForm, notes: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={roomForm.active} onChange={e => setRoomForm({ ...roomForm, active: e.target.checked })} />
              Ativa
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveRoom}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Dialog */}
      <Dialog open={tenantDialogOpen} onOpenChange={setTenantDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTenantId ? 'Editar Locatário' : 'Novo Locatário'}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Nome Completo *</Label><Input value={tenantForm.name} onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CPF / CNPJ</Label><Input value={tenantForm.document} onChange={e => setTenantForm({ ...tenantForm, document: e.target.value })} /></div>
              <div><Label>Contato</Label><Input value={tenantForm.contact} onChange={e => setTenantForm({ ...tenantForm, contact: e.target.value })} /></div>
            </div>
            <div><Label>E-mail</Label><Input type="email" value={tenantForm.email} onChange={e => setTenantForm({ ...tenantForm, email: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={tenantForm.notes} onChange={e => setTenantForm({ ...tenantForm, notes: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tenantForm.active} onChange={e => setTenantForm({ ...tenantForm, active: e.target.checked })} />
              Ativo
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTenantDialogOpen(false)}>Cancelar</Button>
              <Button onClick={saveTenant}>Salvar</Button>
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
                <strong>{receiveRoom.name}</strong> — {receiveRoom.tenant?.name || 'N/A'}
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

      {/* Delete Room Alert */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={(o) => !o && setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sala?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeRoom}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tenant Alert */}
      <AlertDialog open={!!deleteTenantId} onOpenChange={(o) => !o && setDeleteTenantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir locatário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Isso pode afetar as salas vinculadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeTenant}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
