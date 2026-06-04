import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Specialty { id: string; name: string; active: boolean }
interface Insurance { id: string; name: string; active: boolean }

export default function Specialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [linkedMap, setLinkedMap] = useState<Record<string, string[]>>({}); // specialty_id -> insurance_ids
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [name, setName] = useState('');
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [s, i, l] = await Promise.all([
      supabase.from('specialties').select('*').order('name'),
      supabase.from('health_insurances').select('id, name, active').eq('active', true).order('name'),
      supabase.from('specialty_health_insurances').select('specialty_id, health_insurance_id'),
    ]);
    if (s.error) toast({ variant: 'destructive', title: 'Erro', description: s.error.message });
    setSpecialties(s.data || []);
    setInsurances(i.data || []);
    const map: Record<string, string[]> = {};
    (l.data || []).forEach((r: any) => {
      map[r.specialty_id] = [...(map[r.specialty_id] || []), r.health_insurance_id];
    });
    setLinkedMap(map);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setName('');
    setSelectedInsurances([]);
    setDialogOpen(true);
  }
  function openEdit(s: Specialty) {
    setEditing(s);
    setName(s.name);
    setSelectedInsurances(linkedMap[s.id] || []);
    setDialogOpen(true);
  }

  async function syncInsurances(specialtyId: string) {
    const current = linkedMap[specialtyId] || [];
    const toAdd = selectedInsurances.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !selectedInsurances.includes(id));
    if (toAdd.length > 0) {
      await supabase.from('specialty_health_insurances').insert(
        toAdd.map((health_insurance_id) => ({ specialty_id: specialtyId, health_insurance_id }))
      );
    }
    if (toRemove.length > 0) {
      await supabase.from('specialty_health_insurances')
        .delete()
        .eq('specialty_id', specialtyId)
        .in('health_insurance_id', toRemove);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let specialtyId = editing?.id;

    if (editing) {
      const { error } = await supabase.from('specialties').update({ name }).eq('id', editing.id);
      if (error) return toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      const { data, error } = await supabase.from('specialties').insert({ name }).select().single();
      if (error) {
        if (error.code === '23505') return toast({ variant: 'destructive', title: 'Erro', description: 'Especialidade já existe' });
        return toast({ variant: 'destructive', title: 'Erro', description: error.message });
      }
      specialtyId = data.id;
    }

    if (specialtyId) await syncInsurances(specialtyId);
    toast({ title: editing ? 'Especialidade atualizada!' : 'Especialidade cadastrada!' });
    setDialogOpen(false);
    fetchAll();
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('specialties').delete().eq('id', deleteId);
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
    else toast({ title: 'Especialidade removida!' });
    setDeleteId(null);
    fetchAll();
  }

  function toggleInsurance(id: string) {
    setSelectedInsurances((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const filtered = specialties.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Especialidades</h1>
          <p className="text-muted-foreground">Gerencie especialidades e seus convênios vinculados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Especialidade</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Especialidade' : 'Nova Especialidade'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cardiologia" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Convênios atendidos</Label>
                <p className="text-xs text-muted-foreground">Selecione os convênios que cobrem esta especialidade. Aparecerão na página pública de Convênios.</p>
                <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                  {insurances.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum convênio ativo cadastrado.</p>
                  ) : insurances.map((ins) => (
                    <label key={ins.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedInsurances.includes(ins.id)}
                        onCheckedChange={() => toggleInsurance(ins.id)}
                      />
                      {ins.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar especialidade..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Convênios</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center">Nenhuma especialidade encontrada</TableCell></TableRow>
            ) : filtered.map((spec) => (
              <TableRow key={spec.id}>
                <TableCell className="font-medium">{spec.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(linkedMap[spec.id]?.length || 0)} convênio(s)
                </TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs ${spec.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {spec.active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(spec)} title="Editar"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(spec.id)} title="Remover" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover esta especialidade? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
