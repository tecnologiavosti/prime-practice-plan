import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Upload, Loader2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

type Role = 'administrador' | 'recepcao' | 'profissional' | 'financeiro' | 'paciente' | null;

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

interface ProfessionalData {
  crm: string;
  uf_crm: string;
  specialty_id: string | null;
}

interface PatientData {
  cpf: string;
  birth_date: string;
  health_insurance_id: string | null;
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [role, setRole] = useState<Role>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: null,
  });

  const [professional, setProfessional] = useState<ProfessionalData>({
    crm: '',
    uf_crm: '',
    specialty_id: null,
  });
  const [professionalId, setProfessionalId] = useState<string | null>(null);

  const [patient, setPatient] = useState<PatientData>({
    cpf: '',
    birth_date: '',
    health_insurance_id: null,
  });
  const [patientId, setPatientId] = useState<string | null>(null);

  const [specialties, setSpecialties] = useState<Array<{ id: string; name: string }>>([]);
  const [insurances, setInsurances] = useState<Array<{ id: string; name: string }>>([]);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      setUserId(user.id);

      // Roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = rolesData?.map((r) => r.role) ?? [];
      let detectedRole: Role = null;
      if (userRoles.includes('administrador')) detectedRole = 'administrador';
      else if (userRoles.includes('profissional')) detectedRole = 'profissional';
      else if (userRoles.includes('financeiro')) detectedRole = 'financeiro';
      else if (userRoles.includes('recepcao')) detectedRole = 'recepcao';
      else if (userRoles.includes('paciente')) detectedRole = 'paciente';
      setRole(detectedRole);

      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name ?? '',
          email: profileData.email ?? user.email ?? '',
          phone: profileData.phone ?? '',
          avatar_url: profileData.avatar_url ?? null,
        });
      } else {
        setProfile((p) => ({ ...p, email: user.email ?? '' }));
      }

      // Professional
      if (detectedRole === 'profissional') {
        const { data: profData } = await supabase
          .from('professionals')
          .select('id, crm, uf_crm, specialty_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profData) {
          setProfessionalId(profData.id);
          setProfessional({
            crm: profData.crm ?? '',
            uf_crm: profData.uf_crm ?? '',
            specialty_id: profData.specialty_id,
          });
        }
        const { data: specs } = await supabase.from('specialties').select('id, name').eq('active', true).order('name');
        setSpecialties(specs ?? []);
      }

      // Patient
      if (detectedRole === 'paciente') {
        const { data: patData } = await supabase
          .from('patients')
          .select('id, cpf, birth_date, health_insurance_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (patData) {
          setPatientId(patData.id);
          setPatient({
            cpf: patData.cpf ?? '',
            birth_date: patData.birth_date ?? '',
            health_insurance_id: patData.health_insurance_id,
          });
        }
        const { data: ins } = await supabase.from('health_insurances').select('id, name').eq('active', true).order('name');
        setInsurances(ins ?? []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('clinic-assets').getPublicUrl(path);
      setProfile((p) => ({ ...p, avatar_url: urlData.publicUrl }));

      // Save immediately
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', userId);
      toast.success('Foto atualizada!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    // Validate password
    if (newPassword || confirmPassword || currentPassword) {
      if (!newPassword || newPassword.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('A nova senha e a confirmação não coincidem.');
        return;
      }
    }

    setSaving(true);
    try {
      // Update profile
      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq('user_id', userId);
      if (profErr) throw profErr;

      // Update role-specific table
      if (role === 'profissional' && professionalId) {
        const { error } = await supabase
          .from('professionals')
          .update({
            full_name: profile.full_name,
            phone: profile.phone,
            crm: professional.crm || null,
            uf_crm: professional.uf_crm || null,
            specialty_id: professional.specialty_id,
          })
          .eq('id', professionalId);
        if (error) throw error;
      }

      if (role === 'paciente' && patientId) {
        const { error } = await supabase
          .from('patients')
          .update({
            full_name: profile.full_name,
            phone: profile.phone,
            birth_date: patient.birth_date || null,
            health_insurance_id: patient.health_insurance_id,
          })
          .eq('id', patientId);
        if (error) throw error;
      }

      // Update password if filled
      if (newPassword) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwErr) throw pwErr;
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      toast.success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="container max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas informações pessoais e credenciais de acesso.
        </p>
      </div>

      {/* Foto e identidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identidade</CardTitle>
          <CardDescription>Sua foto e dados de identificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
              <AvatarFallback className="text-lg">
                {initials === 'U' ? <UserIcon className="h-8 w-8" /> : initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" />Alterar foto</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">PNG ou JPG, até 5MB.</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-muted-foreground" />
                E-mail
              </Label>
              <Input id="email" value={profile.email} readOnly className="bg-muted" />
            </div>
            {role === 'paciente' && (
              <div className="space-y-2">
                <Label htmlFor="cpf" className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  CPF
                </Label>
                <Input id="cpf" value={patient.cpf} readOnly className="bg-muted" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Para alterar dados de identidade, contate o suporte.
          </p>
        </CardContent>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Pessoais</CardTitle>
          <CardDescription>Informações que você pode atualizar a qualquer momento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(00) 00000-0000"
                maxLength={20}
              />
            </div>
          </div>

          {role === 'profissional' && (
            <>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    value={professional.crm}
                    onChange={(e) => setProfessional({ ...professional, crm: e.target.value })}
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf_crm">UF</Label>
                  <Input
                    id="uf_crm"
                    value={professional.uf_crm}
                    onChange={(e) => setProfessional({ ...professional, uf_crm: e.target.value.toUpperCase() })}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Select
                    value={professional.specialty_id ?? undefined}
                    onValueChange={(v) => setProfessional({ ...professional, specialty_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {role === 'paciente' && (
            <>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={patient.birth_date}
                    onChange={(e) => setPatient({ ...patient, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Convênio</Label>
                  <Select
                    value={patient.health_insurance_id ?? 'none'}
                    onValueChange={(v) => setPatient({ ...patient, health_insurance_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Particular / Nenhum</SelectItem>
                      {insurances.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segurança</CardTitle>
          <CardDescription>Altere sua senha de acesso (deixe em branco para manter a atual)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current_password">Senha Atual</Label>
              <Input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova Senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">A nova senha deve ter ao menos 6 caracteres.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-0 bg-background/80 backdrop-blur py-3 -mx-4 px-4 md:-mx-6 md:px-6 border-t">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
          ) : (
            'Salvar Alterações'
          )}
        </Button>
      </div>
    </div>
  );
}
