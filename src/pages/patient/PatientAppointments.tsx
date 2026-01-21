import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CalendarPlus, Clock, MapPin } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  consultation_type: string;
  procedure: { name: string } | null;
  professional: { full_name: string; specialty: { name: string } | null } | null;
}

const statusColors: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  em_atendimento: 'bg-yellow-100 text-yellow-800',
  finalizado: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
  faltou: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em Atendimento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};

export default function PatientAppointments() {
  const { patientProfile } = usePatientAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (patientProfile?.id) {
      fetchAppointments();
    }
  }, [patientProfile?.id]);

  const fetchAppointments = async () => {
    if (!patientProfile?.id) return;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        notes,
        consultation_type,
        procedure:procedures(name),
        professional:professionals(full_name, specialty:specialties(name))
      `)
      .eq('patient_id', patientProfile.id)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointment_date + 'T12:00:00');
    return aptDate >= today && !['cancelado', 'faltou', 'finalizado'].includes(apt.status);
  });

  const pastAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointment_date + 'T12:00:00');
    return aptDate < today || ['cancelado', 'faltou', 'finalizado'].includes(apt.status);
  });

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="text-center min-w-[60px] p-2 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold text-primary">
              {format(new Date(appointment.appointment_date + 'T12:00:00'), 'dd')}
            </p>
            <p className="text-xs text-muted-foreground uppercase">
              {format(new Date(appointment.appointment_date + 'T12:00:00'), 'MMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-lg">{appointment.procedure?.name || 'Consulta'}</p>
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </p>
            <p className="text-muted-foreground">
              Dr(a). {appointment.professional?.full_name}
              {appointment.professional?.specialty && (
                <span className="text-xs ml-2">({appointment.professional.specialty.name})</span>
              )}
            </p>
            <Badge variant="outline" className="mt-2">
              {appointment.consultation_type === 'particular' ? 'Particular' : 'Convênio'}
            </Badge>
          </div>
        </div>
        <Badge className={statusColors[appointment.status]}>
          {statusLabels[appointment.status]}
        </Badge>
      </div>
      {appointment.notes && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Observações:</strong> {appointment.notes}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie suas consultas e acompanhe seu histórico
          </p>
        </div>
        <Button asChild>
          <Link to="/agendar">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximas ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">Nenhuma consulta agendada</h3>
                <p className="text-muted-foreground mb-4">
                  Você não tem consultas marcadas para os próximos dias
                </p>
                <Button asChild>
                  <Link to="/agendar">Agendar Consulta</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">Sem histórico</h3>
                <p className="text-muted-foreground">
                  Você ainda não possui consultas realizadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
