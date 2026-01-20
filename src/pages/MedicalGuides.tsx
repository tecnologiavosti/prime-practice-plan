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
import { useToast } from '@/hooks/use-toast';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MedicalGuide {
  id: string;
  guide_number: string;
  guide_date: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  status: string;
  patient: { id: string; full_name: string } | null;
  health_insurance: { id: string; name: string } | null;
  procedure: { id: string; name: string } | null;
  professional: { id: string; full_name: string } | null;
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

interface Procedure {
  id: string;
  name: string;
  code: string;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  faturado: 'bg-blue-100 text-blue-800',
  recebido: 'bg-green-100 text-green-800',
  glosado: 'bg-red-100 text-red-800',
};

const emptyForm = {
  guide_number: '',
  patient_id: '',
  health_insurance_id: '',
  procedure_id: '',
  professional_id: '',
  guide_date: format(new Date(), 'yyyy-MM-dd'),
  quantity: 1,
  unit_value: 0,
};

export default function MedicalGuides() {
  const [guides, setGuides] = useState<MedicalGuide[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    await Promise.all([
      fetchGuides(),
      fetchPatients(),
      fetchProfessionals(),
      fetchInsurances(),
      fetchProcedures(),
    ]);
    setLoading(false);
  };

  const fetchGuides = async () => {
    let query = supabase
      .from('medical_guides')
      .select(`
        *,
        patient:patients(id, full_name),
        health_insurance:health_insurances(id, name),
        procedure:procedures(id, name),
        professional:professionals(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setGuides((data as any) || []);
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

  const fetchProcedures = async () => {
    const { data } = await supabase.from('procedures').select('id, name, code').eq('active', true).order('name');
    setProcedures(data || []);
  };

  const generateGuideNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `G${timestamp}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalValue = formData.quantity * formData.unit_value;

    const payload = {
      guide_number: formData.guide_number || generateGuideNumber(),
      patient_id: formData.patient_id,
      health_insurance_id: formData.health_insurance_id || null,
      procedure_id: formData.procedure_id || null,
      professional_id: formData.professional_id || null,
      guide_date: formData.guide_date,
      quantity: formData.quantity,
      unit_value: formData.unit_value,
      total_value: totalValue,
      status: 'pendente',
    };

    const { data: guideData, error } = await supabase.from('medical_guides').insert([payload]).select().single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    // Criar lançamento financeiro automaticamente
    if (guideData) {
      await supabase.from('financial_transactions').insert([{
        transaction_type: 'convenio',
        patient_id: formData.patient_id,
        professional_id: formData.professional_id || null,
        health_insurance_id: formData.health_insurance_id || null,
        procedure_id: formData.procedure_id || null,
        medical_guide_id: guideData.id,
        amount: totalValue,
        due_date: formData.guide_date,
        status: 'pendente',
      }]);
    }

    toast({ title: 'Guia criada com sucesso!' });
    setDialogOpen(false);
    setFormData(emptyForm);
    fetchGuides();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('medical_guides').update({ status: newStatus }).eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    // Atualizar status do lançamento financeiro correspondente
    if (newStatus === 'recebido') {
      await supabase.from('financial_transactions')
        .update({ status: 'pago', payment_date: format(new Date(), 'yyyy-MM-dd') })
        .eq('medical_guide_id', id);
    } else if (newStatus === 'glosado') {
      await supabase.from('financial_transactions')
        .update({ status: 'cancelado' })
        .eq('medical_guide_id', id);
    }

    toast({ title: 'Status atualizado!' });
    fetchGuides();
  };

  const openNew = () => {
    setFormData({ ...emptyForm, guide_number: generateGuideNumber() });
    setDialogOpen(true);
  };

  const filtered = guides.filter((g) =>
    g.guide_number.includes(search) ||
    g.patient?.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guias</h1>
          <p className="text-muted-foreground">Gerencie as guias de atendimento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Guia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Guia</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nº da Guia</Label>
                <Input
                  value={formData.guide_number}
                  onChange={(e) => setFormData({ ...formData, guide_number: e.target.value })}
                  placeholder="Gerado automaticamente"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(v) => setFormData({ ...formData, patient_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Convênio *</Label>
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Procedimento</Label>
                  <Select
                    value={formData.procedure_id}
                    onValueChange={(v) => setFormData({ ...formData, procedure_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select
                    value={formData.professional_id}
                    onValueChange={(v) => setFormData({ ...formData, professional_id: v })}
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
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.guide_date}
                    onChange={(e) => setFormData({ ...formData, guide_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Unit. (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_value}
                    onChange={(e) => setFormData({ ...formData, unit_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
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

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº guia ou paciente..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="faturado">Faturado</SelectItem>
            <SelectItem value="recebido">Recebido</SelectItem>
            <SelectItem value="glosado">Glosado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Guia</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Convênio</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Valor</TableHead>
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
                <TableCell colSpan={8} className="text-center">Nenhuma guia encontrada</TableCell>
              </TableRow>
            ) : (
              filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono font-medium">{g.guide_number}</TableCell>
                  <TableCell>{format(new Date(g.guide_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{g.patient?.full_name || '-'}</TableCell>
                  <TableCell>{g.health_insurance?.name || '-'}</TableCell>
                  <TableCell>{g.procedure?.name || '-'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(g.total_value))}</TableCell>
                  <TableCell>
                    <span className={cn('rounded-full px-2 py-1 text-xs capitalize', statusColors[g.status])}>
                      {g.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select value={g.status} onValueChange={(v) => handleStatusChange(g.id, v)}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="faturado">Faturado</SelectItem>
                        <SelectItem value="recebido">Recebido</SelectItem>
                        <SelectItem value="glosado">Glosado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
