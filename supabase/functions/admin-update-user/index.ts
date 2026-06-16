// Edge function: admin-update-user
// Allows an administrador to reset a user's password and enable/disable access.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "administrador")
      .maybeSingle();
    if (!roleRow) return json({ error: "Apenas administradores" }, 403);

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password: string | undefined = body.password ? String(body.password) : undefined;
    const active: boolean | undefined = typeof body.active === "boolean" ? body.active : undefined;

    if (!email) return json({ error: "E-mail obrigatório" }, 400);
    if (password !== undefined && password.length < 6) return json({ error: "Senha mínima 6 caracteres" }, 400);

    // Find user by email
    let target: { id: string } | null = null;
    let page = 1;
    while (page < 20) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return json({ error: error.message }, 400);
      const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) { target = { id: found.id }; break; }
      if (data.users.length < 200) break;
      page++;
    }
    if (!target) return json({ error: "Usuário ainda não criou conta" }, 404);

    const updates: Record<string, unknown> = {};
    if (password) updates.password = password;
    if (active !== undefined) updates.ban_duration = active ? "none" : "876000h";

    if (Object.keys(updates).length === 0) return json({ error: "Nada para atualizar" }, 400);

    const { error: updErr } = await admin.auth.admin.updateUserById(target.id, updates);
    if (updErr) return json({ error: updErr.message }, 400);

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
