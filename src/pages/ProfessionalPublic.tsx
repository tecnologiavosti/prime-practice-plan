import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicHeader } from '@/components/site/PublicHeader';
import { PublicFooter } from '@/components/site/PublicFooter';
import { SeoHead } from '@/components/SeoHead';
import { ArrowLeft, Users, MessageCircle, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { extractUuidFromSlug } from '@/lib/slug';

interface PublicProfessional {
  id: string;
  full_name: string;
  photo_url: string | null;
  landing_bio: string | null;
  landing_about: string | null;
  landing_curriculum: string | null;
  specialty_name: string | null;
}

const WHATSAPP = '5561981823984';

export default function ProfessionalPublic() {
  const { id: slug } = useParams<{ id: string }>();
  const [prof, setProf] = useState<PublicProfessional | null>(null);
  const [insurances, setInsurances] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = extractUuidFromSlug(slug || '');
    if (!id) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data }, { data: ins }] = await Promise.all([
        (supabase.rpc as any)('get_landing_professional', { _id: id }),
        (supabase.rpc as any)('get_professional_insurances', { _id: id }),
      ]);
      setProf((data?.[0] as PublicProfessional) ?? null);
      setInsurances((ins as any) ?? []);
      setLoading(false);
    })();
  }, [slug]);

  const waHref = prof
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
        `Olá! Gostaria de agendar uma consulta com ${prof.full_name} na Clínica Pacem.`
      )}`
    : '#';

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SeoHead />
      <PublicHeader />

      {loading ? (
        <main className="container mx-auto px-5 md:px-10 py-16 max-w-4xl">
          <p className="text-slate-500">Carregando...</p>
        </main>
      ) : !prof ? (
        <main className="container mx-auto px-5 md:px-10 py-16 max-w-4xl">
          <Link to="/equipe" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para a equipe
          </Link>
          <p className="text-slate-500">Profissional não encontrado.</p>
        </main>
      ) : (
        <>
          {/* HERO */}
          <section className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-slate-50 border-b border-slate-200">
            <div className="container mx-auto px-5 md:px-10 py-14 md:py-20 max-w-6xl">
              <Link to="/equipe" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8">
                <ArrowLeft className="h-4 w-4" /> Voltar para a equipe
              </Link>

              <div className="grid md:grid-cols-[280px_1fr] gap-10 items-center">
                <div className="mx-auto md:mx-0">
                  {prof.photo_url ? (
                    <div className="h-56 w-56 md:h-64 md:w-64 rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-lg">
                      <img
                        src={prof.photo_url}
                        alt={prof.full_name}
                        className="h-full w-full object-cover object-top scale-110"
                      />
                    </div>
                  ) : (
                    <div className="h-56 w-56 md:h-64 md:w-64 rounded-3xl border border-slate-200 bg-white inline-flex items-center justify-center shadow-lg">
                      <Users className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                </div>

                <div>
                  {prof.specialty_name && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                      {prof.specialty_name}
                    </span>
                  )}
                  <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                    {prof.full_name}
                  </h1>
                  {prof.landing_bio && (
                    <p className="mt-5 text-[16px] md:text-lg text-slate-600 leading-relaxed max-w-2xl">
                      {prof.landing_bio}
                    </p>
                  )}

                  <div className="mt-7 flex flex-col sm:flex-row gap-3">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[14.5px] font-semibold shadow-[0_14px_36px_-12px_rgba(37,211,102,0.6)] transition-all hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Agende agora
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <main className="container mx-auto px-5 md:px-10 py-14 md:py-20 max-w-4xl">
            {/* CONVÊNIOS */}
            {insurances.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-sky-700" />
                  <h2 className="text-xl md:text-2xl font-bold">Convênios atendidos</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insurances.map((i) => (
                    <span
                      key={i.id}
                      className="px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-sm font-medium"
                    >
                      {i.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* SOBRE */}
            {prof.landing_about && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-sky-700" />
                  <h2 className="text-xl md:text-2xl font-bold">Sobre</h2>
                </div>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed text-[15.5px]">
                  {prof.landing_about}
                </p>
              </section>
            )}

            {/* CURRÍCULO */}
            {prof.landing_curriculum && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-sky-700" />
                  <h2 className="text-xl md:text-2xl font-bold">Formação e histórico</h2>
                </div>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed text-[15.5px]">
                  {prof.landing_curriculum}
                </p>
              </section>
            )}

            {/* CTA FINAL */}
            <section className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-700 text-white p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold">
                Agende sua consulta com {prof.full_name.split(' ')[0]}
              </h2>
              <p className="mt-3 text-white/90 max-w-xl mx-auto">
                Fale agora pelo WhatsApp e reserve o melhor horário para você.
              </p>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[15px] font-semibold shadow-lg transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="h-5 w-5" />
                Agende agora
              </a>
            </section>
          </main>
        </>
      )}

      <PublicFooter />
    </div>
  );
}
