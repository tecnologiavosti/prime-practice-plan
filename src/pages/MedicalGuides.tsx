import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Trash2, FileText, Calendar, AlertTriangle, Pencil, FileDown, Paperclip, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { addClinicHeader } from '@/lib/pdfHeader';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { createDocumentSignedUrl, DOCUMENTS_BUCKET } from '@/lib/storageDocuments';
import { MultiFileUpload, splitPaths } from '@/components/ui/multi-file-upload';

interface GuideItem {
  id?: string;
  procedure_id: string;
  professional_id: string;
  service_date: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  status: string;
  procedure?: { id: string; name: string; code: string } | null;
  professional?: { id: string; full_name: string; crm?: string | null; uf_crm?: string | null } | null;
}

interface MedicalGuide {
  id: string;
  guide_number: string;
  guide_date: string;
  validity_date: string | null;
  quantity: number;
  unit_value: number;
  total_value: number;
  status: string;
  cid_10: string | null;
  clinical_indication: string | null;
  patient: { id: string; full_name: string; cpf?: string | null } | null;
  health_insurance: { id: string; name: string } | null;
  procedure: { id: string; name: string; code?: string } | null;
  professional: { id: string; full_name: string; crm?: string | null; uf_crm?: string | null } | null;
  items?: GuideItem[];
  attachment_url?: string | null;
}

interface Patient {
  id: string;
  full_name: string;
}

interface Professional {
  id: string;
  full_name: string;
}

interface HealthInsurance {
  id: string;
  name: string;
}

interface Procedure {
  id: string;
  name: string;
  code: string;
}

interface ProcedureInsurancePrice {
  procedure_id: string;
  health_insurance_id: string;
  price: number;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  autorizada: 'bg-green-100 text-green-800',
  faturada: 'bg-blue-100 text-blue-800',
  recebida: 'bg-emerald-100 text-emerald-800',
  glosada: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  autorizada: 'Autorizada',
  faturada: 'Faturada',
  recebida: 'Recebida',
  glosada: 'Glosada',
};

const emptyForm = {
  guide_number: '',
  patient_id: '',
  administrator_id: '',
  health_insurance_id: '',
  professional_id: '',
  guide_date: format(new Date(), 'yyyy-MM-dd'),
  validity_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  cid_10: '',
  clinical_indication: '',
};

interface Administrator { id: string; name: string; }
interface InsuranceAdminMap { insurance_id: string; administrator_id: string; billing_rate: number | null; }

const emptyItem: Omit<GuideItem, 'id' | 'procedure' | 'professional'> = {
  procedure_id: '',
  professional_id: '',
  service_date: format(new Date(), 'yyyy-MM-dd'),
  quantity: 1,
  unit_value: 0,
  total_value: 0,
  status: 'pendente',
};

