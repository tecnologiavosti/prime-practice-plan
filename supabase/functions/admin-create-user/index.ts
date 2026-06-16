// Edge function: admin-create-user
// Allows an administrador to directly create a user (email + password)
// and registers it in authorized_admins so triggers assign the proper role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Check caller is administrador
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "administrador")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem cadastrar usuários" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const full_name = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "profissional" ? "profissional" : "administrador";

    if (full_name.length < 3) return json({ error: "Nome deve ter ao menos 3 caracteres" }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "E-mail inválido" }, 400);
    if (password.length < 6) return json({ error: "Senha deve ter no mínimo 6 caracteres" }, 400);

    // Upsert authorized_admins so trigger atribui o role correto
    const { error: invErr } = await admin
      .from("authorized_admins")
      .upsert({
        email,
        full_name,
        role,
        invited_by: user.id,
        used: false,
      }, { onConflict: "email" });

    if (invErr) return json({ error: invErr.message }, 400);

    // Cria usuário no auth (email já confirmado)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      return json({ error: createErr.message }, 400);
    }

    return json({ ok: true, user_id: created.user?.id });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  function json(obj: unknown, status = 200) {
    return new Response(JSON.stringify(obj), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
