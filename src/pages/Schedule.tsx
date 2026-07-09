import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useRealtime } from '@/hooks/useRealtime';

type ViewType = 'day' | 'week' | 'month';

interface Professional {
  id: string;
  full_name: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_type: string;
  patient: { full_name: string } | null;
  procedure: { name: string } | null;
}

const statusColors: Record<string, string> = {
  agendado: 'bg-blue-100 border-blue-300 text-blue-800',
  confirmado: 'bg-green-100 border-green-300 text-green-800',
  em_atendimento: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  finalizado: 'bg-gray-100 border-gray-300 text-gray-800',
  cancelado: 'bg-red-100 border-red-300 text-red-800',
  faltou: 'bg-orange-100 border-orange-300 text-orange-800',
};

export default function Schedule() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfessionals();
  }, []);
  useRealtime(['appointments','professional_schedules','schedule_blocks','professional_special_periods'], fetchProfessionals);

  useEffect(() => {
    if (selectedProfessional) {
      fetchAppointments();
    }
  }, [selectedProfessional, currentDate, viewType]);

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from('professionals')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name');
    setProfessionals(data || []);
    if (data && data.length > 0) {
      setSelectedProfessional(data[0].id);
    }
    setLoading(false);
  };

  const fetchAppointments = async () => {
    let startDate: Date, endDate: Date;

    if (viewType === 'day') {
      startDate = currentDate;
      endDate = currentDate;
    } else if (viewType === 'week') {
      startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
      endDate = addDays(startDate, 6);
    } else {
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
    }

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        consultation_type,
        patient:patients(full_name),
        procedure:procedures(name)
      `)
      .eq('professional_id', selectedProfessional)
      .gte('appointment_date', format(startDate, 'yyyy-MM-dd'))
      .lte('appointment_date', format(endDate, 'yyyy-MM-dd'))
      .order('start_time');

    setAppointments((data as any) || []);
  };

  const navigate_date = (direction: 'prev' | 'next') => {
    if (viewType === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    } else if (viewType === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startWeek, end: addDays(end, 6 - end.getDay()) });
    return days;
  }, [currentDate]);

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => apt.appointment_date === format(date, 'yyyy-MM-dd'));
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7:00 to 18:00

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda Médica</h1>
          <p className="text-muted-foreground">Visualize e gerencie a agenda</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione um profissional" />
            </SelectTrigger>
            <SelectContent>
              {professionals.length === 0 ? (
                <SelectItem value="none" disabled>
                  Nenhum profissional cadastrado
                </SelectItem>
              ) : (
                professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.full_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/admin/agendamentos')}>
            <Plus className="mr-2 h-4 w-4" />
            Agendar
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate_date('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {viewType === 'day' && format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          {viewType === 'week' && `${format(weekDays[0], 'd MMM', { locale: ptBR })} - ${format(weekDays[6], "d MMM 'de' yyyy", { locale: ptBR })}`}
          {viewType === 'month' && format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => navigate_date('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Empty State - No professionals */}
      {professionals.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhum profissional cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Cadastre profissionais para visualizar e gerenciar a agenda.
            </p>
            <Button onClick={() => navigate('/admin/profissionais')}>
              Cadastrar Profissional
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Day View */}
      {professionals.length > 0 && viewType === 'day' && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {hours.map((hour) => {
                const hourAppts = getAppointmentsForDate(currentDate).filter(
                  (apt) => parseInt(apt.start_time.split(':')[0]) === hour
                );
                return (
                  <div key={hour} className="flex gap-4 border-b py-2">
                    <div className="w-16 text-sm font-medium text-muted-foreground">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    <div className="flex-1 space-y-1">
                      {hourAppts.length === 0 ? (
                        <div className="h-8 rounded border border-dashed border-muted-foreground/30" />
                      ) : (
                        hourAppts.map((apt) => (
                          <div
                            key={apt.id}
                            className={cn(
                              'rounded border p-2 text-sm',
                              statusColors[apt.status]
                            )}
                          >
                            <div className="font-medium">{apt.patient?.full_name}</div>
                            <div className="text-xs">
                              {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)} | {apt.procedure?.name}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {professionals.length > 0 && viewType === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <Card key={day.toISOString()} className={cn(isSameDay(day, new Date()) && 'ring-2 ring-primary')}>
              <CardHeader className="p-2">
                <CardTitle className="text-center text-sm">
                  <div className="text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[200px] max-h-64 space-y-1 overflow-y-auto p-2">
                {getAppointmentsForDate(day).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    Sem consultas
                  </div>
                ) : (
                  getAppointmentsForDate(day).map((apt) => (
                    <div
                      key={apt.id}
                      className={cn(
                        'rounded border p-1 text-xs',
                        statusColors[apt.status]
                      )}
                    >
                      <div className="font-medium truncate">{apt.patient?.full_name}</div>
                      <div>{apt.start_time.slice(0, 5)}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Month View */}
      {professionals.length > 0 && viewType === 'month' && (
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {monthDays.map((day) => {
            const dayAppts = getAppointmentsForDate(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[80px] rounded border p-1',
                  !isSameMonth(day, currentDate) && 'bg-muted/50 opacity-50',
                  isSameDay(day, new Date()) && 'ring-2 ring-primary'
                )}
              >
                <div className="text-right text-sm font-medium">{format(day, 'd')}</div>
                <div className="mt-1 space-y-0.5">
                  {dayAppts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className={cn(
                        'truncate rounded px-1 text-xs',
                        statusColors[apt.status]
                      )}
                    >
                      {apt.start_time.slice(0, 5)} {apt.patient?.full_name}
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{dayAppts.length - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
