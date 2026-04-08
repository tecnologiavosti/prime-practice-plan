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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, FileText, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BillingBatch {
  id: string;
  batch_number: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  total_guides: number;
  status: string;
  health_insurance: { id: string; name: string } | null;
  administrator: { id: string; name: string } | null;
}

interface MedicalGuide {
  id: string;
  guide_number: string;
  guide_date: string;
  total_value: number;
  patient: { full_name: string } | null;
  procedure: { name: string } | null;
}

interface HealthInsurance {
  id: string;
  name: string;
  administrator_id: string | null;
}

interface Administrator {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-800',
  enviado: 'bg-yellow-100 text-yellow-800',
  recebido: 'bg-green-100 text-green-800',
  parcial: 'bg-orange-100 text-orange-800',
};

export default function BillingBatches() {
  const [batches, setBatches] = useState<BillingBatch[]>([]);
  const [pendingGuides, setPendingGuides] = useState<MedicalGuide[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [selectedGuides, setSelectedGuides] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState(format(new Date(), 'yyyy-MM-01'));
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingBatch, setEditingBatch] = useState<BillingBatch | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPeriodStart, setEditPeriodStart] = useState('');
  const [editPeriodEnd, setEditPeriodEnd] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedInsurance) {
      fetchPendingGuides();
    }
  }, [selectedInsurance]);

  const fetchData = async () => {
    await Promise.all([
      fetchBatches(),
      fetchInsurances(),
      fetchAdministrators(),
    ]);
    setLoading(false);
  };

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('billing_batches')
      .select(`
        *,
        health_insurance:health_insurances(id, name),
        administrator:administrators(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setBatches((data as any) || []);
  };

  const fetchPendingGuides = async () => {
    const { data } = await supabase
      .from('medical_guides')
      .select(`
        id,
        guide_number,
        guide_date,
        total_value,
        patient:patients(full_name),
        procedure:procedures(name)
      `)
      .eq('health_insurance_id', selectedInsurance)
      .in('status', ['pendente', 'faturado'])
      .order('guide_date');

    setPendingGuides((data as any) || []);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase.from('health_insurances').select('id, name, administrator_id').eq('active', true).order('name');
    setInsurances(data || []);
  };

  const fetchAdministrators = async () => {
    const { data } = await supabase.from('administrators').select('id, name').eq('active', true).order('name');
    setAdministrators(data || []);
  };

  const generateBatchNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `L${format(new Date(), 'yyyyMM')}${timestamp}`;
  };

  const handleCreateBatch = async () => {
    if (!selectedInsurance || selectedGuides.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um convênio e pelo menos uma guia' });
      return;
    }

    const selectedGuideData = pendingGuides.filter(g => selectedGuides.includes(g.id));
    const totalAmount = selectedGuideData.reduce((acc, g) => acc + Number(g.total_value), 0);
    const insurance = insurances.find(i => i.id === selectedInsurance);

    const payload = {
      batch_number: generateBatchNumber(),
      health_insurance_id: selectedInsurance,
      administrator_id: insurance?.administrator_id || null,
      period_start: periodStart,
      period_end: periodEnd,
      total_amount: totalAmount,
      total_guides: selectedGuides.length,
      status: 'aberto',
    };

    const { data: batchData, error } = await supabase.from('billing_batches').insert([payload]).select().single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    // Add guides to batch
    if (batchData) {
      const batchGuides = selectedGuides.map(guideId => ({
        batch_id: batchData.id,
        guide_id: guideId,
      }));
      await supabase.from('billing_batch_guides').insert(batchGuides);

      // Update guide status
      await supabase.from('medical_guides').update({ status: 'faturado' }).in('id', selectedGuides);
    }

    toast({ title: 'Lote criado com sucesso!' });
    setDialogOpen(false);
    setSelectedInsurance('');
    setSelectedGuides([]);
    fetchBatches();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('billing_batches').update({ status: newStatus }).eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }

    // If received, update all guides and financial transactions
    if (newStatus === 'recebido') {
      const { data: batchGuides } = await supabase
        .from('billing_batch_guides')
        .select('guide_id')
        .eq('batch_id', id);

      if (batchGuides) {
        const guideIds = batchGuides.map(bg => bg.guide_id);
        await supabase.from('medical_guides').update({ status: 'recebido' }).in('id', guideIds);
        await supabase.from('financial_transactions')
          .update({ status: 'pago', payment_date: format(new Date(), 'yyyy-MM-dd') })
          .in('medical_guide_id', guideIds);
      }
    }

    toast({ title: 'Status atualizado!' });
    fetchBatches();
  };

  const handleDeleteBatch = async () => {
    if (!deleteId) return;
    await supabase.from('billing_batch_guides').delete().eq('batch_id', deleteId);
    const { error } = await supabase.from('billing_batches').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Lote removido com sucesso!' });
      fetchBatches();
    }
    setDeleteId(null);
  };

  const toggleGuide = (guideId: string) => {
    if (selectedGuides.includes(guideId)) {
      setSelectedGuides(selectedGuides.filter(id => id !== guideId));
    } else {
      setSelectedGuides([...selectedGuides, guideId]);
    }
  };

  const toggleAllGuides = () => {
    if (selectedGuides.length === pendingGuides.length) {
      setSelectedGuides([]);
    } else {
      setSelectedGuides(pendingGuides.map(g => g.id));
    }
  };

  const filtered = batches.filter((b) =>
    b.batch_number.includes(search) ||
    b.health_insurance?.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Group batches by administrator
  const groupedByAdmin = administrators.map(admin => ({
    admin,
    batches: filtered.filter(b => b.administrator?.id === admin.id),
    total: filtered.filter(b => b.administrator?.id === admin.id).reduce((acc, b) => acc + Number(b.total_amount), 0),
  })).filter(g => g.batches.length > 0);

  const ungroupedBatches = filtered.filter(b => !b.administrator?.id);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">Gerencie os lotes de faturamento por convênio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Lote de Faturamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Convênio *</Label>
                  <Select value={selectedInsurance} onValueChange={setSelectedInsurance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {insurances.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Período Início</Label>
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Período Fim</Label>
                  <Input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              {selectedInsurance && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Guias Disponíveis ({pendingGuides.length})</Label>
                    <Button variant="outline" size="sm" onClick={toggleAllGuides}>
                      {selectedGuides.length === pendingGuides.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Guia</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingGuides.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Nenhuma guia pendente para este convênio
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendingGuides.map((g) => (
                            <TableRow key={g.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedGuides.includes(g.id)}
                                  onCheckedChange={() => toggleGuide(g.id)}
                                />
                              </TableCell>
                              <TableCell className="font-mono">{g.guide_number}</TableCell>
                              <TableCell>{format(new Date(g.guide_date), 'dd/MM/yyyy')}</TableCell>
                              <TableCell>{g.patient?.full_name}</TableCell>
                              <TableCell>{formatCurrency(Number(g.total_value))}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {selectedGuides.length > 0 && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex justify-between">
                        <span>Guias selecionadas: {selectedGuides.length}</span>
                        <span className="font-bold">
                          Total: {formatCurrency(pendingGuides.filter(g => selectedGuides.includes(g.id)).reduce((acc, g) => acc + Number(g.total_value), 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateBatch} disabled={selectedGuides.length === 0}>
                  Criar Lote
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar lote..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grouped by Administrator */}
      {groupedByAdmin.map(({ admin, batches, total }) => (
        <div key={admin.id} className="mb-6">
          <Card className="mb-2">
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{admin.name}</CardTitle>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
            </CardHeader>
          </Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Lote</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Guias</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.batch_number}</TableCell>
                    <TableCell>{b.health_insurance?.name}</TableCell>
                    <TableCell>
                      {format(new Date(b.period_start), 'dd/MM/yy')} - {format(new Date(b.period_end), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>{b.total_guides}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(b.total_amount))}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full px-2 py-1 text-xs capitalize', statusColors[b.status])}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Select value={b.status} onValueChange={(v) => handleStatusChange(b.id, v)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="enviado">Enviado</SelectItem>
                            <SelectItem value="recebido">Recebido</SelectItem>
                            <SelectItem value="parcial">Parcial</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)} title="Remover" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Ungrouped batches */}
      {ungroupedBatches.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Sem Administradora</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Lote</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Guias</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ungroupedBatches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.batch_number}</TableCell>
                    <TableCell>{b.health_insurance?.name}</TableCell>
                    <TableCell>
                      {format(new Date(b.period_start), 'dd/MM/yy')} - {format(new Date(b.period_end), 'dd/MM/yy')}
                    </TableCell>
                    <TableCell>{b.total_guides}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(b.total_amount))}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full px-2 py-1 text-xs capitalize', statusColors[b.status])}>
                        {b.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Select value={b.status} onValueChange={(v) => handleStatusChange(b.id, v)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="enviado">Enviado</SelectItem>
                            <SelectItem value="recebido">Recebido</SelectItem>
                            <SelectItem value="parcial">Parcial</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)} title="Remover" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum lote de faturamento encontrado
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este lote? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBatch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
