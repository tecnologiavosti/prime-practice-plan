import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { fetchSiteContent, saveSiteContent } from '@/hooks/useSiteContent';
import { useClinicSettings, refreshClinicSettings } from '@/hooks/useClinicSettings';
import { Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Save, Globe } from 'lucide-react';

// ---------- Defaults (mirror LandingPage.tsx) ----------
const DEFAULTS = {
  hero: {
    badge: 'Referência em saúde mental em Brasília',
    title_prefix: 'Cuidar da sua ',
    title_highlight: 'saúde mental',
    title_suffix: ' pode começar hoje.',
    subtitle:
      'Atendimento especializado em Psicologia, Psiquiatria, Nutrição e Terapias Integradas para crianças, adolescentes, adultos e casais.',
    cta_whatsapp_text: 'Agende agora',
    cta_whatsapp_msg: 'Olá! Gostaria de agendar uma consulta na Clínica Pacem.',
  },
  sobre: {
    title: 'Sobre a Clínica',
    text: 'Somos uma clínica multidisciplinar em Brasília, dedicada ao cuidado integral da saúde mental.',
    image_url: '',
    bullets: ['Equipe especializada', 'Ambiente acolhedor', 'Presencial e online'] as string[],
  },
  especialidades: [
    { slug: 'psicologia', icon: 'Brain', title: 'Psicologia', desc: 'Acompanhamento psicoterapêutico individual para adultos, adolescentes e crianças.', long: '' },
    { slug: 'psiquiatria', icon: 'Stethoscope', title: 'Psiquiatria', desc: 'Avaliação e tratamento medicamentoso.', long: '' },
    { slug: 'nutricao', icon: 'Apple', title: 'Nutrição', desc: 'Nutrição comportamental integrada à saúde mental.', long: '' },
    { slug: 'fonoaudiologia', icon: 'MessageSquare', title: 'Fonoaudiologia', desc: 'Terapia para linguagem, fala e voz.', long: '' },
    { slug: 'clinico-geral', icon: 'HeartPulse', title: 'Clínico Geral', desc: 'Cuidado clínico preventivo e acompanhamento de saúde.', long: '' },
    { slug: 'rn1', icon: 'Briefcase', title: 'RN-1', desc: 'Cuidado completo para colaboradores com acesso a Psiquiatria, Psicologia, Nutrição e Personal Trainer.', long: '' },
  ] as Array<{ slug: string; icon: string; title: string; desc: string; long: string }>,
  diferenciais: [
    { icon: 'Users', title: 'Equipe multidisciplinar', desc: 'Psicólogos, psiquiatras, nutricionistas e fonoaudiólogos.' },
    { icon: 'Heart', title: 'Atendimento humanizado', desc: 'Acolhimento real, sem julgamentos.' },
    { icon: 'GraduationCap', title: 'Profissionais especializados', desc: 'Formações reconhecidas.' },
    { icon: 'MapPin', title: 'Localização estratégica', desc: 'Asa Norte — Brasília.' },
  ] as Array<{ icon: string; title: string; desc: string }>,
  equipe: {
    title: 'Nossos profissionais',
    subtitle: 'Uma equipe cuidadosamente selecionada.',
  },
  depoimentos: [
    { nome: 'Mariana S.', texto: 'Encontrei na Clínica Pacem um espaço seguro.', estrelas: 5 },
    { nome: 'Carlos H.', texto: 'Atendimento humano de verdade.', estrelas: 5 },
  ] as Array<{ nome: string; texto: string; estrelas: number }>,
  faq: [
    { q: 'Como saber se preciso de terapia?', a: 'Se algo está afetando sua qualidade de vida, vale conversar com um profissional.' },
    { q: 'Terapia online funciona?', a: 'Sim. Estudos mostram eficácia equivalente à presencial.' },
  ] as Array<{ q: string; a: string }>,
  ctas: {
    whatsapp_number: '5561981823984',
    default_message: 'Olá! Gostaria de agendar uma consulta na Clínica Pacem.',
    button_label: 'Agende agora',
  },
  contato: {
    endereco: 'SGAN 605, Asa Norte — Brasília/DF',
    telefone: '(61) 98182-3984',
    email: 'contato@clinicapacem.com.br',
    horario: 'Seg a Sex, 8h às 20h · Sáb 8h às 14h',
    instagram: '',
    facebook: '',
    maps_url: '',
  },
  sections: {
    hero: true,
    especialidades: true,
    diferenciais: true,
    equipe: true,
    depoimentos: true,
    faq: true,
    blog: true,
    cta_final: true,
  },
  privacidade: {
    content: '',
  },
};

