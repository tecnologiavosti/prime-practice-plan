import { useState, useEffect } from 'react';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';

interface CompletedAppointment {
  id: string;
  appointment_date: string;
  procedure: { name: string } | null;
  professional: { full_name: string } | null;
  notes: string | null;
}

export default function PatientHistory() {
  const { patientProfile } = usePatientAuth();
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientProfile?.id) {
      fetchHistory();
    }
  }, [patientProfile?.id]);

  const fetchHistory = async () => {
    if (!patientProfile?.id) return;

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        notes,
        procedure:procedures(name),
        professional:professionals(full_name)
      `)
      .eq('patient_id', patientProfile.id)
      .eq('status', 'finalizado')
      .order('appointment_date', { ascending: false })
      .limit(20);

    setCompletedAppointments(appointmentsData || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico Médico</h1>
        <p className="text-muted-foreground">
          Acompanhe suas consultas realizadas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Consultas Realizadas
          </CardTitle>
          <CardDescription>
            Histórico das suas últimas consultas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Nenhuma consulta realizada ainda
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xl font-bold text-primary">
                        {format(new Date(apt.appointment_date + 'T12:00:00'), 'dd')}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(new Date(apt.appointment_date + 'T12:00:00'), 'MMM', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{apt.procedure?.name || 'Consulta'}</p>
                      <p className="text-sm text-muted-foreground">
                        Dr(a). {apt.professional?.full_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Realizada</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
