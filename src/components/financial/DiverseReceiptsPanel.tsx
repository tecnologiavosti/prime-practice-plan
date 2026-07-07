import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, Trash2, Paperclip, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { createDocumentSignedUrl, DOCUMENTS_BUCKET } from '@/lib/storageDocuments';

interface Entry {
  id: string;
  entry_type: 'entrada' | 'saida';
  category: string;
  description: string | null;
  amount: number;
  entry_date: string;
  notes: string | null;
  receipt_path: string | null;
}

const CATEGORIES = ['Receita avulsa', 'Reembolso', 'Sala Sublocada', 'Doação', 'Outros'];

export function DiverseReceiptsPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [form, setForm] = useState<{
    entry_type: 'entrada' | 'saida';
    category: string;
    description: string;
    amount: number;
    entry_date: string;
    notes: string;
  }>({
    entry_type: 'entrada',
    category: 'Receita avulsa',
    description: '',
    amount: 0,
    entry_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cash_flow_entries')
      .select('id, entry_type, category, description, amount, entry_date, notes, receipt_path')
      .order('entry_date', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
    setEntries((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let receipt_path: string | null = null;
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop();
      const path = `cash-flow/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, receiptFile, { upsert: false });
      if (upErr) {
        setUploading(false);
        toast({ variant: 'destructive', title: 'Erro no upload', description: upErr.message });
        return;
      }
      receipt_path = path;
    }
    const { error } = await supabase.from('cash_flow_entries').insert([{
      entry_type: form.entry_type,
      category: form.category,
      description: form.description || null,
      amount: form.amount,
      entry_date: form.entry_date,
      notes: form.notes || null,
      receipt_path,
    } as any]);
    setUploading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    toast({ title: 'Lançamento registrado!' });
    setOpen(false);
    setReceiptFile(null);
    setForm({ entry_type: 'entrada', category: 'Receita avulsa', description: '', amount: 0, entry_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    fetchEntries();
  };

  const handleViewReceipt = async (path: string) => {
    const { url, error } = await createDocumentSignedUrl(path);
    if (error || !url) {
      toast({ variant: 'destructive', title: 'Erro', description: error || 'Não foi possível abrir.' });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Remover este recebimento?')) return;
    const { error } = await supabase.from('cash_flow_entries').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    fetchEntries();
  };

  const filtered = entries.filter((e) => {
    if (from && e.entry_date < from) return false;
    if (to && e.entry_date > to) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && e.entry_type !== typeFilter) return false;
    return true;
  });

  const totalIn = filtered.filter((e) => e.entry_type === 'entrada').reduce((a, e) => a + Number(e.amount), 0);
  const totalOut = filtered.filter((e) => e.entry_type === 'saida').reduce((a, e) => a + Number(e.amount), 0);
  const total = totalIn - totalOut;
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recebidos Diversos</h2>
          <p className="text-sm text-muted-foreground">Entradas avulsas que não vieram de consultas ou guias.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo lançamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <Select value={form.entry_type} onValueChange={(v) => setForm({ ...form, entry_type: v as 'entrada' | 'saida' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Categoria *</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Valor (R$) *</Label>
                  <CurrencyInput required value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
                </div>
                <div className="space-y-1">
                  <Label>Data *</Label>
                  <Input type="date" required value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Comprovante (opcional)</Label>
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                />
                {receiptFile && (
                  <p className="text-xs text-muted-foreground">{receiptFile.name}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>Cancelar</Button>
                <Button type="submit" disabled={uploading}>{uploading ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalIn)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalOut)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(total)}</div>
            <p className="text-xs text-muted-foreground">{filtered.length} lançamentos</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1 min-w-[140px]">
          <Label className="text-xs">Tipo</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 min-w-[180px]">
          <Label className="text-xs">Categoria</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center">Nenhum lançamento encontrado</TableCell></TableRow>
            ) : filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{format(new Date(e.entry_date + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${e.entry_type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.entry_type === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell>{e.description || '-'}</TableCell>
                <TableCell className={`font-medium ${e.entry_type === 'saida' ? 'text-red-600' : ''}`}>
                  {e.entry_type === 'saida' ? '- ' : ''}{formatCurrency(Number(e.amount))}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {e.receipt_path && (
                      <Button size="icon" variant="ghost" onClick={() => handleViewReceipt(e.receipt_path!)} title="Ver comprovante">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
