// Generates a blog post about mental health using Lovable AI (text + image)
// and inserts it into the blog_posts table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const DEFAULT_TOPICS = [
  "ansiedade no dia a dia",
  "como lidar com burnout no trabalho",
  "depressão: sinais e quando buscar ajuda",
  "saúde mental de adolescentes",
  "qualidade do sono e saúde emocional",
  "mindfulness e meditação para iniciantes",
  "TDAH em adultos",
  "como escolher um psicólogo",
  "luto e reconstrução emocional",
  "saúde mental no relacionamento amoroso",
  "alimentação e bem-estar emocional",
  "rotina saudável para reduzir o estresse",
];

async function callAI(apiKey: string, body: any) {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI error ${resp.status}: ${text}`);
  }
  return await resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const topic: string =
      body.topic?.toString().trim() ||
      DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];
    const publish: boolean = body.publish !== false;

    // 1) Generate post content as JSON
    const textResp = await callAI(apiKey, {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Você é redator de uma clínica brasileira de saúde mental (Clínica Pacem - Brasília). Escreva em português do Brasil, tom acolhedor, informativo e baseado em evidências. Nunca prometa cura. SEMPRE responda apenas com JSON válido, sem markdown ao redor.",
        },
        {
          role: "user",
          content: `Escreva um artigo de blog sobre: "${topic}".
Retorne APENAS um JSON no formato:
{
  "title": "título curto e atrativo, máx 70 caracteres",
  "excerpt": "resumo de 1-2 frases, máx 180 caracteres",
  "content": "artigo completo em markdown, 500-800 palavras, com subtítulos ##, listas e parágrafos curtos. Termine convidando o leitor a buscar a Clínica Pacem em Brasília.",
  "image_prompt": "descrição visual em inglês para gerar uma imagem de capa profissional, fotorrealista, tom calmo, relacionada ao tema, sem texto na imagem"
}`,
        },
      ],
    });

    const raw = textResp.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Resposta IA sem JSON válido");
    const parsed = JSON.parse(jsonMatch[0]);

    const title = String(parsed.title || topic).slice(0, 120);
    const excerpt = String(parsed.excerpt || "").slice(0, 240);
    const content = String(parsed.content || "");
    const imagePrompt = String(parsed.image_prompt || `Calm photo about ${topic}`);

    // 2) Generate cover image
    let coverUrl: string | null = null;
    try {
      const imgResp = await callAI(apiKey, {
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      });
      const imgB64: string | undefined =
        imgResp.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imgB64) {
        // imgB64 is like "data:image/png;base64,...."
        const m = imgB64.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (m) {
          const mime = m[1];
          const ext = mime.split("/")[1] || "png";
          const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
          const path = `blog/${Date.now()}-${slugify(title)}.${ext}`;
          const { error: upErr } = await admin.storage
            .from("clinic-assets")
            .upload(path, bytes, { contentType: mime, upsert: true });
          if (!upErr) {
            const { data: pub } = admin.storage.from("clinic-assets").getPublicUrl(path);
            coverUrl = pub.publicUrl;
          }
        }
      }
    } catch (e) {
      console.error("Image generation failed:", e);
    }

    // 3) Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `post-${Date.now()}`;
    let slug = baseSlug;
    let i = 1;
    while (true) {
      const { data: exists } = await admin
        .from("blog_posts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!exists) break;
      i += 1;
      slug = `${baseSlug}-${i}`;
    }

    // 4) Insert
    const { data: inserted, error: insErr } = await admin
      .from("blog_posts")
      .insert({
        title,
        slug,
        excerpt,
        content,
        cover_url: coverUrl,
        author: "Equipe Clínica Pacem",
        published: publish,
      })
      .select("*")
      .single();

    if (insErr) throw insErr;

    // 5) Prune older published posts — keep only the N most recent
    const KEEP = Number(body.keep ?? 6);
    try {
      const { data: keepRows } = await admin
        .from("blog_posts")
        .select("id")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(KEEP);
      const keepIds = (keepRows || []).map((r: any) => r.id);
      if (keepIds.length > 0) {
        await admin
          .from("blog_posts")
          .delete()
          .eq("published", true)
          .not("id", "in", `(${keepIds.map((i) => `"${i}"`).join(",")})`);
      }
    } catch (e) {
      console.error("Prune failed:", e);
    }

    return new Response(JSON.stringify({ post: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
