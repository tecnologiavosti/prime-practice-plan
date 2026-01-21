import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CalendarPlus, Clock, User } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  procedure: { name: string } | null;
  professional: { full_name: string } | null;
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

export default function PatientDashboard() {
  const { patientProfile } = usePatientAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientProfile?.id) {
      fetchUpcomingAppointments();
    }
  }, [patientProfile?.id]);

  const fetchUpcomingAppointments = async () => {
    if (!patientProfile?.id) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        procedure:procedures(name),
        professional:professionals(full_name)
      `)
      .eq('patient_id', patientProfile.id)
      .gte('appointment_date', today)
      .in('status', ['agendado', 'confirmado'])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      setUpcomingAppointments(data || []);
    }
    setLoading(false);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          Olá, {patientProfile?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu portal de agendamentos
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Link to="/paciente/agendar" className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <CalendarPlus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Agendar Consulta</h3>
                <p className="text-sm text-muted-foreground">Marque um novo horário</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Link to="/paciente/agendamentos" className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Meus Agendamentos</h3>
                <p className="text-sm text-muted-foreground">Veja suas consultas</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Link to="/paciente/meus-dados" className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-green-100 rounded-full">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Meus Dados</h3>
                <p className="text-sm text-muted-foreground">Atualize seu cadastro</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <Link to="/paciente/historico" className="flex flex-col items-center gap-3 text-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Histórico Médico</h3>
                <p className="text-sm text-muted-foreground">Consulte seu histórico</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Consultas
          </CardTitle>
          <CardDescription>
            Suas consultas agendadas para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Você não tem consultas agendadas</p>
              <Button asChild className="mt-4">
                <Link to="/paciente/agendar">Agendar Consulta</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-bold text-primary">
                        {format(new Date(appointment.appointment_date + 'T12:00:00'), 'dd')}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(new Date(appointment.appointment_date + 'T12:00:00'), 'MMM', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">{appointment.procedure?.name || 'Consulta'}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.professional?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[appointment.status]}>
                    {statusLabels[appointment.status]}
                  </Badge>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/paciente/agendamentos">Ver Todos os Agendamentos</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
