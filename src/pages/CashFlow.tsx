import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, TrendingUp, TrendingDown, Wallet, Pencil, Trash2, Paperclip, Eye } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { createDocumentSignedUrl, DOCUMENTS_BUCKET } from '@/lib/storageDocuments';
import { useRealtime } from '@/hooks/useRealtime';

interface Entry {
  id: string;
  entry_type: 'entrada' | 'saida';
  category: string;
  description: string | null;
  amount: number;
  entry_date: string;
  payment_method_id: string | null;
  notes: string | null;
  receipt_path: string | null;
  payment_method?: { name: string } | null;
}

const CATEGORIES_ENTRADA = ['Receita avulsa', 'Reembolso', 'Outros'];
const CATEGORIES_SAIDA = ['Aluguel', 'Salários', 'Materiais', 'Equipamentos', 'Marketing', 'Impostos', 'Contas (água/luz/internet)', 'Manutenção', 'Outros'];

const emptyForm = {
  entry_type: 'saida' as 'entrada' | 'saida',
  category: '',
  description: '',
  amount: 0,
  entry_date: format(new Date(), 'yyyy-MM-dd'),
  payment_method_id: '',
  notes: '',
};

export default function CashFlow() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; name: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'saida'>('all');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchAll(); }, [typeFilter, monthFilter]);
  useRealtime(['cash_flow_entries','financial_transactions'], () => fetchAll());

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchEntries(), fetchPaymentMethods()]);
    setLoading(false);
  };

  const fetchEntries = async () => {
    const [y, m] = monthFilter.split('-').map(Number);
    const start = format(startOfMonth(new Date(y, m - 1, 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(y, m - 1, 1)), 'yyyy-MM-dd');
    let q = supabase
      .from('cash_flow_entries')
      .select('*')
      .gte('entry_date', start)
      .lte('entry_date', end)
      .order('entry_date', { ascending: false });
    if (typeFilter !== 'all') q = q.eq('entry_type', typeFilter);
    const { data, error } = await q;
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setEntries((data as any) || []);
  };

  const fetchPaymentMethods = async () => {
    const { data } = await supabase.from('payment_methods').select('id, name').eq('active', true).order('name');
    setPaymentMethods(data || []);
  };

  const openNew = (type: 'entrada' | 'saida') => {
    setEditingId(null);
    setFormData({ ...emptyForm, entry_type: type });
    setReceiptFile(null);
    setExistingReceipt(null);
    setDialogOpen(true);
  };

  const openEdit = (e: Entry) => {
    setEditingId(e.id);
    setFormData({
      entry_type: e.entry_type,
      category: e.category,
      description: e.description || '',
      amount: Number(e.amount),
      entry_date: e.entry_date,
      payment_method_id: e.payment_method_id || '',
      notes: e.notes || '',
    });
    setReceiptFile(null);
    setExistingReceipt(e.receipt_path || null);
    setDialogOpen(true);
  };

  const handleViewReceipt = async (path: string) => {
    const { url, error } = await createDocumentSignedUrl(path);
    if (error || !url) {
      toast({ variant: 'destructive', title: 'Erro', description: error || 'Não foi possível abrir.' });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Selecione uma categoria' });
      return;
    }
    setUploading(true);
    let receipt_path: string | null = existingReceipt;
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop();
      const path = `cash-flow/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, receiptFile, { upsert: false });
      if (upErr) {
        setUploading(false);
        toast({ variant: 'destructive', title: 'Erro no upload', description: upErr.message });
        return;
      }
      receipt_path = path;
    }
    const payload = {
      entry_type: formData.entry_type,
      category: formData.category,
      description: formData.description || null,
      amount: formData.amount,
      entry_date: formData.entry_date,
      payment_method_id: formData.payment_method_id || null,
      notes: formData.notes || null,
      receipt_path,
    };
    const { error } = editingId
      ? await supabase.from('cash_flow_entries').update(payload as any).eq('id', editingId)
      : await supabase.from('cash_flow_entries').insert([payload as any]);
    setUploading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    toast({ title: editingId ? 'Lançamento atualizado!' : 'Lançamento criado!' });
    setDialogOpen(false);
    setFormData(emptyForm);
    setReceiptFile(null);
    setExistingReceipt(null);
    fetchEntries();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('cash_flow_entries').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Lançamento removido!' });
      fetchEntries();
    }
    setDeleteId(null);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const totalEntradas = entries.filter(e => e.entry_type === 'entrada').reduce((s, e) => s + Number(e.amount), 0);
  const totalSaidas = entries.filter(e => e.entry_type === 'saida').reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalEntradas - totalSaidas;

  const categories = formData.entry_type === 'entrada' ? CATEGORIES_ENTRADA : CATEGORIES_SAIDA;

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Despesas, entradas e saídas financeiras</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openNew('entrada')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <TrendingUp className="mr-2 h-4 w-4" /> Nova Entrada
          </Button>
          <Button onClick={() => openNew('saida')} className="bg-red-600 hover:bg-red-700">
            <TrendingDown className="mr-2 h-4 w-4" /> Nova Despesa
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-t-[3px] border-t-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalEntradas)}</div>
          </CardContent>
        </Card>
        <Card className="border-t-[3px] border-t-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</div>
          </CardContent>
        </Card>
        <Card className="border-t-[3px] border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(saldo)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-[180px]"
        />
        <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Forma Pgto</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Carregando...</TableCell></TableRow>
              ) : entries.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">Nenhum lançamento no período</TableCell></TableRow>
              ) : entries.map((e, idx) => (
                <TableRow key={e.id} className={idx % 2 === 0 ? '' : 'bg-muted/30'}>
                  <TableCell className="text-sm">{format(new Date(e.entry_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${e.entry_type === 'entrada' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {e.entry_type === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{e.category}</TableCell>
                  <TableCell className="text-sm">{e.description || '—'}</TableCell>
                  <TableCell className="text-sm">{paymentMethods.find(p => p.id === e.payment_method_id)?.name || '—'}</TableCell>
                  <TableCell className={`text-right font-semibold tabular-nums ${e.entry_type === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {e.entry_type === 'entrada' ? '+' : '-'} {formatCurrency(Number(e.amount))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {e.receipt_path && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Ver comprovante" onClick={() => handleViewReceipt(e.receipt_path!)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={() => setDeleteId(e.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Lançamento' : `Novo ${formData.entry_type === 'entrada' ? 'Entrada' : 'Despesa'}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={formData.entry_type} onValueChange={(v: any) => setFormData({ ...formData, entry_type: v, category: '' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída / Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <CurrencyInput required value={formData.amount} onChange={(v) => setFormData({ ...formData, amount: v })} />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input type="date" required value={formData.entry_date} onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Aluguel de novembro" />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formData.payment_method_id} onValueChange={(v) => setFormData({ ...formData, payment_method_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Comprovante (opcional)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
              {receiptFile && <p className="text-xs text-muted-foreground">{receiptFile.name}</p>}
              {!receiptFile && existingReceipt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  <span>Comprovante anexado.</span>
                  <button type="button" className="text-primary underline" onClick={() => handleViewReceipt(existingReceipt)}>Ver</button>
                  <button type="button" className="text-destructive underline" onClick={() => setExistingReceipt(null)}>Remover</button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Cancelar</Button>
              <Button type="submit" disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