// Small helpers
function ArrayEditor<T extends Record<string, any>>({
  items,
  onChange,
  fields,
  labelKey,
  addLabel = 'Adicionar item',
}: {
  items: T[];
  onChange: (n: T[]) => void;
  fields: Array<{ key: keyof T; label: string; type?: 'text' | 'textarea' | 'number'; placeholder?: string }>;
  labelKey?: keyof T;
  addLabel?: string;
}) {
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    onChange(copy);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const update = (idx: number, key: keyof T, val: any) => {
    const copy = [...items];
    copy[idx] = { ...copy[idx], [key]: val };
    onChange(copy);
  };
  const add = () => {
    const empty: any = {};
    fields.forEach((f) => (empty[f.key] = f.type === 'number' ? 0 : ''));
    onChange([...items, empty]);
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <Card key={idx} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">
              {labelKey ? String(item[labelKey] || `Item ${idx + 1}`) : `Item ${idx + 1}`}
            </div>
            <div className="flex gap-1">
              <Button type="button" size="icon" variant="ghost" onClick={() => move(idx, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => move(idx, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={() => remove(idx)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((f) => (
              <div key={String(f.key)} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    value={String(item[f.key] ?? '')}
                    onChange={(e) => update(idx, f.key, e.target.value)}
                    rows={3}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={String(item[f.key] ?? '')}
                    onChange={(e) => update(idx, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={add}>
        <Plus className="h-4 w-4 mr-1" /> {addLabel}
      </Button>
    </div>
  );
}

function useContent<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const v = await fetchSiteContent<T>(key);
      if (v !== null) setValue(v);
      setLoading(false);
    })();
  }, [key]);
  return { value, setValue, loading };
}

function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} disabled={saving}>
        <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  );
}

