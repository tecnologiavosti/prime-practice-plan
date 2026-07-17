import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Wallet, CheckCircle2, Clock, FilePlus, Users, Upload, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { slugify } from '@/lib/slug';

export default function ProfessionalDashboard() {
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
  });

  const [profId, setProfId] = useState<string | null>(null);
  const [profName, setProfName] = useState('');
  const [profile, setProfile] = useState({
    photo_url: '' as string,
    landing_bio: '',
    landing_about: '',
    landing_curriculum: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekAhead = new Date();
      weekAhead.setDate(weekAhead.getDate() + 7);
      const weekEnd = format(weekAhead, 'yyyy-MM-dd');

      const [{ count: todayCount }, { count: weekCount }, { data: payouts }] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('appointment_date', today)
          .lte('appointment_date', weekEnd),
        supabase.from('professional_payouts').select('payout_amount, status'),
      ]);

      const pending = (payouts || []).filter((p) => p.status === 'pendente').reduce((s, p) => s + Number(p.payout_amount), 0);
      const paid = (payouts || []).filter((p) => p.status === 'pago').reduce((s, p) => s + Number(p.payout_amount), 0);

      setStats({
        todayCount: todayCount || 0,
        weekCount: weekCount || 0,
        pendingPayouts: pending,
        paidPayouts: paid,
      });
    })();

    (async () => {
      setLoadingProfile(true);
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) { setLoadingProfile(false); return; }
      const { data } = await supabase
        .from('professionals')
        .select('id, full_name, photo_url, landing_bio, landing_about, landing_curriculum')
        .eq('user_id', userRes.user.id)
        .maybeSingle();
      if (data) {
        setProfId(data.id);
        setProfName(data.full_name || '');
        setProfile({
          photo_url: data.photo_url ?? '',
          landing_bio: data.landing_bio ?? '',
          landing_about: data.landing_about ?? '',
          landing_curriculum: data.landing_curriculum ?? '',
        });
      }
      setLoadingProfile(false);
    })();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    if (!original) return;
    setUploading(true);
    try {
      let file: File = original;
      try {
        const { enhanceProfilePhoto } = await import('@/lib/imageEnhance');
        file = await enhanceProfilePhoto(original);
      } catch {}
      const ext = file.name.split('.').pop();
      const path = `professionals/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('clinic-assets')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('clinic-assets').getPublicUrl(path);
      setProfile((p) => ({ ...p, photo_url: pub.publicUrl }));
      toast.success('Foto enviada! Clique em Salvar para aplicar.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          photo_url: profile.photo_url || null,
          landing_bio: profile.landing_bio || null,
          landing_about: profile.landing_about || null,
          landing_curriculum: profile.landing_curriculum || null,
        })
        .eq('id', profId);
      if (error) throw error;
      toast.success('Perfil atualizado! As alterações já aparecem no site.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const publicSlug = profName ? slugify(profName) : '';

  const cards = [
    { label: 'Atendimentos hoje', value: stats.todayCount, icon: Calendar },
    { label: 'Próximos 7 dias', value: stats.weekCount, icon: Clock },
    { label: 'A receber', value: `R$ ${stats.pendingPayouts.toFixed(2)}`, icon: Wallet },
    { label: 'Total pago', value: `R$ ${stats.paidPayouts.toFixed(2)}`, icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos seus atendimentos e repasses</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/professional/pacientes"><Users className="h-4 w-4" />Pacientes</Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/professional/pacientes"><FilePlus className="h-4 w-4" />Novo Prontuário</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Meu perfil público</CardTitle>
            <CardDescription>Estas informações aparecem na home do site e na sua landing page.</CardDescription>
          </div>
          {publicSlug && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a href={`/equipe/${publicSlug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> Ver minha página
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingProfile ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : !profId ? (
            <p className="text-sm text-muted-foreground">
              Seu cadastro de profissional ainda não está vinculado. Contate o administrador.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt="Foto"
                    className="h-20 w-20 rounded-full object-cover object-top border"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full border bg-muted" />
                )}
                <div>
                  <input
                    id="prof-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('prof-photo-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                    ) : (
                      <><Upload className="mr-2 h-4 w-4" />Alterar foto</>
                    )}
                  </Button>
                  {profile.photo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => setProfile((p) => ({ ...p, photo_url: '' }))}
                    >
                      Remover
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">A foto é otimizada automaticamente.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="landing_bio">Mini bio</Label>
                <Input
                  id="landing_bio"
                  value={profile.landing_bio}
                  onChange={(e) => setProfile({ ...profile, landing_bio: e.target.value })}
                  placeholder="Frase curta que aparece no card da home"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  Aparece abaixo do seu nome no card da home. Até 160 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="landing_about">Sobre o profissional</Label>
                <Textarea
                  id="landing_about"
                  rows={5}
                  value={profile.landing_about}
                  onChange={(e) => setProfile({ ...profile, landing_about: e.target.value })}
                  placeholder="Apresentação completa exibida na sua landing page"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landing_curriculum">Histórico curricular</Label>
                <Textarea
                  id="landing_curriculum"
                  rows={6}
                  value={profile.landing_curriculum}
                  onChange={(e) => setProfile({ ...profile, landing_curriculum: e.target.value })}
                  placeholder="Formação, especializações, experiência..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                  ) : (
                    'Salvar alterações'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
