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
import { Plus, Edit } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setMethods(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMethod) {
      const { error } = await supabase
        .from('payment_methods')
        .update({ name })
        .eq('id', editingMethod.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      toast({ title: 'Forma de pagamento atualizada!' });
    } else {
      const { error } = await supabase.from('payment_methods').insert([{ name }]);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      toast({ title: 'Forma de pagamento cadastrada!' });
    }

    setDialogOpen(false);
    setEditingMethod(null);
    setName('');
    fetchMethods();
  };

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setName(method.name);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingMethod(null);
    setName('');
    setDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Formas de Pagamento</h1>
          <p className="text-muted-foreground">Gerencie as formas de pagamento (particular)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Forma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cartão de Crédito"
                />
              </div>
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : methods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Nenhuma forma de pagamento</TableCell>
              </TableRow>
            ) : (
              methods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${method.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {method.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(method)}>
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
