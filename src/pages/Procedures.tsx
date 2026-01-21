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
import { Plus, Search, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { toast } = useToast();

  useEffect(() => {
    fetchProcedures();
    fetchInsurances();
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
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingProcedure(null);
    setFormData(emptyProcedure);
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
              <Tabs defaultValue="dados">
                <TabsList className="w-full">
                  <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
                  <TabsTrigger value="convenios" className="flex-1">Valores Convênios</TabsTrigger>
                </TabsList>
                <TabsContent value="dados" className="space-y-4 mt-4">
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
                      <Label>Valor Particular (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.private_price}
                        onChange={(e) => setFormData({ ...formData, private_price: parseFloat(e.target.value) || 0 })}
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
                </TabsContent>
                <TabsContent value="convenios" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Configure os valores para cada convênio. Deixe em branco ou 0 se não houver tabela específica.
                  </p>
                  {insurances.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                      <p>Nenhum convênio cadastrado</p>
                      <p className="text-sm">Cadastre convênios em Planos de Saúde</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {insurances.map((ins) => {
                        const priceObj = insurancePrices.find((p) => p.health_insurance_id === ins.id);
                        return (
                          <div key={ins.id} className="flex items-center gap-4">
                            <Label className="w-48 shrink-0">{ins.name}</Label>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-muted-foreground">R$</span>
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
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2">
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
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhum procedimento encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((proc) => (
                <TableRow key={proc.id}>
                  <TableCell className="font-mono">{proc.code}</TableCell>
                  <TableCell className="font-medium">{proc.name}</TableCell>
                  <TableCell>{formatCurrency(proc.private_price)}</TableCell>
                  <TableCell>{proc.duration_minutes} min</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${proc.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {proc.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(proc)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
