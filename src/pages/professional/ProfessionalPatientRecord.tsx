import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FilePlus, FileText, Calendar, Phone, Mail, IdCard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { QuickRecord } from '@/components/professional/QuickRecord';
import { toast } from 'sonner';

type Patient = {
  id: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
};

type AnamnesisEntry = {
  id: string;
  created_at: string;
  appointment_id: string | null;
  notes: string | null;
  diagnosis: string | null;
  treatment_plan: string | null;
};

type Appointment = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
};

export default function ProfessionalPatientRecord() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<AnamnesisEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordOpen, setRecordOpen] = useState(false);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  const [professional, setProfessional] = useState<{ id: string; full_name: string; crm: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('professionals')
        .select('id, full_name, crm')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfessional(data);
    })();
  }, [user]);

  const loadData = async () => {
    if (!patientId) return;
    setLoading(true);

    const [{ data: pat }, { data: anam }, { data: appts }] = await Promise.all([
      supabase
        .from('patients')
        .select('id, full_name, cpf, phone, email, birth_date')
        .eq('id', patientId)
        .maybeSingle(),
      supabase
        .from('anamnesis')
        .select('id, created_at, appointment_id, notes, diagnosis, treatment_plan')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('appointments')
        .select('id, appointment_date, start_time, end_time, status')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .limit(20),
    ]);

    if (!pat) {
      toast.error('Paciente não encontrado ou sem permissão de acesso.');
      navigate('/professional/pacientes');
      return;
    }

    setPatient(pat as Patient);
    setHistory((anam as any) || []);
    setAppointments((appts as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const startNewRecord = () => {
    // Tenta usar o agendamento mais próximo de hoje (atendido/agendado)
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayAppt = appointments.find(
      (a) => a.appointment_date === today && a.status !== 'cancelado'
    );
    setActiveAppointmentId(todayAppt?.id || appointments[0]?.id || null);
    setRecordOpen(true);
  };

  const openExistingRecord = (entry: AnamnesisEntry) => {
    setActiveAppointmentId(entry.appointment_id);
    setRecordOpen(true);
  };

  if (loading || !patient) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Carregando prontuário...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/professional/pacientes')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{patient.full_name}</h1>
            <p className="text-sm text-muted-foreground">Prontuário do paciente</p>
          </div>
        </div>
        <Button onClick={startNewRecord} className="gap-2">
          <FilePlus className="h-4 w-4" />
          Iniciar Novo Atendimento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <IdCard className="h-4 w-4 text-muted-foreground" />
              <span>{patient.cpf || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{patient.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{patient.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {patient.birth_date
                  ? format(new Date(patient.birth_date), 'dd/MM/yyyy')
                  : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Histórico de atendimentos ({history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento registrado ainda. Clique em "Iniciar Novo Atendimento" para
              começar.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-md p-4 hover:bg-accent/30 cursor-pointer transition-colors"
                  onClick={() => openExistingRecord(entry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {format(new Date(entry.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    {entry.diagnosis && (
                      <Badge variant="secondary" className="text-xs">
                        {entry.diagnosis.substring(0, 40)}
                        {entry.diagnosis.length > 40 ? '...' : ''}
                      </Badge>
                    )}
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QuickRecord
        open={recordOpen}
        onOpenChange={(o) => {
          setRecordOpen(o);
          if (!o) loadData();
        }}
        appointmentId={activeAppointmentId}
        patientId={patient.id}
        patientName={patient.full_name}
        professionalId={professional?.id || null}
        professionalName={professional?.full_name || ''}
        professionalCrm={professional?.crm || null}
      />
    </div>
  );
}
