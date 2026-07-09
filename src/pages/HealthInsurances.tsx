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
import { Plus, Search, Edit, Trash2, Link2, ShieldCheck } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useRealtime } from '@/hooks/useRealtime';

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
  const [selectedAdminIds, setSelectedAdminIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchInsurances();
    fetchAdministrators();
  }, []);
  useRealtime(['health_insurances','insurance_administrators_map'], fetchInsurances);

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

  const saveAdminLinks = async (insuranceId: string) => {
    const { error: delErr } = await supabase
      .from('insurance_administrators_map')
      .delete()
      .eq('insurance_id', insuranceId);
    if (delErr) throw delErr;

    if (selectedAdminIds.size > 0) {
      const links = Array.from(selectedAdminIds).map((aid) => ({
        insurance_id: insuranceId,
        administrator_id: aid,
      }));
      const { error } = await supabase.from('insurance_administrators_map').insert(links);
      if (error) throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let insuranceId = editingInsurance?.id;
      if (editingInsurance) {
        const { error } = await supabase
          .from('health_insurances')
          .update(formData)
          .eq('id', editingInsurance.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('health_insurances')
          .insert(formData)
          .select('id')
          .single();
        if (error) throw error;
        insuranceId = data.id;
      }
      if (insuranceId) await saveAdminLinks(insuranceId);

      toast({ title: editingInsurance ? 'Convênio atualizado!' : 'Convênio cadastrado!' });
      setDialogOpen(false);
      setEditingInsurance(null);
      setFormData(emptyInsurance);
      setSelectedAdminIds(new Set());
      fetchInsurances();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
  };

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
    });
    setSelectedAdminIds(new Set(insurance.administrator_ids));
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingInsurance(null);
    setFormData(emptyInsurance);
    setSelectedAdminIds(new Set());
    setDialogOpen(true);
  };

  const toggleAdmin = (adminId: string) => {
    setSelectedAdminIds((prev) => {
      const next = new Set(prev);
      if (next.has(adminId)) next.delete(adminId);
      else next.add(adminId);
      return next;
    });
  };

  const filtered = insurances.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.code?.includes(search)
  );

  const getLinkedAdmins = (ids: string[]) =>
    ids.map((id) => administrators.find((a) => a.id === id)).filter(Boolean) as Administrator[];

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
                <div className="space-y-2 md:col-span-2">
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
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Administradoras</Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedAdminIds.size} selecionada(s)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Marque as administradoras que operam este convênio. Os valores são definidos na tela da administradora.
                </p>
                <div className="max-h-[280px] overflow-y-auto space-y-2 border rounded-lg p-3">
                  {administrators.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Nenhuma administradora cadastrada
                    </p>
                  ) : (
                    administrators.map((adm) => {
                      const checked = selectedAdminIds.has(adm.id);
                      return (
                        <div
                          key={adm.id}
                          className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                            checked ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            id={`form-adm-${adm.id}`}
                            checked={checked}
                            onCheckedChange={() => toggleAdmin(adm.id)}
                          />
                          <label
                            htmlFor={`form-adm-${adm.id}`}
                            className="cursor-pointer flex-1 font-medium text-sm"
                          >
                            {adm.name}
                          </label>
                        </div>
                      );
                    })
                  )}
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
              <TableHead>Administradoras Vinculadas</TableHead>
              <TableHead>Registro ANS</TableHead>
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
                <TableCell colSpan={6} className="text-center">Nenhum convênio encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((ins) => {
                const linked = getLinkedAdmins(ins.administrator_ids);
                return (
                  <TableRow key={ins.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        {ins.name}
                      </div>
                    </TableCell>
                    <TableCell>{ins.code || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {linked.length === 0 ? (
                          <span className="text-muted-foreground text-sm">Nenhuma administradora</span>
                        ) : (
                          linked.slice(0, 3).map((a) => (
                            <Badge key={a.id} variant="secondary" className="text-xs">
                              {a.name}
                            </Badge>
                          ))
                        )}
                        {linked.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{linked.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{ins.ans_registration || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={ins.active ? 'default' : 'destructive'}>
                        {ins.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(ins)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(ins.id)}
                          title="Remover"
                          className="text-destructive hover:text-destructive"
                        >
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
