import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, DollarSign, Clock, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Payout {
  id: string;
  payout_amount: number;
  reference_date: string;
  status: string;
  payment_date: string | null;
  professional: { id: string; full_name: string } | null;
  procedure: { name: string } | null;
  medical_guide: { guide_number: string } | null;
}

interface Professional {
  id: string;
  full_name: string;
}

interface ProfessionalFee {
  id: string;
  professional_id: string;
  procedure_id: string | null;
  fee_type: string;
  fixed_value: number;
  percentage_value: number;
  per_procedure_value: number;
  professional: { full_name: string } | null;
  procedure: { name: string } | null;
}

interface Procedure {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
};

export default function ProfessionalPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [fees, setFees] = useState<ProfessionalFee[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago'>('all');
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [feeForm, setFeeForm] = useState({
    professional_id: '',
    procedure_id: '',
    fee_type: 'fixed' as 'fixed' | 'percentage' | 'per_procedure',
    fixed_value: 0,
    percentage_value: 0,
    per_procedure_value: 0,
  });
  const [deleteFeeId, setDeleteFeeId] = useState<string | null>(null);
  const [deletePayoutId, setDeletePayoutId] = useState<string | null>(null);
  const [editPayoutDialogOpen, setEditPayoutDialogOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState<Payout | null>(null);
  const [editPayoutForm, setEditPayoutForm] = useState({
    payout_amount: 0,
    reference_date: '',
    notes: '',
  });
  const { toast } = useToast();

  const [stats, setStats] = useState({
    totalPendente: 0,
    totalPago: 0,
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    await Promise.all([
      fetchPayouts(),
      fetchFees(),
      fetchProfessionals(),
      fetchProcedures(),
    ]);
    setLoading(false);
  };

  const fetchPayouts = async () => {
    let query = supabase
      .from('professional_payouts')
      .select(`
        *,
        professional:professionals(id, full_name),
        procedure:procedures(name),
        medical_guide:medical_guides(guide_number)
      `)
      .order('reference_date', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setPayouts((data as any) || []);
    
    const pendentes = (data || []).filter((p: any) => p.status === 'pendente');
    const pagos = (data || []).filter((p: any) => p.status === 'pago');
    setStats({
      totalPendente: pendentes.reduce((acc: number, p: any) => acc + Number(p.payout_amount), 0),
      totalPago: pagos.reduce((acc: number, p: any) => acc + Number(p.payout_amount), 0),
    });
  };

  const fetchFees = async () => {
    const { data } = await supabase
      .from('professional_fees')
      .select(`
        *,
        professional:professionals(full_name),
        procedure:procedures(name)
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });
    setFees((data as any) || []);
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('professionals').select('id, full_name').eq('active', true).order('full_name');
    setProfessionals(data || []);
  };

  const fetchProcedures = async () => {
    const { data } = await supabase.from('procedures').select('id, name').eq('active', true).order('name');
    setProcedures(data || []);
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      professional_id: feeForm.professional_id,
      procedure_id: feeForm.procedure_id || null,
      fee_type: feeForm.fee_type,
      fixed_value: feeForm.fee_type === 'fixed' ? feeForm.fixed_value : 0,
      percentage_value: feeForm.fee_type === 'percentage' ? feeForm.percentage_value : 0,
      per_procedure_value: feeForm.fee_type === 'per_procedure' ? feeForm.per_procedure_value : 0,
    };

    let error;
    if (editingFeeId) {
      ({ error } = await supabase.from('professional_fees').update(payload).eq('id', editingFeeId));
    } else {
      ({ error } = await supabase.from('professional_fees').insert([payload]));
    }

    if (error) {
      if (error.code === '23505') {
        toast({ variant: 'destructive', title: 'Erro', description: 'Configuração já existe para este profissional/procedimento' });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      }
      return;
    }

    toast({ title: editingFeeId ? 'Configuração atualizada!' : 'Configuração de repasse salva!' });
    setFeeDialogOpen(false);
    setEditingFeeId(null);
    resetFeeForm();
    fetchFees();
  };

  const resetFeeForm = () => {
    setFeeForm({
      professional_id: '',
      procedure_id: '',
      fee_type: 'fixed',
      fixed_value: 0,
      percentage_value: 0,
      per_procedure_value: 0,
    });
  };

  const handleEditFee = (fee: ProfessionalFee) => {
    setEditingFeeId(fee.id);
    setFeeForm({
      professional_id: fee.professional_id,
      procedure_id: fee.procedure_id || '',
      fee_type: fee.fee_type as any,
      fixed_value: Number(fee.fixed_value),
      percentage_value: Number(fee.percentage_value),
      per_procedure_value: Number(fee.per_procedure_value),
    });
    setFeeDialogOpen(true);
  };

  const handlePayoutStatus = async (id: string, status: 'pendente' | 'pago') => {
    const update: any = { status };
    if (status === 'pago') {
      update.payment_date = format(new Date(), 'yyyy-MM-dd');
    }

    const { error } = await supabase.from('professional_payouts').update(update).eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    toast({ title: 'Status atualizado!' });
    fetchPayouts();
  };

  const handleDeleteFee = async () => {
    if (!deleteFeeId) return;
    const { error } = await supabase.from('professional_fees').delete().eq('id', deleteFeeId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Configuração removida!' });
      fetchFees();
    }
    setDeleteFeeId(null);
  };

  const handleEditPayout = (p: Payout) => {
    setEditingPayout(p);
    setEditPayoutForm({
      payout_amount: p.payout_amount,
      reference_date: p.reference_date,
      notes: '',
    });
    setEditPayoutDialogOpen(true);
  };

  const handleUpdatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayout) return;
    const { error } = await supabase.from('professional_payouts').update({
      payout_amount: editPayoutForm.payout_amount,
      reference_date: editPayoutForm.reference_date,
    }).eq('id', editingPayout.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    toast({ title: 'Repasse atualizado!' });
    setEditPayoutDialogOpen(false);
    setEditingPayout(null);
    fetchPayouts();
  };

  const handleDeletePayout = async () => {
    if (!deletePayoutId) return;
    const { error } = await supabase.from('professional_payouts').delete().eq('id', deletePayoutId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Repasse removido com sucesso!' });
      fetchPayouts();
    }
    setDeletePayoutId(null);
  };

  const filtered = payouts.filter((p) =>
    p.professional?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.medical_guide?.guide_number.includes(search)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getFeeDescription = (fee: ProfessionalFee) => {
    if (fee.fee_type === 'fixed') return `Fixo: ${formatCurrency(Number(fee.fixed_value))}`;
    if (fee.fee_type === 'percentage') return `${fee.percentage_value}%`;
    return `Por proc.: ${formatCurrency(Number(fee.per_procedure_value))}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repasse Profissionais</h1>
          <p className="text-muted-foreground">Gerencie os repasses dos profissionais</p>
        </div>
        <Dialog open={feeDialogOpen} onOpenChange={(open) => { setFeeDialogOpen(open); if (!open) { setEditingFeeId(null); resetFeeForm(); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingFeeId(null); resetFeeForm(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Config. Repasse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFeeId ? 'Editar Configuração de Repasse' : 'Configurar Repasse'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFeeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Profissional *</Label>
                <Select
                  value={feeForm.professional_id}
                  onValueChange={(v) => setFeeForm({ ...feeForm, professional_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Procedimento (opcional - deixe vazio para valor padrão)</Label>
                <Select
                  value={feeForm.procedure_id}
                  onValueChange={(v) => setFeeForm({ ...feeForm, procedure_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os procedimentos" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Repasse *</Label>
                <Select
                  value={feeForm.fee_type}
                  onValueChange={(v) => setFeeForm({ ...feeForm, fee_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Valor Fixo por Consulta</SelectItem>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="per_procedure">Valor por Procedimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {feeForm.fee_type === 'fixed' && (
                <div className="space-y-2">
                  <Label>Valor Fixo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={feeForm.fixed_value}
                    onChange={(e) => setFeeForm({ ...feeForm, fixed_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              {feeForm.fee_type === 'percentage' && (
                <div className="space-y-2">
                  <Label>Percentual (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={feeForm.percentage_value}
                    onChange={(e) => setFeeForm({ ...feeForm, percentage_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              {feeForm.fee_type === 'per_procedure' && (
                <div className="space-y-2">
                  <Label>Valor por Procedimento (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={feeForm.per_procedure_value}
                    onChange={(e) => setFeeForm({ ...feeForm, per_procedure_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFeeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPendente)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPago)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Configurations */}
      {fees.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Configurações de Repasse</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.professional?.full_name}</TableCell>
                    <TableCell>{fee.procedure?.name || 'Todos'}</TableCell>
                    <TableCell>{getFeeDescription(fee)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => handleEditFee(fee)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteFeeId(fee.id)} title="Remover" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profissional</TableHead>
              <TableHead>Guia</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Data Ref.</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Nenhum repasse encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.professional?.full_name || '-'}</TableCell>
                  <TableCell className="font-mono">{p.medical_guide?.guide_number || '-'}</TableCell>
                  <TableCell>{p.procedure?.name || '-'}</TableCell>
                  <TableCell>{format(new Date(p.reference_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(p.payout_amount))}</TableCell>
                  <TableCell>
                    <span className={cn('rounded-full px-2 py-1 text-xs capitalize', statusColors[p.status])}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {p.status === 'pendente' && (
                        <Button size="sm" variant="outline" onClick={() => handlePayoutStatus(p.id, 'pago')}>
                          Pagar
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEditPayout(p)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletePayoutId(p.id)} title="Remover" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editPayoutDialogOpen} onOpenChange={setEditPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Repasse</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePayout} className="space-y-4">
            <div className="space-y-2">
              <Label>Profissional</Label>
              <Input value={editingPayout?.professional?.full_name || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={editPayoutForm.payout_amount}
                onChange={(e) => setEditPayoutForm({ ...editPayoutForm, payout_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Referência</Label>
              <Input
                type="date"
                value={editPayoutForm.reference_date}
                onChange={(e) => setEditPayoutForm({ ...editPayoutForm, reference_date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditPayoutDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePayoutId} onOpenChange={(open) => !open && setDeletePayoutId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este repasse? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
