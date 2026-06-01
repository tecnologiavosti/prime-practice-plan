import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShieldCheck,
  BarChart3,
  Activity,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Save,
  Globe,
} from "lucide-react";

interface SeoSettings {
  id: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url: string;
  google_site_verification: string;
  bing_site_verification: string;
  ga4_measurement_id: string;
  gtm_container_id: string;
  meta_pixel_id: string;
  robots_txt: string;
}

const empty: Omit<SeoSettings, "id"> = {
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_image_url: "",
  google_site_verification: "",
  bing_site_verification: "",
  ga4_measurement_id: "",
  gtm_container_id: "",
  meta_pixel_id: "",
  robots_txt: "User-agent: *\nAllow: /\n",
};

const SITE_URL = "https://clinicapacem.com.br";

export default function SeoSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<SeoSettings | null>(null);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: row, error } = await supabase
      .from("seo_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else if (row) {
      setData(row as SeoSettings);
      setForm({
        meta_title: row.meta_title || "",
        meta_description: row.meta_description || "",
        meta_keywords: row.meta_keywords || "",
        og_image_url: row.og_image_url || "",
        google_site_verification: row.google_site_verification || "",
        bing_site_verification: row.bing_site_verification || "",
        ga4_measurement_id: row.ga4_measurement_id || "",
        gtm_container_id: row.gtm_container_id || "",
        meta_pixel_id: row.meta_pixel_id || "",
        robots_txt: row.robots_txt || "User-agent: *\nAllow: /\n",
      });
    }
    setLoading(false);
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    const { error } = await supabase
      .from("seo_settings")
      .update(form)
      .eq("id", data.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas", description: "As tags serão aplicadas no site." });
      load();
    }
  }

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const StatusBadge = ({ ok }: { ok: boolean }) =>
    ok ? (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Configurado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-slate-500 gap-1">
        <XCircle className="h-3 w-3" /> Não configurado
      </Badge>
    );

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SEO / Google</h1>
          <p className="text-sm text-muted-foreground">
            Configure como o site aparece no Google e ative ferramentas de monitoramento.
          </p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>

      <Tabs defaultValue="meta" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="meta" className="gap-2"><Search className="h-4 w-4" />Meta Tags</TabsTrigger>
          <TabsTrigger value="verify" className="gap-2"><ShieldCheck className="h-4 w-4" />Verificação</TabsTrigger>
          <TabsTrigger value="track" className="gap-2"><BarChart3 className="h-4 w-4" />Rastreamento</TabsTrigger>
          <TabsTrigger value="robots" className="gap-2"><Globe className="h-4 w-4" />Sitemap/Robots</TabsTrigger>
          <TabsTrigger value="status" className="gap-2"><Activity className="h-4 w-4" />Status</TabsTrigger>
        </TabsList>

        {/* META TAGS */}
        <TabsContent value="meta" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Como o site aparece no Google</CardTitle>
              <CardDescription>
                Estas informações são mostradas nos resultados de busca e ao compartilhar nas redes sociais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título da página (até 60 caracteres)</Label>
                <Input value={form.meta_title} onChange={set("meta_title")} maxLength={70} placeholder="Clínica Pacem - Agendamento Online" />
                <p className="text-xs text-muted-foreground">{form.meta_title.length}/60</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição (até 160 caracteres)</Label>
                <Textarea value={form.meta_description} onChange={set("meta_description")} maxLength={200} rows={3} placeholder="Agende sua consulta online..." />
                <p className="text-xs text-muted-foreground">{form.meta_description.length}/160</p>
              </div>
              <div className="space-y-2">
                <Label>Palavras-chave (separadas por vírgula)</Label>
                <Input value={form.meta_keywords} onChange={set("meta_keywords")} placeholder="clínica, agendamento, saúde, brasília" />
              </div>
              <div className="space-y-2">
                <Label>URL da imagem de compartilhamento (Open Graph)</Label>
                <Input value={form.og_image_url} onChange={set("og_image_url")} placeholder="https://..." />
                <p className="text-xs text-muted-foreground">Imagem exibida ao compartilhar no WhatsApp, Facebook, etc.</p>
              </div>

              {/* Preview */}
              <div className="border rounded-md p-4 bg-slate-50 space-y-1">
                <p className="text-xs text-muted-foreground mb-2">Pré-visualização Google:</p>
                <p className="text-blue-700 text-base truncate">{form.meta_title || "Título da página"}</p>
                <p className="text-emerald-700 text-xs">{SITE_URL}</p>
                <p className="text-slate-600 text-sm line-clamp-2">{form.meta_description || "Descrição da página..."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VERIFICAÇÃO */}
        <TabsContent value="verify" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Códigos de verificação</CardTitle>
              <CardDescription>
                Cole o código fornecido pelo Google Search Console / Bing para provar que você é dono do site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Google Search Console</Label>
                  <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Abrir Search Console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input value={form.google_site_verification} onChange={set("google_site_verification")} placeholder='Cole apenas o valor do content="..." da meta tag' />
                <p className="text-xs text-muted-foreground">
                  No Search Console escolha "Tag HTML" e cole aqui apenas o conteúdo entre aspas do atributo <code>content</code>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Bing Webmaster</Label>
                  <a href="https://www.bing.com/webmasters" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Abrir Bing Webmaster <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input value={form.bing_site_verification} onChange={set("bing_site_verification")} placeholder='Conteúdo do content="..." da meta msvalidate.01' />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RASTREAMENTO */}
        <TabsContent value="track" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>IDs de rastreamento</CardTitle>
              <CardDescription>
                Conecte ferramentas de análise. Os scripts são carregados automaticamente nas páginas públicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Google Analytics 4 (Measurement ID)</Label>
                  <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Abrir Analytics <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input value={form.ga4_measurement_id} onChange={set("ga4_measurement_id")} placeholder="G-XXXXXXXXXX" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Google Tag Manager (Container ID)</Label>
                  <a href="https://tagmanager.google.com" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Abrir GTM <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input value={form.gtm_container_id} onChange={set("gtm_container_id")} placeholder="GTM-XXXXXXX" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Meta Pixel (Facebook / Instagram)</Label>
                  <a href="https://business.facebook.com/events_manager" target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Abrir Events Manager <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input value={form.meta_pixel_id} onChange={set("meta_pixel_id")} placeholder="Apenas números, ex: 1234567890" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SITEMAP / ROBOTS */}
        <TabsContent value="robots" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sitemap & robots.txt</CardTitle>
              <CardDescription>
                Arquivos que dizem ao Google quais páginas indexar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium text-sm">sitemap.xml</p>
                  <p className="text-xs text-muted-foreground">Lista das páginas do site (gerada automaticamente)</p>
                </div>
                <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-3 w-3" /> Ver</Button>
                </a>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium text-sm">robots.txt</p>
                  <p className="text-xs text-muted-foreground">Diz quais robôs podem visitar o site</p>
                </div>
                <a href={`${SITE_URL}/robots.txt`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-3 w-3" /> Ver atual</Button>
                </a>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                💡 Esses arquivos ficam em <code>public/robots.txt</code> e <code>public/sitemap.xml</code>.
                Para mudanças no robots.txt, peça ao suporte.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATUS */}
        <TabsContent value="status" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Status das configurações</CardTitle>
              <CardDescription>
                Verifique o que está ativo no seu site agora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Título da página", ok: !!data?.meta_title },
                { label: "Descrição (meta description)", ok: !!data?.meta_description },
                { label: "Palavras-chave", ok: !!data?.meta_keywords },
                { label: "Imagem de compartilhamento", ok: !!data?.og_image_url },
                { label: "Verificação Google Search Console", ok: !!data?.google_site_verification },
                { label: "Verificação Bing", ok: !!data?.bing_site_verification },
                { label: "Google Analytics 4", ok: !!data?.ga4_measurement_id },
                { label: "Google Tag Manager", ok: !!data?.gtm_container_id },
                { label: "Meta Pixel", ok: !!data?.meta_pixel_id },
              ].map((it) => (
                <div key={it.label} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span className="text-sm">{it.label}</span>
                  <StatusBadge ok={it.ok} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acompanhe o andamento</CardTitle>
              <CardDescription>
                Os dados de tráfego, cliques e indexação ficam no painel oficial do Google.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full justify-between gap-2 h-auto py-3">
                  <span className="text-left">
                    <span className="block font-medium text-sm">Google Search Console</span>
                    <span className="block text-xs text-muted-foreground">Cliques, impressões, posição</span>
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a href="https://analytics.google.com" target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full justify-between gap-2 h-auto py-3">
                  <span className="text-left">
                    <span className="block font-medium text-sm">Google Analytics 4</span>
                    <span className="block text-xs text-muted-foreground">Visitas, sessões, conversões</span>
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(SITE_URL)}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full justify-between gap-2 h-auto py-3">
                  <span className="text-left">
                    <span className="block font-medium text-sm">Teste de Rich Results</span>
                    <span className="block text-xs text-muted-foreground">Verifica se o Google lê seu site</span>
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
              <a href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(SITE_URL)}`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full justify-between gap-2 h-auto py-3">
                  <span className="text-left">
                    <span className="block font-medium text-sm">PageSpeed Insights</span>
                    <span className="block text-xs text-muted-foreground">Velocidade e performance</span>
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
