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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Professional {
  id: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  specialty_id: string | null;
  council_number: string | null;
  council_state: string | null;
  service_type: string;
  active: boolean;
}

interface Specialty {
  id: string;
  name: string;
}

interface HealthInsurance {
  id: string;
  name: string;
}

interface Schedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  service_type: string;
  active: boolean;
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const emptyProfessional = {
  full_name: '',
  cpf: '',
  phone: '',
  email: '',
  specialty_id: '',
  council_number: '',
  council_state: '',
  service_type: 'ambos' as 'ambos' | 'particular' | 'convenio',
  address: '',
  city: '',
  state: '',
  zip_code: '',
};

const emptySchedule: Schedule = {
  day_of_week: 1,
  start_time: '08:00',
  end_time: '18:00',
  slot_duration_minutes: 30,
  service_type: 'ambos',
  active: true,
};

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [formData, setFormData] = useState(emptyProfessional);
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<Schedule>(emptySchedule);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfessionals();
    fetchSpecialties();
    fetchInsurances();
  }, []);

  const fetchProfessionals = async () => {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('full_name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setProfessionals(data || []);
    setLoading(false);
  };

  const fetchSpecialties = async () => {
    const { data } = await supabase.from('specialties').select('*').eq('active', true).order('name');
    setSpecialties(data || []);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase.from('health_insurances').select('id, name').eq('active', true).order('name');
    setInsurances(data || []);
  };

  const fetchProfessionalInsurances = async (professionalId: string) => {
    const { data } = await supabase
      .from('professional_insurances')
      .select('health_insurance_id')
      .eq('professional_id', professionalId);
    return data?.map((d) => d.health_insurance_id) || [];
  };

  const fetchSchedules = async (professionalId: string) => {
    const { data } = await supabase
      .from('professional_schedules')
      .select('*')
      .eq('professional_id', professionalId)
      .order('day_of_week');
    setSchedules(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      specialty_id: formData.specialty_id || null,
    };

    if (editingProfessional) {
      const { error } = await supabase
        .from('professionals')
        .update(payload)
        .eq('id', editingProfessional.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }

      // Update insurances
      await supabase.from('professional_insurances').delete().eq('professional_id', editingProfessional.id);
      if (selectedInsurances.length > 0) {
        await supabase.from('professional_insurances').insert(
          selectedInsurances.map((insId) => ({
            professional_id: editingProfessional.id,
            health_insurance_id: insId,
          }))
        );
      }

      toast({ title: 'Profissional atualizado com sucesso!' });
    } else {
      const { data, error } = await supabase.from('professionals').insert(payload).select().single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }

      // Add insurances
      if (selectedInsurances.length > 0 && data) {
        await supabase.from('professional_insurances').insert(
          selectedInsurances.map((insId) => ({
            professional_id: data.id,
            health_insurance_id: insId,
          }))
        );
      }

      toast({ title: 'Profissional cadastrado com sucesso!' });
    }

    setDialogOpen(false);
    setEditingProfessional(null);
    setFormData(emptyProfessional);
    setSelectedInsurances([]);
    fetchProfessionals();
  };

  const handleAddSchedule = async () => {
    if (!selectedProfessional) return;

    const { error } = await supabase.from('professional_schedules').insert({
      ...newSchedule,
      professional_id: selectedProfessional.id,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    toast({ title: 'Horário adicionado!' });
    setNewSchedule(emptySchedule);
    fetchSchedules(selectedProfessional.id);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const { error } = await supabase.from('professional_schedules').delete().eq('id', scheduleId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    if (selectedProfessional) fetchSchedules(selectedProfessional.id);
  };

  const openEdit = async (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      full_name: professional.full_name,
      cpf: professional.cpf || '',
      phone: professional.phone || '',
      email: professional.email || '',
      specialty_id: professional.specialty_id || '',
      council_number: professional.council_number || '',
      council_state: professional.council_state || '',
      service_type: professional.service_type,
      address: '',
      city: '',
      state: '',
      zip_code: '',
    });
    const insIds = await fetchProfessionalInsurances(professional.id);
    setSelectedInsurances(insIds);
    setDialogOpen(true);
  };

  const openSchedule = (professional: Professional) => {
    setSelectedProfessional(professional);
    fetchSchedules(professional.id);
    setScheduleDialogOpen(true);
  };

  const openNew = () => {
    setEditingProfessional(null);
    setFormData(emptyProfessional);
    setSelectedInsurances([]);
    setDialogOpen(true);
  };

  const filtered = professionals.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profissionais</h1>
          <p className="text-muted-foreground">Gerencie os profissionais da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="dados">
                <TabsList className="w-full">
                  <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
                  <TabsTrigger value="convenios" className="flex-1">Convênios</TabsTrigger>
                </TabsList>
                <TabsContent value="dados" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome Completo *</Label>
                      <Input
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Especialidade</Label>
                      <Select
                        value={formData.specialty_id}
                        onValueChange={(v) => setFormData({ ...formData, specialty_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((spec) => (
                            <SelectItem key={spec.id} value={spec.id}>{spec.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Atendimento</Label>
                      <Select
                        value={formData.service_type}
                        onValueChange={(v) => setFormData({ ...formData, service_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="particular">Particular</SelectItem>
                          <SelectItem value="convenio">Convênio</SelectItem>
                          <SelectItem value="ambos">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nº Conselho</Label>
                      <Input
                        value={formData.council_number}
                        onChange={(e) => setFormData({ ...formData, council_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>UF Conselho</Label>
                      <Input
                        value={formData.council_state}
                        onChange={(e) => setFormData({ ...formData, council_state: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="convenios" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Selecione os convênios atendidos</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {insurances.map((ins) => (
                      <div key={ins.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={ins.id}
                          checked={selectedInsurances.includes(ins.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedInsurances([...selectedInsurances, ins.id]);
                            } else {
                              setSelectedInsurances(selectedInsurances.filter((id) => id !== ins.id));
                            }
                          }}
                        />
                        <label htmlFor={ins.id} className="text-sm">{ins.name}</label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agenda de {selectedProfessional?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Dia</Label>
                <Select
                  value={newSchedule.day_of_week.toString()}
                  onValueChange={(v) => setNewSchedule({ ...newSchedule, day_of_week: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day, i) => (
                      <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={newSchedule.slot_duration_minutes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, slot_duration_minutes: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddSchedule}>Adicionar</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((sched: any) => (
                  <TableRow key={sched.id}>
                    <TableCell>{dayNames[sched.day_of_week]}</TableCell>
                    <TableCell>{sched.start_time} - {sched.end_time}</TableCell>
                    <TableCell>{sched.slot_duration_minutes} min</TableCell>
                    <TableCell className="capitalize">{sched.service_type}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSchedule(sched.id)}>
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar profissional..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo Atendimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhum profissional encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.full_name}</TableCell>
                  <TableCell>
                    {specialties.find((s) => s.id === prof.specialty_id)?.name || '-'}
                  </TableCell>
                  <TableCell>{prof.phone || '-'}</TableCell>
                  <TableCell className="capitalize">{prof.service_type}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${prof.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {prof.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(prof)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openSchedule(prof)}>
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
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
