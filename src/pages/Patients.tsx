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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Upload, ExternalLink, Loader2, Eye } from 'lucide-react';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { createDocumentSignedUrl, DOCUMENTS_BUCKET } from '@/lib/storageDocuments';

interface Patient {
  id: string;
  full_name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  health_insurance_id: string | null;
  insurance_card_number: string | null;
  preferred_service_type: string | null;
  active: boolean;
  created_at: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  gender: string | null;
  document_url?: string | null;
}

interface HealthInsurance {
  id: string;
  name: string;
}

const emptyPatient = {
  full_name: '',
  cpf: '',
  phone: '',
  email: '',
  birth_date: '',
  health_insurance_id: '',
  insurance_card_number: '',
  preferred_service_type: 'particular' as 'particular' | 'convenio' | 'pacote',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  notes: '',
  gender: '',
  document_url: '',
  has_guardian: false,
  guardian_name: '',
  guardian_cpf: '',
  guardian_rg: '',
  guardian_relationship: '',
  guardian_phone: '',
  guardian_email: '',
};

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [insurances, setInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState(emptyPatient);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('patients').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Paciente removido com sucesso!' });
      fetchPatients();
    }
    setDeleteId(null);
  };

  useEffect(() => {
    fetchPatients();
    fetchInsurances();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('full_name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setPatients(data || []);
    setLoading(false);
  };

  const fetchInsurances = async () => {
    const { data } = await supabase
      .from('health_insurances')
      .select('id, name')
      .eq('active', true)
      .order('name');
    setInsurances(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { document_url, ...rest } = formData;
    const payload = {
      ...rest,
      health_insurance_id: rest.health_insurance_id || null,
      birth_date: rest.birth_date || null,
      document_url: document_url || null,
    };

    if (editingPatient) {
      const { error } = await supabase
        .from('patients')
        .update(payload)
        .eq('id', editingPatient.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      toast({ title: 'Paciente atualizado com sucesso!' });
    } else {
      const { error } = await supabase.from('patients').insert(payload);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      toast({ title: 'Paciente cadastrado com sucesso!' });
    }

    setDialogOpen(false);
    setEditingPatient(null);
    setFormData(emptyPatient);
    fetchPatients();
  };

  const openEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      full_name: patient.full_name,
      cpf: patient.cpf || '',
      phone: patient.phone || '',
      email: patient.email || '',
      birth_date: patient.birth_date || '',
      health_insurance_id: patient.health_insurance_id || '',
      insurance_card_number: patient.insurance_card_number || '',
      preferred_service_type: (patient.preferred_service_type || 'particular') as 'particular' | 'convenio' | 'pacote',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zip_code: patient.zip_code || '',
      notes: patient.notes || '',
      gender: patient.gender || '',
      document_url: patient.document_url || '',
      has_guardian: (patient as any).has_guardian ?? false,
      guardian_name: (patient as any).guardian_name || '',
      guardian_cpf: (patient as any).guardian_cpf || '',
      guardian_rg: (patient as any).guardian_rg || '',
      guardian_relationship: (patient as any).guardian_relationship || '',
      guardian_phone: (patient as any).guardian_phone || '',
      guardian_email: (patient as any).guardian_email || '',
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingPatient(null);
    setFormData(emptyPatient);
    setDialogOpen(true);
  };

  const handleOpenPatientDocument = async (storedValue: string) => {
    const { path, url, error } = await createDocumentSignedUrl(storedValue);

    console.info('[documents] Patient document URL generated', {
      bucket: DOCUMENTS_BUCKET,
      storedValue,
      path,
      url,
    });

    if (error || !url) {
      toast({ variant: 'destructive', title: 'Erro ao abrir documento', description: error || 'Não foi possível gerar o link do arquivo.' });
      return;
    }

    toast({ title: 'Link gerado', description: 'A URL do documento foi registrada no console.' });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf?.includes(search) ||
    p.phone?.includes(search)
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie os pacientes da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => setFormData({ ...formData, gender: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Atendimento</Label>
                  <Select
                    value={formData.preferred_service_type}
                    onValueChange={(v) => setFormData({ ...formData, preferred_service_type: v as 'particular' | 'convenio' | 'pacote' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="convenio">Convênio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Convênio</Label>
                  <Select
                    value={formData.health_insurance_id}
                    onValueChange={(v) => setFormData({ ...formData, health_insurance_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {insurances.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id}>
                          {ins.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nº Carteirinha</Label>
                  <Input
                    value={formData.insurance_card_number}
                    onChange={(e) => setFormData({ ...formData, insurance_card_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="has_guardian"
                      checked={formData.has_guardian}
                      onChange={(e) => setFormData({ ...formData, has_guardian: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="has_guardian" className="cursor-pointer font-semibold">
                      Paciente possui responsável
                    </Label>
                  </div>
                </div>
                {formData.has_guardian && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nome do Responsável *</Label>
                      <Input
                        required={formData.has_guardian}
                        value={formData.guardian_name}
                        onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF do Responsável</Label>
                      <Input
                        value={formData.guardian_cpf}
                        onChange={(e) => setFormData({ ...formData, guardian_cpf: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>RG do Responsável</Label>
                      <Input
                        value={formData.guardian_rg}
                        onChange={(e) => setFormData({ ...formData, guardian_rg: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Parentesco</Label>
                      <Select
                        value={formData.guardian_relationship}
                        onValueChange={(v) => setFormData({ ...formData, guardian_relationship: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pai">Pai</SelectItem>
                          <SelectItem value="mae">Mãe</SelectItem>
                          <SelectItem value="avo">Avô/Avó</SelectItem>
                          <SelectItem value="tutor">Tutor Legal</SelectItem>
                          <SelectItem value="conjuge">Cônjuge</SelectItem>
                          <SelectItem value="filho">Filho(a)</SelectItem>
                          <SelectItem value="irmao">Irmão(ã)</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone do Responsável</Label>
                      <Input
                        value={formData.guardian_phone}
                        onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Email do Responsável</Label>
                      <Input
                        type="email"
                        value={formData.guardian_email}
                        onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2 md:col-span-2 border-t pt-4">
                  <Label>Documentos (PDF/Imagem) — até 5 arquivos</Label>
                  <MultiFileUpload
                    value={formData.document_url}
                    onChange={(v) => setFormData((current) => ({ ...current, document_url: v }))}
                    folder="documentos_pacientes"
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
            placeholder="Buscar paciente..."
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
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Convênio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Nenhum paciente encontrado</TableCell>
              </TableRow>
            ) : (
              filtered.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.full_name}</TableCell>
                  <TableCell>{patient.cpf || '-'}</TableCell>
                  <TableCell>{patient.phone || '-'}</TableCell>
                  <TableCell className="capitalize">{patient.preferred_service_type || '-'}</TableCell>
                  <TableCell>
                    {insurances.find((i) => i.id === patient.health_insurance_id)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${patient.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {patient.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(patient)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(patient.id)} title="Remover" className="text-destructive hover:text-destructive">
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
            <AlertDialogDescription>Tem certeza que deseja remover este paciente? Esta ação não pode ser desfeita.</AlertDialogDescription>
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
