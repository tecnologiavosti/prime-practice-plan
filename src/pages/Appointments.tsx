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
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_type: string;
  notes: string | null;
  patient: { id: string; full_name: string } | null;
  professional: { id: string; full_name: string } | null;
  procedure: { id: string; name: string } | null;
  health_insurance: { id: string; name: string } | null;
}

interface Patient {
  id: string;
  full_name: string;
}

interface Professional {
  id: string;
  full_name: string;
}

interface Procedure {
  id: string;
  name: string;
  duration_minutes: number;
  private_price: number;
}

interface HealthInsurance {
  id: string;
  name: string;
}

interface PrivatePackage {
  id: string;
  name: string;
  total_price: number;
}

interface ProcedureInsurancePrice {
  procedure_id: string;
  health_insurance_id: string;
  price: number;
}

const statusOptions = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em_atendimento', label: 'Em Atendimento' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
];

const statusColors: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  em_atendimento: 'bg-yellow-100 text-yellow-800',
  finalizado: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
  faltou: 'bg-orange-100 text-orange-800',
};

const emptyForm = {
  patient_id: '',
  professional_id: '',
  procedure_id: '',
  appointment_date: format(new Date(), 'yyyy-MM-dd'),
  start_time: '08:00',
  end_time: '08:30',
  consultation_type: 'particular' as 'particular' | 'convenio' | 'pacote',
  health_insurance_id: '',
  notes: '',
  status: 'agendado' as 'agendado' | 'confirmado' | 'em_atendimento' | 'finalizado' | 'cancelado' | 'faltou',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [packages, setPackages] = useState<PrivatePackage[]>([]);
  const [procedureInsurancePrices, setProcedureInsurancePrices] = useState<ProcedureInsurancePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    await Promise.all([
      fetchAppointments(),
      fetchPatients(),
      fetchProfessionals(),
      fetchProcedures(),
      fetchInsurances(),
      fetchPackages(),
      fetchProcedureInsurancePrices(),
    ]);
    setLoading(false);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        consultation_type,
        notes,
        patient:patients(id, full_name),
        professional:professionals(id, full_name),
        procedure:procedures(id, name),
        health_insurance:health_insurances(id, name)
      `)
      .eq('appointment_date', dateFilter)
      .order('start_time');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setAppointments((data as any) || []);
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, full_name').eq('active', true).order('full_name');
    setPatients(data || []);
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('professionals').select('id, full_name').eq('active', true).order('full_name');
    setProfessionals(data || []);
  };

  const fetchProcedures = async () => {
    const { data } = await supabase.from('procedures').select('id, name, duration_minutes, private_price').eq('active', true).order('name');
    setProcedures(data || []);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase.from('health_insurances').select('id, name').eq('active', true).order('name');
    setInsurances(data || []);
  };

  const fetchPackages = async () => {
    const { data } = await supabase.from('private_packages').select('id, name, total_price').eq('active', true).order('name');
    setPackages(data || []);
  };

  const fetchProcedureInsurancePrices = async () => {
    const { data } = await supabase.from('procedure_insurance_prices').select('procedure_id, health_insurance_id, price');
    setProcedureInsurancePrices(data || []);
  };

  const getProcedurePrice = (): number | null => {
    if (!formData.procedure_id) return null;
    
    if (formData.consultation_type === 'particular') {
      const procedure = procedures.find(p => p.id === formData.procedure_id);
      return procedure?.private_price || null;
    }
    
    if (formData.consultation_type === 'convenio' && formData.health_insurance_id) {
      const insurancePrice = procedureInsurancePrices.find(
        pip => pip.procedure_id === formData.procedure_id && pip.health_insurance_id === formData.health_insurance_id
      );
      return insurancePrice?.price || null;
    }
    
    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      patient_id: formData.patient_id,
      professional_id: formData.professional_id,
      procedure_id: formData.procedure_id || null,
      appointment_date: formData.appointment_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      consultation_type: formData.consultation_type,
      health_insurance_id: formData.consultation_type === 'convenio' ? formData.health_insurance_id : null,
      notes: formData.notes || null,
      status: formData.status,
      created_by: user?.id,
    };

    const { error } = await supabase.from('appointments').insert(payload);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    toast({ title: 'Agendamento criado com sucesso!' });
    setDialogOpen(false);
    setFormData(emptyForm);
    fetchAppointments();
  };

  const handleStatusChange = async (appointmentId: string, newStatus: 'agendado' | 'confirmado' | 'em_atendimento' | 'finalizado' | 'cancelado' | 'faltou') => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    toast({ title: 'Status atualizado!' });
    fetchAppointments();
  };

  const handleProcedureChange = (procedureId: string) => {
    const procedure = procedures.find((p) => p.id === procedureId);
    if (procedure) {
      const [hours, minutes] = formData.start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + procedure.duration_minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      
      setFormData({ ...formData, procedure_id: procedureId, end_time: endTime });
    } else {
      setFormData({ ...formData, procedure_id: procedureId });
    }
  };

  const openNew = () => {
    setFormData({ ...emptyForm, appointment_date: dateFilter });
    setDialogOpen(true);
  };

  const filtered = appointments.filter(
    (a) =>
      a.patient?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.professional?.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select
                    required
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
                  <Label>Profissional *</Label>
                  <Select
                    required
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
                <div className="space-y-2">
                  <Label>Tipo de Consulta *</Label>
                  <Select
                    value={formData.consultation_type}
                    onValueChange={(v) => setFormData({ ...formData, consultation_type: v as 'particular' | 'convenio' | 'pacote', health_insurance_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.consultation_type === 'convenio' && (
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
                {formData.consultation_type === 'pacote' && (
                  <div className="space-y-2">
                    <Label>Pacote</Label>
                    <Select
                      value={formData.health_insurance_id}
                      onValueChange={(v) => setFormData({ ...formData, health_insurance_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o pacote" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.length === 0 ? (
                          <SelectItem value="none" disabled>Nenhum pacote cadastrado</SelectItem>
                        ) : (
                          packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} - {formatCurrency(pkg.total_price)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.procedure_id && (formData.consultation_type === 'particular' || (formData.consultation_type === 'convenio' && formData.health_insurance_id)) && (
                  <div className="space-y-2">
                    <Label>Valor do Procedimento</Label>
                    <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                      {getProcedurePrice() !== null ? formatCurrency(getProcedurePrice()!) : 'Valor não cadastrado'}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Início *</Label>
                  <Input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fim *</Label>
                  <Input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agendar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
        <Input
          type="date"
          className="w-[180px]"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Horário</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhum agendamento encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-mono">
                    {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                  </TableCell>
                  <TableCell className="font-medium">{apt.patient?.full_name}</TableCell>
                  <TableCell>{apt.professional?.full_name}</TableCell>
                  <TableCell>{apt.procedure?.name || '-'}</TableCell>
                  <TableCell className="capitalize">
                    {apt.consultation_type}
                    {apt.health_insurance && ` (${apt.health_insurance.name})`}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={apt.status}
                      onValueChange={(v) => handleStatusChange(apt.id, v as 'agendado' | 'confirmado' | 'em_atendimento' | 'finalizado' | 'cancelado' | 'faltou')}
                    >
                      <SelectTrigger className={cn('w-[140px]', statusColors[apt.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
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
