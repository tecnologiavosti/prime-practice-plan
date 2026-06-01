import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { SeoHead } from '@/components/SeoHead';
import { supabase } from '@/integrations/supabase/client';
import logoPacem from '@/assets/logoPacem.png';
import clinicHero from '@/assets/clinic-hero.jpg';
import {
  Calendar,
  Clock,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
  HeartPulse,
  Stethoscope,
  FileText,
  Lock,
  Phone,
  MapPin,
  Mail,
  Instagram,
  Facebook,
} from 'lucide-react';

const features = [
  { icon: Calendar, title: 'Agendamento Online', description: 'Marque suas consultas 24h por dia, de qualquer lugar.' },
  { icon: Clock, title: 'Horários Flexíveis', description: 'Ampla disponibilidade de horários para sua conveniência.' },
  { icon: Shield, title: 'Dados Seguros', description: 'Suas informações protegidas com criptografia de ponta.' },
  { icon: Users, title: 'Equipe Especializada', description: 'Profissionais qualificados e experientes à sua disposição.' },
];

const benefits = [
  'Agende consultas em segundos',
  'Acompanhe seu histórico médico',
  'Receba lembretes automáticos',
  'Acesse de qualquer dispositivo',
];

const specialtyIconFor = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('cardio')) return HeartPulse;
  if (n.includes('pedia') || n.includes('criança')) return Users;
  if (n.includes('derma') || n.includes('pele')) return FileText;
  if (n.includes('clínic') || n.includes('clinic') || n.includes('geral')) return Stethoscope;
  return Stethoscope;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

// Clean light "Prime Clinic" scoped palette — does NOT affect admin app
const lpStyles = {
  '--lp-bg': '210 40% 98%',
  '--lp-surface': '0 0% 100%',
  '--lp-ink': '222 47% 11%',
  '--lp-muted': '215 16% 47%',
  '--lp-line': '214 32% 91%',
  '--lp-blue': '221 83% 53%',
  '--lp-blue-soft': '214 95% 93%',
  '--lp-blue-ink': '224 76% 28%',
} as React.CSSProperties;

