import { useState, useEffect } from 'react';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, MapPin, Heart, Save } from 'lucide-react';

interface PatientData {
  id: string;
  full_name: string;
  cpf: string | null;
  rg: string | null;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  health_insurance_id: string | null;
  insurance_card_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
}

interface HealthInsurance {
  id: string;
  name: string;
}

export default function PatientProfile() {
  const { patientProfile, user } = usePatientAuth();
  const { toast } = useToast();
  
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patientProfile?.id) {
      fetchPatientData();
      fetchHealthInsurances();
    }
  }, [patientProfile?.id]);

  const fetchPatientData = async () => {
    if (!patientProfile?.id) return;

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientProfile.id)
      .single();

    if (error) {
      console.error('Error fetching patient:', error);
    } else {
      setPatientData(data);
    }
    setLoading(false);
  };

  const fetchHealthInsurances = async () => {
    const { data } = await supabase
      .from('health_insurances')
      .select('id, name')
      .eq('active', true)
      .order('name');
    
    setHealthInsurances(data || []);
  };

  const handleSave = async () => {
    if (!patientData) return;

    setSaving(true);

    const { error } = await supabase
      .from('patients')
      .update({
        full_name: patientData.full_name,
        phone: patientData.phone,
        phone_secondary: patientData.phone_secondary,
        email: patientData.email,
        birth_date: patientData.birth_date,
        gender: patientData.gender,
        address: patientData.address,
        address_number: patientData.address_number,
        address_complement: patientData.address_complement,
        neighborhood: patientData.neighborhood,
        city: patientData.city,
        state: patientData.state,
        zip_code: patientData.zip_code,
        health_insurance_id: patientData.health_insurance_id,
        insurance_card_number: patientData.insurance_card_number,
        emergency_contact_name: patientData.emergency_contact_name,
        emergency_contact_phone: patientData.emergency_contact_phone,
      })
      .eq('id', patientData.id);

    setSaving(false);

    if (error) {
      console.error('Error updating patient:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar seus dados.',
      });
      return;
    }

    toast({
      title: 'Dados atualizados!',
      description: 'Suas informações foram salvas com sucesso.',
    });
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  if (loading || !patientData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Dados</h1>
          <p className="text-muted-foreground">
            Mantenha suas informações atualizadas
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={patientData.full_name}
                onChange={(e) => setPatientData({ ...patientData, full_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={patientData.cpf || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>RG</Label>
                <Input value={patientData.rg || ''} disabled className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={patientData.birth_date || ''}
                  onChange={(e) => setPatientData({ ...patientData, birth_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select
                  value={patientData.gender || ''}
                  onValueChange={(value) => setPatientData({ ...patientData, gender: value })}
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
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={patientData.email || ''}
                onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone Principal</Label>
                <Input
                  value={patientData.phone || ''}
                  onChange={(e) => setPatientData({ ...patientData, phone: formatPhone(e.target.value) })}
                  maxLength={15}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone Secundário</Label>
                <Input
                  value={patientData.phone_secondary || ''}
                  onChange={(e) => setPatientData({ ...patientData, phone_secondary: formatPhone(e.target.value) })}
                  maxLength={15}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-base font-semibold">Contato de Emergência</Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={patientData.emergency_contact_name || ''}
                    onChange={(e) => setPatientData({ ...patientData, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={patientData.emergency_contact_phone || ''}
                    onChange={(e) => setPatientData({ ...patientData, emergency_contact_phone: formatPhone(e.target.value) })}
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={patientData.address || ''}
                  onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={patientData.address_number || ''}
                  onChange={(e) => setPatientData({ ...patientData, address_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={patientData.address_complement || ''}
                  onChange={(e) => setPatientData({ ...patientData, address_complement: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={patientData.neighborhood || ''}
                  onChange={(e) => setPatientData({ ...patientData, neighborhood: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={patientData.city || ''}
                  onChange={(e) => setPatientData({ ...patientData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={patientData.state || ''}
                  onChange={(e) => setPatientData({ ...patientData, state: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={patientData.zip_code || ''}
                  onChange={(e) => setPatientData({ ...patientData, zip_code: formatCEP(e.target.value) })}
                  maxLength={9}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Insurance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Convênio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Convênio</Label>
              <Select
                value={patientData.health_insurance_id || 'none'}
                onValueChange={(value) => setPatientData({ 
                  ...patientData, 
                  health_insurance_id: value === 'none' ? null : value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Particular)</SelectItem>
                  {healthInsurances.map((ins) => (
                    <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {patientData.health_insurance_id && (
              <div className="space-y-2">
                <Label>Número da Carteirinha</Label>
                <Input
                  value={patientData.insurance_card_number || ''}
                  onChange={(e) => setPatientData({ ...patientData, insurance_card_number: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
