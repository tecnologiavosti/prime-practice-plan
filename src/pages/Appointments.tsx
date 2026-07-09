import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Pencil, Trash2, CalendarDays, CalendarRange, Receipt } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ReceiptDialog } from '@/components/patient/ReceiptDialog';
import { PatientCombobox } from '@/components/patient/PatientCombobox';
import { ProfessionalCombobox } from '@/components/professional/ProfessionalCombobox';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_type: string;
  notes: string | null;
  administrator_id: string | null;
  custom_amount: number | null;
  patient: { id: string; full_name: string } | null;
  professional: { id: string; full_name: string } | null;
  procedure: { id: string; name: string; private_price?: number } | null;
  health_insurance: { id: string; name: string } | null;
  administrator: { id: string; name: string } | null;
  room: { id: string; name: string } | null;
}

interface Patient { id: string; full_name: string; }
interface Professional { id: string; full_name: string; }
interface Procedure { id: string; name: string; duration_minutes: number; private_price: number; }
interface HealthInsurance { id: string; name: string; }
interface PrivatePackage { id: string; name: string; total_price: number; }
interface ProcedureInsurancePrice { procedure_id: string; health_insurance_id: string; price: number; }
interface PaymentMethod { id: string; name: string; }
interface Administrator { id: string; name: string; }
interface InsAdminMap { insurance_id: string; administrator_id: string; billing_rate: number | null; }
interface Room { id: string; name: string; active: boolean; }

