import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Search, Edit, Building2, Link2, DollarSign } from 'lucide-react';

interface Administrator {
  id: string;
  name: string;
  cnpj: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  active: boolean;
}

interface HealthInsurance {
  id: string;
  name: string;
  code: string | null;
  administrator_id: string | null;
  billing_rate: number | null;
  active: boolean;
}

interface InsuranceWithValue {
  id: string;
  selected: boolean;
  billing_rate: number;
}

const emptyAdministrator = {
  name: '',
  cnpj: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
};

export default function Administrators() {
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [insuranceDialogOpen, setInsuranceDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Administrator | null>(null);
  const [insuranceSettings, setInsuranceSettings] = useState<Map<string, InsuranceWithValue>>(new Map());
  const [formData, setFormData] = useState(emptyAdministrator);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAdministrators(), fetchHealthInsurances()]);
    setLoading(false);
  };

  const fetchAdministrators = async () => {
    const { data, error } = await supabase
      .from('administrators')
      .select('*')
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setAdministrators(data || []);
  };

  const fetchHealthInsurances = async () => {
    const { data, error } = await supabase
      .from('health_insurances')
      .select('id, name, code, administrator_id, billing_rate, active')
      .eq('active', true)
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setHealthInsurances(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAdmin) {
      const { error } = await supabase
        .from('administrators')
        .update(formData)
        .eq('id', editingAdmin.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      toast({ title: 'Administradora atualizada com sucesso!' });
    } else {
      const { error } = await supabase.from('administrators').insert(formData);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      toast({ title: 'Administradora cadastrada com sucesso!' });
    }

    setDialogOpen(false);
    setEditingAdmin(null);
    setFormData(emptyAdministrator);
    fetchData();
  };

  const openEdit = (admin: Administrator) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      cnpj: admin.cnpj || '',
      contact_name: admin.contact_name || '',
      contact_phone: admin.contact_phone || '',
      contact_email: admin.contact_email || '',
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingAdmin(null);
    setFormData(emptyAdministrator);
    setDialogOpen(true);
  };

  const openInsuranceDialog = (admin: Administrator) => {
    setSelectedAdmin(admin);
    
    // Initialize settings for all insurances
    const settings = new Map<string, InsuranceWithValue>();
    healthInsurances.forEach(ins => {
      settings.set(ins.id, {
        id: ins.id,
        selected: ins.administrator_id === admin.id,
        billing_rate: ins.administrator_id === admin.id ? Number(ins.billing_rate || 0) : 0,
      });
    });
    setInsuranceSettings(settings);
    setInsuranceDialogOpen(true);
  };

  const toggleInsurance = (insuranceId: string) => {
    setInsuranceSettings(prev => {
      const newSettings = new Map(prev);
      const current = newSettings.get(insuranceId);
      if (current) {
        newSettings.set(insuranceId, {
          ...current,
          selected: !current.selected,
        });
      }
      return newSettings;
    });
  };

  const updateBillingRate = (insuranceId: string, value: number) => {
    setInsuranceSettings(prev => {
      const newSettings = new Map(prev);
      const current = newSettings.get(insuranceId);
      if (current) {
        newSettings.set(insuranceId, {
          ...current,
          billing_rate: value,
        });
      }
      return newSettings;
    });
  };

  const handleSaveInsurances = async () => {
    if (!selectedAdmin) return;

    // First, unlink all insurances from this admin
    const { error: unlinkError } = await supabase
      .from('health_insurances')
      .update({ administrator_id: null, billing_rate: 0 })
      .eq('administrator_id', selectedAdmin.id);

    if (unlinkError) {
      toast({ variant: 'destructive', title: 'Erro', description: unlinkError.message });
      return;
    }

    // Then, update each selected insurance with its billing rate
    const selectedInsurances = Array.from(insuranceSettings.entries())
      .filter(([_, settings]) => settings.selected);

    for (const [insuranceId, settings] of selectedInsurances) {
      const { error } = await supabase
        .from('health_insurances')
        .update({ 
          administrator_id: selectedAdmin.id,
          billing_rate: settings.billing_rate 
        })
        .eq('id', insuranceId);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
    }

    toast({ title: 'Convênios e valores salvos com sucesso!' });
    setInsuranceDialogOpen(false);
    setSelectedAdmin(null);
    fetchHealthInsurances();
  };

  const getLinkedInsurances = (adminId: string) => {
    return healthInsurances.filter(ins => ins.administrator_id === adminId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filtered = administrators.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.cnpj?.includes(search)
  );

  const getSelectedCount = () => {
    return Array.from(insuranceSettings.values()).filter(s => s.selected).length;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Administradoras</h1>
          <p className="text-muted-foreground">Gerencie as administradoras de convênios</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Administradora
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? 'Editar Administradora' : 'Nova Administradora'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contato</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
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
            placeholder="Buscar administradora..."
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
              <TableHead>CNPJ</TableHead>
              <TableHead>Convênios Vinculados</TableHead>
              <TableHead>Contato</TableHead>
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
                <TableCell colSpan={6} className="text-center">Nenhuma administradora encontrada</TableCell>
              </TableRow>
            ) : (
              filtered.map((admin) => {
                const linkedInsurances = getLinkedInsurances(admin.id);
                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {admin.name}
                      </div>
                    </TableCell>
                    <TableCell>{admin.cnpj || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {linkedInsurances.length === 0 ? (
                          <span className="text-muted-foreground text-sm">Nenhum convênio</span>
                        ) : (
                          linkedInsurances.slice(0, 3).map(ins => (
                            <Badge key={ins.id} variant="secondary" className="text-xs">
                              {ins.name}
                              {ins.billing_rate && Number(ins.billing_rate) > 0 && (
                                <span className="ml-1 text-muted-foreground">
                                  ({formatCurrency(Number(ins.billing_rate))})
                                </span>
                              )}
                            </Badge>
                          ))
                        )}
                        {linkedInsurances.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{linkedInsurances.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{admin.contact_name || '-'}</p>
                        {admin.contact_phone && (
                          <p className="text-muted-foreground">{admin.contact_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.active ? 'default' : 'destructive'}>
                        {admin.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openInsuranceDialog(admin)}
                          title="Gerenciar Convênios e Valores"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEdit(admin)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Dialog para gerenciar convênios e valores */}
      <Dialog open={insuranceDialogOpen} onOpenChange={setInsuranceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Convênios e Valores - {selectedAdmin?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione os convênios e defina o valor de referência para cada um:
            </p>
            <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-lg p-3">
              {healthInsurances.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum convênio cadastrado
                </p>
              ) : (
                healthInsurances.map(insurance => {
                  const settings = insuranceSettings.get(insurance.id);
                  const isLinkedToOther = insurance.administrator_id && 
                    insurance.administrator_id !== selectedAdmin?.id;
                  const otherAdmin = isLinkedToOther 
                    ? administrators.find(a => a.id === insurance.administrator_id)
                    : null;

                  return (
                    <div
                      key={insurance.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        settings?.selected
                          ? 'bg-primary/5 border-primary/30'
                          : 'hover:bg-muted/50'
                      } ${isLinkedToOther ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            id={insurance.id}
                            checked={settings?.selected || false}
                            onCheckedChange={() => toggleInsurance(insurance.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={insurance.id}
                              className="cursor-pointer block"
                            >
                              <p className="font-medium">{insurance.name}</p>
                              {insurance.code && (
                                <p className="text-xs text-muted-foreground">
                                  Código: {insurance.code}
                                </p>
                              )}
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isLinkedToOther && (
                            <Badge variant="outline" className="text-xs">
                              {otherAdmin?.name}
                            </Badge>
                          )}
                          
                          {settings?.selected && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Valor"
                                value={settings.billing_rate || ''}
                                onChange={(e) => updateBillingRate(insurance.id, parseFloat(e.target.value) || 0)}
                                className="w-28 h-8"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {getSelectedCount()} convênio(s) selecionado(s)
              </p>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setInsuranceDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveInsurances}>
                  Salvar Convênios e Valores
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