export default function MedicalGuides() {
  const [guides, setGuides] = useState<MedicalGuide[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [insAdminMap, setInsAdminMap] = useState<InsuranceAdminMap[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [procedureInsurancePrices, setProcedureInsurancePrices] = useState<ProcedureInsurancePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [items, setItems] = useState<Omit<GuideItem, 'id' | 'procedure' | 'professional'>[]>([{ ...emptyItem }]);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentsDialog, setAttachmentsDialog] = useState<string[] | null>(null);
  const [openingAttachmentIdx, setOpeningAttachmentIdx] = useState<number | null>(null);
  const [insuranceRate, setInsuranceRate] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    await Promise.all([
      fetchGuides(),
      fetchPatients(),
      fetchProfessionals(),
      fetchInsurances(),
      fetchProcedures(),
      fetchProcedureInsurancePrices(),
      fetchAdministrators(),
      fetchInsAdminMap(),
    ]);
    setLoading(false);
  };

  const fetchAdministrators = async () => {
    const { data } = await supabase.from('administrators').select('id, name').eq('active', true).order('name');
    setAdministrators(data || []);
  };

  const fetchInsAdminMap = async () => {
    const { data } = await supabase.from('insurance_administrators_map').select('insurance_id, administrator_id, billing_rate');
    setInsAdminMap((data as any) || []);
  };


  const fetchGuides = async () => {
    let query = supabase
      .from('medical_guides')
      .select(`
        *,
        patient:patients(id, full_name, cpf),
        health_insurance:health_insurances(id, name),
        procedure:procedures(id, name, code),
        professional:professionals(id, full_name, crm, uf_crm)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setGuides((data as any) || []);
  };

  const fetchGuideItems = async (guideId: string) => {
    const { data, error } = await supabase
      .from('medical_guide_items')
      .select(`
        *,
        procedure:procedures(id, name, code),
        professional:professionals(id, full_name, crm, uf_crm)
      `)
      .eq('medical_guide_id', guideId)
      .order('service_date', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return [];
    }
    return data || [];
  };

  const handleExpandGuide = async (guideId: string) => {
    if (expandedGuide === guideId) {
      setExpandedGuide(null);
      return;
    }
    
    const items = await fetchGuideItems(guideId);
    setGuides(prev => prev.map(g => 
      g.id === guideId ? { ...g, items: items as GuideItem[] } : g
    ));
    setExpandedGuide(guideId);
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, full_name').eq('active', true).order('full_name');
    setPatients(data || []);
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('professionals').select('id, full_name').eq('active', true).order('full_name');
    setProfessionals(data || []);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase.from('health_insurances').select('id, name').eq('active', true).order('name');
    setInsurances(data || []);
  };

  const fetchProcedures = async () => {
    const { data } = await supabase.from('procedures').select('id, name, code').eq('active', true).order('name');
    setProcedures(data || []);
  };

  const fetchProcedureInsurancePrices = async () => {
    const { data } = await supabase.from('procedure_insurance_prices').select('procedure_id, health_insurance_id, price');
    setProcedureInsurancePrices(data || []);
  };

  const generateGuideNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `G${timestamp}${random}`;
  };

  const addItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getInsuranceDefaultPrice = (procedureId: string, insuranceId: string): number | null => {
    // 1) procedure_insurance_prices (preço específico por procedimento)
    const pip = procedureInsurancePrices.find(p => p.procedure_id === procedureId && p.health_insurance_id === insuranceId);
    if (pip) return Number(pip.price) || 0;
    // 2) valor editável do convênio na guia
    if (insuranceRate > 0) return insuranceRate;
    // 3) billing_rate da administradora selecionada
    if (formData.administrator_id) {
      const m = insAdminMap.find(x => x.insurance_id === insuranceId && x.administrator_id === formData.administrator_id);
      if (m && m.billing_rate != null) return Number(m.billing_rate) || 0;
    }
    return null;
  };

  const applyInsuranceRate = (rate: number) => {
    setInsuranceRate(rate);
    setItems(prev => prev.map(it => ({
      ...it,
      unit_value: rate,
      total_value: (it.quantity || 1) * rate,
    })));
  };

  const updateItem = (index: number, field: keyof typeof emptyItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'procedure_id' && formData.health_insurance_id) {
      const price = getInsuranceDefaultPrice(value, formData.health_insurance_id);
      if (price != null) {
        newItems[index].unit_value = price;
        newItems[index].total_value = newItems[index].quantity * price;
      }
    }

    if (field === 'quantity' || field === 'unit_value') {
      newItems[index].total_value = newItems[index].quantity * newItems[index].unit_value;
    }

    setItems(newItems);
  };

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + item.total_value, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.administrator_id || !formData.health_insurance_id || !formData.professional_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preencha paciente, administradora, convênio e profissional executante' });
      return;
    }

    if (items.every(item => !item.procedure_id)) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Adicione pelo menos um procedimento' });
      return;
    }

    const totalValue = getTotalValue();

    const payload = {
      guide_number: formData.guide_number || generateGuideNumber(),
      patient_id: formData.patient_id,
      administrator_id: formData.administrator_id,
      health_insurance_id: formData.health_insurance_id,
      professional_id: formData.professional_id || null,
      guide_date: formData.guide_date,
      validity_date: formData.validity_date,
      quantity: items.reduce((sum, i) => sum + i.quantity, 0),
      unit_value: 0,
      total_value: totalValue,
      attachment_url: attachmentUrl || null,
      cid_10: formData.cid_10 || null,
      clinical_indication: formData.clinical_indication || null,
    };

    let guideId: string;

    if (editingId) {
      // Update existing guide
      const { error } = await supabase
        .from('medical_guides')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      guideId = editingId;

      // Remove old items and re-insert
      await supabase.from('medical_guide_items').delete().eq('medical_guide_id', editingId);
    } else {
      // Create new guide
      const { data: guideData, error } = await supabase
        .from('medical_guides')
        .insert([{ ...payload, status: 'pendente' }])
        .select()
        .single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      guideId = guideData.id;

      // Create financial transaction only for new guides
      await supabase.from('financial_transactions').insert([{
        transaction_type: 'convenio',
        patient_id: formData.patient_id,
        health_insurance_id: formData.health_insurance_id,
        medical_guide_id: guideId,
        amount: totalValue,
        due_date: formData.guide_date,
        status: 'pendente',
      }]);
    }

    // Insert guide items
    const validItems = items.filter(item => item.procedure_id);
    if (validItems.length > 0) {
      const itemsPayload = validItems.map(item => ({
        medical_guide_id: guideId,
        procedure_id: item.procedure_id,
        professional_id: formData.professional_id || null,
        service_date: item.service_date,
        quantity: item.quantity,
        unit_value: item.unit_value,
        total_value: item.total_value,
        status: 'pendente',
      }));

      const { error: itemsError } = await supabase
        .from('medical_guide_items')
        .insert(itemsPayload);

      if (itemsError) {
        toast({ variant: 'destructive', title: 'Erro ao salvar itens', description: itemsError.message });
      }
    }

    toast({ title: editingId ? 'Guia atualizada com sucesso!' : 'Guia criada com sucesso!' });
    setDialogOpen(false);
    setFormData(emptyForm);
    setItems([{ ...emptyItem }]);
    fetchGuides();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('medical_guides').update({ status: newStatus }).eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    // Update financial transaction status
    if (newStatus === 'recebida') {
      await supabase.from('financial_transactions')
        .update({ status: 'pago', payment_date: format(new Date(), 'yyyy-MM-dd') })
        .eq('medical_guide_id', id);
    } else if (newStatus === 'glosada') {
      await supabase.from('financial_transactions')
        .update({ status: 'cancelado' })
        .eq('medical_guide_id', id);
    }

    toast({ title: 'Status atualizado!' });
    fetchGuides();
  };

  const handleOpenAttachment = async (storedValue: string) => {
    const paths = splitPaths(storedValue);
    if (paths.length === 0) {
      toast({ variant: 'destructive', title: 'Erro ao abrir anexo', description: 'Nenhum arquivo encontrado.' });
      return;
    }
    for (const p of paths) {
      const { url, error } = await createDocumentSignedUrl(p);
      if (error || !url) {
        toast({ variant: 'destructive', title: 'Erro ao abrir anexo', description: error || 'Não foi possível gerar o link do arquivo.' });
        continue;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, guide_number: generateGuideNumber() });
    setItems([{ ...emptyItem }]);
    setAttachmentUrl('');
    setInsuranceRate(0);
    setDialogOpen(true);
  };

  const handleEdit = async (g: MedicalGuide) => {
    setEditingId(g.id);
    const adminId = (g as any).administrator_id || '';
    const insId = g.health_insurance?.id || '';
    setFormData({
      guide_number: g.guide_number,
      patient_id: g.patient?.id || '',
      administrator_id: adminId,
      health_insurance_id: insId,
      professional_id: g.professional?.id || '',
      guide_date: g.guide_date,
      validity_date: g.validity_date || '',
      cid_10: g.cid_10 || '',
      clinical_indication: g.clinical_indication || '',
    });
    const m = insAdminMap.find(x => x.administrator_id === adminId && x.insurance_id === insId);
    setInsuranceRate(m?.billing_rate != null ? Number(m.billing_rate) : Number(g.unit_value) || 0);
    setAttachmentUrl(g.attachment_url || '');
    setDialogOpen(true);

    const existingItems = await fetchGuideItems(g.id);
    if (existingItems.length > 0) {
      setItems(existingItems.map((it: any) => ({
        procedure_id: it.procedure_id,
        professional_id: it.professional_id,
        service_date: it.service_date,
        quantity: Number(it.quantity) || 1,
        unit_value: Number(it.unit_value) || 0,
        total_value: Number(it.total_value) || 0,
        status: it.status,
      })));
    } else {
      setItems([{ ...emptyItem }]);
    }
  };
  const handleDownloadPDF = async (g: MedicalGuide) => {
    if (!g.professional) {
      toast({ variant: 'destructive', title: 'Profissional não vinculado', description: 'Esta guia não possui um profissional associado. Edite a guia e selecione o profissional antes de gerar o PDF.' });
      return;
    }

    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = 210;
    const contentWidth = pageWidth - margin * 2;
    let y = await addClinicHeader(doc, margin);

    const CNES = '0000000'; // Substituir pelo CNES real da clínica

    // --- Título ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GUIA DE SERVIÇO PROFISSIONAL / SADT', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.setDrawColor(100, 160, 160);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // --- Helper para campo com label ---
    const labelWidth = 45;
    const addField = (label: string, value: string, xOffset = 0, customLabelWidth = labelWidth) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin + xOffset, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '-', margin + xOffset + customLabelWidth, y);
    };

    const addFieldLine = (label: string, value: string) => {
      addField(label, value);
      y += 7;
    };

    // --- Seção: Dados da Guia ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 120, 120);
    doc.text('DADOS DA GUIA', margin, y);
    doc.setTextColor(0);
    y += 7;

    addField('Nº da Guia', g.guide_number);
    addField('Data', format(new Date(g.guide_date), 'dd/MM/yyyy'), 90, 20);
    y += 7;
    if (g.validity_date) {
      addField('Validade', format(new Date(g.validity_date), 'dd/MM/yyyy'));
      addField('Status', statusLabels[g.status] || g.status, 90, 20);
      y += 7;
    } else {
      addFieldLine('Status', statusLabels[g.status] || g.status);
    }
    addFieldLine('CNES', CNES);

    y += 3;
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Seção: Beneficiário ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 120, 120);
    doc.text('BENEFICIÁRIO', margin, y);
    doc.setTextColor(0);
    y += 7;

    addFieldLine('Paciente', g.patient?.full_name || '-');

    const cpfRaw = (g.patient?.cpf || '').replace(/\D/g, '');
    const cpfFormatted = cpfRaw.length === 11
      ? cpfRaw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      : cpfRaw || '-';
    addField('CPF', cpfFormatted);
    addField('Convênio', g.health_insurance?.name || '-', 90, 30);
    y += 7;

    y += 3;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Seção: Profissional Solicitante ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 120, 120);
    doc.text('PROFISSIONAL EXECUTANTE', margin, y);
    doc.setTextColor(0);
    y += 7;

    const profName = g.professional?.full_name || '-';
    const crmText = g.professional?.crm
      ? `${g.professional.crm} / ${g.professional.uf_crm || 'XX'}`
      : '-';
    addField('Nome', profName);
    y += 7;
    addFieldLine('CRM', crmText);

    // --- CID e Indicação Clínica ---
    if (g.cid_10) addFieldLine('CID-10', g.cid_10);
    if (g.clinical_indication) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicação Clínica:', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(g.clinical_indication, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    }

    y += 3;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // --- Seção: Procedimentos ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 120, 120);
    doc.text('PROCEDIMENTOS', margin, y);
    doc.setTextColor(0);
    y += 7;

    if (g.procedure) {
      addField('Procedimento', `${g.procedure.code ? g.procedure.code + ' - ' : ''}${g.procedure.name}`);
      addField('Valor', formatCurrency(Number(g.total_value)), 120, 18);
      y += 7;
    }

    if (g.items && g.items.length > 0) {
      // Table header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 245, 245);
      doc.rect(margin, y - 4, contentWidth, 7, 'F');
      doc.text('#', margin + 2, y);
      doc.text('Cód. TUSS', margin + 10, y);
      doc.text('Procedimento', margin + 40, y);
      doc.text('Profissional', margin + 95, y);
      doc.text('Qtd', margin + 135, y);
      doc.text('Valor', margin + 150, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      g.items.forEach((item, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${idx + 1}`, margin + 2, y);
        doc.text(item.procedure?.code || '-', margin + 10, y);
        doc.text((item.procedure?.name || '-').substring(0, 30), margin + 40, y);
        doc.text((item.professional?.full_name || '-').substring(0, 22), margin + 95, y);
        doc.text(`${item.quantity}`, margin + 135, y);
        doc.text(formatCurrency(Number(item.total_value)), margin + 150, y);
        y += 6;
      });
    }

    // Total
    y += 4;
    doc.setDrawColor(100, 160, 160);
    doc.setLineWidth(0.5);
    doc.line(margin + 120, y, pageWidth - margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', margin + 120, y);
    doc.text(formatCurrency(Number(g.total_value)), pageWidth - margin, y, { align: 'right' });
    y += 12;

    // --- Assinaturas ---
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);

    const sigY = Math.max(y + 15, 240);
    const sigLeft = margin;
    const sigRight = pageWidth / 2 + 10;
    const sigWidth = 70;

    doc.line(sigLeft, sigY, sigLeft + sigWidth, sigY);
    doc.line(sigRight, sigY, sigRight + sigWidth, sigY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura e Carimbo do Profissional', sigLeft + sigWidth / 2, sigY + 5, { align: 'center' });
    doc.text('Assinatura do Beneficiário/Responsável', sigRight + sigWidth / 2, sigY + 5, { align: 'center' });

    // --- Rodapé ---
    doc.setFontSize(7);
    doc.setTextColor(130);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy")} às ${format(new Date(), "HH:mm")}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
    doc.setTextColor(0);

    doc.save(`guia_${g.guide_number}.pdf`);
  };

  const filtered = guides.filter((g) =>
    g.guide_number.includes(search) ||
    g.patient?.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isExpired = (validityDate: string | null) => {
    if (!validityDate) return false;
    return isBefore(new Date(validityDate), new Date());
  };

  const isExpiringSoon = (validityDate: string | null) => {
    if (!validityDate) return false;
    const validity = new Date(validityDate);
    const today = new Date();
    const fiveDaysFromNow = addDays(today, 5);
    return isAfter(validity, today) && isBefore(validity, fiveDaysFromNow);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guias</h1>
          <p className="text-muted-foreground">Gerencie as guias de atendimento com múltiplos procedimentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Guia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Guia' : 'Nova Guia'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header da Guia */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Nº da Guia</Label>
                  <Input
                    value={formData.guide_number}
                    onChange={(e) => setFormData({ ...formData, guide_number: e.target.value })}
                    placeholder="Gerado automaticamente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data da Guia *</Label>
                  <Input
                    type="date"
                    value={formData.guide_date}
                    onChange={(e) => setFormData({ ...formData, guide_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validade da Guia</Label>
                  <Input
                    type="date"
                    value={formData.validity_date}
                    onChange={(e) => setFormData({ ...formData, validity_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Paciente *</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(v) => setFormData({ ...formData, patient_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Administradora *</Label>
                  <Select
                    value={formData.administrator_id}
                    onValueChange={(v) => setFormData({ ...formData, administrator_id: v, health_insurance_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a administradora" />
                    </SelectTrigger>
                    <SelectContent>
                      {administrators.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Convênio *</Label>
                <Select
                  value={formData.health_insurance_id}
                  onValueChange={(v) => {
                    setFormData({ ...formData, health_insurance_id: v });
                    const m = insAdminMap.find(x => x.administrator_id === formData.administrator_id && x.insurance_id === v);
                    const rate = m?.billing_rate != null ? Number(m.billing_rate) : 0;
                    applyInsuranceRate(rate);
                  }}
                  disabled={!formData.administrator_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.administrator_id ? 'Selecione o convênio' : 'Selecione a administradora primeiro'} />
                  </SelectTrigger>
                  <SelectContent>
                    {insurances
                      .filter((i) => insAdminMap.some(m => m.administrator_id === formData.administrator_id && m.insurance_id === i.id))
                      .map((i) => {
                        const m = insAdminMap.find(x => x.administrator_id === formData.administrator_id && x.insurance_id === i.id);
                        const rate = m?.billing_rate;
                        return (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name}{rate != null ? ` — ${formatCurrency(Number(rate))}` : ''}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {formData.administrator_id && !insurances.some(i => insAdminMap.some(m => m.administrator_id === formData.administrator_id && m.insurance_id === i.id)) && (
                  <p className="text-xs text-destructive">Esta administradora ainda não possui convênios cadastrados.</p>
                )}
              </div>

              {formData.health_insurance_id && (
                <div className="space-y-2">
                  <Label>Valor do Convênio (R$)</Label>
                  <CurrencyInput
                    value={insuranceRate}
                    onChange={(v) => applyInsuranceRate(Number(v) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esse valor será aplicado a cada atendimento adicionado. Você pode editar o valor individual de cada item abaixo.
                  </p>
                </div>
              )}

              {/* Profissional Executante */}
              <div className="space-y-2">
                <Label>Profissional Executante *</Label>
                <Select
                  value={formData.professional_id}
                  onValueChange={(v) => setFormData({ ...formData, professional_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>CID-10 Principal</Label>
                  <Input
                    value={formData.cid_10}
                    onChange={(e) => setFormData({ ...formData, cid_10: e.target.value })}
                    placeholder="Ex: F32.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Indicação Clínica</Label>
                  <Input
                    value={formData.clinical_indication}
                    onChange={(e) => setFormData({ ...formData, clinical_indication: e.target.value })}
                    placeholder="Justificativa do atendimento"
                  />
                </div>
              </div>

              {/* Itens/Atendimentos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Atendimentos / Procedimentos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Atendimento {index + 1}</span>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1 md:col-span-1">
                          <Label className="text-xs">Procedimento *</Label>
                          <Select
                            value={item.procedure_id}
                            onValueChange={(v) => updateItem(index, 'procedure_id', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {procedures.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.code} - {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Data Atendimento</Label>
                          <Input
                            type="date"
                            value={item.service_date}
                            onChange={(e) => updateItem(index, 'service_date', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Qtd</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Valor</Label>
                            <CurrencyInput
                              value={item.unit_value}
                              onChange={(val) => updateItem(index, 'unit_value', val)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Total</Label>
                            <Input
                              type="text"
                              value={formatCurrency(item.total_value)}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end p-3 bg-muted rounded-lg">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total da Guia</p>
                    <p className="text-xl font-bold">{formatCurrency(getTotalValue())}</p>
                  </div>
                </div>
              </div>

              {/* Upload de Anexos (até 5) */}
              <div className="space-y-2">
                <Label>Anexos (PDF/Imagem) — até 5 arquivos</Label>
                <MultiFileUpload
                  value={attachmentUrl}
                  onChange={setAttachmentUrl}
                  folder="anexos_guias"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Guia</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nº guia ou paciente..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="autorizada">Autorizada</SelectItem>
            <SelectItem value="faturada">Faturada</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="glosada">Glosada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Nº Guia</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Convênio</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">Nenhuma guia encontrada</TableCell>
              </TableRow>
            ) : (
              filtered.map((g) => (
                <>
                  <TableRow key={g.id} className="cursor-pointer" onClick={() => handleExpandGuide(g.id)}>
                    <TableCell>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-mono font-medium">{g.guide_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(g.guide_date), 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {g.validity_date ? (
                        <div className={cn(
                          "flex items-center gap-1",
                          isExpired(g.validity_date) && "text-destructive",
                          isExpiringSoon(g.validity_date) && "text-amber-600"
                        )}>
                          {(isExpired(g.validity_date) || isExpiringSoon(g.validity_date)) && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {format(new Date(g.validity_date), 'dd/MM/yyyy')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{g.patient?.full_name || '-'}</TableCell>
                    <TableCell>{g.health_insurance?.name || '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(g.total_value))}</TableCell>
                    <TableCell>
                      <Badge className={cn(statusColors[g.status])}>
                        {statusLabels[g.status] || g.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Select value={g.status} onValueChange={(v) => handleStatusChange(g.id, v)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="autorizada">Autorizada</SelectItem>
                            <SelectItem value="faturada">Faturada</SelectItem>
                            <SelectItem value="recebida">Recebida</SelectItem>
                            <SelectItem value="glosada">Glosada</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(g)} title="Download PDF">
                          <FileDown className="h-4 w-4" />
                        </Button>
                        {g.attachment_url && (
                          <Button variant="ghost" size="icon" onClick={() => void handleOpenAttachment(g.attachment_url!)} title="Ver Anexo">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(g)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded items */}
                  {expandedGuide === g.id && g.items && g.items.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 p-0">
                        <div className="p-4">
                          <p className="text-sm font-medium mb-2">Atendimentos da Guia</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Procedimento</TableHead>
                                <TableHead>Profissional</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead>Valor Unit.</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {g.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    {item.procedure?.code} - {item.procedure?.name || '-'}
                                  </TableCell>
                                  <TableCell>{item.professional?.full_name || '-'}</TableCell>
                                  <TableCell>{format(new Date(item.service_date), 'dd/MM/yyyy')}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{formatCurrency(Number(item.unit_value))}</TableCell>
                                  <TableCell className="font-medium">{formatCurrency(Number(item.total_value))}</TableCell>
                                  <TableCell>
                                    <Badge className={cn(statusColors[item.status])}>
                                      {statusLabels[item.status] || item.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {expandedGuide === g.id && (!g.items || g.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 text-center py-4 text-muted-foreground">
                        Nenhum atendimento registrado nesta guia
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
