import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, FileText, Check } from 'lucide-react';

interface Professional {
  id: string;
  full_name: string;
  specialty: { name: string } | null;
}

interface Procedure {
  id: string;
  name: string;
  duration_minutes: number;
  private_price: number;
}

interface Schedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export default function PatientBooking() {
  const { patientProfile } = usePatientAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedProcedure, setSelectedProcedure] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchProfessionals();
    fetchProcedures();
  }, []);

  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedProfessional, selectedDate]);

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from('professionals')
      .select('id, full_name, specialty:specialties(name)')
      .eq('active', true)
      .order('full_name');
    
    setProfessionals(data || []);
  };

  const fetchProcedures = async () => {
    const { data } = await supabase
      .from('procedures')
      .select('id, name, duration_minutes, private_price')
      .eq('active', true)
      .order('name');
    
    setProcedures(data || []);
  };

  const fetchAvailableSlots = async () => {
    if (!selectedProfessional || !selectedDate) return;

    setLoadingSlots(true);
    const dayOfWeek = selectedDate.getDay();
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Get professional's schedule for this day
    const { data: schedules } = await supabase
      .from('professional_schedules')
      .select('*')
      .eq('professional_id', selectedProfessional)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true);

    // Get existing appointments for this day
    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('professional_id', selectedProfessional)
      .eq('appointment_date', dateStr)
      .not('status', 'in', '("cancelado","faltou")');

    // Get schedule blocks for this day
    const { data: blocks } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('professional_id', selectedProfessional)
      .eq('block_date', dateStr);

    // Generate available slots
    const slots: TimeSlot[] = [];
    const procedure = procedures.find(p => p.id === selectedProcedure);
    const duration = procedure?.duration_minutes || 30;

    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        let currentTime = schedule.start_time;
        
        while (currentTime < schedule.end_time) {
          const endTime = addMinutesToTime(currentTime, duration);
          
          if (endTime <= schedule.end_time) {
            const isBlocked = blocks?.some(block => {
              if (block.is_full_day) return true;
              return block.start_time && block.end_time && 
                     currentTime < block.end_time && endTime > block.start_time;
            });

            const isBooked = existingAppointments?.some(apt => 
              currentTime < apt.end_time && endTime > apt.start_time
            );

            slots.push({
              start: currentTime,
              end: endTime,
              available: !isBlocked && !isBooked,
            });
          }
          
          currentTime = addMinutesToTime(currentTime, schedule.slot_duration_minutes);
        }
      }
    }

    setAvailableSlots(slots);
    setLoadingSlots(false);
  };

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
  };

  const handleSubmit = async () => {
    if (!patientProfile?.id || !selectedProfessional || !selectedProcedure || !selectedDate || !selectedSlot) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('appointments').insert({
      patient_id: patientProfile.id,
      professional_id: selectedProfessional,
      procedure_id: selectedProcedure,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      consultation_type: 'particular',
      status: 'agendado',
      notes: notes || null,
    });

    setLoading(false);

    if (error) {
      console.error('Error creating appointment:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao agendar',
        description: 'Não foi possível realizar o agendamento. Tente novamente.',
      });
      return;
    }

    toast({
      title: 'Agendamento realizado!',
      description: 'Sua consulta foi agendada com sucesso.',
    });

    navigate('/paciente/agendamentos');
  };

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 60);

  const selectedProfessionalData = professionals.find(p => p.id === selectedProfessional);
  const selectedProcedureData = procedures.find(p => p.id === selectedProcedure);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agendar Consulta</h1>
        <p className="text-muted-foreground">
          Escolha o profissional, procedimento, data e horário
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Professional and Procedure */}
          {step >= 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profissional e Procedimento
                </CardTitle>
                <CardDescription>
                  Selecione o profissional e o tipo de consulta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select
                    value={selectedProfessional}
                    onValueChange={(value) => {
                      setSelectedProfessional(value);
                      setSelectedDate(undefined);
                      setSelectedSlot(null);
                      if (value && selectedProcedure && step === 1) setStep(2);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.full_name}
                          {prof.specialty && ` - ${prof.specialty.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Procedimento</Label>
                  <Select
                    value={selectedProcedure}
                    onValueChange={(value) => {
                      setSelectedProcedure(value);
                      setSelectedSlot(null);
                      if (value && selectedProfessional && step === 1) setStep(2);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map((proc) => (
                        <SelectItem key={proc.id} value={proc.id}>
                          {proc.name} ({proc.duration_minutes}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Date */}
          {step >= 2 && selectedProfessional && selectedProcedure && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Data da Consulta
                </CardTitle>
                <CardDescription>
                  Escolha uma data disponível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                    if (date && step === 2) setStep(3);
                  }}
                  disabled={(date) => 
                    isBefore(date, minDate) || 
                    isAfter(date, maxDate) ||
                    date.getDay() === 0
                  }
                  locale={ptBR}
                  className="rounded-md border mx-auto"
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Time */}
          {step >= 3 && selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário Disponível
                </CardTitle>
                <CardDescription>
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSlots ? (
                  <p className="text-center py-4 text-muted-foreground">Carregando horários...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    Não há horários disponíveis nesta data
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={selectedSlot?.start === slot.start ? 'default' : 'outline'}
                        disabled={!slot.available}
                        onClick={() => {
                          setSelectedSlot(slot);
                          if (step === 3) setStep(4);
                        }}
                        className="h-12"
                      >
                        {slot.start.slice(0, 5)}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Notes and Confirm */}
          {step >= 4 && selectedSlot && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações (opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Informe alguma observação para a consulta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProfessionalData && (
                <div>
                  <p className="text-sm text-muted-foreground">Profissional</p>
                  <p className="font-medium">{selectedProfessionalData.full_name}</p>
                  {selectedProfessionalData.specialty && (
                    <Badge variant="outline" className="mt-1">
                      {selectedProfessionalData.specialty.name}
                    </Badge>
                  )}
                </div>
              )}

              {selectedProcedureData && (
                <div>
                  <p className="text-sm text-muted-foreground">Procedimento</p>
                  <p className="font-medium">{selectedProcedureData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Duração: {selectedProcedureData.duration_minutes} minutos
                  </p>
                </div>
              )}

              {selectedDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}

              {selectedSlot && (
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">
                    {selectedSlot.start.slice(0, 5)} - {selectedSlot.end.slice(0, 5)}
                  </p>
                </div>
              )}

              {selectedProcedureData && selectedProcedureData.private_price > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Valor Particular</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {selectedProcedureData.private_price.toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
