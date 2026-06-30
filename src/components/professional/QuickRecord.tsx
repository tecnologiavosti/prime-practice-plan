import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { addClinicHeader } from '@/lib/pdfHeader';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FileText, Pill, FileSignature, Save, Download, Stethoscope, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string | null;
  patientId: string | null;
  patientName: string;
  professionalId: string | null;
  professionalName: string;
  professionalCrm?: string | null;
}

const empty = {
  chief_complaint: '',
  current_illness_history: '',
  past_medical_history: '',
  family_history: '',
  allergies: '',
  current_medications: '',
  lifestyle_habits: '',
  physical_examination: '',
  diagnosis: '',
  treatment_plan: '',
  notes: '',
};

export function QuickRecord({
  open,
  onOpenChange,
  appointmentId,
  patientId,
  patientName,
  professionalId,
  professionalName,
  professionalCrm,
}: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty });
  const [attestDays, setAttestDays] = useState('1');
  const [attestReason, setAttestReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [patientFull, setPatientFull] = useState<any>(null);

  const set = (k: keyof typeof empty) => (e: any) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    if (!open || !patientId) return;
    (async () => {
      const [{ data: anam }, { data: pat }] = await Promise.all([
        appointmentId
          ? supabase.from('anamnesis').select('*').eq('appointment_id', appointmentId).maybeSingle()
          : Promise.resolve({ data: null as any }),
        supabase
          .from('patients')
          .select('full_name, cpf, birth_date, phone, email, gender, address, city, state')
          .eq('id', patientId)
          .maybeSingle(),
      ]);
      setPatientFull(pat);
      if (anam) {
        setForm({
          chief_complaint: anam.chief_complaint || '',
          current_illness_history: anam.current_illness_history || '',
          past_medical_history: anam.past_medical_history || '',
          family_history: anam.family_history || '',
          allergies: anam.allergies || '',
          current_medications: anam.current_medications || '',
          lifestyle_habits: anam.lifestyle_habits || '',
          physical_examination: anam.physical_examination || '',
          diagnosis: anam.diagnosis || '',
          treatment_plan: anam.treatment_plan || '',
          notes: anam.notes || '',
        });
      } else {
        setForm({ ...empty });
      }
    })();
  }, [open, appointmentId, patientId]);

  const saveRecord = async () => {
    if (!patientId) return;
    setSaving(true);
    const payload: any = {
      patient_id: patientId,
      appointment_id: appointmentId,
      professional_id: professionalId,
      ...Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, (v as string).trim() || null]),
      ),
    };
    const { data: existing } = appointmentId
      ? await supabase.from('anamnesis').select('id').eq('appointment_id', appointmentId).maybeSingle()
      : { data: null as any };
    const { error } = existing
      ? await supabase.from('anamnesis').update(payload).eq('id', existing.id)
      : await supabase.from('anamnesis').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Prontuário salvo' });
    }
  };

  const writeSection = (doc: jsPDF, y: number, title: string, body: string) => {
    if (!body?.trim()) return y;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(body, 170);
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 20, y);
      y += 5;
    }
    return y + 4;
  };

  const downloadFullRecordPdf = async () => {
    const doc = new jsPDF();
    let y = await addClinicHeader(doc, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PRONTUÁRIO MÉDICO', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, y, { align: 'center' });
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Identificação do Paciente', 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    const p = patientFull || {};
    const idLines = [
      `Nome: ${patientName}`,
      `CPF: ${p.cpf || '—'}   Nasc.: ${p.birth_date ? format(new Date(p.birth_date), 'dd/MM/yyyy') : '—'}   Sexo: ${p.gender || '—'}`,
      `Contato: ${p.phone || '—'}   E-mail: ${p.email || '—'}`,
      `Endereço: ${[p.address, p.city, p.state].filter(Boolean).join(', ') || '—'}`,
    ];
    idLines.forEach((l) => { doc.text(l, 20, y); y += 5; });
    y += 4;

    y = writeSection(doc, y, '1. Queixa principal', form.chief_complaint);
    y = writeSection(doc, y, '2. História da doença atual', form.current_illness_history);
    y = writeSection(doc, y, '3. Antecedentes pessoais', form.past_medical_history);
    y = writeSection(doc, y, '4. Antecedentes familiares', form.family_history);
    y = writeSection(doc, y, '5. Alergias', form.allergies);
    y = writeSection(doc, y, '6. Medicações em uso', form.current_medications);
    y = writeSection(doc, y, '7. Hábitos de vida', form.lifestyle_habits);
    y = writeSection(doc, y, '8. Exame físico / sinais vitais', form.physical_examination);
    y = writeSection(doc, y, '9. Hipótese diagnóstica / CID', form.diagnosis);
    y = writeSection(doc, y, '10. Conduta / Plano terapêutico', form.treatment_plan);
    y = writeSection(doc, y, '11. Evolução e observações', form.notes);

    if (y > 250) { doc.addPage(); y = 20; }
    y += 20;
    doc.line(60, y, 150, y); y += 5;
    doc.setFontSize(9);
    doc.text(professionalName, 105, y, { align: 'center' });
    if (professionalCrm) { y += 4; doc.text(`CRM: ${professionalCrm}`, 105, y, { align: 'center' }); }

    doc.save(`prontuario_${patientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const generatePrescriptionPdf = async () => {
    if (!form.treatment_plan.trim()) {
      toast({ title: 'Preencha a conduta/prescrição antes', variant: 'destructive' });
      return;
    }
    const doc = new jsPDF();
    let y = await addClinicHeader(doc, 20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text('PRESCRIÇÃO MÉDICA', 105, y, { align: 'center' }); y += 10;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Paciente: ${patientName}`, 20, y); y += 6;
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 20, y); y += 10;
    if (form.diagnosis.trim()) {
      doc.setFont('helvetica', 'bold'); doc.text('Diagnóstico:', 20, y); y += 5;
      doc.setFont('helvetica', 'normal');
      const dx = doc.splitTextToSize(form.diagnosis, 170);
      doc.text(dx, 20, y); y += dx.length * 5 + 4;
    }
    doc.setFont('helvetica', 'bold'); doc.text('Prescrição:', 20, y); y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(form.treatment_plan, 170);
    doc.text(lines, 20, y); y += lines.length * 5 + 20;
    doc.line(60, y, 150, y); y += 5;
    doc.setFontSize(9);
    doc.text(professionalName, 105, y, { align: 'center' });
    if (professionalCrm) { y += 4; doc.text(`CRM: ${professionalCrm}`, 105, y, { align: 'center' }); }
    doc.save(`prescricao_${patientName.replace(/\s+/g, '_')}.pdf`);
  };

  const generateAttestPdf = async () => {
    const days = parseInt(attestDays, 10) || 1;
    const doc = new jsPDF();
    let y = await addClinicHeader(doc, 20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text('ATESTADO MÉDICO', 105, y, { align: 'center' }); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    const today = format(new Date(), 'dd/MM/yyyy');
    const text =
      `Atesto, para os devidos fins, que o(a) paciente ${patientName} esteve sob meus cuidados ` +
      `na presente data (${today}), necessitando de afastamento de suas atividades por ${days} ` +
      `dia(s)${attestReason.trim() ? `, em razão de: ${attestReason.trim()}` : ''}.`;
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, y); y += lines.length * 6 + 30;
    doc.line(60, y, 150, y); y += 5;
    doc.setFontSize(9);
    doc.text(professionalName, 105, y, { align: 'center' });
    if (professionalCrm) { y += 4; doc.text(`CRM: ${professionalCrm}`, 105, y, { align: 'center' }); }
    doc.save(`atestado_${patientName.replace(/\s+/g, '_')}.pdf`);
  };

  const field = (k: keyof typeof empty, label: string, rows = 3, placeholder = '') => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea rows={rows} value={form[k]} onChange={set(k)} placeholder={placeholder} />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Prontuário Médico</SheetTitle>
          <SheetDescription>{patientName}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="anamnese" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="anamnese"><ClipboardList className="h-4 w-4 mr-1" />Anamnese</TabsTrigger>
            <TabsTrigger value="exame"><Stethoscope className="h-4 w-4 mr-1" />Exame</TabsTrigger>
            <TabsTrigger value="conduta"><FileText className="h-4 w-4 mr-1" />Conduta</TabsTrigger>
            <TabsTrigger value="prescription"><Pill className="h-4 w-4 mr-1" />Receita</TabsTrigger>
            <TabsTrigger value="attest"><FileSignature className="h-4 w-4 mr-1" />Atestado</TabsTrigger>
          </TabsList>

          <TabsContent value="anamnese" className="space-y-4 mt-4">
            {field('chief_complaint', 'Queixa principal', 2, 'Motivo da consulta relatado pelo paciente')}
            {field('current_illness_history', 'História da doença atual (HDA)', 5, 'Início, evolução, fatores de melhora/piora...')}
            {field('past_medical_history', 'Antecedentes pessoais', 3, 'Doenças, cirurgias, internações prévias')}
            {field('family_history', 'Antecedentes familiares', 2)}
            {field('allergies', 'Alergias', 2, 'Medicamentos, alimentos, etc.')}
            {field('current_medications', 'Medicações em uso', 3)}
            {field('lifestyle_habits', 'Hábitos de vida', 2, 'Tabagismo, etilismo, atividade física, sono...')}
          </TabsContent>

          <TabsContent value="exame" className="space-y-4 mt-4">
            {field('physical_examination', 'Exame físico e sinais vitais', 10,
              'PA: __/__ mmHg | FC: __ bpm | FR: __ irpm | Sat O2: __% | T: __°C | Peso: __ kg | Altura: __ m\n\nDescreva achados ao exame...')}
          </TabsContent>

          <TabsContent value="conduta" className="space-y-4 mt-4">
            {field('diagnosis', 'Hipótese diagnóstica / CID-10', 3)}
            {field('treatment_plan', 'Conduta / Plano terapêutico', 6, 'Exames solicitados, medicações, orientações, retorno...')}
            {field('notes', 'Evolução e observações', 4)}
          </TabsContent>

          <TabsContent value="prescription" className="space-y-4 mt-4">
            <p className="text-xs text-muted-foreground">A prescrição é gerada a partir do campo "Conduta / Plano terapêutico".</p>
            {field('treatment_plan', 'Prescrição', 12,
              '1. Dipirona 500mg — 1 cp VO 6/6h por 3 dias\n2. ...')}
            <Button onClick={generatePrescriptionPdf} className="gap-2">
              <Pill className="h-4 w-4" />Gerar PDF da Receita
            </Button>
          </TabsContent>

          <TabsContent value="attest" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Dias de afastamento</Label>
                <Input type="number" min="1" value={attestDays} onChange={(e) => setAttestDays(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea rows={3} value={attestReason} onChange={(e) => setAttestReason(e.target.value)} />
            </div>
            <Button onClick={generateAttestPdf} className="gap-2">
              <FileSignature className="h-4 w-4" />Gerar PDF do Atestado
            </Button>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 bg-background border-t mt-6 pt-4 flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={downloadFullRecordPdf} className="gap-2">
            <Download className="h-4 w-4" />Baixar Prontuário (PDF)
          </Button>
          <Button onClick={saveRecord} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar Prontuário'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
