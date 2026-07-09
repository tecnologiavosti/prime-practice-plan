import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useRealtime } from '@/hooks/useRealtime';

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

interface SectionDraft {
  id: string; // local uuid OR db id
  dbId?: string;
  name: string;
  section_value: number;
  procedures: { procedure_id: string; quantity: number }[];
}

const emptyPackage = { name: '', description: '', total_price: 0 };
const uid = () => Math.random().toString(36).slice(2);

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState(emptyPackage);
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
    fetchProcedures();
  }, []);
  useRealtime(['package_sections','package_procedures','private_packages','patient_packages'], fetchPackages);

  const fetchPackages = async () => {
    const { data, error } = await supabase.from('private_packages').select('*').order('name');
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

  const loadSections = async (packageId: string): Promise<SectionDraft[]> => {
    const { data: secs } = await supabase
      .from('package_sections')
      .select('*')
      .eq('package_id', packageId)
      .order('sort_order');
    const { data: procs } = await supabase
      .from('package_procedures')
      .select('procedure_id, quantity, section_id')
      .eq('package_id', packageId);

    const list: SectionDraft[] = (secs || []).map((s: any) => ({
      id: s.id,
      dbId: s.id,
      name: s.name,
      section_value: Number(s.section_value) || 0,
      procedures: (procs || [])
        .filter((p: any) => p.section_id === s.id)
        .map((p: any) => ({ procedure_id: p.procedure_id, quantity: p.quantity })),
    }));

    const unassigned = (procs || []).filter((p: any) => !p.section_id);
    if (unassigned.length > 0 || list.length === 0) {
      list.unshift({
        id: uid(),
        name: list.length === 0 ? 'Seção 1' : 'Geral',
        section_value: 0,
        procedures: unassigned.map((p: any) => ({ procedure_id: p.procedure_id, quantity: p.quantity })),
      });
    }
    return list;
  };

  const recalcTotal = (secs: SectionDraft[]) =>
    secs.reduce((sum, s) => sum + (Number(s.section_value) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = recalcTotal(sections);
    const payload = {
      name: formData.name,
      description: formData.description || null,
      total_price: total,
    };

    let packageId: string;
    if (editingPackage) {
      const { error } = await supabase.from('private_packages').update(payload).eq('id', editingPackage.id);
      if (error) return toast({ variant: 'destructive', title: 'Erro', description: error.message });
      packageId = editingPackage.id;
    } else {
      const { data, error } = await supabase.from('private_packages').insert(payload).select().single();
      if (error || !data) return toast({ variant: 'destructive', title: 'Erro', description: error?.message });
      packageId = data.id;
    }

    // Wipe and re-insert sections + procedures
    await supabase.from('package_procedures').delete().eq('package_id', packageId);
    await supabase.from('package_sections').delete().eq('package_id', packageId);

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const { data: secRow, error: secErr } = await supabase
        .from('package_sections')
        .insert({
          package_id: packageId,
          name: s.name || `Seção ${i + 1}`,
          section_value: Number(s.section_value) || 0,
          sort_order: i,
        })
        .select()
        .single();
      if (secErr || !secRow) {
        toast({ variant: 'destructive', title: 'Erro na seção', description: secErr?.message });
        continue;
      }
      if (s.procedures.length > 0) {
        await supabase.from('package_procedures').insert(
          s.procedures.map((p) => ({
            package_id: packageId,
            procedure_id: p.procedure_id,
            quantity: p.quantity,
            section_id: secRow.id,
          }))
        );
      }
    }

    toast({ title: editingPackage ? 'Pacote atualizado!' : 'Pacote cadastrado!' });
    setDialogOpen(false);
    setEditingPackage(null);
    setFormData(emptyPackage);
    setSections([]);
    fetchPackages();
  };

  const openEdit = async (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({ name: pkg.name, description: pkg.description || '', total_price: pkg.total_price });
    const secs = await loadSections(pkg.id);
    setSections(secs);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingPackage(null);
    setFormData(emptyPackage);
    setSections([{ id: uid(), name: 'Seção 1', section_value: 0, procedures: [] }]);
    setDialogOpen(true);
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { id: uid(), name: `Seção ${prev.length + 1}`, section_value: 0, procedures: [] },
    ]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSection = (id: string, patch: Partial<SectionDraft>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const toggleProcedure = (sectionId: string, procedureId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const exists = s.procedures.find((p) => p.procedure_id === procedureId);
        return {
          ...s,
          procedures: exists
            ? s.procedures.filter((p) => p.procedure_id !== procedureId)
            : [...s.procedures, { procedure_id: procedureId, quantity: 1 }],
        };
      })
    );
  };

  const updateQuantity = (sectionId: string, procedureId: string, quantity: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, procedures: s.procedures.map((p) => (p.procedure_id === procedureId ? { ...p, quantity } : p)) }
      )
    );
  };

  const handleDeletePackage = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('private_packages').delete().eq('id', deleteId);
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
    else {
      toast({ title: 'Pacote removido com sucesso!' });
      fetchPackages();
    }
    setDeleteId(null);
  };

  const filtered = packages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const totalDialog = recalcTotal(sections);

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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Editar Pacote' : 'Novo Pacote'}</DialogTitle>
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
                  <Label>Valor Total (soma das seções)</Label>
                  <Input readOnly value={formatCurrency(totalDialog)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-base">Seções do Pacote</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  <Plus className="mr-1 h-4 w-4" /> Adicionar Seção
                </Button>
              </div>

              <div className="space-y-3">
                {sections.map((section, idx) => {
                  const isCollapsed = collapsed[section.id];
                  return (
                    <Card key={section.id} className="p-4 space-y-3">
                      <div className="grid gap-3 md:grid-cols-[1fr,180px,auto,auto]">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome da Seção</Label>
                          <Input
                            value={section.name}
                            onChange={(e) => updateSection(section.id, { name: e.target.value })}
                            placeholder={`Seção ${idx + 1}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor da Seção (R$)</Label>
                          <CurrencyInput
                            value={section.section_value}
                            onChange={(v) => updateSection(section.id, { section_value: v })}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="self-end"
                          onClick={() => setCollapsed((c) => ({ ...c, [section.id]: !c[section.id] }))}
                          title={isCollapsed ? 'Expandir' : 'Recolher'}
                        >
                          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="self-end text-destructive hover:text-destructive"
                          onClick={() => removeSection(section.id)}
                          disabled={sections.length === 1}
                          title="Remover seção"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {!isCollapsed && (
                        <div className="space-y-1">
                          <Label className="text-xs">Procedimentos da Seção</Label>
                          <div className="max-h-44 overflow-y-auto rounded-md border p-2">
                            {procedures.map((proc) => {
                              const sel = section.procedures.find((p) => p.procedure_id === proc.id);
                              return (
                                <div key={proc.id} className="flex items-center gap-3 py-1">
                                  <Checkbox
                                    id={`${section.id}-${proc.id}`}
                                    checked={!!sel}
                                    onCheckedChange={() => toggleProcedure(section.id, proc.id)}
                                  />
                                  <label htmlFor={`${section.id}-${proc.id}`} className="flex-1 text-sm">
                                    {proc.code} - {proc.name}
                                  </label>
                                  {sel && (
                                    <Input
                                      type="number"
                                      min="1"
                                      className="w-20"
                                      value={sel.quantity}
                                      onChange={(e) =>
                                        updateQuantity(section.id, proc.id, parseInt(e.target.value) || 1)
                                      }
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
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
