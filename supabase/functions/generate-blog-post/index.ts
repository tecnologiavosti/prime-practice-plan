// Generates a blog post using Google Gemini API directly (free tier)
// and inserts it into the blog_posts table.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_TEXT_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_IMAGE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY ausente. Configure em Settings > Secrets.");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const topic: string =
      body.topic?.toString().trim() ||
      DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];
    const publish: boolean = body.publish !== false;

    // 1) Generate post content as JSON via Gemini
    const textPrompt = `Você é redator de uma clínica brasileira de saúde mental (Clínica Pacem - Brasília). Escreva em português do Brasil, tom acolhedor, informativo e baseado em evidências. Nunca prometa cura.

Escreva um artigo de blog sobre: "${topic}".
Retorne APENAS um JSON válido no formato (sem markdown, sem \`\`\`):
{
  "title": "título curto e atrativo, máx 70 caracteres",
  "excerpt": "resumo de 1-2 frases, máx 180 caracteres",
  "content": "artigo completo em markdown, 500-800 palavras, com subtítulos ##, listas e parágrafos curtos. Termine convidando o leitor a buscar a Clínica Pacem em Brasília.",
  "image_prompt": "descrição visual em inglês para gerar uma imagem de capa profissional, fotorrealista, tom calmo, relacionada ao tema, sem texto na imagem"
}`;

    const textResp = await fetch(`${GEMINI_TEXT_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: textPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
      }),
    });
    if (!textResp.ok) {
      const t = await textResp.text();
      throw new Error(`Gemini text ${textResp.status}: ${t}`);
    }
    const textJson = await textResp.json();
    const raw = textJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Resposta Gemini sem JSON válido");
    const parsed = JSON.parse(jsonMatch[0]);

    const title = String(parsed.title || topic).slice(0, 120);
    const excerpt = String(parsed.excerpt || "").slice(0, 240);
    const content = String(parsed.content || "");
    const imagePrompt = String(parsed.image_prompt || `Calm photo about ${topic}`);

    // 2) Generate cover image via Gemini image model
    let coverUrl: string | null = null;
    try {
      const imgResp = await fetch(`${GEMINI_IMAGE_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: imagePrompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      });
      if (imgResp.ok) {
        const imgJson = await imgResp.json();
        const parts = imgJson.candidates?.[0]?.content?.parts ?? [];
        const imgPart = parts.find((p: any) => p.inlineData?.data);
        if (imgPart) {
          const mime = imgPart.inlineData.mimeType || "image/png";
          const ext = mime.split("/")[1] || "png";
          const bytes = Uint8Array.from(atob(imgPart.inlineData.data), (c) => c.charCodeAt(0));
          const path = `blog/${Date.now()}-${slugify(title)}.${ext}`;
          const { error: upErr } = await admin.storage
            .from("clinic-assets")
            .upload(path, bytes, { contentType: mime, upsert: true });
          if (!upErr) {
            const { data: pub } = admin.storage.from("clinic-assets").getPublicUrl(path);
            coverUrl = pub.publicUrl;
          }
        }
      } else {
        console.error("Image generation failed:", imgResp.status, await imgResp.text());
      }
    } catch (e) {
      console.error("Image generation error:", e);
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
