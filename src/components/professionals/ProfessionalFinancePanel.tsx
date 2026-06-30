import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Fee {
  id: string;
  fee_type: string;
  fixed_value: number | null;
  percentage_value: number | null;
  per_procedure_value: number | null;
  procedure_id: string | null;
  procedure?: { name: string } | null;
}

interface Procedure { id: string; name: string; }

interface Props { professionalId: string; }

const emptyForm = {
  procedure_id: '',
  fee_type: 'percentage' as 'percentage' | 'fixed' | 'per_procedure',
  fixed_value: 0,
  percentage_value: 0,
  per_procedure_value: 0,
};

export function ProfessionalFinancePanel({ professionalId }: Props) {
  const [fees, setFees] = useState<Fee[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFees();
    fetchProcedures();
  }, [professionalId]);

  const fetchFees = async () => {
    const { data } = await supabase
      .from('professional_fees')
      .select('*, procedure:procedures(name)')
      .eq('professional_id', professionalId)
      .eq('active', true)
      .order('created_at', { ascending: false });
    setFees((data as any) || []);
  };

  const fetchProcedures = async () => {
    const { data } = await supabase
      .from('procedures').select('id, name').eq('active', true).order('name');
    setProcedures(data || []);
  };

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    const payload = {
      professional_id: professionalId,
      procedure_id: form.procedure_id || null,
      fee_type: form.fee_type,
      fixed_value: form.fee_type === 'fixed' ? form.fixed_value : 0,
      percentage_value: form.fee_type === 'percentage' ? form.percentage_value : 0,
      per_procedure_value: form.fee_type === 'per_procedure' ? form.per_procedure_value : 0,
    };
    const { error } = editingId
      ? await supabase.from('professional_fees').update(payload).eq('id', editingId)
      : await supabase.from('professional_fees').insert([payload]);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.code === '23505' ? 'Já existe regra para este procedimento' : error.message });
      return;
    }
    toast({ title: editingId ? 'Regra atualizada!' : 'Regra criada!' });
    reset();
    fetchFees();
  };

  const handleEdit = (f: Fee) => {
    setEditingId(f.id);
    setForm({
      procedure_id: f.procedure_id || '',
      fee_type: f.fee_type as any,
      fixed_value: Number(f.fixed_value) || 0,
      percentage_value: Number(f.percentage_value) || 0,
      per_procedure_value: Number(f.per_procedure_value) || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover esta regra?')) return;
    const { error } = await supabase.from('professional_fees').delete().eq('id', id);
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return; }
    toast({ title: 'Regra removida' });
    fetchFees();
  };

  const renderValue = (f: Fee) => {
    if (f.fee_type === 'percentage') return `${Number(f.percentage_value || 0).toFixed(2)}%`;
    if (f.fee_type === 'fixed') return formatCurrency(Number(f.fixed_value || 0));
    return formatCurrency(Number(f.per_procedure_value || 0));
  };

  const typeLabel = (t: string) =>
    t === 'percentage' ? 'Porcentagem' : t === 'fixed' ? 'Valor fixo mensal' : 'Por procedimento';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Regras de Repasse</Label>
          <p className="text-xs text-muted-foreground">Configure quanto este profissional recebe (padrão ou por procedimento).</p>
        </div>
        {!showForm && (
          <Button type="button" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova regra
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-md border p-3 space-y-3 bg-muted/30">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Procedimento (opcional — vazio = padrão)</Label>
              <Select value={form.procedure_id || 'none'} onValueChange={(v) => setForm({ ...form, procedure_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Padrão (todos)</SelectItem>
                  {procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.fee_type} onValueChange={(v) => setForm({ ...form, fee_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo mensal</SelectItem>
                  <SelectItem value="per_procedure">Por procedimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.fee_type === 'percentage' && (
              <div className="space-y-1">
                <Label className="text-xs">Porcentagem (%)</Label>
                <Input
                  type="number" step="0.01" min="0" max="100"
                  value={form.percentage_value}
                  onChange={(e) => setForm({ ...form, percentage_value: Number(e.target.value) })}
                />
              </div>
            )}
            {form.fee_type === 'fixed' && (
              <div className="space-y-1">
                <Label className="text-xs">Valor fixo mensal (R$)</Label>
                <CurrencyInput value={form.fixed_value} onChange={(v) => setForm({ ...form, fixed_value: v })} />
              </div>
            )}
            {form.fee_type === 'per_procedure' && (
              <div className="space-y-1">
                <Label className="text-xs">Valor por procedimento (R$)</Label>
                <CurrencyInput value={form.per_procedure_value} onChange={(v) => setForm({ ...form, per_procedure_value: v })} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset}><X className="h-4 w-4 mr-1" />Cancelar</Button>
            <Button type="button" size="sm" onClick={handleSave}>{editingId ? 'Atualizar' : 'Salvar'}</Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Procedimento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Nenhuma regra cadastrada</TableCell></TableRow>
            ) : fees.map(f => (
              <TableRow key={f.id}>
                <TableCell>{f.procedure?.name || <span className="text-muted-foreground italic">Padrão</span>}</TableCell>
                <TableCell>{typeLabel(f.fee_type)}</TableCell>
                <TableCell className="font-mono">{renderValue(f)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4" /></Button>
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
