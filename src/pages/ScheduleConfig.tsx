import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

interface Professional {
  id: string;
  full_name: string;
}

interface Schedule {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  service_type: string;
  active: boolean;
}

export default function ScheduleConfig() {
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [isProfessionalUser, setIsProfessionalUser] = useState(false);
  const [noProfessionalRecord, setNoProfessionalRecord] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [serviceType, setServiceType] = useState('ambos');
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessional) fetchSchedules();
  }, [selectedProfessional]);

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from('professionals')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name');
    if (data) setProfessionals(data);
  };

  const fetchSchedules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('professional_schedules')
      .select('*')
      .eq('professional_id', selectedProfessional)
      .order('day_of_week');
    if (data) setSchedules(data as Schedule[]);
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedDays([]);
    setStartTime('08:00');
    setEndTime('18:00');
    setSlotDuration('30');
    setServiceType('ambos');
    setActive(true);
    setEditingSchedule(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (s: Schedule) => {
    setEditingSchedule(s);
    setSelectedDays([s.day_of_week]);
    setStartTime(s.start_time.slice(0, 5));
    setEndTime(s.end_time.slice(0, 5));
    setSlotDuration(String(s.slot_duration_minutes));
    setServiceType(s.service_type);
    setActive(s.active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedProfessional) return;

    if (editingSchedule) {
      const { error } = await supabase
        .from('professional_schedules')
        .update({
          day_of_week: selectedDays[0],
          start_time: startTime,
          end_time: endTime,
          slot_duration_minutes: parseInt(slotDuration),
          service_type: serviceType as any,
          active,
        })
        .eq('id', editingSchedule.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Horário atualizado com sucesso' });
    } else {
      if (selectedDays.length === 0) {
        toast({ title: 'Selecione ao menos um dia', variant: 'destructive' });
        return;
      }

      const rows = selectedDays.map((day) => ({
        professional_id: selectedProfessional,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        slot_duration_minutes: parseInt(slotDuration),
        service_type: serviceType as any,
        active,
      }));

      const { error } = await supabase.from('professional_schedules').insert(rows);
      if (error) {
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Horários cadastrados com sucesso' });
    }

    setDialogOpen(false);
    resetForm();
    fetchSchedules();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('professional_schedules').delete().eq('id', deleteId);
    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Horário removido' });
      fetchSchedules();
    }
    setDeleteId(null);
  };

  const toggleDay = (day: number) => {
    if (editingSchedule) return; // single day when editing
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getDayLabel = (d: number) => DAYS_OF_WEEK.find((x) => x.value === d)?.label ?? '';

  const serviceLabel = (t: string) => {
    if (t === 'particular') return 'Particular';
    if (t === 'convenio') return 'Convênio';
    return 'Ambos';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurar Escalas</h1>
          <p className="text-muted-foreground">Defina os dias e horários de atendimento de cada profissional.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Selecione o Profissional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um profissional..." />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProfessional && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Horários Cadastrados</CardTitle>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Horário
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : schedules.length === 0 ? (
              <p className="text-muted-foreground">Nenhum horário cadastrado. Clique em "Adicionar Horário" para começar.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Duração Slot</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{getDayLabel(s.day_of_week)}</TableCell>
                      <TableCell>{s.start_time.slice(0, 5)}</TableCell>
                      <TableCell>{s.end_time.slice(0, 5)}</TableCell>
                      <TableCell>{s.slot_duration_minutes} min</TableCell>
                      <TableCell>{serviceLabel(s.service_type)}</TableCell>
                      <TableCell>{s.active ? 'Sim' : 'Não'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEdit(s)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Editar Horário' : 'Adicionar Horários'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Dias da Semana</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                      disabled={!!editingSchedule && day.value !== editingSchedule.day_of_week}
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start">Hora Início</Label>
                <Input id="start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end">Hora Fim</Label>
                <Input id="end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slot">Duração do Slot (min)</Label>
                <Input id="slot" type="number" value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} min="10" max="120" />
              </div>
              <div>
                <Label>Tipo de Atendimento</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambos">Ambos</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="convenio">Convênio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <Checkbox checked={active} onCheckedChange={(v) => setActive(!!v)} />
              <span className="text-sm">Ativo</span>
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editingSchedule ? 'Salvar' : 'Cadastrar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>Deseja remover este horário? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
