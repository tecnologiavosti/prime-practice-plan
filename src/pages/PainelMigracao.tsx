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
      // Direct call to edge function without prefixing /functions/v1/ manually
      // because supabase.functions.invoke handles the base URL.
      const { data: res, error } = await supabase.functions.invoke("painel-migracao");
      
      if (error) {
        console.error("Erro na Edge Function:", error);
        throw error;
      }
      
      if (!res) {
        throw new Error("Resposta vazia da Edge Function");
      }

      setData(res as PanelData);
      toast.success("Dados de migração carregados");
    } catch (e: any) {
      console.error("Falha ao revelar dados:", e);
      toast.error(`Não foi possível carregar os dados: ${e.message || "Erro desconhecido"}`);
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

  const extras = data?.secrets ? Object.entries(data.secrets).filter(([k]) => !SYSTEM_KEYS.includes(k)) : [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs font-mono whitespace-pre-wrap mb-8">
        {`ATENÇÃO — REQUISITO BLOQUEANTE:

- migrate-sql deve ser uma SUPABASE EDGE FUNCTION REAL.

- Crie exatamente supabase/functions/migrate-sql/index.ts.

- Configure [functions.migrate-sql] com verify_jwt = false em supabase/config.toml.

- Faça deploy no Supabase conectado ao projeto.

- Endpoint final obrigatório: \${SUPABASE_URL}/functions/v1/migrate-sql.

- NÃO crie Next.js API Route, server route, /api/public/migrate-sql, proxy da aplicação ou apenas arquivo local.

- Criar código sem publicar NÃO conclui a tarefa.

- Antes de concluir, teste OPTIONS no endpoint final e confirme que não retorna 404.

- Se este ambiente não puder publicar Edge Functions, diga isso claramente. Não afirme que foi implementado ou deployado.

CONTRATO EXATO USADO PELO DATACLONE:

- POST \${SUPABASE_URL}/functions/v1/migrate-sql.

- Header Authorization: Bearer <service_role>.

- Header Content-Type: application/json.

- Body exatamente { "sql_query": "..." }.

- Leia a chave somente do Bearer token. Não espere key no body.

- Crie o cliente Supabase server-side usando SUPABASE_URL e o token recebido.

- Chame supabase.rpc("exec_sql", { sql_query }).

- Nunca registre ou devolva chave, Authorization ou stack.

Estas regras têm prioridade sobre qualquer instrução conflitante abaixo.

Crie uma página chamada "Painel de Migração" no meu projeto, seguindo EXATAMENTE a especificação abaixo. O objetivo é reunir, EM ORDEM, tudo que preciso copiar para migrar este projeto para outro Supabase.

## Importante sobre acesso

- A página /painel-migracao deve ser PÚBLICA (sem exigir login). É uma página temporária só para a migração; o dono apaga depois.

- Não crie usuário, enum app_role, tabela user_roles nem trigger de role para esta página.

## Migration SQL obrigatória — função exec_sql (ponte para migrações)

\`\`\`sql

CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)

RETURNS json

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path TO 'public', 'pg_catalog', 'information_schema', 'auth', 'storage'

AS \$\$

DECLARE

  result json;

  caller_role text;

  clean_query text;

BEGIN

  caller_role := current_setting('request.jwt.claims', true)::json->>\'role\';

  IF caller_role IS DISTINCT FROM \'service_role\' THEN

    RAISE EXCEPTION \'Acesso negado: apenas service_role pode executar esta função.\';

  END IF;

  clean_query := rtrim(sql_query, \'; \');

  EXECUTE \'SELECT json_agg(row_to_json(t)) FROM (\' || clean_query || \') t\' INTO result;

  RETURN COALESCE(result, \'[]\'::json);

END;

\$\$;

\`\`\`

## Edge Function migrate-sql (com verify_jwt = false no config.toml)

Esta função permite que a ferramenta de migração leia o banco mesmo quando a chave secreta é do novo formato (sb_secret_), que o Supabase bloqueia no navegador. A query roda NO SERVIDOR.

- Inclua CORS headers (Access-Control-Allow-Origin: *, Access-Control-Allow-Headers: authorization, content-type, apikey, Access-Control-Allow-Methods: POST, OPTIONS).

- Responda requisições OPTIONS com status 200 e os CORS headers.

- Aceite POST com body JSON exatamente { sql_query }.

- Extraia a service_role do header Authorization: Bearer e crie o client Supabase server-side com (Deno.env.get("SUPABASE_URL"), serviceRoleRecebida). Não aceite chave no body.

- Chame: const { data, error } = await supabase.rpc("exec_sql", { sql_query: body.sql_query }).

- Se houver error, retorne status 400 com { error: error.message } e os CORS headers.

- Caso contrário, retorne data (o array JSON) com os CORS headers.

- Observação: a própria função exec_sql já exige role service_role, então uma chave inválida será rejeitada por ela.

## Edge Function painel-migracao (com verify_jwt = false no config.toml)

- Acesso PÚBLICO: não exija login nem role. Responda a qualquer requisição (é uma função temporária de migração).

- Use Deno.env.toObject() para retornar TODOS os secrets configurados dinamicamente.

- Filtre as variáveis de sistema: PATH, HOME, DENO_DIR, HOSTNAME, PORT, TMPDIR, USER, LANG, TERM, _, DENO_REGION, DENO_DEPLOYMENT_ID e qualquer XDG_*.

- Retorne project_url, anon_key, service_role_key em campos separados.

- Descubra Edge Functions via probe: defina um array knownFunctionNames com os nomes das funções do projeto. Use Promise.allSettled para fazer fetch(OPTIONS) cada URL \${SUPABASE_URL}/functions/v1/\${name}. Considere existente qualquer função que retorne status < 500. Retorne edge_functions (array) e edge_functions_count (número).

- Descubra tabelas do banco via exec_sql (service_role): execute a query que lista tablename, row_count, column_count, encrypted_columns e has_user_id do schema public, e retorne database_tables no JSON.

- Inclua CORS headers.

## Página React /painel-migracao (PÚBLICA — sem login)

A página deve ser um passo a passo VERTICAL, numerado, na ORDEM EXATA de coleta para a migração. Cada passo é um card com título "Passo N", o que copiar e o botão correspondente. No topo, um botão grande "Revelar Tudo" que chama a edge function (sem precisar de login) e preenche todos os passos de uma vez.

- Cabeçalho: título "Painel de Migração" + subtítulo "Copie os itens abaixo na ordem e cole na extensão DataClone".

- Botão "Revelar Tudo" (chama a edge function; enquanto carrega, mostra Loader2).

- Passo 1 — Credenciais (ícone ShieldAlert): mostre Project URL, Anon Key e Service Role Key. Cada valor mascarado (12 primeiros chars + ••••• + 8 últimos) com botões Eye/EyeOff e Copy por linha. Botão "Copiar Project URL" e "Copiar Service Role Key" em destaque (são os 2 que a extensão pede).

- Passo 2 — Edge Functions (ícone Code2): liste os nomes das funções descobertas como chips. Botão "Baixar edge-functions.ts" que usa import.meta.glob('/supabase/functions/*/index.ts', { query: '?raw', import: 'default', eager: true }) para embutir o código no build e baixa um arquivo edge-functions.ts consolidado (cada função separada por // ═══ NOME ═══), sem chamadas de rede. Exiba toast com a contagem.

- Passo 3 — Secrets (ícone Key): liste as env vars extras (mascaradas, com Copy). Botão "Baixar secrets.ts" que gera secrets.ts com "export const SECRETS = { ... } as const" e "export type SecretKey = keyof typeof SECRETS;".

- Passo 4 — Conferência (ícone Database): Card de Tabelas do Banco com a contagem e classificação por heurística (Essencial/Histórico/Ignorar) e um aviso sobre senhas (são copiadas como hash bcrypt; se o JWT secret do destino mudar, sessões antigas caem mas a senha continua válida).

- Botões auxiliares no topo: "Copiar Tudo" (todas as credenciais com separadores visuais ═══ e categorias).

- Adicione a rota /painel-migracao no App.tsx como rota PÚBLICA (NÃO use ProtectedRoute — não exige login).

- Imports lucide-react: Eye, EyeOff, Copy, Check, ShieldAlert, Key, Download, Loader2, Code2, Database, AlertTriangle, Info.`}
      </div>

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
