import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { QuickRecord } from '@/components/professional/QuickRecord';
import { ClipboardEdit } from 'lucide-react';

type AppointmentRow = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  consultation_type: string;
  notes: string | null;
  patient_id: string;
  patients: { full_name: string } | null;
  procedures: { name: string } | null;
};

const STATUS_OPTIONS = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em_atendimento', label: 'Em Atendimento' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
];

const STATUS_COLORS: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-emerald-100 text-emerald-700',
  em_atendimento: 'bg-amber-100 text-amber-700',
  finalizado: 'bg-slate-100 text-slate-700',
  cancelado: 'bg-red-100 text-red-700',
  faltou: 'bg-orange-100 text-orange-700',
};

export default function ProfessionalSchedule() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [items, setItems] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<{ id: string; full_name: string; crm: string | null } | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<AppointmentRow | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('professionals').select('id, full_name, crm').maybeSingle();
      if (data) setMe(data as any);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, end_time, status, consultation_type, notes, patient_id, patients(full_name), procedures(name)')
      .eq('appointment_date', date)
      .order('start_time', { ascending: true });

    if (error) {
      toast({ title: 'Erro ao carregar agenda', description: error.message, variant: 'destructive' });
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [date]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status: status as any }).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status atualizado' });
      load();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minha Agenda</h1>
          <p className="text-sm text-muted-foreground">Atendimentos do dia selecionado</p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-[180px]"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {items.length} atendimento(s) em {format(new Date(date + 'T00:00:00'), 'dd/MM/yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum atendimento agendado para esta data.</p>
          ) : (
            <div className="space-y-2">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-4 rounded-md border bg-card p-3"
                >
                  <div className="text-sm font-mono w-24 shrink-0">
                    {a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{a.patients?.full_name || 'Paciente'}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.procedures?.name || '—'} · {a.consultation_type}
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[a.status] || ''} variant="secondary">
                    {STATUS_OPTIONS.find((s) => s.value === a.status)?.label || a.status}
                  </Badge>
                  <Select value={a.status} onValueChange={(v) => updateStatus(a.id, v)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => { setActiveRow(a); setRecordOpen(true); }}
                  >
                    <ClipboardEdit className="h-4 w-4" />
                    Prontuário
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QuickRecord
        open={recordOpen}
        onOpenChange={setRecordOpen}
        appointmentId={activeRow?.id || null}
        patientId={activeRow?.patient_id || null}
        patientName={activeRow?.patients?.full_name || ''}
        professionalId={me?.id || null}
        professionalName={me?.full_name || ''}
        professionalCrm={me?.crm || null}
      />
    </div>
  );
}
