import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SYSTEM_VARS = new Set([
  'PATH', 'HOME', 'DENO_DIR', 'HOSTNAME', 'PORT', 'TMPDIR', 'USER', 'LANG', 'TERM', '_',
  'DENO_REGION', 'DENO_DEPLOYMENT_ID',
]);

const knownFunctionNames = [
  'migrate-sql',
  'painel-migracao',
  'admin-create-user',
  'admin-update-user',
  'generate-blog-post',
];

const TABLES_QUERY = `
SELECT
  c.relname AS tablename,
  COALESCE(s.n_live_tup, 0)::bigint AS row_count,
  (SELECT count(*) FROM information_schema.columns col
     WHERE col.table_schema = 'public' AND col.table_name = c.relname)::int AS column_count,
  (SELECT count(*) FROM information_schema.columns col
     WHERE col.table_schema = 'public' AND col.table_name = c.relname
       AND (col.column_name ILIKE '%password%' OR col.column_name ILIKE '%secret%'
            OR col.column_name ILIKE '%token%' OR col.column_name ILIKE '%encrypted%'))::int AS encrypted_columns,
  EXISTS (SELECT 1 FROM information_schema.columns col
     WHERE col.table_schema = 'public' AND col.table_name = c.relname
       AND col.column_name = 'user_id') AS has_user_id
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  const env = Deno.env.toObject();
  const supabaseUrl = env.SUPABASE_URL ?? '';
  const anonKey = env.SUPABASE_ANON_KEY ?? '';
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  const secrets: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (SYSTEM_VARS.has(key) || key.startsWith('XDG_')) continue;
    secrets[key] = value;
  }

  // Probe edge functions
  const probes = await Promise.allSettled(
    knownFunctionNames.map(async (name) => {
      const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, { method: 'OPTIONS' });
      return { name, ok: res.status < 500 };
    }),
  );
  const edge_functions = probes
    .filter((p): p is PromiseFulfilledResult<{ name: string; ok: boolean }> => p.status === 'fulfilled')
    .filter((p) => p.value.ok)
    .map((p) => p.value.name);

  // Database tables via exec_sql
  let database_tables: unknown[] = [];
  let database_tables_error: string | null = null;
  try {
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.rpc('exec_sql', { sql_query: TABLES_QUERY });
    if (error) database_tables_error = error.message;
    else database_tables = (data as unknown[]) ?? [];
  } catch (_e) {
    database_tables_error = 'Não foi possível listar as tabelas.';
  }

  return new Response(
    JSON.stringify({
      project_url: supabaseUrl,
      anon_key: anonKey,
      service_role_key: serviceRoleKey,
      secrets,
      edge_functions,
      edge_functions_count: edge_functions.length,
      database_tables,
      database_tables_error,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
