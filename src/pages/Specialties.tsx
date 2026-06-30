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
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Specialty { id: string; name: string; active: boolean }
interface Insurance { id: string; name: string }
interface Administrator { id: string; name: string }
interface InsAdminLink { insurance_id: string; administrator_id: string; billing_rate: number | null }
interface SpecialtyLink { specialty_id: string; health_insurance_id: string; administrator_id: string | null }

// Key format: `${insuranceId}|${administratorId or ''}`
const k = (ins: string, adm: string | null) => `${ins}|${adm || ''}`;

export default function Specialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [insAdminLinks, setInsAdminLinks] = useState<InsAdminLink[]>([]);
  const [linkedMap, setLinkedMap] = useState<Record<string, Set<string>>>({}); // specialty_id -> Set of keys
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [s, i, a, m, l] = await Promise.all([
      supabase.from('specialties').select('*').order('name'),
      supabase.from('health_insurances').select('id, name').eq('active', true).order('name'),
      supabase.from('administrators').select('id, name').eq('active', true).order('name'),
      supabase.from('insurance_administrators_map').select('insurance_id, administrator_id'),
      supabase.from('specialty_health_insurances').select('specialty_id, health_insurance_id, administrator_id'),
    ]);
    if (s.error) toast({ variant: 'destructive', title: 'Erro', description: s.error.message });
    setSpecialties(s.data || []);
    setInsurances(i.data || []);
    setAdministrators(a.data || []);
    setInsAdminLinks((m.data || []) as InsAdminLink[]);
    const map: Record<string, Set<string>> = {};
    (l.data || []).forEach((r: any) => {
      if (!map[r.specialty_id]) map[r.specialty_id] = new Set();
      map[r.specialty_id].add(k(r.health_insurance_id, r.administrator_id));
    });
    setLinkedMap(map);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setName('');
    setSelected(new Set());
    setDialogOpen(true);
  }
  function openEdit(s: Specialty) {
    setEditing(s);
    setName(s.name);
    setSelected(new Set(linkedMap[s.id] || []));
    setDialogOpen(true);
  }

  async function syncLinks(specialtyId: string) {
    const current = linkedMap[specialtyId] || new Set<string>();
    const target = selected;
    const toAdd: SpecialtyLink[] = [];
    const toRemove: SpecialtyLink[] = [];
    target.forEach((key) => {
      if (!current.has(key)) {
        const [ins, adm] = key.split('|');
        toAdd.push({ specialty_id: specialtyId, health_insurance_id: ins, administrator_id: adm || null });
      }
    });
    current.forEach((key) => {
      if (!target.has(key)) {
        const [ins, adm] = key.split('|');
        toRemove.push({ specialty_id: specialtyId, health_insurance_id: ins, administrator_id: adm || null });
      }
    });
    if (toAdd.length > 0) {
      await supabase.from('specialty_health_insurances').insert(toAdd);
    }
    for (const r of toRemove) {
      let q = supabase.from('specialty_health_insurances').delete()
        .eq('specialty_id', r.specialty_id)
        .eq('health_insurance_id', r.health_insurance_id);
      q = r.administrator_id ? q.eq('administrator_id', r.administrator_id) : q.is('administrator_id', null);
      await q;
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

    if (specialtyId) await syncLinks(specialtyId);
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

  function toggleKey(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const adminsForInsurance = (insId: string): Administrator[] => {
    const adminIds = insAdminLinks.filter((l) => l.insurance_id === insId).map((l) => l.administrator_id);
    return administrators.filter((a) => adminIds.includes(a.id));
  };

  const filtered = specialties.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Especialidades</h1>
          <p className="text-muted-foreground">Gerencie especialidades e seus convênios/administradoras vinculados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Especialidade</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Especialidade' : 'Nova Especialidade'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cardiologia" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Convênios e Administradoras</Label>
                <p className="text-xs text-muted-foreground">
                  Marque o convênio e, dentro dele, as administradoras que cobrem esta especialidade.
                </p>
                <div className="border rounded-md p-3 max-h-[400px] overflow-y-auto space-y-3">
                  {insurances.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum convênio ativo cadastrado.</p>
                  ) : insurances.map((ins) => {
                    const admins = adminsForInsurance(ins.id);
                    const directKey = k(ins.id, null);
                    return (
                      <div key={ins.id} className="rounded-md border p-3 space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <Checkbox
                            checked={selected.has(directKey)}
                            onCheckedChange={() => toggleKey(directKey)}
                          />
                          {ins.name}
                          <span className="ml-auto text-[11px] text-muted-foreground">
                            {admins.length === 0 ? 'sem administradoras' : `${admins.length} administradora(s)`}
                          </span>
                        </label>
                        {admins.length > 0 && (
                          <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {admins.map((adm) => {
                              const key = k(ins.id, adm.id);
                              return (
                                <label key={adm.id} className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground">
                                  <Checkbox
                                    checked={selected.has(key)}
                                    onCheckedChange={() => toggleKey(key)}
                                  />
                                  {adm.name}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              <TableHead>Vínculos</TableHead>
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
                  {(linkedMap[spec.id]?.size || 0)} vínculo(s)
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
