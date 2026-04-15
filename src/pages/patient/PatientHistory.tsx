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
  const { patientProfile } = usePatientAuth();
  const [anamneses, setAnamneses] = useState<Anamnesis[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientProfile?.id) {
      fetchHistory();
    }
  }, [patientProfile?.id]);

  const fetchHistory = async () => {
    if (!patientProfile?.id) return;

    // Fetch anamneses
    const { data: anamnesisData } = await supabase
      .from('anamnesis')
      .select(`
        id,
        created_at,
        chief_complaint,
        current_illness_history,
        past_medical_history,
        family_history,
        current_medications,
        allergies,
        lifestyle_habits,
        physical_examination,
        diagnosis,
        treatment_plan,
        notes,
        professional:professionals(full_name),
        appointment:appointments(
          appointment_date,
          procedure:procedures(name)
        )
      `)
      .eq('patient_id', patientProfile.id)
      .order('created_at', { ascending: false });

    setAnamneses(anamnesisData || []);

    // Fetch completed appointments
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

  const AnamnesisSection = ({ label, value, icon: Icon }: { label: string; value: string | null; icon?: any }) => {
    if (!value) return null;
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
        </div>
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      </div>
    );
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
          Acompanhe seus atendimentos e fichas de anamnese
        </p>
      </div>

      {/* Anamnesis Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichas de Anamnese
          </CardTitle>
          <CardDescription>
            Registros de seus atendimentos médicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {anamneses.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Nenhum registro de anamnese encontrado
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {anamneses.map((anamnesis) => (
                <AccordionItem key={anamnesis.id} value={anamnesis.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {anamnesis.appointment?.procedure?.name || 'Consulta'}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(anamnesis.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {anamnesis.professional && (
                            <>
                              <span>•</span>
                              <User className="h-3 w-3" />
                              Dr(a). {anamnesis.professional.full_name}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-4 border-t">
                      <AnamnesisSection 
                        label="Queixa Principal" 
                        value={anamnesis.chief_complaint} 
                        icon={AlertCircle}
                      />
                      <AnamnesisSection 
                        label="História da Doença Atual" 
                        value={anamnesis.current_illness_history} 
                      />
                      <AnamnesisSection 
                        label="Antecedentes Pessoais" 
                        value={anamnesis.past_medical_history} 
                      />
                      <AnamnesisSection 
                        label="Antecedentes Familiares" 
                        value={anamnesis.family_history} 
                      />
                      <AnamnesisSection 
                        label="Medicamentos em Uso" 
                        value={anamnesis.current_medications} 
                      />
                      <AnamnesisSection 
                        label="Alergias" 
                        value={anamnesis.allergies}
                        icon={AlertCircle}
                      />
                      <AnamnesisSection 
                        label="Hábitos de Vida" 
                        value={anamnesis.lifestyle_habits} 
                      />
                      <AnamnesisSection 
                        label="Exame Físico" 
                        value={anamnesis.physical_examination}
                        icon={Stethoscope}
                      />
                      
                      {(anamnesis.diagnosis || anamnesis.treatment_plan) && (
                        <div className="pt-4 border-t space-y-4">
                          <AnamnesisSection 
                            label="Diagnóstico" 
                            value={anamnesis.diagnosis} 
                          />
                          <AnamnesisSection 
                            label="Plano de Tratamento" 
                            value={anamnesis.treatment_plan} 
                          />
                        </div>
                      )}

                      {anamnesis.notes && (
                        <div className="pt-4 border-t">
                          <AnamnesisSection 
                            label="Observações" 
                            value={anamnesis.notes} 
                          />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Completed Appointments */}
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
