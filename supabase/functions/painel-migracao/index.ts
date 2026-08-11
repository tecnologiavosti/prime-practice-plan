import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const env = Deno.env.toObject();
  const filteredEnv: Record<string, string> = {};
  const blocked = ["PATH", "HOME", "DENO_DIR", "HOSTNAME", "PORT", "TMPDIR", "USER", "LANG", "TERM", "_", "DENO_REGION", "DENO_DEPLOYMENT_ID"];
  
  for (const [key, value] of Object.entries(env)) {
    if (!blocked.includes(key) && !key.startsWith("XDG_")) {
      filteredEnv[key] = value;
    }
  }

  return new Response(JSON.stringify({
    project_url: Deno.env.get("SUPABASE_URL"),
    anon_key: Deno.env.get("SUPABASE_ANON_KEY"),
    service_role_key: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    secrets: filteredEnv
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