export default function LandingPage() {
  const { settings } = useClinicSettings();
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState<{
    patients: number;
    specialties: number;
    professionals: number;
    appointments: number;
  } | null>(null);
  const [specialtiesList, setSpecialtiesList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('specialties')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (data) setSpecialtiesList(data);
    })();
  }, []);

  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';
  const clinicLogo = settings?.logo_url || logoPacem;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_landing_stats');
      if (!error && data && data.length > 0) {
        const r = data[0] as {
          patients_count: number;
          specialties_count: number;
          professionals_count: number;
          appointments_count: number;
        };
        setStats({
          patients: r.patients_count ?? 0,
          specialties: r.specialties_count ?? 0,
          professionals: r.professionals_count ?? 0,
          appointments: r.appointments_count ?? 0,
        });
      }
    })();
  }, []);

  const formatStat = (n: number) => {
    if (n >= 1000) return `+${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0').slice(0, 3)}`.replace(/\.0+$/, '');
    return `+${n}`;
  };

  return (
    <div
      style={lpStyles}
      className="relative min-h-screen overflow-x-hidden bg-[hsl(var(--lp-bg))] font-['Inter',_sans-serif] text-[hsl(var(--lp-ink))] antialiased"
    >
      <SeoHead />
      {/* ============== HEADER ============== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[hsl(var(--lp-line))] bg-white/85 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--lp-line))]'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-4 md:px-10 py-2 md:py-3">
          <Link to="/" className="flex items-center gap-2 md:gap-2.5 min-w-0">
            <img src={clinicLogo} alt={clinicName} className="h-8 md:h-9 w-auto object-contain shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="text-[14px] md:text-[15px] font-bold tracking-tight text-[hsl(var(--lp-ink))] truncate">
                {clinicName}
              </div>
              <div className="hidden sm:block text-[9px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--lp-muted))]">
                Cuidado · Confiança
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-9 text-[14px] font-medium text-[hsl(var(--lp-ink))]/75">
            <a href="#beneficios" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Benefícios</a>
            <a href="#especialidades" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Especialidades</a>
            <a href="#sobre" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Sobre</a>
            <a href="#contato" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Contato</a>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-[hsl(var(--lp-ink))] hover:bg-[hsl(var(--lp-blue-soft))]/60 hover:text-[hsl(var(--lp-blue-ink))]">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-xl bg-[hsl(var(--lp-blue))] text-white hover:bg-[hsl(var(--lp-blue-ink))] shadow-[0_8px_24px_-8px_hsl(var(--lp-blue)/0.5)] transition-all px-3 md:px-4"
            >
              <Link to="/cadastro">
                <span className="hidden sm:inline">Agendar avaliação</span>
                <span className="sm:hidden">Agendar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ============== HERO ============== */}
      <section className="relative pt-24 pb-14 md:pt-36 md:pb-24">
        {/* subtle ambient */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[hsl(var(--lp-blue)/0.08)] blur-3xl" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--lp-blue)/0.06)] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-10 relative">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center"
          >
            {/* LEFT — TEXT */}
            <div>
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--lp-line))] bg-white px-3 py-1.5 text-[11px] md:text-[11.5px] font-semibold text-[hsl(var(--lp-blue-ink))] shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--lp-blue))]" />
                Excelência em saúde e bem-estar
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-5 md:mt-7 text-[32px] sm:text-[40px] md:text-[54px] lg:text-[62px] font-extrabold leading-[1.05] tracking-[-0.025em] text-[hsl(var(--lp-ink))]"
              >
                Agende suas consultas{' '}
                <span className="text-[hsl(var(--lp-blue))]">com facilidade</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-4 md:mt-6 text-[15px] md:text-lg text-[hsl(var(--lp-muted))] max-w-xl leading-relaxed"
              >
                Simplifique o cuidado com sua saúde. Agende consultas online, acompanhe seu histórico
                médico e gerencie seus atendimentos em um só lugar.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-7 md:mt-9 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  asChild
                  className="h-12 px-6 md:px-7 rounded-xl bg-[hsl(var(--lp-blue))] hover:bg-[hsl(var(--lp-blue-ink))] text-white text-[14.5px] font-semibold shadow-[0_14px_36px_-12px_hsl(var(--lp-blue)/0.6)] transition-all hover:-translate-y-0.5"
                >
                  <Link to="/cadastro">
                    Criar minha conta
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 px-6 md:px-7 rounded-xl border-[hsl(var(--lp-line))] bg-white text-[hsl(var(--lp-ink))] hover:bg-[hsl(var(--lp-blue-soft))]/50 hover:text-[hsl(var(--lp-blue-ink))] hover:border-[hsl(var(--lp-blue)/0.3)] text-[14.5px] font-semibold transition-all"
                >
                  <Link to="/login">Já tenho conta</Link>
                </Button>
              </motion.div>

              {/* trust row */}
              <motion.div variants={fadeUp} className="mt-8 md:mt-10 flex items-center gap-3 md:gap-4">
                <div className="flex -space-x-2.5">
                  {[
                    'from-blue-200 to-blue-400',
                    'from-teal-200 to-teal-400',
                    'from-indigo-200 to-indigo-400',
                    'from-sky-200 to-sky-400',
                  ].map((g, i) => (
                    <div
                      key={i}
                      className={`h-9 w-9 rounded-full border-2 border-white bg-gradient-to-br ${g} shadow-sm`}
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[hsl(var(--lp-blue))]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-[12.5px] text-[hsl(var(--lp-muted))] mt-0.5">
                    {stats && stats.patients > 0
                      ? `Mais de ${stats.patients.toLocaleString('pt-BR')} pacientes atendidos com excelência`
                      : 'Pacientes atendidos com excelência'}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* RIGHT — IMAGE */}
            <motion.div
              variants={fadeUp}
              className="relative"
            >
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[hsl(var(--lp-blue)/0.12)] via-transparent to-[hsl(var(--lp-blue)/0.08)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[hsl(var(--lp-line))] bg-white shadow-[0_30px_80px_-30px_hsl(var(--lp-blue)/0.35)]">
                <img
                  src={clinicHero}
                  alt={`Recepção da ${clinicName}`}
                  className="w-full h-[280px] sm:h-[420px] md:h-[520px] object-cover"
                  width={1024}
                  height={1024}
                />
              </div>
              {/* floating badge */}
              <div className="absolute -bottom-5 -left-4 md:-left-8 hidden sm:flex items-center gap-3 rounded-2xl border border-[hsl(var(--lp-line))] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_18px_40px_-18px_hsl(var(--lp-ink)/0.25)]">
                <div className="h-10 w-10 rounded-xl bg-[hsl(var(--lp-blue-soft))] flex items-center justify-center">
                  <HeartPulse className="h-5 w-5 text-[hsl(var(--lp-blue))]" />
                </div>
                <div className="leading-tight">
                  <p className="text-[12px] text-[hsl(var(--lp-muted))]">Satisfação</p>
                  <p className="text-[15px] font-bold text-[hsl(var(--lp-ink))]">98% garantida</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* STATS BAR */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
            className="mt-12 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-line))] shadow-[0_18px_60px_-30px_hsl(var(--lp-ink)/0.15)]"
          >
            {[
              { icon: Users, v: stats ? stats.patients.toLocaleString('pt-BR') : '—', l: 'Pacientes cadastrados' },
              { icon: Star, v: stats ? String(stats.specialties) : '—', l: 'Especialidades' },
              { icon: Stethoscope, v: stats ? String(stats.professionals) : '—', l: 'Profissionais' },
              { icon: HeartPulse, v: stats ? stats.appointments.toLocaleString('pt-BR') : '—', l: 'Consultas realizadas' },
            ].map((s) => (
              <motion.div
                key={s.l}
                variants={fadeUp}
                className="bg-white px-4 sm:px-6 py-5 sm:py-7 flex items-center gap-3 sm:gap-4"
              >
                <div className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl bg-[hsl(var(--lp-blue-soft))] flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-[hsl(var(--lp-blue))]" strokeWidth={1.8} />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-[18px] sm:text-[22px] font-extrabold tracking-tight text-[hsl(var(--lp-ink))]">{s.v}</div>
                  <div className="text-[11.5px] sm:text-[12.5px] text-[hsl(var(--lp-muted))] mt-0.5">{s.l}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============== FEATURES / SOBRE ============== */}
      <section id="sobre" className="relative py-16 md:py-28">
        <div className="container mx-auto px-5 md:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
            className="max-w-2xl mx-auto text-center mb-16"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]"
            >
              + Nossos diferenciais
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="mt-6 text-[28px] md:text-[44px] font-extrabold tracking-[-0.02em] leading-[1.1] text-[hsl(var(--lp-ink))]"
            >
              Tecnologia que <span className="text-[hsl(var(--lp-blue))]">cuida</span> de você
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-[16px] text-[hsl(var(--lp-muted))] leading-relaxed">
              Experiência completa e segura para o cuidado da sua saúde, com a confiança de uma clínica
              tradicional e a praticidade de um sistema moderno.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group relative rounded-2xl border border-[hsl(var(--lp-line))] bg-white p-6 shadow-[0_4px_18px_-10px_hsl(var(--lp-ink)/0.1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_hsl(var(--lp-blue)/0.35)] hover:border-[hsl(var(--lp-blue)/0.3)]"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--lp-blue-soft))] text-[hsl(var(--lp-blue))] group-hover:bg-[hsl(var(--lp-blue))] group-hover:text-white transition-colors">
                  <f.icon className="h-5.5 w-5.5" strokeWidth={1.8} />
                </div>
                <h3 className="text-[16px] font-bold text-[hsl(var(--lp-ink))] mb-2 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-[13.5px] leading-relaxed text-[hsl(var(--lp-muted))]">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============== ESPECIALIDADES ============== */}
      <section id="especialidades" className="relative py-16 md:py-28 bg-white border-y border-[hsl(var(--lp-line))]">
        <div className="container mx-auto px-5 md:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
            className="max-w-2xl mx-auto text-center mb-14"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]"
            >
              + Especialidades
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className="mt-6 text-[28px] md:text-[44px] font-extrabold tracking-[-0.02em] leading-[1.1] text-[hsl(var(--lp-ink))]"
            >
              Um time completo, <span className="text-[hsl(var(--lp-blue))]">à sua disposição</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto"
          >
            {specialtiesList.map((sp) => {
              const Icon = specialtyIconFor(sp.name);
              return (
                <motion.div
                  key={sp.id}
                  variants={fadeUp}
                  className="group rounded-2xl border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_40px_-18px_hsl(var(--lp-blue)/0.3)] hover:border-[hsl(var(--lp-blue)/0.3)]"
                >
                  <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white border border-[hsl(var(--lp-line))] text-[hsl(var(--lp-blue))] group-hover:bg-[hsl(var(--lp-blue))] group-hover:text-white group-hover:border-transparent transition-colors">
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[15px] font-bold text-[hsl(var(--lp-ink))]">{sp.name}</h3>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ============== BENEFÍCIOS ============== */}
      <section id="beneficios" className="relative py-16 md:py-28">
        <div className="container mx-auto px-5 md:px-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.05 }}
              variants={stagger}
            >
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]"
              >
                + Benefícios
              </motion.span>
              <motion.h2
                variants={fadeUp}
                className="mt-6 text-[28px] md:text-[44px] font-extrabold tracking-[-0.02em] leading-[1.08] text-[hsl(var(--lp-ink))]"
              >
                Tudo que você precisa para <span className="text-[hsl(var(--lp-blue))]">gerenciar</span> sua saúde
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-5 text-[16px] text-[hsl(var(--lp-muted))] leading-relaxed">
                Nosso portal oferece uma experiência completa e intuitiva para você cuidar
                da sua saúde de forma prática e organizada.
              </motion.p>
              <motion.ul variants={stagger} className="mt-8 space-y-3.5">
                {benefits.map((b, i) => (
                  <motion.li
                    key={i}
                    variants={fadeUp}
                    className="flex items-start gap-3 group"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--lp-blue-soft))] text-[hsl(var(--lp-blue))] shrink-0 group-hover:bg-[hsl(var(--lp-blue))] group-hover:text-white transition-colors">
                      <CheckCircle className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span className="text-[15.5px] text-[hsl(var(--lp-ink))] pt-0.5">{b}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp} className="mt-9">
                <Button
                  size="lg"
                  asChild
                  className="h-12 px-7 rounded-xl bg-[hsl(var(--lp-blue))] hover:bg-[hsl(var(--lp-blue-ink))] text-white text-[14.5px] font-semibold shadow-[0_14px_36px_-12px_hsl(var(--lp-blue)/0.55)] transition-all hover:-translate-y-0.5"
                >
                  <Link to="/cadastro">
                    Começar agora
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* card visual */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[hsl(var(--lp-blue)/0.12)] to-transparent blur-2xl" />
              <div className="relative rounded-[1.75rem] border border-[hsl(var(--lp-line))] bg-white p-7 shadow-[0_30px_70px_-30px_hsl(var(--lp-blue)/0.3)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-11 w-11 rounded-xl bg-[hsl(var(--lp-blue-soft))] flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[hsl(var(--lp-blue))]" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[14px] font-bold text-[hsl(var(--lp-ink))]">Próxima consulta</p>
                    <p className="text-[12px] text-[hsl(var(--lp-muted))]">Segunda-feira · 10:00</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: 'Dr. João Silva', specialty: 'Cardiologista', rating: '4.9' },
                    { name: 'Dra. Maria Santos', specialty: 'Dermatologista', rating: '4.8' },
                    { name: 'Dr. Pedro Lima', specialty: 'Clínico Geral', rating: '4.9' },
                  ].map((doc) => (
                    <div
                      key={doc.name}
                      className="group flex items-center justify-between p-3.5 rounded-xl border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] hover:bg-white hover:border-[hsl(var(--lp-blue)/0.3)] hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white border border-[hsl(var(--lp-line))] flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-[hsl(var(--lp-blue))]" />
                        </div>
                        <div className="leading-tight">
                          <p className="text-[13.5px] font-semibold text-[hsl(var(--lp-ink))]">{doc.name}</p>
                          <p className="text-[11.5px] text-[hsl(var(--lp-muted))]">{doc.specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[hsl(var(--lp-blue))]">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-[12px] font-semibold">{doc.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-[hsl(var(--lp-line))] flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[hsl(var(--lp-muted))]">
                  <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> LGPD</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 24/7</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Criptografia</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== CTA ============== */}
      <section className="relative pb-24">
        <div className="container mx-auto px-5 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl bg-[hsl(var(--lp-blue))] px-5 py-8 md:px-12 md:py-12 shadow-[0_30px_70px_-25px_hsl(var(--lp-blue)/0.55)]"
          >
            <div aria-hidden className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }} />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-[20px] md:text-[26px] font-extrabold text-white tracking-tight leading-tight">
                    Pronto para cuidar da sua saúde?
                  </h3>
                  <p className="text-[14.5px] text-white/85 mt-1">
                    Crie sua conta gratuitamente e agende suas consultas hoje mesmo.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                asChild
                className="h-12 px-7 rounded-xl bg-white text-[hsl(var(--lp-blue-ink))] hover:bg-white/90 text-[14.5px] font-semibold shadow-lg transition-all hover:-translate-y-0.5 shrink-0"
              >
                <Link to="/cadastro">
                  Agendar avaliação
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer id="contato" className="bg-white border-t border-[hsl(var(--lp-line))] text-[hsl(var(--lp-muted))]">
        <div className="container mx-auto px-5 md:px-10 py-12 md:py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={clinicLogo} alt={clinicName} className="h-9 w-auto object-contain" />
              <div className="leading-tight">
                <div className="text-[hsl(var(--lp-ink))] font-bold">{clinicName}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--lp-muted))]">Cuidado · Confiança</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/clinicapacem"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram: Clínica Pacem (@clinicapacem)"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--lp-line))] bg-white text-[hsl(var(--lp-muted))] hover:text-[hsl(var(--lp-blue))] hover:border-[hsl(var(--lp-blue)/0.4)] transition-colors"
              >
                <Instagram className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </a>
              <a
                href="https://www.facebook.com/clinicapacem"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook: Clínica Pacem"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--lp-line))] bg-white text-[hsl(var(--lp-muted))] hover:text-[hsl(var(--lp-blue))] hover:border-[hsl(var(--lp-blue)/0.4)] transition-colors"
              >
                <Facebook className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </a>
            </div>
            <Link
              to="/politica-de-privacidade"
              className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-[hsl(var(--lp-muted))] hover:text-[hsl(var(--lp-blue))] transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              Política de Privacidade
            </Link>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--lp-ink))] mb-4">Atendimento</p>
            <ul className="space-y-2.5 text-[14px]">
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--lp-blue))]" />
                <div>
                  <div className="text-[hsl(var(--lp-ink))] font-semibold">Segunda a Sexta</div>
                  <div>08h às 19h</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--lp-blue))]" />
                <div>
                  <div className="text-[hsl(var(--lp-ink))] font-semibold">Sábado</div>
                  <div>08h às 13h</div>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--lp-ink))] mb-4">Navegação</p>
            <ul className="space-y-2.5 text-[14px]">
              <li><a href="#sobre" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Sobre</a></li>
              <li><a href="#especialidades" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Especialidades</a></li>
              <li><a href="#beneficios" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Benefícios</a></li>
              <li><Link to="/login" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Entrar</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--lp-ink))] mb-4">Contato</p>
            <ul className="space-y-2.5 text-[14px]">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--lp-blue))]" />{settings?.endereco_completo || 'Endereço da clínica'}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-[hsl(var(--lp-blue))]" />(61) 99811-7985</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-[hsl(var(--lp-blue))]" />{settings?.email_contato || 'contato@clinica.com'}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[hsl(var(--lp-line))]">
          <div className="container mx-auto px-5 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12.5px] text-[hsl(var(--lp-muted))]">
            <p>© {new Date().getFullYear()} {clinicName}. Todos os direitos reservados.</p>
            <Link to="/admin/auth" className="hover:text-[hsl(var(--lp-blue))] transition-colors">Área Administrativa</Link>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/5561998117985"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale conosco no WhatsApp"
        className="fixed bottom-24 md:bottom-28 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-8px_rgba(37,211,102,0.6)] hover:scale-105 hover:shadow-[0_16px_36px_-8px_rgba(37,211,102,0.7)] transition-all duration-300"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
        </svg>
      </a>
    </div>
  );
}
