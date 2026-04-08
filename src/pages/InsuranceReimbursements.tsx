import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HealthInsurance {
  id: string;
  name: string;
}

interface Reimbursement {
  id: string;
  health_insurance_id: string;
  reference_month: string;
  expected_amount: number;
  received_amount: number;
  receipt_file_path: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  parcial: 'bg-orange-100 text-orange-800',
  recebido: 'bg-green-100 text-green-800',
  divergente: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  recebido: 'Recebido',
  divergente: 'Divergente',
};

const emptyForm = {
  health_insurance_id: '',
  reference_month: '',
  expected_amount: 0,
  received_amount: 0,
  status: 'pendente',
  notes: '',
};

export default function InsuranceReimbursements() {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchReimbursements(), fetchInsurances()]);
    setLoading(false);
  };

  const fetchReimbursements = async () => {
    const { data, error } = await supabase
      .from('insurance_reimbursements')
      .select('*')
      .order('reference_month', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setReimbursements(data || []);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase.from('health_insurances').select('id, name').eq('active', true).order('name');
    setInsurances(data || []);
  };

  const calculateExpected = async (insuranceId: string, month: string) => {
    if (!insuranceId || !month) return;
    const startDate = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const endDate = new Date(y, m, 0).toISOString().split('T')[0];

    const { data } = await supabase
      .from('medical_guides')
      .select('total_value')
      .eq('health_insurance_id', insuranceId)
      .gte('guide_date', startDate)
      .lte('guide_date', endDate);

    const total = (data || []).reduce((sum, g) => sum + Number(g.total_value || 0), 0);
    setFormData(prev => ({ ...prev, expected_amount: total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.health_insurance_id || !formData.reference_month) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione convênio e mês' });
      return;
    }
    setSubmitting(true);

    let receiptPath: string | null = null;
    if (receiptFile) {
      const filePath = `reimbursements/${formData.health_insurance_id}/${formData.reference_month}/${receiptFile.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, receiptFile, { upsert: true });
      if (uploadError) {
        toast({ variant: 'destructive', title: 'Erro no upload', description: uploadError.message });
        setSubmitting(false);
        return;
      }
      receiptPath = filePath;
    }

    const payload: any = {
      health_insurance_id: formData.health_insurance_id,
      reference_month: formData.reference_month,
      expected_amount: formData.expected_amount,
      received_amount: formData.received_amount,
      status: formData.status,
      notes: formData.notes || null,
    };
    if (receiptPath) payload.receipt_file_path = receiptPath;

    let error;
    if (editingId) {
      ({ error } = await supabase.from('insurance_reimbursements').update(payload).eq('id', editingId));
    } else {
      if (receiptPath) payload.receipt_file_path = receiptPath;
      ({ error } = await supabase.from('insurance_reimbursements').insert(payload));
    }

    setSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    toast({ title: editingId ? 'Repasse atualizado com sucesso!' : 'Repasse registrado com sucesso!' });
    setDialogOpen(false);
    setFormData(emptyForm);
    setEditingId(null);
    setReceiptFile(null);
    fetchReimbursements();
  };

  const handleEdit = (r: Reimbursement) => {
    setEditingId(r.id);
    setFormData({
      health_insurance_id: r.health_insurance_id,
      reference_month: r.reference_month,
      expected_amount: Number(r.expected_amount),
      received_amount: Number(r.received_amount),
      status: r.status,
      notes: r.notes || '',
    });
    setReceiptFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('insurance_reimbursements').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Repasse removido com sucesso!' });
      fetchReimbursements();
    }
    setDeleteId(null);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const openNew = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setReceiptFile(null);
    setDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repasse de Convênios</h1>
          <p className="text-muted-foreground">Controle de repasses mensais por convênio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Repasse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Repasse' : 'Registrar Repasse'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Convênio *</Label>
                  <Select
                    value={formData.health_insurance_id}
                    onValueChange={(v) => {
                      setFormData({ ...formData, health_insurance_id: v });
                      calculateExpected(v, formData.reference_month);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {insurances.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mês Referência *</Label>
                  <Input
                    type="month"
                    value={formData.reference_month}
                    onChange={(e) => {
                      setFormData({ ...formData, reference_month: e.target.value });
                      calculateExpected(formData.health_insurance_id, e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Esperado (Guias)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.expected_amount}
                    onChange={(e) => setFormData({ ...formData, expected_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Recebido</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.received_amount}
                    onChange={(e) => setFormData({ ...formData, received_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="parcial">Parcial</SelectItem>
                      <SelectItem value="recebido">Recebido</SelectItem>
                      <SelectItem value="divergente">Divergente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Comprovante</Label>
                  <Input
                    type="file"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              {formData.expected_amount > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="font-medium text-sm">Comparativo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Esperado</p>
                      <p className="font-bold">{formatCurrency(formData.expected_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recebido</p>
                      <p className="font-bold">{formatCurrency(formData.received_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Diferença</p>
                      <p className={cn("font-bold", formData.received_amount - formData.expected_amount < 0 ? "text-destructive" : "text-green-600")}>
                        {formatCurrency(formData.received_amount - formData.expected_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Convênio</TableHead>
              <TableHead>Mês Ref.</TableHead>
              <TableHead>Esperado</TableHead>
              <TableHead>Recebido</TableHead>
              <TableHead>Diferença</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Carregando...</TableCell></TableRow>
            ) : reimbursements.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">Nenhum repasse registrado</TableCell></TableRow>
            ) : (
              reimbursements.map((r) => {
                const diff = Number(r.received_amount) - Number(r.expected_amount);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {insurances.find((i) => i.id === r.health_insurance_id)?.name || '-'}
                    </TableCell>
                    <TableCell>{r.reference_month}</TableCell>
                    <TableCell>{formatCurrency(Number(r.expected_amount))}</TableCell>
                    <TableCell>{formatCurrency(Number(r.received_amount))}</TableCell>
                    <TableCell className={cn("font-medium", diff < 0 ? "text-destructive" : "text-green-600")}>
                      {formatCurrency(diff)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusColors[r.status])}>
                        {statusLabels[r.status] || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)} title="Remover" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este repasse? Esta ação não pode ser desfeita.
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
