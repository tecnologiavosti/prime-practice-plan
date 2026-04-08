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
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Procedure {
  id: string;
  code: string;
  name: string;
  description: string | null;
  private_price: number;
  duration_minutes: number;
  active: boolean;
}

interface HealthInsurance {
  id: string;
  name: string;
}

interface InsurancePrice {
  health_insurance_id: string;
  price: number;
}

interface ProcedureInsurancePrice {
  procedure_id: string;
  health_insurance_id: string;
  price: number;
  health_insurance?: { name: string };
}

const emptyProcedure = {
  code: '',
  name: '',
  description: '',
  private_price: 0,
  duration_minutes: 30,
};

export default function Procedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [formData, setFormData] = useState(emptyProcedure);
  const [insurancePrices, setInsurancePrices] = useState<InsurancePrice[]>([]);
  const [allProcedurePrices, setAllProcedurePrices] = useState<ProcedureInsurancePrice[]>([]);
  const [isParticular, setIsParticular] = useState(true);
  const [isConvenio, setIsConvenio] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeleteProcedure = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('procedures').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Procedimento removido com sucesso!' });
      fetchProcedures();
      fetchAllProcedurePrices();
    }
    setDeleteId(null);
  };

  useEffect(() => {
    fetchProcedures();
    fetchInsurances();
    fetchAllProcedurePrices();
  }, []);

  const fetchProcedures = async () => {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setProcedures(data || []);
    setLoading(false);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase.from('health_insurances').select('id, name').eq('active', true).order('name');
    setInsurances(data || []);
  };

  const fetchAllProcedurePrices = async () => {
    const { data } = await supabase
      .from('procedure_insurance_prices')
      .select('procedure_id, health_insurance_id, price, health_insurance:health_insurances(name)');
    setAllProcedurePrices((data as any) || []);
  };

  const fetchInsurancePrices = async (procedureId: string) => {
    const { data } = await supabase
      .from('procedure_insurance_prices')
      .select('health_insurance_id, price')
      .eq('procedure_id', procedureId);
    
    const prices: InsurancePrice[] = insurances.map((ins) => {
      const existing = data?.find((d) => d.health_insurance_id === ins.id);
      return {
        health_insurance_id: ins.id,
        price: existing?.price || 0,
      };
    });
    setInsurancePrices(prices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      private_price: parseFloat(formData.private_price.toString()),
      duration_minutes: parseInt(formData.duration_minutes.toString()),
    };

    let procedureId = editingProcedure?.id;

    if (editingProcedure) {
      const { error } = await supabase
        .from('procedures')
        .update(payload)
        .eq('id', editingProcedure.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
    } else {
      const { data, error } = await supabase.from('procedures').insert(payload).select().single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      procedureId = data.id;
    }

    // Save insurance prices
    if (procedureId) {
      await supabase
        .from('procedure_insurance_prices')
        .delete()
        .eq('procedure_id', procedureId);

      const toInsert = insurancePrices
        .filter((p) => p.price > 0)
        .map((p) => ({
          procedure_id: procedureId,
          health_insurance_id: p.health_insurance_id,
          price: p.price,
        }));

      if (toInsert.length > 0) {
        await supabase.from('procedure_insurance_prices').insert(toInsert);
      }
    }

    toast({ title: editingProcedure ? 'Procedimento atualizado!' : 'Procedimento cadastrado!' });
    setDialogOpen(false);
    setEditingProcedure(null);
    setFormData(emptyProcedure);
    setInsurancePrices([]);
    fetchProcedures();
    fetchAllProcedurePrices();
  };

  const getInsurancePricesForProcedure = (procedureId: string) => {
    return allProcedurePrices
      .filter((p) => p.procedure_id === procedureId && p.price > 0)
      .map((p) => ({
        name: p.health_insurance?.name || 'Convênio',
        price: p.price,
      }));
  };
  const openEdit = async (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setFormData({
      code: procedure.code,
      name: procedure.name,
      description: procedure.description || '',
      private_price: procedure.private_price,
      duration_minutes: procedure.duration_minutes,
    });
    await fetchInsurancePrices(procedure.id);
    // Determine if has private or insurance prices
    setIsParticular(procedure.private_price > 0);
    setIsConvenio(true); // Show insurance prices if editing
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingProcedure(null);
    setFormData(emptyProcedure);
    setIsParticular(true);
    setIsConvenio(false);
    // Initialize empty insurance prices
    setInsurancePrices(insurances.map((ins) => ({
      health_insurance_id: ins.id,
      price: 0,
    })));
    setDialogOpen(true);
  };

  const filtered = procedures.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search)
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie os procedimentos da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Procedimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProcedure ? 'Editar Procedimento' : 'Novo Procedimento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Tipo de Atendimento */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Tipo de Atendimento</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="particular"
                      checked={isParticular}
                      onCheckedChange={(checked) => setIsParticular(!!checked)}
                    />
                    <label htmlFor="particular" className="text-sm font-medium cursor-pointer">
                      Particular
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="convenio"
                      checked={isConvenio}
                      onCheckedChange={(checked) => setIsConvenio(!!checked)}
                    />
                    <label htmlFor="convenio" className="text-sm font-medium cursor-pointer">
                      Convênio
                    </label>
                  </div>
                </div>

                {/* Valor Particular */}
                {isParticular && (
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                    <Label className="font-medium">Valor Particular</Label>
                    <div className="flex items-center gap-2 max-w-xs">
                      <span className="text-muted-foreground">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.private_price || ''}
                        onChange={(e) => setFormData({ ...formData, private_price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                )}

                {/* Valores por Convênio */}
                {isConvenio && (
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                    <Label className="font-medium">Valores por Convênio</Label>
                    {insurances.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Nenhum convênio cadastrado</p>
                        <p className="text-sm">Cadastre convênios em Planos de Saúde</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {insurances.map((ins) => {
                          const priceObj = insurancePrices.find((p) => p.health_insurance_id === ins.id);
                          return (
                            <div key={ins.id} className="flex items-center gap-4">
                              <Label className="w-40 shrink-0 text-sm">{ins.name}</Label>
                              <div className="flex items-center gap-2 flex-1 max-w-xs">
                                <span className="text-muted-foreground text-sm">R$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0,00"
                                  value={priceObj?.price || ''}
                                  onChange={(e) => {
                                    const newPrices = insurancePrices.map((p) =>
                                      p.health_insurance_id === ins.id
                                        ? { ...p, price: parseFloat(e.target.value) || 0 }
                                        : p
                                    );
                                    setInsurancePrices(newPrices);
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>


      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar procedimento..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Valor Particular</TableHead>
              <TableHead>Valor Convênio</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Nenhum procedimento encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((proc) => {
                const insurancePricesList = getInsurancePricesForProcedure(proc.id);
                return (
                  <TableRow key={proc.id}>
                    <TableCell className="font-mono">{proc.code}</TableCell>
                    <TableCell className="font-medium">{proc.name}</TableCell>
                    <TableCell>
                      {proc.private_price > 0 ? formatCurrency(proc.private_price) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {insurancePricesList.length > 0 ? (
                        <div className="space-y-1">
                          {insurancePricesList.slice(0, 2).map((ip, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="text-muted-foreground">{ip.name}:</span>{' '}
                              {formatCurrency(ip.price)}
                            </div>
                          ))}
                          {insurancePricesList.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{insurancePricesList.length - 2} mais
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{proc.duration_minutes} min</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-1 text-xs ${proc.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {proc.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(proc)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(proc.id)} title="Remover" className="text-destructive hover:text-destructive">
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
            <AlertDialogDescription>Tem certeza que deseja remover este procedimento? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProcedure} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
