import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useClinicSettings, refreshClinicSettings } from '@/hooks/useClinicSettings';
import { Upload, Trash2, Building2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function ClinicProfile() {
  const { hasRole, loading: authLoading } = useAuth();
  const { settings, loading } = useClinicSettings();
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome_fantasia: '', razao_social: '', cnpj: '',
    endereco_completo: '', telefone: '', email_contato: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        nome_fantasia: settings.nome_fantasia || '',
        razao_social: settings.razao_social || '',
        cnpj: settings.cnpj || '',
        endereco_completo: settings.endereco_completo || '',
        telefone: settings.telefone || '',
        email_contato: settings.email_contato || '',
      });
    }
  }, [settings]);

  if (authLoading) return null;
  if (!hasRole('administrador')) return <Navigate to="/admin" replace />;

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from('clinic_settings')
      .update(form)
      .eq('id', settings.id);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
      return;
    }
    await refreshClinicSettings();
    toast({ title: 'Perfil atualizado com sucesso' });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `logo-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('clinic-assets')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setUploading(false);
      toast({ variant: 'destructive', title: 'Erro no upload', description: upErr.message });
      return;
    }

    const { data: pub } = supabase.storage.from('clinic-assets').getPublicUrl(path);
    const { error: updErr } = await supabase
      .from('clinic_settings')
      .update({ logo_url: pub.publicUrl })
      .eq('id', settings.id);

    setUploading(false);
    if (updErr) {
      toast({ variant: 'destructive', title: 'Erro ao salvar logo', description: updErr.message });
      return;
    }
    await refreshClinicSettings();
    toast({ title: 'Logo atualizada' });
    e.target.value = '';
  };

  const handleRemoveLogo = async () => {
    if (!settings) return;
    const { error } = await supabase
      .from('clinic_settings')
      .update({ logo_url: null })
      .eq('id', settings.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    await refreshClinicSettings();
    toast({ title: 'Logo removida' });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil da Clínica</h1>
        <p className="text-sm text-muted-foreground">
          Estas informações são utilizadas em todo o sistema (login, recibos, guias).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logomarca</CardTitle>
          <CardDescription>Aparece no login, sidebar e documentos PDF.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="w-32 h-32 border rounded-md flex items-center justify-center bg-muted/30 overflow-hidden">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <Building2 className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              <Button type="button" variant="outline" disabled={uploading} asChild>
                <span className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Enviando...' : 'Enviar nova logo'}
                </span>
              </Button>
            </label>
            {settings?.logo_url && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Remover logo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover logo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O sistema voltará a usar o ícone padrão até que uma nova logo seja enviada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveLogo}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da Clínica</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Nome Fantasia</Label>
            <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Razão Social</Label>
            <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Endereço Completo</Label>
            <Input value={form.endereco_completo} onChange={(e) => setForm({ ...form, endereco_completo: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email de Contato</Label>
            <Input type="email" value={form.email_contato} onChange={(e) => setForm({ ...form, email_contato: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