// ---------- Tab bodies ----------
function IdentidadeTab() {
  const { settings } = useClinicSettings();
  const [form, setForm] = useState({
    nome_fantasia: '',
    logo_url: '',
    telefone: '',
    email_contato: '',
    endereco_completo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        nome_fantasia: settings.nome_fantasia || '',
        logo_url: settings.logo_url || '',
        telefone: settings.telefone || '',
        email_contato: settings.email_contato || '',
        endereco_completo: settings.endereco_completo || '',
      });
    }
  }, [settings]);

  const upload = async (file: File) => {
    const path = `logos/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('clinic-assets').upload(path, file, { upsert: true });
    if (error) return toast.error('Erro ao enviar imagem');
    const { data } = supabase.storage.from('clinic-assets').getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('clinic_settings')
      .update({ ...form })
      .eq('id', settings?.id ?? '');
    if (error) toast.error('Erro ao salvar');
    else {
      await refreshClinicSettings();
      toast.success('Identidade atualizada');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Logo da clínica</Label>
        <div className="flex items-center gap-3 mt-1">
          {form.logo_url && <img src={form.logo_url} alt="logo" className="h-14 w-auto rounded border" />}
          <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
      </div>
      <div>
        <Label>Nome</Label>
        <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Telefone</Label>
          <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input value={form.email_contato} onChange={(e) => setForm({ ...form, email_contato: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Endereço</Label>
        <Input value={form.endereco_completo} onChange={(e) => setForm({ ...form, endereco_completo: e.target.value })} />
      </div>
      <SaveBar onSave={save} saving={saving} />
    </div>
  );
}

function GenericTab<T>({
  contentKey,
  fallback,
  render,
}: {
  contentKey: string;
  fallback: T;
  render: (value: T, setValue: (v: T) => void) => React.ReactNode;
}) {
  const { value, setValue, loading } = useContent<T>(contentKey, fallback);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await saveSiteContent(contentKey, value);
      toast.success('Alterações salvas');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>;
  return (
    <div className="space-y-4">
      {render(value, setValue)}
      <SaveBar onSave={save} saving={saving} />
    </div>
  );
}

function HeroTab() {
  return (
    <GenericTab
      contentKey="hero"
      fallback={DEFAULTS.hero}
      render={(v, set) => (
        <div className="space-y-3">
          <div>
            <Label>Badge (texto pequeno acima do título)</Label>
            <Input value={v.badge} onChange={(e) => set({ ...v, badge: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><Label>Título — início</Label><Input value={v.title_prefix} onChange={(e) => set({ ...v, title_prefix: e.target.value })} /></div>
            <div><Label>Título — destaque</Label><Input value={v.title_highlight} onChange={(e) => set({ ...v, title_highlight: e.target.value })} /></div>
            <div><Label>Título — fim</Label><Input value={v.title_suffix} onChange={(e) => set({ ...v, title_suffix: e.target.value })} /></div>
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Textarea rows={3} value={v.subtitle} onChange={(e) => set({ ...v, subtitle: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Texto do botão WhatsApp</Label><Input value={v.cta_whatsapp_text} onChange={(e) => set({ ...v, cta_whatsapp_text: e.target.value })} /></div>
            <div><Label>Mensagem pré-preenchida</Label><Input value={v.cta_whatsapp_msg} onChange={(e) => set({ ...v, cta_whatsapp_msg: e.target.value })} /></div>
          </div>
        </div>
      )}
    />
  );
}

function SobreTab() {
  return (
    <GenericTab
      contentKey="sobre"
      fallback={DEFAULTS.sobre}
      render={(v, set) => (
        <div className="space-y-3">
          <div><Label>Título</Label><Input value={v.title} onChange={(e) => set({ ...v, title: e.target.value })} /></div>
          <div><Label>Texto</Label><Textarea rows={5} value={v.text} onChange={(e) => set({ ...v, text: e.target.value })} /></div>
          <div><Label>URL da imagem</Label><Input value={v.image_url} onChange={(e) => set({ ...v, image_url: e.target.value })} /></div>
          <div>
            <Label>Destaques (um por linha)</Label>
            <Textarea rows={4} value={(v.bullets || []).join('\n')} onChange={(e) => set({ ...v, bullets: e.target.value.split('\n').filter(Boolean) })} />
          </div>
        </div>
      )}
    />
  );
}

function EspecialidadesTab() {
  return (
    <GenericTab
      contentKey="especialidades"
      fallback={DEFAULTS.especialidades as any}
      render={(v: any[], set) => (
        <ArrayEditor
          items={v}
          onChange={set}
          labelKey="title"
          addLabel="Adicionar especialidade"
          fields={[
            { key: 'title', label: 'Título' },
            { key: 'slug', label: 'Slug (URL)' },
            { key: 'icon', label: 'Ícone (nome lucide)', placeholder: 'ex: Brain, Stethoscope' },
            { key: 'desc', label: 'Descrição curta', type: 'textarea' },
            { key: 'long', label: 'Descrição longa (página interna)', type: 'textarea' },
          ]}
        />
      )}
    />
  );
}

function DiferenciaisTab() {
  return (
    <GenericTab
      contentKey="diferenciais"
      fallback={DEFAULTS.diferenciais as any}
      render={(v: any[], set) => (
        <ArrayEditor
          items={v}
          onChange={set}
          labelKey="title"
          fields={[
            { key: 'icon', label: 'Ícone (nome lucide)' },
            { key: 'title', label: 'Título' },
            { key: 'desc', label: 'Descrição', type: 'textarea' },
          ]}
        />
      )}
    />
  );
}

function EquipeTab() {
  const [profs, setProfs] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('professionals')
        .select('id, full_name, show_on_landing, landing_order, photo_url')
        .eq('active', true)
        .order('full_name');
      setProfs(data || []);
    })();
  }, []);

  const toggle = async (id: string, show: boolean) => {
    await supabase.from('professionals').update({ show_on_landing: show }).eq('id', id);
    setProfs((p) => p.map((x) => (x.id === id ? { ...x, show_on_landing: show } : x)));
    toast.success('Atualizado');
  };
  const setOrder = async (id: string, order: number) => {
    await supabase.from('professionals').update({ landing_order: order }).eq('id', id);
    setProfs((p) => p.map((x) => (x.id === id ? { ...x, landing_order: order } : x)));
  };

  return (
    <div className="space-y-4">
      <GenericTab
        contentKey="equipe"
        fallback={DEFAULTS.equipe}
        render={(v, set) => (
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Título da seção</Label><Input value={v.title} onChange={(e) => set({ ...v, title: e.target.value })} /></div>
            <div><Label>Subtítulo</Label><Input value={v.subtitle} onChange={(e) => set({ ...v, subtitle: e.target.value })} /></div>
          </div>
        )}
      />
      <Card className="p-4">
        <div className="text-sm font-medium mb-3">Profissionais exibidos na home</div>
        <div className="space-y-2">
          {profs.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border rounded p-2">
              {p.photo_url ? <img src={p.photo_url} className="h-10 w-10 rounded-full object-cover" alt="" /> : <div className="h-10 w-10 rounded-full bg-muted" />}
              <div className="flex-1 text-sm">{p.full_name}</div>
              <Input type="number" className="w-20" value={p.landing_order ?? 0} onChange={(e) => setOrder(p.id, Number(e.target.value))} />
              <Switch checked={!!p.show_on_landing} onCheckedChange={(c) => toggle(p.id, c)} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function DepoimentosTab() {
  return (
    <GenericTab
      contentKey="depoimentos"
      fallback={DEFAULTS.depoimentos as any}
      render={(v: any[], set) => (
        <ArrayEditor
          items={v}
          onChange={set}
          labelKey="nome"
          fields={[
            { key: 'nome', label: 'Nome' },
            { key: 'estrelas', label: 'Estrelas (1-5)', type: 'number' },
            { key: 'texto', label: 'Depoimento', type: 'textarea' },
          ]}
        />
      )}
    />
  );
}

function FaqTab() {
  return (
    <GenericTab
      contentKey="faq"
      fallback={DEFAULTS.faq as any}
      render={(v: any[], set) => (
        <ArrayEditor
          items={v}
          onChange={set}
          labelKey="q"
          fields={[
            { key: 'q', label: 'Pergunta' },
            { key: 'a', label: 'Resposta', type: 'textarea' },
          ]}
        />
      )}
    />
  );
}

function CtasTab() {
  return (
    <GenericTab
      contentKey="ctas"
      fallback={DEFAULTS.ctas}
      render={(v, set) => (
        <div className="space-y-3">
          <div><Label>Número WhatsApp (com DDI)</Label><Input value={v.whatsapp_number} onChange={(e) => set({ ...v, whatsapp_number: e.target.value })} placeholder="5561999999999" /></div>
          <div><Label>Mensagem padrão</Label><Textarea rows={2} value={v.default_message} onChange={(e) => set({ ...v, default_message: e.target.value })} /></div>
          <div><Label>Texto do botão</Label><Input value={v.button_label} onChange={(e) => set({ ...v, button_label: e.target.value })} /></div>
        </div>
      )}
    />
  );
}

function ContatoTab() {
  return (
    <GenericTab
      contentKey="contato"
      fallback={DEFAULTS.contato}
      render={(v, set) => (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><Label>Endereço</Label><Input value={v.endereco} onChange={(e) => set({ ...v, endereco: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={v.telefone} onChange={(e) => set({ ...v, telefone: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input value={v.email} onChange={(e) => set({ ...v, email: e.target.value })} /></div>
          <div><Label>Horário</Label><Input value={v.horario} onChange={(e) => set({ ...v, horario: e.target.value })} /></div>
          <div><Label>Google Maps (URL)</Label><Input value={v.maps_url} onChange={(e) => set({ ...v, maps_url: e.target.value })} /></div>
          <div><Label>Instagram</Label><Input value={v.instagram} onChange={(e) => set({ ...v, instagram: e.target.value })} /></div>
          <div><Label>Facebook</Label><Input value={v.facebook} onChange={(e) => set({ ...v, facebook: e.target.value })} /></div>
        </div>
      )}
    />
  );
}

function SecoesTab() {
  return (
    <GenericTab
      contentKey="sections"
      fallback={DEFAULTS.sections}
      render={(v, set) => (
        <div className="space-y-2">
          {Object.keys(v).map((k) => (
            <div key={k} className="flex items-center justify-between border rounded p-3">
              <div className="text-sm capitalize">{k.replace('_', ' ')}</div>
              <Switch checked={(v as any)[k]} onCheckedChange={(c) => set({ ...v, [k]: c } as any)} />
            </div>
          ))}
        </div>
      )}
    />
  );
}

function SeoTab() {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('seo_settings').select('*').limit(1).maybeSingle();
      if (data) { setForm(data); setId(data.id); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = {
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      meta_keywords: form.meta_keywords,
      og_image_url: form.og_image_url,
      google_site_verification: form.google_site_verification,
      ga4_measurement_id: form.ga4_measurement_id,
      gtm_container_id: form.gtm_container_id,
      robots_txt: form.robots_txt,
    };
    const q = id
      ? supabase.from('seo_settings').update(payload).eq('id', id)
      : supabase.from('seo_settings').insert({ ...payload, singleton: true });
    const { error } = await q;
    if (error) toast.error('Erro ao salvar');
    else toast.success('SEO atualizado');
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div><Label>Título (meta title)</Label><Input value={form.meta_title || ''} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} /></div>
      <div><Label>Descrição (meta description)</Label><Textarea rows={3} value={form.meta_description || ''} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} /></div>
      <div><Label>Palavras-chave</Label><Input value={form.meta_keywords || ''} onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })} /></div>
      <div><Label>OG Image (URL)</Label><Input value={form.og_image_url || ''} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} /></div>
      <div className="grid md:grid-cols-2 gap-3">
        <div><Label>GA4 Measurement ID</Label><Input value={form.ga4_measurement_id || ''} onChange={(e) => setForm({ ...form, ga4_measurement_id: e.target.value })} /></div>
        <div><Label>GTM Container ID</Label><Input value={form.gtm_container_id || ''} onChange={(e) => setForm({ ...form, gtm_container_id: e.target.value })} /></div>
      </div>
      <div><Label>Google Site Verification</Label><Input value={form.google_site_verification || ''} onChange={(e) => setForm({ ...form, google_site_verification: e.target.value })} /></div>
      <div><Label>robots.txt</Label><Textarea rows={4} value={form.robots_txt || ''} onChange={(e) => setForm({ ...form, robots_txt: e.target.value })} /></div>
      <SaveBar onSave={save} saving={saving} />
    </div>
  );
}

function DominioTab() {
  return (
    <div className="space-y-3 text-sm">
      <p>Domínio atual: <strong>{window.location.host}</strong></p>
      <p className="text-muted-foreground">
        Para conectar um domínio personalizado, use a área de publicação em Configurações do Projeto → Domínios.
      </p>
    </div>
  );
}

function PrivacidadeTab() {
  return (
    <GenericTab
      contentKey="privacidade"
      fallback={DEFAULTS.privacidade}
      render={(v, set) => (
        <div>
          <Label>Conteúdo da página (texto/HTML)</Label>
          <Textarea rows={18} value={v.content} onChange={(e) => set({ ...v, content: e.target.value })} />
        </div>
      )}
    />
  );
}

// ---------- Page ----------
export default function MeuSite() {
  const { settings } = useClinicSettings();

  const tabs: Array<{ key: string; label: string; body: React.ReactNode }> = [
    { key: 'identidade', label: 'Identidade', body: <IdentidadeTab /> },
    { key: 'hero', label: 'Topo (Hero)', body: <HeroTab /> },
    { key: 'sobre', label: 'Sobre', body: <SobreTab /> },
    { key: 'especialidades', label: 'Especialidades', body: <EspecialidadesTab /> },
    { key: 'diferenciais', label: 'Diferenciais', body: <DiferenciaisTab /> },
    { key: 'equipe', label: 'Equipe', body: <EquipeTab /> },
    { key: 'depoimentos', label: 'Depoimentos', body: <DepoimentosTab /> },
    { key: 'faq', label: 'FAQ', body: <FaqTab /> },
    { key: 'ctas', label: 'CTAs', body: <CtasTab /> },
    { key: 'contato', label: 'Contato', body: <ContatoTab /> },
    { key: 'secoes', label: 'Seções', body: <SecoesTab /> },
    { key: 'seo', label: 'SEO', body: <SeoTab /> },
    { key: 'dominio', label: 'Domínio', body: <DominioTab /> },
    { key: 'privacidade', label: 'Privacidade', body: <PrivacidadeTab /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="h-6 w-6" /> Meu Site</h1>
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center gap-1 mt-1">
            {settings?.nome_fantasia || 'Ver site'} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <Tabs defaultValue="identidade" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <Card className="p-5">{t.body}</Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
