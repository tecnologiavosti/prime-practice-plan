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
import { FileText, Pill, FileSignature, Save } from 'lucide-react';
import { format } from 'date-fns';

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
  const [evolution, setEvolution] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [attestDays, setAttestDays] = useState('1');
  const [attestReason, setAttestReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Carregar anamnesis existente desta consulta
  useEffect(() => {
    if (!open || !appointmentId) return;
    (async () => {
      const { data } = await supabase
        .from('anamnesis')
        .select('notes, diagnosis, treatment_plan')
        .eq('appointment_id', appointmentId)
        .maybeSingle();
      if (data) {
        setEvolution(data.notes || '');
        setDiagnosis(data.diagnosis || '');
        setPrescription(data.treatment_plan || '');
      } else {
        setEvolution('');
        setDiagnosis('');
        setPrescription('');
      }
    })();
  }, [open, appointmentId]);

  const saveEvolution = async () => {
    if (!patientId || !appointmentId) return;
    setSaving(true);

    // upsert por appointment_id
    const { data: existing } = await supabase
      .from('anamnesis')
      .select('id')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    const payload = {
      patient_id: patientId,
      appointment_id: appointmentId,
      professional_id: professionalId,
      notes: evolution.trim() || null,
      diagnosis: diagnosis.trim() || null,
      treatment_plan: prescription.trim() || null,
    };

    const { error } = existing
      ? await supabase.from('anamnesis').update(payload).eq('id', existing.id)
      : await supabase.from('anamnesis').insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Evolução salva' });
    }
  };

  const generatePrescriptionPdf = async () => {
    if (!prescription.trim()) {
      toast({ title: 'Preencha a prescrição antes de gerar o PDF', variant: 'destructive' });
      return;
    }
    const doc = new jsPDF();
    let y = await addClinicHeader(doc, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PRESCRIÇÃO MÉDICA', 105, y, { align: 'center' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Paciente: ${patientName}`, 20, y);
    y += 6;
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 20, y);
    y += 10;

    if (diagnosis.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnóstico (CID/Hipótese):', 20, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const dxLines = doc.splitTextToSize(diagnosis, 170);
      doc.text(dxLines, 20, y);
      y += dxLines.length * 5 + 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Prescrição:', 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(prescription, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 20;

    // Assinatura
    doc.line(60, y, 150, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(professionalName, 105, y, { align: 'center' });
    if (professionalCrm) {
      y += 4;
      doc.text(`CRM: ${professionalCrm}`, 105, y, { align: 'center' });
    }

    doc.save(`prescricao_${patientName.replace(/\s+/g, '_')}.pdf`);
  };

  const generateAttestPdf = async () => {
    const days = parseInt(attestDays, 10) || 1;
    const doc = new jsPDF();
    let y = await addClinicHeader(doc, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ATESTADO MÉDICO', 105, y, { align: 'center' });
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const today = format(new Date(), 'dd/MM/yyyy');
    const text =
      `Atesto, para os devidos fins, que o(a) paciente ${patientName} esteve sob meus cuidados ` +
      `na presente data (${today}), necessitando de afastamento de suas atividades por ${days} ` +
      `(${days === 1 ? 'um' : days} ) dia(s)${attestReason.trim() ? `, em razão de: ${attestReason.trim()}` : ''}.`;

    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 30;

    doc.line(60, y, 150, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(professionalName, 105, y, { align: 'center' });
    if (professionalCrm) {
      y += 4;
      doc.text(`CRM: ${professionalCrm}`, 105, y, { align: 'center' });
    }

    doc.save(`atestado_${patientName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Prontuário rápido</SheetTitle>
          <SheetDescription>{patientName}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="evolution" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="evolution"><FileText className="h-4 w-4 mr-1" />Evolução</TabsTrigger>
            <TabsTrigger value="prescription"><Pill className="h-4 w-4 mr-1" />Prescrição</TabsTrigger>
            <TabsTrigger value="attest"><FileSignature className="h-4 w-4 mr-1" />Atestado</TabsTrigger>
          </TabsList>

          <TabsContent value="evolution" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Diagnóstico / Hipótese</Label>
              <Textarea rows={2} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Ex.: CID-10, hipótese diagnóstica..." />
            </div>
            <div className="space-y-2">
              <Label>Evolução do atendimento</Label>
              <Textarea rows={10} value={evolution} onChange={(e) => setEvolution(e.target.value)} placeholder="Descreva o atendimento, sintomas, exames, conduta..." />
            </div>
            <Button onClick={saveEvolution} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar evolução'}
            </Button>
          </TabsContent>

          <TabsContent value="prescription" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Prescrição</Label>
              <Textarea
                rows={12}
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder={'Ex.:\n1. Dipirona 500mg — 1 comprimido VO de 6/6h por 3 dias\n2. ...'}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveEvolution} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />Salvar
              </Button>
              <Button onClick={generatePrescriptionPdf} className="gap-2">
                <Pill className="h-4 w-4" />Gerar PDF da Prescrição
              </Button>
            </div>
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
              <Textarea rows={3} value={attestReason} onChange={(e) => setAttestReason(e.target.value)} placeholder="Ex.: quadro gripal, repouso recomendado..." />
            </div>
            <Button onClick={generateAttestPdf} className="gap-2">
              <FileSignature className="h-4 w-4" />Gerar PDF do Atestado
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