type ViewMode = 'daily' | 'monthly';

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
  administrator_id: '',
  health_insurance_id: '',
  custom_amount: 0,
  notes: '',
  room_id: '',
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [insAdminMap, setInsAdminMap] = useState<InsAdminMap[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [filterProfessionalId, setFilterProfessionalId] = useState('');
  const [filterPatientId, setFilterPatientId] = useState('');
  const [filterAdministratorId, setFilterAdministratorId] = useState('');
  const [filterInsuranceId, setFilterInsuranceId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Finalization state
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);
  const [finalizePaymentMethodId, setFinalizePaymentMethodId] = useState('');
  const [finalizeAmount, setFinalizeAmount] = useState(0);
  const [finalizeNotes, setFinalizeNotes] = useState('');

  // Receipt state
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [dateFilter, monthFilter, viewMode]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchAppointments(),
        fetchPatients(),
        fetchProfessionals(),
        fetchProcedures(),
        fetchInsurances(),
        fetchPackages(),
        fetchProcedureInsurancePrices(),
        fetchPaymentMethods(),
        fetchAdministrators(),
        fetchInsAdminMap(),
      ]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao carregar dados' });
    }
    setLoading(false);
  };

  const fetchAppointments = async () => {
    let query = supabase
      .from('appointments')
      .select(`
        id, appointment_date, start_time, end_time, status, consultation_type, notes,
        administrator_id, custom_amount,
        patient:patients(id, full_name),
        professional:professionals(id, full_name),
        procedure:procedures(id, name, private_price),
        health_insurance:health_insurances(id, name),
        administrator:administrators(id, name)
      `)
      .order('appointment_date')
      .order('start_time');

    if (viewMode === 'daily') {
      query = query.eq('appointment_date', dateFilter);
    } else {
      const monthDate = parseISO(monthFilter + '-01');
      const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      query = query.gte('appointment_date', start).lte('appointment_date', end);
    }

    const { data, error } = await query;
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return; }
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
  const fetchPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('id, name').eq('active', true).order('name');
    setPaymentMethods(data || []);
  };
  const fetchAdministrators = async () => {
    const { data } = await supabase.from('administrators').select('id, name').eq('active', true).order('name');
    setAdministrators((data || []) as Administrator[]);
  };
  const fetchInsAdminMap = async () => {
    const { data } = await supabase.from('insurance_administrators_map').select('insurance_id, administrator_id, billing_rate');
    setInsAdminMap((data || []) as InsAdminMap[]);
  };

  const getProcedurePrice = (): number | null => {
    if (!formData.procedure_id) return null;
    if (formData.consultation_type === 'particular') {
      return procedures.find(p => p.id === formData.procedure_id)?.private_price || null;
    }
    if (formData.consultation_type === 'convenio' && formData.health_insurance_id) {
      return procedureInsurancePrices.find(
        pip => pip.procedure_id === formData.procedure_id && pip.health_insurance_id === formData.health_insurance_id
      )?.price || null;
    }
    return null;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.professional_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione paciente e profissional' });
      return;
    }

    if (formData.consultation_type === 'convenio' && !formData.health_insurance_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um convênio' });
      return;
    }

    setSubmitting(true);
    try {
      const isConv = formData.consultation_type === 'convenio';
      const payload = {
        patient_id: formData.patient_id,
        professional_id: formData.professional_id,
        procedure_id: formData.procedure_id || null,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        consultation_type: formData.consultation_type,
        health_insurance_id: isConv ? formData.health_insurance_id || null : null,
        administrator_id: isConv ? formData.administrator_id || null : null,
        custom_amount: formData.custom_amount > 0 ? formData.custom_amount : null,
        patient_package_id: null,
        notes: formData.notes || null,
        status: formData.status,
      };

      let error;
      if (editingId) {
        ({ error } = await supabase.from('appointments').update(payload).eq('id', editingId));
      } else {
        ({ error } = await supabase.from('appointments').insert({ ...payload, created_by: user?.id }));
      }

      if (error) {
        const msg = error.message || '';
        if (msg.includes('CONFLICT_PROFESSIONAL')) {
          toast({ variant: 'destructive', title: 'Conflito de Agenda', description: 'Este profissional já possui um atendimento neste horário.' });
        } else if (msg.includes('CONFLICT_PATIENT')) {
          toast({ variant: 'destructive', title: 'Conflito de Agenda', description: 'Este paciente já possui um atendimento neste horário.' });
        } else {
          toast({ variant: 'destructive', title: 'Erro', description: msg });
        }
        return;
      }

      toast({ title: editingId ? 'Agendamento atualizado!' : 'Agendamento criado com sucesso!' });
      setDialogOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
      fetchAppointments();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: err?.message || 'Tente novamente' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    if (newStatus === 'finalizado') {
      const apt = appointments.find(a => a.id === appointmentId);
      if (apt) {
        setFinalizingAppointment(apt);
        const custom = (apt as any).custom_amount;
        const price = (apt.procedure as any)?.private_price;
        setFinalizeAmount(custom ? Number(custom) : (price ? Number(price) : 0));
        setFinalizePaymentMethodId('');
        setFinalizeNotes('');
        setFinalizeDialogOpen(true);
        return;
      }
    }

    const { error } = await supabase.from('appointments').update({ status: newStatus as any }).eq('id', appointmentId);
    if (error) {
      const msg = error.message || '';
      if (msg.includes('CONFLICT_PROFESSIONAL') || msg.includes('CONFLICT_PATIENT')) {
        toast({ variant: 'destructive', title: 'Conflito de Agenda', description: 'Não é possível reativar: já existe outro atendimento neste horário.' });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: msg });
      }
      return;
    }
    toast({ title: 'Status atualizado!' });
    fetchAppointments();
  };

  const handleFinalize = async () => {
    if (!finalizingAppointment) return;
    if (!finalizePaymentMethodId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione a forma de pagamento' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('appointments')
        .update({ status: 'finalizado' })
        .eq('id', finalizingAppointment.id);
      if (error) throw error;

      await supabase.from('financial_transactions').insert({
        transaction_type: finalizingAppointment.consultation_type === 'convenio' ? 'convenio' : 'particular',
        patient_id: finalizingAppointment.patient?.id || null,
        professional_id: finalizingAppointment.professional?.id || null,
        procedure_id: finalizingAppointment.procedure?.id || null,
        appointment_id: finalizingAppointment.id,
        health_insurance_id: finalizingAppointment.health_insurance?.id || null,
        amount: finalizeAmount,
        payment_method_id: finalizePaymentMethodId,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'pago',
        description: `Consulta - ${finalizingAppointment.patient?.full_name}`,
        notes: finalizeNotes || null,
      });

      // Generate professional payout based on fee configuration
      if (finalizingAppointment.professional?.id) {
        const profId = finalizingAppointment.professional.id;
        const procId = finalizingAppointment.procedure?.id || null;

        // Try to find a specific fee for this procedure, then fallback to general fee
        let feeQuery = supabase.from('professional_fees')
          .select('*')
          .eq('professional_id', profId)
          .eq('active', true);

        const { data: specificFees } = await feeQuery;
        
        // Prioritize procedure-specific fee, fallback to general (null procedure_id)
        const fee = specificFees?.find(f => f.procedure_id === procId) 
          || specificFees?.find(f => !f.procedure_id);

        if (fee) {
          let payoutAmount = 0;
          if (fee.fee_type === 'fixed') {
            payoutAmount = Number(fee.fixed_value);
          } else if (fee.fee_type === 'percentage') {
            payoutAmount = finalizeAmount * (Number(fee.percentage_value) / 100);
          } else if (fee.fee_type === 'per_procedure') {
            payoutAmount = Number(fee.per_procedure_value);
          }

          if (payoutAmount > 0) {
            await supabase.from('professional_payouts').insert({
              professional_id: profId,
              appointment_id: finalizingAppointment.id,
              procedure_id: procId,
              payout_amount: payoutAmount,
              reference_date: finalizingAppointment.appointment_date,
              status: 'pendente',
            });
          }
        }
      }

      const pmName = paymentMethods.find(m => m.id === finalizePaymentMethodId)?.name || '';

      setReceiptData({
        patientName: finalizingAppointment.patient?.full_name || '',
        professionalName: finalizingAppointment.professional?.full_name || '',
        procedureName: finalizingAppointment.procedure?.name || 'Consulta',
        consultationType: finalizingAppointment.consultation_type,
        insuranceName: finalizingAppointment.health_insurance?.name,
        appointmentDate: finalizingAppointment.appointment_date,
        amount: finalizeAmount,
        paymentMethodName: pmName,
        notes: finalizeNotes || null,
      });

      setFinalizeDialogOpen(false);
      setReceiptOpen(true);
      toast({ title: 'Consulta finalizada com sucesso!' });
      fetchAppointments();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err?.message || 'Erro ao finalizar' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcedureChange = (procedureId: string) => {
    const procedure = procedures.find((p) => p.id === procedureId);
    if (procedure) {
      const [hours, minutes] = formData.start_time.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + procedure.duration_minutes;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
      setFormData({ ...formData, procedure_id: procedureId, end_time: endTime });
    } else {
      setFormData({ ...formData, procedure_id: procedureId });
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, appointment_date: viewMode === 'daily' ? dateFilter : format(new Date(), 'yyyy-MM-dd') });
    setDialogOpen(true);
  };

  const handleEditAppointment = (apt: Appointment) => {
    setEditingId(apt.id);
    setFormData({
      patient_id: apt.patient?.id || '',
      professional_id: apt.professional?.id || '',
      procedure_id: apt.procedure?.id || '',
      appointment_date: apt.appointment_date,
      start_time: apt.start_time?.slice(0, 5) || '08:00',
      end_time: apt.end_time?.slice(0, 5) || '08:30',
      consultation_type: apt.consultation_type as any,
      administrator_id: apt.administrator_id || '',
      health_insurance_id: apt.health_insurance?.id || '',
      custom_amount: Number(apt.custom_amount) || 0,
      notes: apt.notes || '',
      status: apt.status as any,
    });
    setDialogOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('appointments').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Agendamento removido com sucesso!' });
      fetchAppointments();
    }
    setDeleteId(null);
  };

  const handleViewReceipt = async (apt: Appointment) => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('amount, notes, payment_method:payment_methods(name)')
      .eq('appointment_id', apt.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast({ variant: 'destructive', title: 'Recibo indisponível', description: 'Nenhum registro financeiro encontrado para esta consulta.' });
      return;
    }

    setReceiptData({
      patientName: apt.patient?.full_name || '',
      professionalName: apt.professional?.full_name || '',
      procedureName: apt.procedure?.name || 'Consulta',
      consultationType: apt.consultation_type,
      insuranceName: apt.health_insurance?.name,
      appointmentDate: apt.appointment_date,
      amount: Number(data.amount) || 0,
      paymentMethodName: (data.payment_method as any)?.name || '',
      notes: data.notes || null,
    });
    setReceiptOpen(true);
  };

  // Apply filters
  const filtered = appointments.filter((a) => {
    const matchSearch = !search ||
      a.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.professional?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchProfessional = !filterProfessionalId || a.professional?.id === filterProfessionalId;
    const matchPatient = !filterPatientId || a.patient?.id === filterPatientId;
    const matchAdmin = !filterAdministratorId || a.administrator?.id === filterAdministratorId;
    const matchInsurance = !filterInsuranceId || a.health_insurance?.id === filterInsuranceId;
    const matchType = !filterType || a.consultation_type === filterType;
    return matchSearch && matchProfessional && matchPatient && matchAdmin && matchInsurance && matchType;
  });

  // Group by date for monthly view
  const groupedByDate = filtered.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort();

  const renderAppointmentRow = (apt: Appointment, showDate = false) => (
    <TableRow key={apt.id}>
      {showDate && (
        <TableCell className="font-medium whitespace-nowrap">
          {format(parseISO(apt.appointment_date), "dd/MM/yyyy (EEE)", { locale: ptBR })}
        </TableCell>
      )}
      <TableCell className="font-mono">{apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}</TableCell>
      <TableCell className="font-medium">{apt.patient?.full_name || '-'}</TableCell>
      <TableCell>{apt.professional?.full_name || '-'}</TableCell>
      <TableCell>{apt.procedure?.name || '-'}</TableCell>
      <TableCell className="capitalize">
        {apt.consultation_type}
        {apt.health_insurance && ` (${apt.health_insurance.name})`}
      </TableCell>
      <TableCell>{apt.administrator?.name || '-'}</TableCell>
      <TableCell className="font-mono whitespace-nowrap">
        {apt.custom_amount != null ? formatCurrency(Number(apt.custom_amount)) : (apt.procedure?.private_price ? formatCurrency(Number(apt.procedure.private_price)) : '-')}
      </TableCell>
      <TableCell>
        <Select value={apt.status} onValueChange={(v) => handleStatusChange(apt.id, v)}>
          <SelectTrigger className={cn('w-[140px]', statusColors[apt.status])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {apt.status === 'finalizado' && (
            <Button variant="ghost" size="icon" onClick={() => handleViewReceipt(apt)} title="Ver recibo">
              <Receipt className="h-4 w-4 text-primary" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => handleEditAppointment(apt)} title="Editar">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(apt.id)} title="Remover" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const colCount = viewMode === 'monthly' ? 10 : 9;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditingId(null); } setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <PatientCombobox
                    value={formData.patient_id}
                    onChange={(id) => setFormData({ ...formData, patient_id: id })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Profissional *</Label>
                  <ProfessionalCombobox
                    value={formData.professional_id}
                    onChange={(id) => setFormData({ ...formData, professional_id: id })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Procedimento</Label>
                  <Select value={formData.procedure_id} onValueChange={handleProcedureChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {procedures.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Consulta *</Label>
                  <Select
                    value={formData.consultation_type}
                    onValueChange={(v) => setFormData({ ...formData, consultation_type: v as any, health_insurance_id: '', administrator_id: '', custom_amount: 0 })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                      <SelectItem value="pacote">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.consultation_type === 'convenio' && (
                  <>
                    <div className="space-y-2">
                      <Label>Administradora *</Label>
                      <Select
                        value={formData.administrator_id}
                        onValueChange={(v) => setFormData({ ...formData, administrator_id: v, health_insurance_id: '', custom_amount: 0 })}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione a administradora" /></SelectTrigger>
                        <SelectContent>
                          {administrators.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhuma administradora cadastrada</SelectItem>
                          ) : (
                            administrators.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Convênio *</Label>
                      <Select
                        value={formData.health_insurance_id}
                        onValueChange={(v) => {
                          const rate = insAdminMap.find(m => m.administrator_id === formData.administrator_id && m.insurance_id === v)?.billing_rate;
                          setFormData({ ...formData, health_insurance_id: v, custom_amount: Number(rate) || 0 });
                        }}
                        disabled={!formData.administrator_id}
                      >
                        <SelectTrigger><SelectValue placeholder={formData.administrator_id ? 'Selecione' : 'Escolha a administradora'} /></SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const ids = insAdminMap
                              .filter(m => m.administrator_id === formData.administrator_id)
                              .map(m => m.insurance_id);
                            const filtered = insurances.filter(i => ids.includes(i.id));
                            if (filtered.length === 0) {
                              return <SelectItem value="none" disabled>Nenhum convênio nesta administradora</SelectItem>;
                            }
                            return filtered.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>);
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {formData.consultation_type === 'pacote' && (
                  <div className="space-y-2">
                    <Label>Pacote</Label>
                    <Select value={formData.health_insurance_id} onValueChange={(v) => setFormData({ ...formData, health_insurance_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione o pacote" /></SelectTrigger>
                      <SelectContent>
                        {packages.length === 0 ? (
                          <SelectItem value="none" disabled>Nenhum pacote cadastrado</SelectItem>
                        ) : (
                          packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} - {formatCurrency(pkg.total_price)}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.consultation_type === 'convenio' && formData.health_insurance_id && (
                  <div className="space-y-2">
                    <Label>Valor (R$) — editável</Label>
                    <CurrencyInput
                      value={formData.custom_amount}
                      onChange={(v) => setFormData({ ...formData, custom_amount: v })}
                    />
                  </div>
                )}
                {formData.procedure_id && formData.consultation_type === 'particular' && (
                  <div className="space-y-2">
                    <Label>Valor do Procedimento</Label>
                    <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                      {getProcedurePrice() !== null ? formatCurrency(getProcedurePrice()!) : 'Valor não cadastrado'}
                    </div>
                  </div>
                )}
                {editingId && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" required value={formData.appointment_date} onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Hora Início *</Label>
                  <Input type="time" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fim *</Label>
                  <Input type="time" required value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Agendar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Mode Tabs + Filters */}
      <div className="mb-4 space-y-3">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="daily" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Diário
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <CalendarRange className="h-4 w-4" />
              Mensal
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {viewMode === 'daily' ? (
            <Input type="date" className="w-[180px]" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          ) : (
            <Input type="month" className="w-[180px]" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
          )}

          <Select value={filterProfessionalId || 'all'} onValueChange={(v) => setFilterProfessionalId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os profissionais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterPatientId || 'all'} onValueChange={(v) => setFilterPatientId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os pacientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pacientes</SelectItem>
              {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="convenio">Convênio</SelectItem>
              <SelectItem value="pacote">Pacote</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAdministratorId || 'all'} onValueChange={(v) => setFilterAdministratorId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as administradoras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as administradoras</SelectItem>
              {administrators.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterInsuranceId || 'all'} onValueChange={(v) => setFilterInsuranceId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os convênios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os convênios</SelectItem>
              {insurances.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border" ref={scrollRef}>
        <Table>
          <TableHeader>
            <TableRow>
              {viewMode === 'monthly' && <TableHead>Data</TableHead>}
              <TableHead>Horário</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Profissional</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Administradora</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={colCount} className="text-center">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={colCount} className="text-center">Nenhum agendamento encontrado</TableCell></TableRow>
            ) : viewMode === 'daily' ? (
              filtered.map((apt) => renderAppointmentRow(apt, false))
            ) : (
              sortedDates.map((date) => (
                groupedByDate[date].map((apt, idx) => (
                  <TableRow key={apt.id} className={idx === 0 ? 'border-t-2' : ''}>
                    {idx === 0 ? (
                      <TableCell rowSpan={groupedByDate[date].length} className="font-medium whitespace-nowrap align-top bg-muted/30">
                        {format(parseISO(date), "dd/MM (EEE)", { locale: ptBR })}
                      </TableCell>
                    ) : null}
                    <TableCell className="font-mono">{apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}</TableCell>
                    <TableCell className="font-medium">{apt.patient?.full_name || '-'}</TableCell>
                    <TableCell>{apt.professional?.full_name || '-'}</TableCell>
                    <TableCell>{apt.procedure?.name || '-'}</TableCell>
                    <TableCell className="capitalize">
                      {apt.consultation_type}
                      {apt.health_insurance && ` (${apt.health_insurance.name})`}
                    </TableCell>
                    <TableCell>{apt.administrator?.name || '-'}</TableCell>
                    <TableCell className="font-mono whitespace-nowrap">
                      {apt.custom_amount != null ? formatCurrency(Number(apt.custom_amount)) : (apt.procedure?.private_price ? formatCurrency(Number(apt.procedure.private_price)) : '-')}
                    </TableCell>
                    <TableCell>
                      <Select value={apt.status} onValueChange={(v) => handleStatusChange(apt.id, v)}>
                        <SelectTrigger className={cn('w-[140px]', statusColors[apt.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {apt.status === 'finalizado' && (
                          <Button variant="ghost" size="icon" onClick={() => handleViewReceipt(apt)} title="Ver recibo">
                            <Receipt className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEditAppointment(apt)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(apt.id)} title="Remover" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {viewMode === 'monthly' && filtered.length > 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          Total: {filtered.length} agendamento(s) em {sortedDates.length} dia(s)
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize Consultation Dialog */}
      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Consulta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paciente: <strong>{finalizingAppointment?.patient?.full_name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select value={finalizePaymentMethodId} onValueChange={setFinalizePaymentMethodId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <CurrencyInput value={finalizeAmount} onChange={(val) => setFinalizeAmount(val)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={finalizeNotes} onChange={(e) => setFinalizeNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFinalizeDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleFinalize} disabled={submitting}>{submitting ? 'Finalizando...' : 'Finalizar e Gerar Recibo'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} data={receiptData} />
    </div>
  );
}
