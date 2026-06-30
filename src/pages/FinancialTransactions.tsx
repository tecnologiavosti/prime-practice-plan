import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientCombobox } from '@/components/patient/PatientCombobox';
import { ProfessionalCombobox } from '@/components/professional/ProfessionalCombobox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, DollarSign, FileText, Clock, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DiverseReceiptsPanel } from '@/components/financial/DiverseReceiptsPanel';

interface Transaction {
  id: string;
  transaction_type: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  payment_date: string | null;
  status: string;
  patient: { full_name: string } | null;
  professional: { full_name: string } | null;
  health_insurance: { name: string } | null;
  medical_guide: { guide_number: string } | null;
  payment_method: { name: string } | null;
  procedure: { name: string } | null;
}

interface Patient {
  id: string;
  full_name: string;
}

interface Professional {
  id: string;
  full_name: string;
}

interface HealthInsurance {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface Procedure {
  id: string;
  name: string;
  private_price: number;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const emptyForm = {
  transaction_type: 'particular' as 'particular' | 'convenio',
  patient_id: '',
  professional_id: '',
  health_insurance_id: '',
  procedure_id: '',
  amount: 0,
  due_date: format(new Date(), 'yyyy-MM-dd'),
  payment_method_id: '',
  description: '',
};

export default function FinancialTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'geral' | 'particular' | 'convenio' | 'diversos'>('geral');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'particular' | 'convenio'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'pago' | 'cancelado'>('all');
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');
  const [insuranceFilter, setInsuranceFilter] = useState<string>('all');
  const [procedureFilter, setProcedureFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dueFrom, setDueFrom] = useState<string>('');
  const [dueTo, setDueTo] = useState<string>('');
  const [payFrom, setPayFrom] = useState<string>('');
  const [payTo, setPayTo] = useState<string>('');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (tab === 'particular') setTypeFilter('particular');
    else if (tab === 'convenio') setTypeFilter('convenio');
    else if (tab === 'geral') setTypeFilter('all');
  }, [tab]);

  const [stats, setStats] = useState({
    totalPendente: 0,
    totalPago: 0,
    countPendente: 0,
    countPago: 0,
  });

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  const fetchData = async () => {
    await Promise.all([
      fetchTransactions(),
      fetchPatients(),
      fetchProfessionals(),
      fetchInsurances(),
      fetchPaymentMethods(),
      fetchProcedures(),
    ]);
    setLoading(false);
  };

  const fetchTransactions = async () => {
    let query = supabase
      .from('financial_transactions')
      .select(`
        *,
        patient:patients(full_name),
        professional:professionals(full_name),
        health_insurance:health_insurances(name),
        medical_guide:medical_guides(guide_number),
        payment_method:payment_methods(name),
        procedure:procedures(name)
      `)
      .order('created_at', { ascending: false });

    if (typeFilter !== 'all') {
      query = query.eq('transaction_type', typeFilter);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setTransactions((data as any) || []);
    calculateStats(data || []);
  };

  const calculateStats = (data: any[]) => {
    const pendentes = data.filter(t => t.status === 'pendente');
    const pagos = data.filter(t => t.status === 'pago');
    setStats({
      totalPendente: pendentes.reduce((acc, t) => acc + Number(t.amount), 0),
      totalPago: pagos.reduce((acc, t) => acc + Number(t.amount), 0),
      countPendente: pendentes.length,
      countPago: pagos.length,
    });
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, full_name').eq('active', true).order('full_name');
    setPatients(data || []);
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('professionals').select('id, full_name').eq('active', true).order('full_name');
    setProfessionals(data || []);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase.from('health_insurances').select('id, name').eq('active', true).order('name');
    setInsurances(data || []);
  };

  const fetchPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('id, name').eq('active', true).order('name');
    setPaymentMethods(data || []);
  };

  const fetchProcedures = async () => {
    const { data } = await supabase.from('procedures').select('id, name, private_price').eq('active', true).order('name');
    setProcedures(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      transaction_type: formData.transaction_type,
      patient_id: formData.patient_id || null,
      professional_id: formData.professional_id || null,
      health_insurance_id: formData.transaction_type === 'convenio' ? formData.health_insurance_id || null : null,
      procedure_id: formData.procedure_id || null,
      amount: formData.amount,
      due_date: formData.due_date || null,
      payment_method_id: formData.transaction_type === 'particular' ? formData.payment_method_id || null : null,
      description: formData.description || null,
      status: 'pendente',
    };

    const { error } = await supabase.from('financial_transactions').insert([payload]);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    toast({ title: 'Lançamento criado com sucesso!' });
    setDialogOpen(false);
    setFormData(emptyForm);
    fetchTransactions();
  };

  const handleStatusChange = async (id: string, newStatus: string, paymentMethodId?: string) => {
    const update: any = { status: newStatus };
    if (newStatus === 'pago') {
      update.payment_date = format(new Date(), 'yyyy-MM-dd');
      if (paymentMethodId) update.payment_method_id = paymentMethodId;
    }

    const { error } = await supabase.from('financial_transactions').update(update).eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    toast({ title: 'Status atualizado!' });
    fetchTransactions();
  };

  const handleProcedureChange = (procedureId: string) => {
    const procedure = procedures.find(p => p.id === procedureId);
    if (procedure) {
      setFormData({ ...formData, procedure_id: procedureId, amount: Number(procedure.private_price) });
    } else {
      setFormData({ ...formData, procedure_id: procedureId });
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      transaction_type: t.transaction_type as any,
      patient_id: (t as any).patient_id || '',
      professional_id: (t as any).professional_id || '',
      health_insurance_id: (t as any).health_insurance_id || '',
      procedure_id: (t as any).procedure_id || '',
      amount: Number(t.amount),
      due_date: t.due_date || format(new Date(), 'yyyy-MM-dd'),
      payment_method_id: (t as any).payment_method_id || '',
      description: t.description || '',
    });
    setDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('financial_transactions').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Lançamento removido com sucesso!' });
      fetchTransactions();
    }
    setDeleteId(null);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setProfessionalFilter('all');
    setInsuranceFilter('all');
    setProcedureFilter('all');
    setPaymentMethodFilter('all');
    setDueFrom(''); setDueTo('');
    setPayFrom(''); setPayTo('');
    setAmountMin(''); setAmountMax('');
  };

  const filtered = transactions.filter((t: any) => {
    const term = search.trim().toLowerCase();
    if (term) {
      const haystack = [
        t.patient?.full_name,
        t.professional?.full_name,
        t.medical_guide?.guide_number,
        t.description,
        t.procedure?.name,
        t.health_insurance?.name,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (professionalFilter !== 'all' && t.professional_id !== professionalFilter) return false;
    if (insuranceFilter !== 'all' && t.health_insurance_id !== insuranceFilter) return false;
    if (procedureFilter !== 'all' && t.procedure_id !== procedureFilter) return false;
    if (paymentMethodFilter !== 'all' && t.payment_method_id !== paymentMethodFilter) return false;
    if (dueFrom && (!t.due_date || t.due_date < dueFrom)) return false;
    if (dueTo && (!t.due_date || t.due_date > dueTo)) return false;
    if (payFrom && (!t.payment_date || t.payment_date < payFrom)) return false;
    if (payTo && (!t.payment_date || t.payment_date > payTo)) return false;
    const amt = Number(t.amount);
    if (amountMin && amt < Number(amountMin)) return false;
    if (amountMax && amt > Number(amountMax)) return false;
    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">Gerencie os lançamentos financeiros</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(v) => setFormData({ ...formData, transaction_type: v as 'particular' | 'convenio' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <PatientCombobox
                    value={formData.patient_id}
                    onChange={(id) => setFormData({ ...formData, patient_id: id })}
                    allowCreate={false}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <ProfessionalCombobox
                    value={formData.professional_id}
                    onChange={(id) => setFormData({ ...formData, professional_id: id })}
                  />
                </div>
              </div>

              {formData.transaction_type === 'convenio' && (
                <div className="space-y-2">
                  <Label>Convênio</Label>
                  <Select
                    value={formData.health_insurance_id}
                    onValueChange={(v) => setFormData({ ...formData, health_insurance_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {insurances.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Procedimento</Label>
                <Select
                  value={formData.procedure_id}
                  onValueChange={handleProcedureChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <CurrencyInput
                    required
                    value={formData.amount}
                    onChange={(val) => setFormData({ ...formData, amount: val })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              {formData.transaction_type === 'particular' && (
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.payment_method_id}
                    onValueChange={(v) => setFormData({ ...formData, payment_method_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="particular">A receber — Particular</TabsTrigger>
          <TabsTrigger value="convenio">A receber — Convênios</TabsTrigger>
          <TabsTrigger value="diversos">Recebidos diversos</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'diversos' ? (
        <DiverseReceiptsPanel />
      ) : (
      <>
      {/* Stats Cards (refletem os filtros aplicados) */}

      {(() => {
        const pend = filtered.filter((t) => t.status === 'pendente');
        const pagos = filtered.filter((t) => t.status === 'pago');
        const totPend = pend.reduce((a, t) => a + Number(t.amount), 0);
        const totPago = pagos.reduce((a, t) => a + Number(t.amount), 0);
        return (
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totPend)}</div>
                <p className="text-xs text-muted-foreground">{pend.length} lançamentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recebidos</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totPago)}</div>
                <p className="text-xs text-muted-foreground">{pagos.length} lançamentos</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}


      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente, guia, descrição..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="convenio">Convênio</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)}>
            {showFilters ? 'Ocultar filtros' : 'Mais filtros'}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar</Button>
        </div>

        {showFilters && (
          <div className="grid gap-3 rounded-md border bg-muted/30 p-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Profissional</Label>
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Convênio</Label>
              <Select value={insuranceFilter} onValueChange={setInsuranceFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {insurances.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Procedimento</Label>
              <Select value={procedureFilter} onValueChange={setProcedureFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {procedures.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Forma de pagamento</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {paymentMethods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vencimento de</Label>
              <Input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vencimento até</Label>
              <Input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recebido de</Label>
              <Input type="date" value={payFrom} onChange={(e) => setPayFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recebido até</Label>
              <Input type="date" value={payTo} onChange={(e) => setPayTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor mínimo (R$)</Label>
              <Input type="number" min="0" step="0.01" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor máximo (R$)</Label>
              <Input type="number" min="0" step="0.01" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} />
            </div>
          </div>
        )}
      </div>


      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guia / Descrição</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Nenhum lançamento encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    {t.medical_guide?.guide_number || t.description || '-'}
                  </TableCell>
                  <TableCell>{t.patient?.full_name || '-'}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'rounded-full px-2 py-1 text-xs',
                      t.transaction_type === 'particular' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    )}>
                      {t.transaction_type === 'particular' ? 'Particular' : t.health_insurance?.name || 'Convênio'}
                    </span>
                  </TableCell>
                  <TableCell>{t.procedure?.name || '-'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(t.amount))}</TableCell>
                  <TableCell>{t.due_date ? format(new Date(t.due_date), 'dd/MM/yyyy') : '-'}</TableCell>
                  <TableCell>
                    <span className={cn('rounded-full px-2 py-1 text-xs', statusColors[t.status])}>
                      {t.status === 'pendente' ? 'Pendente' : t.status === 'pago' ? 'Pago' : 'Cancelado'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {t.status === 'pendente' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(t.id, 'pago')}>
                            Receber
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleStatusChange(t.id, 'cancelado')}>
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </>
      )}



      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este lançamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
