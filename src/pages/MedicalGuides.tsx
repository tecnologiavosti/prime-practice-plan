import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

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
  professional?: { id: string; full_name: string } | null;
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
  patient: { id: string; full_name: string } | null;
  health_insurance: { id: string; name: string } | null;
  procedure: { id: string; name: string } | null;
  professional: { id: string; full_name: string } | null;
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
  health_insurance_id: '',
  guide_date: format(new Date(), 'yyyy-MM-dd'),
  validity_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
};

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
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
    ]);
    setLoading(false);
  };

  const fetchGuides = async () => {
    let query = supabase
      .from('medical_guides')
      .select(`
        *,
        patient:patients(id, full_name),
        health_insurance:health_insurances(id, name),
        procedure:procedures(id, name),
        professional:professionals(id, full_name)
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
        professional:professionals(id, full_name)
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

  const updateItem = (index: number, field: keyof typeof emptyItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill unit_value when procedure is selected
    if (field === 'procedure_id' && formData.health_insurance_id) {
      const insurancePrice = procedureInsurancePrices.find(
        pip => pip.procedure_id === value && pip.health_insurance_id === formData.health_insurance_id
      );
      if (insurancePrice) {
        newItems[index].unit_value = insurancePrice.price;
        newItems[index].total_value = newItems[index].quantity * insurancePrice.price;
      }
    }
    
    // Recalculate total
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

    if (!formData.patient_id || !formData.health_insurance_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preencha paciente e convênio' });
      return;
    }

    if (items.every(item => !item.procedure_id)) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Adicione pelo menos um procedimento' });
      return;
    }

    const totalValue = getTotalValue();

    // Create the guide
    const payload = {
      guide_number: formData.guide_number || generateGuideNumber(),
      patient_id: formData.patient_id,
      health_insurance_id: formData.health_insurance_id,
      guide_date: formData.guide_date,
      validity_date: formData.validity_date,
      quantity: items.reduce((sum, i) => sum + i.quantity, 0),
      unit_value: 0,
      total_value: totalValue,
      status: 'pendente',
      attachment_url: attachmentUrl || null,
    };

    const { data: guideData, error } = await supabase
      .from('medical_guides')
      .insert([payload])
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    // Create guide items
    const validItems = items.filter(item => item.procedure_id);
    if (validItems.length > 0 && guideData) {
      const itemsPayload = validItems.map(item => ({
        medical_guide_id: guideData.id,
        procedure_id: item.procedure_id,
        professional_id: item.professional_id || null,
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

    // Create financial transaction
    if (guideData) {
      await supabase.from('financial_transactions').insert([{
        transaction_type: 'convenio',
        patient_id: formData.patient_id,
        health_insurance_id: formData.health_insurance_id,
        medical_guide_id: guideData.id,
        amount: totalValue,
        due_date: formData.guide_date,
        status: 'pendente',
      }]);
    }

    toast({ title: 'Guia criada com sucesso!' });
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

  const openNew = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, guide_number: generateGuideNumber() });
    setItems([{ ...emptyItem }]);
    setAttachmentUrl('');
    setDialogOpen(true);
  };

  const handleEdit = (g: MedicalGuide) => {
    setEditingId(g.id);
    setFormData({
      guide_number: g.guide_number,
      patient_id: g.patient?.id || '',
      health_insurance_id: g.health_insurance?.id || '',
      guide_date: g.guide_date,
      validity_date: g.validity_date || '',
    });
    setItems([{ ...emptyItem }]);
    setAttachmentUrl(g.attachment_url || '');
    setDialogOpen(true);
  };
  const handleDownloadPDF = (g: MedicalGuide) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GUIA MÉDICA', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Clínica Médica', 105, y, { align: 'center' });
    y += 12;

    doc.setDrawColor(180);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(11);
    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 50, y);
      y += 8;
    };

    addField('Nº da Guia', g.guide_number);
    addField('Data', format(new Date(g.guide_date), 'dd/MM/yyyy'));
    if (g.validity_date) addField('Validade', format(new Date(g.validity_date), 'dd/MM/yyyy'));
    addField('Paciente', g.patient?.full_name || '-');
    addField('Convênio', g.health_insurance?.name || '-');
    addField('Profissional', g.professional?.full_name || '-');
    addField('Procedimento', g.procedure?.name || '-');
    addField('Valor Total', formatCurrency(Number(g.total_value)));
    addField('Status', statusLabels[g.status] || g.status);

    // Items section
    if (g.items && g.items.length > 0) {
      y += 5;
      doc.line(margin, y, 190, y);
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Atendimentos:', margin, y);
      y += 8;

      g.items.forEach((item, idx) => {
        doc.setFont('helvetica', 'normal');
        doc.text(
          `${idx + 1}. ${item.procedure?.code || ''} - ${item.procedure?.name || '-'} | ${item.professional?.full_name || '-'} | Qtd: ${item.quantity} | ${formatCurrency(Number(item.total_value))}`,
          margin + 5, y
        );
        y += 7;
      });
    }

    y += 10;
    doc.line(margin, y, 190, y);
    y += 25;

    // Signature lines
    doc.line(margin, y, 85, y);
    doc.line(115, y, 190, y);
    y += 5;
    doc.setFontSize(9);
    doc.text('Assinatura do Profissional', 52.5, y, { align: 'center' });
    doc.text('Assinatura do Paciente', 152.5, y, { align: 'center' });

    y += 15;
    doc.setFontSize(8);
    doc.text(`Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 105, y, { align: 'center' });

    doc.save(`guia_${g.guide_number}.pdf`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('medical_guide_items').delete().eq('medical_guide_id', deleteId);
    const { error } = await supabase.from('medical_guides').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Guia removida com sucesso!' });
      fetchGuides();
    }
    setDeleteId(null);
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
              <DialogTitle>Nova Guia</DialogTitle>
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
                  <Label>Convênio *</Label>
                  <Select
                    value={formData.health_insurance_id}
                    onValueChange={(v) => setFormData({ ...formData, health_insurance_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o convênio" />
                    </SelectTrigger>
                    <SelectContent>
                      {insurances.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
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
                          <Label className="text-xs">Profissional</Label>
                          <Select
                            value={item.professional_id}
                            onValueChange={(v) => updateItem(index, 'professional_id', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {professionals.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
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
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_value}
                              onChange={(e) => updateItem(index, 'unit_value', parseFloat(e.target.value) || 0)}
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

              {/* Upload de Anexo */}
              <div className="space-y-2">
                <Label>Anexo (PDF/Imagem)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    disabled={uploadingAttachment}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingAttachment(true);
                      const ext = file.name.split('.').pop();
                      const path = `anexos_guias/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
                      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
                      if (uploadError) {
                        toast({ variant: 'destructive', title: 'Erro no upload', description: uploadError.message });
                        setUploadingAttachment(false);
                        return;
                      }
                      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
                      setAttachmentUrl(urlData.publicUrl);
                      setUploadingAttachment(false);
                      toast({ title: 'Anexo enviado!' });
                    }}
                  />
                  {uploadingAttachment && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {attachmentUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={() => window.open(attachmentUrl, '_blank')}>
                    <Paperclip className="mr-1 h-3 w-3" /> Ver Anexo Atual
                  </Button>
                )}
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
                          <Button variant="ghost" size="icon" onClick={() => window.open(g.attachment_url!, '_blank')} title="Ver Anexo">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(g)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(g.id)} title="Remover" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta guia? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
