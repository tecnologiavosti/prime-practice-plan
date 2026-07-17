import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SeoHead } from '@/components/SeoHead';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Users,
  MessageCircle,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  Award,
  HeartHandshake,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { extractUuidFromSlug, slugify } from '@/lib/slug';

interface PublicProfessional {
  id: string;
  full_name: string;
  photo_url: string | null;
  landing_bio: string | null;
  landing_about: string | null;
  landing_curriculum: string | null;
  specialty_name: string | null;
  landing_whatsapp: string | null;
}

const DEFAULT_WHATSAPP = '5561981823984';

function normalizeWhatsapp(raw: string | null | undefined): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return DEFAULT_WHATSAPP;
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

type AvailStatus = 'available' | 'unavailable' | 'off';
interface AvailDay { day: string; status: AvailStatus }

export default function ProfessionalPublic() {
  const { id: slug } = useParams<{ id: string }>();
  const [prof, setProf] = useState<PublicProfessional | null>(null);
  const [insurances, setInsurances] = useState<{ id: string; name: string }[]>([]);
  const [availability, setAvailability] = useState<AvailDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawSlug = slug || '';
    const uuidFromSlug = extractUuidFromSlug(rawSlug);
    (async () => {
      let id = uuidFromSlug;
      if (!id) {
        const { data: list } = await (supabase.rpc as any)('get_landing_professionals');
        const target = (list as { id: string; full_name: string }[] | null)?.find(
          (p) => slugify(p.full_name) === rawSlug.toLowerCase(),
        );
        id = target?.id ?? null;
      }
      if (!id) {
        setLoading(false);
        return;
      }
      const today = new Date();
      const start = new Date(today);
      const end = new Date(today);
      end.setDate(end.getDate() + 29);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const [{ data }, { data: ins }, { data: avail }] = await Promise.all([
        (supabase.rpc as any)('get_landing_professional', { _id: id }),
        (supabase.rpc as any)('get_professional_insurances', { _id: id }),
        (supabase.rpc as any)('get_professional_availability', {
          _id: id,
          _start: fmt(start),
          _end: fmt(end),
        }),
      ]);
      setProf((data?.[0] as PublicProfessional) ?? null);
      setInsurances((ins as any) ?? []);
      setAvailability((avail as AvailDay[]) ?? []);
      setLoading(false);
    })();
  }, [slug]);


  const waNumber = normalizeWhatsapp(prof?.landing_whatsapp);
  const waHref = prof
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Olá! Gostaria de agendar uma consulta com ${prof.full_name} na Clínica Pacem.`,
      )}`
    : '#';

  const firstName = prof?.full_name.split(' ')[0] ?? '';
  const isFemale = /a$/i.test(firstName);
  const artigo = isFemale ? 'da' : 'de';

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 antialiased">
      <SeoHead />
      {prof.photo_url && (
        <Helmet prioritizeSeoTags>
          <meta property="og:image" content={prof.photo_url} />
          <meta property="og:image:secure_url" content={prof.photo_url} />
          <meta property="og:title" content={prof.full_name} />
          {prof.landing_bio && <meta property="og:description" content={prof.landing_bio} />}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:image" content={prof.photo_url} />
        </Helmet>
      )}

      {/* Minimal top bar — this page is a self-contained landing */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/70">
        <div className="container mx-auto px-5 md:px-10 max-w-6xl h-14 flex items-center justify-between">
          <Link
            to="/equipe"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para a equipe</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
          <span className="text-[13px] font-semibold tracking-[0.22em] uppercase text-slate-700">
            Clínica <span className="text-sky-700">Pacem</span>
          </span>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[12.5px] font-semibold transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            Agendar
          </a>
        </div>
      </header>

      {loading ? (
        <main className="container mx-auto px-5 md:px-10 py-24 max-w-4xl">
          <p className="text-slate-500">Carregando...</p>
        </main>
      ) : !prof ? (
        <main className="container mx-auto px-5 md:px-10 py-24 max-w-4xl">
          <p className="text-slate-500">Profissional não encontrado.</p>
        </main>
      ) : (
        <>
          {/* HERO */}
          <section className="relative overflow-hidden">
            {/* Decorative background */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-br from-white via-sky-50/60 to-slate-50"
            />
            <div
              aria-hidden
              className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-sky-200/40 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-emerald-100/50 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  'radial-gradient(currentColor 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />

            <div className="relative container mx-auto px-5 md:px-10 py-16 md:py-24 max-w-6xl">
              <div className="grid md:grid-cols-[340px_1fr] gap-12 items-center">
                <div className="mx-auto md:mx-0 relative">
                  <div
                    aria-hidden
                    className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-sky-200/70 to-emerald-100/70 blur-xl"
                  />
                  {prof.photo_url ? (
                    <div className="relative h-72 w-72 md:h-80 md:w-80 rounded-[2rem] overflow-hidden border border-white bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
                      <img
                        src={prof.photo_url}
                        alt={prof.full_name}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  ) : (
                    <div className="relative h-72 w-72 md:h-80 md:w-80 rounded-[2rem] border border-white bg-white inline-flex items-center justify-center shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]">
                      <Users className="h-20 w-20 text-slate-300" />
                    </div>
                  )}
                  {/* Floating badge */}
                  <div className="absolute -bottom-4 -right-4 md:-right-6 bg-white rounded-2xl border border-slate-200 shadow-lg px-4 py-3 flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 inline-flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Atendendo
                      </div>
                      <div className="text-[13px] font-bold text-slate-900">
                        Novos pacientes
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  {prof.specialty_name && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/80 backdrop-blur px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      {prof.specialty_name}
                    </span>
                  )}
                  <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-slate-900">
                    {prof.full_name}
                  </h1>
                  {prof.landing_bio && (
                    <p className="mt-6 text-[17px] md:text-lg text-slate-600 leading-relaxed max-w-2xl">
                      {prof.landing_bio}
                    </p>
                  )}

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 h-13 px-7 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1fbb59] text-white text-[15px] font-semibold shadow-[0_18px_40px_-14px_rgba(37,211,102,0.7)] transition-all hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Agende agora
                    </a>
                    <a
                      href="#sobre"
                      className="inline-flex items-center justify-center gap-2 h-13 px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-[15px] font-semibold transition-colors"
                    >
                      Conheça o trabalho
                    </a>
                  </div>

                  {/* Trust row */}
                  <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
                    {[
                      { icon: Award, label: 'Formação sólida' },
                      { icon: HeartHandshake, label: 'Escuta acolhedora' },
                      { icon: ShieldCheck, label: 'Ética e sigilo' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-start gap-1.5">
                        <Icon className="h-4 w-4 text-sky-700" />
                        <span className="text-[12px] font-medium text-slate-600 leading-tight">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <main className="container mx-auto px-5 md:px-10 py-16 md:py-20 max-w-6xl space-y-16 md:space-y-20">
            {/* SOBRE */}
            {prof.landing_about && (
              <section id="sobre" className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-16">
                <div>
                  <div className="inline-flex items-center gap-2 text-sky-700 mb-3">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      Sobre
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight text-slate-900">
                    O trabalho {artigo} {firstName}
                  </h2>
                </div>
                <div className="text-slate-700 whitespace-pre-line leading-[1.75] text-[16px] md:text-[17px] max-w-3xl">
                  {prof.landing_about}
                </div>
              </section>
            )}

            {/* CURRÍCULO */}
            {prof.landing_curriculum && (
              <section className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-16">
                <div>
                  <div className="inline-flex items-center gap-2 text-sky-700 mb-3">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      Formação
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight text-slate-900">
                    Trajetória e histórico
                  </h2>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm max-w-3xl">
                  <p className="text-slate-700 whitespace-pre-line leading-[1.75] text-[15.5px]">
                    {prof.landing_curriculum}
                  </p>
                </div>
              </section>
            )}

            {/* CONVÊNIOS */}
            {insurances.length > 0 && (
              <section className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-16">
                <div>
                  <div className="inline-flex items-center gap-2 text-sky-700 mb-3">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                      Convênios
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight text-slate-900">
                    Convênios atendidos
                  </h2>
                  <p className="mt-3 text-sm text-slate-500">
                    Verifique a cobertura do seu plano no atendimento.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 content-start">
                  {insurances.map((i) => (
                    <span
                      key={i.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-medium shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {i.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* INFO CARDS */}
            <section className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: MapPin,
                  title: 'Atendimento presencial',
                  desc: 'Clínica Pacem — Brasília/DF.',
                },
                {
                  icon: Clock,
                  title: 'Horários flexíveis',
                  desc: 'Agende no melhor horário para sua rotina.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Sigilo profissional',
                  desc: 'Ambiente seguro, ético e confidencial.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-sky-50 inline-flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-sky-700" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </section>

            {/* CTA FINAL */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-10 md:p-16">
              <div
                aria-hidden
                className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
              />
              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                  Vagas abertas
                </span>
                <h2 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight">
                  Dê o próximo passo com {firstName}.
                </h2>
                <p className="mt-4 text-white/70 text-[16px] leading-relaxed">
                  Fale agora pelo WhatsApp e reserve o melhor horário. O acolhimento
                  começa na primeira conversa.
                </p>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center gap-2 h-13 px-8 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1fbb59] text-white text-[15px] font-semibold shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-5 w-5" />
                  Agende agora pelo WhatsApp
                </a>
              </div>
            </section>
          </main>

          {/* Minimal footer specific to this landing */}
          <footer className="border-t border-slate-200 bg-white">
            <div className="container mx-auto px-5 md:px-10 max-w-6xl py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-slate-500">
              <span>© {new Date().getFullYear()} Clínica Pacem</span>
              <span>{prof.full_name} · {prof.specialty_name ?? 'Profissional'}</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
