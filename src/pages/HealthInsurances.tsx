import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';

interface HealthInsurance {
  id: string;
  name: string;
  code: string | null;
  ans_registration: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  active: boolean;
  administrator_ids: string[];
}

interface Administrator {
  id: string;
  name: string;
}

const emptyInsurance = {
  name: '',
  code: '',
  ans_registration: '',
  contact_phone: '',
  contact_email: '',
  notes: '',
  active: true,
  administrator_ids: [] as string[],
};

export default function HealthInsurances() {
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<HealthInsurance | null>(null);
  const [formData, setFormData] = useState(emptyInsurance);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('health_insurances').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Convênio removido com sucesso!' });
      fetchInsurances();
    }
    setDeleteId(null);
  };

  useEffect(() => {
    fetchInsurances();
    fetchAdministrators();
  }, []);

  const fetchInsurances = async () => {
    const { data, error } = await supabase
      .from('health_insurances')
      .select('*, insurance_administrators_map(administrator_id)')
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    const mapped: HealthInsurance[] = (data || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      code: i.code,
      ans_registration: i.ans_registration,
      contact_phone: i.contact_phone,
      contact_email: i.contact_email,
      notes: i.notes,
      active: i.active,
      administrator_ids: (i.insurance_administrators_map || []).map((m: any) => m.administrator_id),
    }));
    setInsurances(mapped);
    setLoading(false);
  };

  const fetchAdministrators = async () => {
    const { data } = await supabase.from('administrators').select('id, name').eq('active', true).order('name');
    setAdministrators(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { administrator_ids, ...rest } = formData;
    const payload = { ...rest };

    let insuranceId = editingInsurance?.id;

    if (editingInsurance) {
      const { error } = await supabase
        .from('health_insurances')
        .update(payload)
        .eq('id', editingInsurance.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
    } else {
      const { data, error } = await supabase.from('health_insurances').insert(payload).select().single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      insuranceId = data.id;
    }

    // Sync administrator links
    if (insuranceId) {
      await supabase.from('insurance_administrators_map').delete().eq('insurance_id', insuranceId);
      if (administrator_ids.length > 0) {
        const links = administrator_ids.map((aid) => ({
          insurance_id: insuranceId!,
          administrator_id: aid,
        }));
        const { error: linkErr } = await supabase.from('insurance_administrators_map').insert(links);
        if (linkErr) {
          toast({ variant: 'destructive', title: 'Erro ao vincular administradoras', description: linkErr.message });
          return;
        }
      }
    }

    toast({ title: editingInsurance ? 'Convênio atualizado!' : 'Convênio cadastrado!' });
    setDialogOpen(false);
    setEditingInsurance(null);
    setFormData(emptyInsurance);
    fetchInsurances();
  };

  const openEdit = (insurance: HealthInsurance) => {
    setEditingInsurance(insurance);
    setFormData({
      name: insurance.name,
      code: insurance.code || '',
      ans_registration: insurance.ans_registration || '',
      contact_phone: insurance.contact_phone || '',
      contact_email: insurance.contact_email || '',
      notes: insurance.notes || '',
      active: insurance.active,
      administrator_ids: insurance.administrator_ids,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingInsurance(null);
    setFormData(emptyInsurance);
    setDialogOpen(true);
  };

  const toggleAdmin = (adminId: string) => {
    setFormData((prev) => ({
      ...prev,
      administrator_ids: prev.administrator_ids.includes(adminId)
        ? prev.administrator_ids.filter((id) => id !== adminId)
        : [...prev.administrator_ids, adminId],
    }));
  };

  const filtered = insurances.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.code?.includes(search)
  );

  const getAdminNames = (ids: string[]) =>
    ids.map((id) => administrators.find((a) => a.id === id)?.name).filter(Boolean) as string[];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Convênios</h1>
          <p className="text-muted-foreground">Gerencie os convênios da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Convênio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInsurance ? 'Editar Convênio' : 'Novo Convênio'}
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
                  <Label>Código</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Administradoras</Label>
                  <div className="rounded-md border p-3 max-h-48 overflow-y-auto space-y-2">
                    {administrators.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma administradora cadastrada</p>
                    ) : (
                      administrators.map((adm) => (
                        <div key={adm.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`adm-${adm.id}`}
                            checked={formData.administrator_ids.includes(adm.id)}
                            onCheckedChange={() => toggleAdmin(adm.id)}
                          />
                          <label htmlFor={`adm-${adm.id}`} className="text-sm cursor-pointer">
                            {adm.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Registro ANS</Label>
                  <Input
                    value={formData.ans_registration}
                    onChange={(e) => setFormData({ ...formData, ans_registration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                  />
                  <Label>{formData.active ? 'Ativo' : 'Inativo'}</Label>
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
            placeholder="Buscar convênio..."
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
              <TableHead>Código</TableHead>
              <TableHead>Administradoras</TableHead>
              <TableHead>Registro ANS</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Nenhum convênio encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((ins) => {
                const names = getAdminNames(ins.administrator_ids);
                return (
                  <TableRow key={ins.id}>
                    <TableCell className="font-medium">{ins.name}</TableCell>
                    <TableCell>{ins.code || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {names.length === 0 ? (
                          <span className="text-muted-foreground text-sm">-</span>
                        ) : (
                          names.map((n) => (
                            <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{ins.ans_registration || '-'}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-1 text-xs ${ins.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {ins.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ins)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(ins.id)} title="Remover" className="text-destructive hover:text-destructive">
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
            <AlertDialogDescription>Tem certeza que deseja remover este convênio? Esta ação não pode ser desfeita.</AlertDialogDescription>
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
