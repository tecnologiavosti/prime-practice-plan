import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Eye, EyeOff, Copy, Check, ShieldAlert, Key, Download, Loader2,
  Code2, Database, AlertTriangle, Info,
} from "lucide-react";

interface TableInfo {
  tablename: string;
  row_count: number;
  column_count: number;
  encrypted_columns: number;
  has_user_id: boolean;
}

interface PanelData {
  project_url: string;
  anon_key: string;
  service_role_key: string;
  secrets: Record<string, string>;
  edge_functions: string[];
  edge_functions_count: number;
  database_tables: TableInfo[] | null;
  database_tables_error: string | null;
}

const SYSTEM_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

function mask(value: string) {
  if (!value) return "";
  if (value.length <= 24) return `${value.slice(0, 4)}•••••`;
  return `${value.slice(0, 12)}•••••${value.slice(-8)}`;
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function classify(t: TableInfo): { label: string; variant: "default" | "secondary" | "outline" } {
  if (t.row_count === 0) return { label: "Ignorar", variant: "outline" };
  if (t.has_user_id || t.encrypted_columns > 0) return { label: "Essencial", variant: "default" };
  return { label: "Histórico", variant: "secondary" };
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{visible ? value : mask(value)}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => setVisible((v) => !v)} aria-label="Mostrar/ocultar">
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={copy} aria-label="Copiar">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

export default function PainelMigracao() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PanelData | null>(null);

  const revealAll = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("painel-migracao", { body: {} });
      if (error) throw error;
      setData(res as PanelData);
      toast.success("Dados de migração carregados");
    } catch (e) {
      toast.error("Não foi possível carregar os dados de migração");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!data) return;
    const extras = Object.entries(data.secrets).filter(([k]) => !SYSTEM_KEYS.includes(k));
    const text = [
      "═══ CREDENCIAIS ═══",
      `PROJECT_URL=${data.project_url}`,
      `ANON_KEY=${data.anon_key}`,
      `SERVICE_ROLE_KEY=${data.service_role_key}`,
      "",
      "═══ EDGE FUNCTIONS ═══",
      ...data.edge_functions.map((f) => `- ${f}`),
      "",
      "═══ SECRETS ═══",
      ...extras.map(([k, v]) => `${k}=${v}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Tudo copiado");
  };

  const downloadEdgeFunctions = () => {
    const modules = import.meta.glob("/supabase/functions/*/index.ts", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const entries = Object.entries(modules);
    const content = entries
      .map(([path, code]) => {
        const name = path.split("/").slice(-2)[0];
        return `// ═══ ${name} ═══\n${code}`;
      })
      .join("\n\n");
    download("edge-functions.ts", content);
    toast.success(`${entries.length} edge functions exportadas`);
  };

  const downloadSecrets = () => {
    if (!data) return;
    const extras = Object.entries(data.secrets).filter(([k]) => !SYSTEM_KEYS.includes(k));
    const body = extras.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n");
    const content = `export const SECRETS = {\n${body}\n} as const;\n\nexport type SecretKey = keyof typeof SECRETS;\n`;
    download("secrets.ts", content);
    toast.success(`${extras.length} secrets exportados`);
  };

  const extras = data ? Object.entries(data.secrets).filter(([k]) => !SYSTEM_KEYS.includes(k)) : [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Painel de Migração</h1>
        <p className="text-sm text-muted-foreground">
          Copie os itens abaixo na ordem e cole na extensão DataClone.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={revealAll} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
          Revelar Tudo
        </Button>
        <Button size="lg" variant="outline" onClick={copyAll} disabled={!data}>
          <Copy className="mr-2 h-4 w-4" /> Copiar Tudo
        </Button>
      </div>

      {/* Passo 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4" /> Passo 1 — Credenciais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!data ? (
            <p className="text-sm text-muted-foreground">Clique em “Revelar Tudo” para carregar.</p>
          ) : (
            <>
              <SecretRow label="Project URL" value={data.project_url} />
              <SecretRow label="Anon Key" value={data.anon_key} />
              <SecretRow label="Service Role Key" value={data.service_role_key} />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(data.project_url);
                    toast.success("Project URL copiado");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copiar Project URL
                </Button>
                <Button
                  onClick={async () => {
                    await navigator.clipboard.writeText(data.service_role_key);
                    toast.success("Service Role Key copiada");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copiar Service Role Key
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Passo 2 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2 className="h-4 w-4" /> Passo 2 — Edge Functions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {data?.edge_functions?.length ? (
              data.edge_functions.map((f) => (
                <Badge key={f} variant="secondary" className="font-mono">{f}</Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma função descoberta ainda.</p>
            )}
          </div>
          <Button variant="outline" onClick={downloadEdgeFunctions}>
            <Download className="mr-2 h-4 w-4" /> Baixar edge-functions.ts
          </Button>
        </CardContent>
      </Card>

      {/* Passo 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" /> Passo 3 — Secrets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {extras.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum secret extra encontrado.</p>
          ) : (
            extras.map(([k, v]) => <SecretRow key={k} label={k} value={v} />)
          )}
          <Button variant="outline" onClick={downloadSecrets} disabled={!data}>
            <Download className="mr-2 h-4 w-4" /> Baixar secrets.ts
          </Button>
        </CardContent>
      </Card>

      {/* Passo 4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Passo 4 — Conferência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {data?.database_tables?.length
              ? `${data.database_tables.length} tabelas encontradas no schema public.`
              : data?.database_tables_error ?? "Sem dados de tabelas ainda."}
          </p>
          <div className="space-y-1">
            {data?.database_tables?.map((t) => {
              const c = classify(t);
              return (
                <div key={t.tablename} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="font-mono">{t.tablename}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {t.row_count} linhas · {t.column_count} colunas
                    <Badge variant={c.variant}>{c.label}</Badge>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              As senhas são copiadas como hash bcrypt. Se o JWT secret do destino mudar, as sessões
              antigas caem, mas a senha do usuário continua válida.
            </p>
          </div>
          <div className="flex gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Página temporária de migração — remova-a após concluir a cópia dos dados.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
