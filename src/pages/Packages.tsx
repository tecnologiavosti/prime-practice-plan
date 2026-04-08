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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

interface Package {
  id: string;
  name: string;
  description: string | null;
  total_price: number;
  active: boolean;
}

interface Procedure {
  id: string;
  name: string;
  code: string;
}

interface PackageProcedure {
  procedure_id: string;
  quantity: number;
}

const emptyPackage = {
  name: '',
  description: '',
  total_price: 0,
};

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState(emptyPackage);
  const [selectedProcedures, setSelectedProcedures] = useState<PackageProcedure[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeletePackage = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('private_packages').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Pacote removido com sucesso!' });
      fetchPackages();
    }
    setDeleteId(null);
  };

  useEffect(() => {
    fetchPackages();
    fetchProcedures();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('private_packages')
      .select('*')
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setPackages(data || []);
    setLoading(false);
  };

  const fetchProcedures = async () => {
    const { data } = await supabase.from('procedures').select('id, name, code').eq('active', true).order('name');
    setProcedures(data || []);
  };

  const fetchPackageProcedures = async (packageId: string) => {
    const { data } = await supabase
      .from('package_procedures')
      .select('procedure_id, quantity')
      .eq('package_id', packageId);
    return data || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || null,
      total_price: parseFloat(formData.total_price.toString()),
    };

    if (editingPackage) {
      const { error } = await supabase
        .from('private_packages')
        .update(payload)
        .eq('id', editingPackage.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }

      // Update procedures
      await supabase.from('package_procedures').delete().eq('package_id', editingPackage.id);
      if (selectedProcedures.length > 0) {
        await supabase.from('package_procedures').insert(
          selectedProcedures.map((p) => ({
            package_id: editingPackage.id,
            procedure_id: p.procedure_id,
            quantity: p.quantity,
          }))
        );
      }

      toast({ title: 'Pacote atualizado com sucesso!' });
    } else {
      const { data, error } = await supabase.from('private_packages').insert(payload).select().single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }

      if (selectedProcedures.length > 0 && data) {
        await supabase.from('package_procedures').insert(
          selectedProcedures.map((p) => ({
            package_id: data.id,
            procedure_id: p.procedure_id,
            quantity: p.quantity,
          }))
        );
      }

      toast({ title: 'Pacote cadastrado com sucesso!' });
    }

    setDialogOpen(false);
    setEditingPackage(null);
    setFormData(emptyPackage);
    setSelectedProcedures([]);
    fetchPackages();
  };

  const openEdit = async (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      total_price: pkg.total_price,
    });
    const procs = await fetchPackageProcedures(pkg.id);
    setSelectedProcedures(procs);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingPackage(null);
    setFormData(emptyPackage);
    setSelectedProcedures([]);
    setDialogOpen(true);
  };

  const toggleProcedure = (procedureId: string) => {
    const exists = selectedProcedures.find((p) => p.procedure_id === procedureId);
    if (exists) {
      setSelectedProcedures(selectedProcedures.filter((p) => p.procedure_id !== procedureId));
    } else {
      setSelectedProcedures([...selectedProcedures, { procedure_id: procedureId, quantity: 1 }]);
    }
  };

  const updateQuantity = (procedureId: string, quantity: number) => {
    setSelectedProcedures(
      selectedProcedures.map((p) =>
        p.procedure_id === procedureId ? { ...p, quantity } : p
      )
    );
  };

  const filtered = packages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacotes Particulares</h1>
          <p className="text-muted-foreground">Gerencie os pacotes de procedimentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pacote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Total (R$) *</Label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={formData.total_price}
                    onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
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

              <div className="space-y-2">
                <Label>Procedimentos Incluídos</Label>
                <div className="max-h-48 overflow-y-auto rounded-md border p-3">
                  {procedures.map((proc) => {
                    const selected = selectedProcedures.find((p) => p.procedure_id === proc.id);
                    return (
                      <div key={proc.id} className="flex items-center gap-3 py-2">
                        <Checkbox
                          id={proc.id}
                          checked={!!selected}
                          onCheckedChange={() => toggleProcedure(proc.id)}
                        />
                        <label htmlFor={proc.id} className="flex-1 text-sm">
                          {proc.code} - {proc.name}
                        </label>
                        {selected && (
                          <Input
                            type="number"
                            min="1"
                            className="w-20"
                            value={selected.quantity}
                            onChange={(e) => updateQuantity(proc.id, parseInt(e.target.value) || 1)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
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

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar pacote..."
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
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Nenhum pacote encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{pkg.description || '-'}</TableCell>
                  <TableCell>{formatCurrency(pkg.total_price)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${pkg.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {pkg.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(pkg.id)} title="Remover" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover este pacote? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePackage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
