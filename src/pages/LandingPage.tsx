import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { SeoHead } from '@/components/SeoHead';
import { PublicHeader } from '@/components/site/PublicHeader';
import { supabase } from '@/integrations/supabase/client';
import { makeProfessionalSlug } from '@/lib/slug';
import logoPacem from '@/assets/logoPacem.png';
import clinicHero from '@/assets/clinic-hero.jpg';
import {
  Brain,
  Stethoscope,
  Apple,
  MessageSquare,
  Heart,
  Briefcase,
  CheckCircle,
  ArrowRight,
  Star,
  Sparkles,
  HeartPulse,
  Phone,
  MapPin,
  Mail,
  Instagram,
  Facebook,
  Lock,
  Clock,
  ShieldCheck,
  Users,
  GraduationCap,
  Calendar,
  MessageCircle,
  ClipboardList,
  Cross,
  BookOpen,
  Activity,
} from 'lucide-react';
import { PublicFooter } from '@/components/site/PublicFooter';

const WHATSAPP = '5561981823984';
const wa = (msg = 'Olá! Gostaria de agendar uma consulta na Clínica Pacem.') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

const ICON_MAP: Record<string, any> = {
  Brain, Stethoscope, Apple, MessageSquare, HeartPulse, Briefcase,
  ClipboardList, Cross, BookOpen, Activity, Heart,
};

const especialidadesDefault = [
  { slug: 'psicologia', icon: 'Brain', title: 'Psicologia', desc: 'Acompanhamento psicoterapêutico individual para adultos, adolescentes e crianças.' },
  { slug: 'psiquiatria', icon: 'Stethoscope', title: 'Psiquiatria', desc: 'Avaliação e tratamento medicamentoso para depressão, ansiedade, TDAH e outros transtornos.' },
  { slug: 'nutricao', icon: 'Apple', title: 'Nutrição', desc: 'Nutrição comportamental integrada à saúde mental e qualidade de vida.' },
  { slug: 'fonoaudiologia', icon: 'MessageSquare', title: 'Fonoaudiologia', desc: 'Diagnóstico e terapia para linguagem, fala, voz e desenvolvimento infantil.' },
  { slug: 'rn1', icon: 'Briefcase', title: 'RN-1', desc: 'Cuidado completo para colaboradores com acesso à Psiquiatria, Psicologia, Nutrição e Personal Trainer, além de atendimento médico 24h e teleconsultas. Mais saúde, bem-estar e produtividade para sua equipe.' },
  { slug: 'avaliacao-neuropsicologica', icon: 'ClipboardList', title: 'Avaliação Neuropsicológica', desc: 'Investigação aprofundada das funções cognitivas — memória, atenção, linguagem e funções executivas — para diagnóstico e orientação terapêutica.' },
  { slug: 'clinico-medico', icon: 'Cross', title: 'Clínico Médico', desc: 'Consulta médica ampla com avaliação clínica, solicitação de exames, acompanhamento de doenças crônicas e cuidado preventivo em todas as idades.' },
  { slug: 'psicopedagogia', icon: 'BookOpen', title: 'Psicopedagogia', desc: 'Avaliação e intervenção para dificuldades de aprendizagem, desenvolvimento escolar, TDAH e organização de estudos para crianças e adolescentes.' },
  { slug: 'neurologia', icon: 'Activity', title: 'Neurologia', desc: 'Diagnóstico e tratamento de doenças do sistema nervoso: cefaleias, epilepsia, tonturas, distúrbios do sono e doenças neurodegenerativas.' },
];


const diferenciais = [
  { icon: Users, title: 'Equipe multidisciplinar', desc: 'Psicólogos, psiquiatras, nutricionistas e fonoaudiólogos trabalhando juntos.' },
  { icon: Heart, title: 'Atendimento humanizado', desc: 'Acolhimento real, sem julgamentos, no seu ritmo.' },
  { icon: GraduationCap, title: 'Profissionais especializados', desc: 'Pós-graduação e formações reconhecidas em diversas abordagens.' },
  { icon: MapPin, title: 'Localização estratégica', desc: 'Asa Norte — Brasília, fácil acesso e estacionamento.' },
  { icon: Calendar, title: 'Presencial e online', desc: 'Você escolhe a modalidade que melhor se adapta à sua rotina.' },
  { icon: ShieldCheck, title: 'Ambiente acolhedor', desc: 'Espaço pensado para o seu conforto e sigilo absoluto.' },
];

const depoimentos = [
  { nome: 'Mariana S.', texto: 'Encontrei na Clínica Pacem um espaço seguro. A escuta cuidadosa fez toda a diferença na minha jornada com a ansiedade.', estrelas: 5 },
  { nome: 'Carlos H.', texto: 'Atendimento humano de verdade. Recomendo a quem busca tratamento sério para depressão em Brasília.', estrelas: 5 },
  { nome: 'Juliana M.', texto: 'A terapia de casal salvou nossa relação. Profissionais preparados e ambiente extremamente acolhedor.', estrelas: 5 },
  { nome: 'Fernanda L.', texto: 'Minha filha adora as sessões. A terapia infantil tem sido transformadora para toda a família.', estrelas: 5 },
];

const faqs = [
  {
    q: 'Como saber se preciso de terapia?',
    a: 'Sinais comuns incluem tristeza persistente, ansiedade frequente, dificuldade para dormir, perda de interesse em atividades, irritabilidade, conflitos nos relacionamentos ou sensação de estar sobrecarregado. Se algo está afetando sua qualidade de vida, vale conversar com um profissional.',
  },
  {
    q: 'Psicólogo e psiquiatra fazem a mesma coisa?',
    a: 'Não. O psicólogo atua com psicoterapia (conversa terapêutica) e o psiquiatra é médico, podendo prescrever medicamentos. Em muitos casos os dois trabalham juntos para um tratamento mais completo.',
  },
  {
    q: 'Terapia online funciona?',
    a: 'Sim. Estudos mostram eficácia equivalente à terapia presencial para a maioria das demandas. A Clínica Pacem oferece atendimento online com a mesma qualidade técnica do presencial.',
  },
  {
    q: 'Quanto tempo dura o tratamento?',
    a: 'Varia conforme o caso e o objetivo. Tratamentos focais podem durar de 3 a 6 meses; processos mais profundos podem se estender por mais tempo. O profissional discute o plano com você desde a primeira sessão.',
  },
  {
    q: 'Como agendar uma consulta?',
    a: 'Você pode agendar online pelo nosso portal do paciente, falar diretamente com nossa equipe pelo WhatsApp (61) 98182-3984 ou criar sua conta gratuitamente em poucos segundos.',
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

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

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
  </svg>
);

export default function LandingPage() {
  const { settings } = useClinicSettings();
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState<{ patients: number; appointments: number } | null>(null);
  const [posts, setPosts] = useState<Array<{ id: string; title: string; excerpt: string | null; cover_url: string | null; author: string | null; published_at: string; slug: string }>>([]);
  const [team, setTeam] = useState<Array<{ id: string; full_name: string; photo_url: string | null; landing_bio: string | null; specialty_name: string | null }>>([]);
  const [especialidades, setEspecialidades] = useState<Array<{ slug: string; icon: string; title: string; desc: string }>>(especialidadesDefault);


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
      const { data } = await supabase.rpc('get_landing_stats');
      if (data && data.length > 0) {
        const r = data[0] as { patients_count: number; appointments_count: number };
        setStats({ patients: r.patients_count ?? 0, appointments: r.appointments_count ?? 0 });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, cover_url, author, published_at, slug')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(6);
      if (data) setPosts(data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.rpc as any)('get_landing_professionals');
      if (data) setTeam(data as any);
    })();
  }, []);


  return (
    <div
      style={lpStyles}
      className="relative min-h-screen overflow-x-hidden bg-[hsl(var(--lp-bg))] font-['Inter',_sans-serif] text-[hsl(var(--lp-ink))] antialiased"
    >
      <SeoHead />

      <PublicHeader floating />


      {/* HERO */}
      <section className="relative pt-24 pb-14 md:pt-36 md:pb-24">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-[hsl(var(--lp-blue)/0.08)] blur-3xl" />
          <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--lp-blue)/0.06)] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 md:px-10 relative">
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div>
              <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--lp-line))] bg-white px-3 py-1.5 text-[11.5px] font-semibold text-[hsl(var(--lp-blue-ink))] shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--lp-blue))]" />
                Referência em saúde mental em Brasília
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-5 md:mt-7 text-[32px] sm:text-[40px] md:text-[54px] lg:text-[60px] font-extrabold leading-[1.05] tracking-[-0.025em]"
              >
                Cuidar da sua <span className="text-[hsl(var(--lp-blue))]">saúde mental</span> pode começar hoje.
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 md:mt-6 text-[16px] md:text-lg text-[hsl(var(--lp-muted))] max-w-xl leading-relaxed">
                Atendimento especializado em Psicologia, Psiquiatria, Nutrição e Terapias
                Integradas para crianças, adolescentes, adultos e casais.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-7 md:mt-9 flex flex-col sm:flex-row gap-3">
                <a
                  href={wa('Olá! Gostaria de agendar uma consulta na Clínica Pacem.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[14.5px] font-semibold shadow-[0_14px_36px_-12px_rgba(37,211,102,0.6)] transition-all hover:-translate-y-0.5"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Agende agora
                </a>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-8 md:mt-10 flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {['from-blue-200 to-blue-400', 'from-teal-200 to-teal-400', 'from-indigo-200 to-indigo-400', 'from-sky-200 to-sky-400'].map((g, i) => (
                    <div key={i} className={`h-9 w-9 rounded-full border-2 border-white bg-gradient-to-br ${g} shadow-sm`} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[hsl(var(--lp-blue))]">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <p className="text-[12.5px] text-[hsl(var(--lp-muted))] mt-0.5">
                    {stats && stats.patients > 0
                      ? `Mais de ${stats.patients.toLocaleString('pt-BR')} pacientes atendidos`
                      : 'Pacientes atendidos com excelência'}
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeUp} className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[hsl(var(--lp-blue)/0.12)] via-transparent to-[hsl(var(--lp-blue)/0.08)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[hsl(var(--lp-line))] bg-white shadow-[0_30px_80px_-30px_hsl(var(--lp-blue)/0.35)]">
                <img
                  src={clinicHero}
                  alt={`Recepção da ${clinicName} — clínica de psicologia em Brasília`}
                  className="w-full h-[280px] sm:h-[420px] md:h-[520px] object-cover"
                  width={1024}
                  height={1024}
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-5 -left-4 md:-left-8 hidden sm:flex items-center gap-3 rounded-2xl border border-[hsl(var(--lp-line))] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_18px_40px_-18px_hsl(var(--lp-ink)/0.25)]">
                <div className="h-10 w-10 rounded-xl bg-[hsl(var(--lp-blue-soft))] flex items-center justify-center">
                  <HeartPulse className="h-5 w-5 text-[hsl(var(--lp-blue))]" />
                </div>
                <div className="leading-tight">
                  <p className="text-[12px] text-[hsl(var(--lp-muted))]">Avaliação</p>
                  <p className="text-[15px] font-bold">4.9 · Google</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section id="especialidades" className="relative py-16 md:py-24 bg-white border-y border-[hsl(var(--lp-line))]">
        <div className="container mx-auto px-5 md:px-10">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]">
              Especialidades
            </span>
            <h2 className="mt-5 text-[28px] md:text-[42px] font-extrabold tracking-[-0.02em] leading-[1.1]">
              Cuidado integral para sua <br className="hidden sm:block" /><span className="text-[hsl(var(--lp-blue))]">saúde mental</span>
            </h2>
            <p className="mt-4 text-[15.5px] text-[hsl(var(--lp-muted))]">
              Equipe multidisciplinar para acompanhar cada etapa da sua jornada.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.05 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
          >
            {especialidades.map((sp) => (
              <motion.div
                key={sp.title}
                variants={fadeUp}
                className="group flex h-full flex-col rounded-2xl border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_40px_-18px_hsl(var(--lp-blue)/0.3)] hover:border-[hsl(var(--lp-blue)/0.3)]"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white border border-[hsl(var(--lp-line))] text-[hsl(var(--lp-blue))] group-hover:bg-[hsl(var(--lp-blue))] group-hover:text-white group-hover:border-transparent transition-colors">
                    <sp.icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <a
                    href={wa(`Olá! Gostaria de agendar ${sp.title} na Clínica Pacem.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Agendar ${sp.title} pelo WhatsApp`}
                    className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[14px] font-semibold shadow-[0_8px_20px_-10px_rgba(37,211,102,0.7)] transition-all"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Agende agora
                  </a>
                </div>
                <h3 className="text-[17px] font-bold mb-2">{sp.title}</h3>
                <p className="text-[14px] text-[hsl(var(--lp-muted))] leading-relaxed mb-4">{sp.desc}</p>
                <Link
                  to={`/especialidades/${sp.slug}`}
                  className="mt-auto inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[hsl(var(--lp-blue))] hover:text-[hsl(var(--lp-blue-ink))] transition-colors"
                >
                  Saiba mais
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="py-16 md:py-24">
        <div className="container mx-auto px-5 md:px-10">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]">
              Por que escolher
            </span>
            <h2 className="mt-5 text-[28px] md:text-[42px] font-extrabold tracking-[-0.02em] leading-[1.1]">
              Por que escolher a <br className="hidden sm:block" /><span className="text-[hsl(var(--lp-blue))]">Clínica Pacem</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {diferenciais.map((d) => (
              <div
                key={d.title}
                className="flex gap-4 p-6 rounded-2xl border border-[hsl(var(--lp-line))] bg-white hover:shadow-[0_18px_40px_-18px_hsl(var(--lp-blue)/0.25)] transition-shadow"
              >
                <div className="shrink-0 h-11 w-11 rounded-xl bg-[hsl(var(--lp-blue-soft))] text-[hsl(var(--lp-blue))] flex items-center justify-center">
                  <d.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-[15.5px] font-bold mb-1">{d.title}</h3>
                  <p className="text-[13.5px] text-[hsl(var(--lp-muted))] leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section id="equipe" className="py-16 md:py-24 bg-white border-y border-[hsl(var(--lp-line))]">
        <div className="container mx-auto px-5 md:px-10">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]">
              Quem cuida de você
            </span>
            <h2 className="mt-5 text-[28px] md:text-[42px] font-extrabold tracking-[-0.02em] leading-[1.1]">
              Profissionais qualificados <br className="hidden sm:block" /><span className="text-[hsl(var(--lp-blue))]">e dedicados</span>
            </h2>
            <p className="mt-4 text-[15.5px] text-[hsl(var(--lp-muted))]">
              Formação sólida, atualização constante e compromisso com o seu bem-estar.
            </p>
          </div>



          {team.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {team.map((m) => (
                <Link
                  key={m.id}
                  to={`/equipe/${makeProfessionalSlug(m.id, m.full_name)}`}
                  className="group rounded-2xl border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] p-6 text-center transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  {m.photo_url ? (
                    <div className="mx-auto mb-4 h-24 w-24 rounded-full overflow-hidden border border-[hsl(var(--lp-line))] bg-white">
                      <img src={m.photo_url} alt={m.full_name} loading="lazy"
                        className="h-full w-full object-cover object-top scale-110" />
                    </div>
                  ) : (
                    <div className="mx-auto mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white text-[hsl(var(--lp-blue))] border border-[hsl(var(--lp-line))]">
                      <Users className="h-8 w-8" />
                    </div>
                  )}
                  <h3 className="text-[16px] font-bold mb-0.5 group-hover:text-[hsl(var(--lp-blue))]">{m.full_name}</h3>
                  {m.specialty_name && (
                    <p className="text-[13px] text-[hsl(var(--lp-blue))] font-semibold mb-2">{m.specialty_name}</p>
                  )}
                  <span className="text-[12.5px] text-[hsl(var(--lp-muted))] underline-offset-2 group-hover:underline">Ver perfil</span>
                </Link>
              ))}

            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {[
                { icon: GraduationCap, title: 'Formação sólida', desc: 'Pós-graduação e especializações reconhecidas.' },
                { icon: ShieldCheck, title: 'Registro profissional', desc: 'Equipe regularizada e ética profissional rigorosa.' },
                { icon: Heart, title: 'Escuta humanizada', desc: 'Cuidado verdadeiro, respeito ao seu tempo.' },
              ].map((b) => (
                <div key={b.title} className="rounded-2xl border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] p-6 text-center">
                  <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[hsl(var(--lp-blue))] border border-[hsl(var(--lp-line))]">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[15.5px] font-bold mb-1">{b.title}</h3>
                  <p className="text-[13.5px] text-[hsl(var(--lp-muted))] leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          )}


          <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link to="/equipe"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[hsl(var(--lp-blue))] text-white font-semibold hover:bg-[hsl(var(--lp-blue-ink))] transition-colors">
              Ver todos os profissionais <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={wa('Olá! Gostaria de conhecer a equipe da Clínica Pacem.')} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold transition-colors">
              Agende agora
            </a>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section id="depoimentos" className="py-16 md:py-24">
        <div className="container mx-auto px-5 md:px-10">
          <div className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]">
              Depoimentos
            </span>
            <h2 className="mt-5 text-[28px] md:text-[42px] font-extrabold tracking-[-0.02em] leading-[1.1]">
              Histórias de quem <br className="hidden sm:block" /><span className="text-[hsl(var(--lp-blue))]">confia na Pacem</span>
            </h2>
            <div className="mt-5 inline-flex items-center gap-2 text-[14px] text-[hsl(var(--lp-muted))]">
              <div className="flex text-[hsl(var(--lp-blue))]">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <span className="font-semibold text-[hsl(var(--lp-ink))]">4.9</span> · Avaliações no Google
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {depoimentos.map((d) => (
              <figure
                key={d.nome}
                className="rounded-2xl border border-[hsl(var(--lp-line))] bg-white p-6 shadow-[0_4px_18px_-10px_hsl(var(--lp-ink)/0.1)]"
              >
                <div className="flex text-[hsl(var(--lp-blue))] mb-3">
                  {[...Array(d.estrelas)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="text-[14px] leading-relaxed text-[hsl(var(--lp-ink))]/85 mb-4">"{d.texto}"</blockquote>
                <figcaption className="text-[12.5px] font-semibold text-[hsl(var(--lp-muted))]">— {d.nome}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      {posts.length > 0 && (
        <section id="blog" className="py-16 md:py-24">
          <div className="container mx-auto px-5 md:px-10">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]">
                Blog
              </span>
              <h2 className="mt-5 text-[28px] md:text-[42px] font-extrabold tracking-[-0.02em] leading-[1.1]">
                Conteúdo sobre <br className="hidden sm:block" /><span className="text-[hsl(var(--lp-blue))]">saúde mental</span>
              </h2>
              <p className="mt-4 text-[15.5px] text-[hsl(var(--lp-muted))]">
                Artigos escritos pela nossa equipe para informar e cuidar de você.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group rounded-2xl border border-[hsl(var(--lp-line))] bg-white overflow-hidden hover:shadow-[0_18px_40px_-18px_hsl(var(--lp-blue)/0.3)] transition-all hover:-translate-y-1"
                >
                  {p.cover_url ? (
                    <img src={p.cover_url} alt={p.title} className="w-full h-44 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-[hsl(var(--lp-blue-soft))] to-white flex items-center justify-center">
                      <Brain className="h-12 w-12 text-[hsl(var(--lp-blue))]/30" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-[16px] font-bold leading-snug mb-2 line-clamp-2 group-hover:text-[hsl(var(--lp-blue))] transition-colors">{p.title}</h3>
                    {p.excerpt && <p className="text-[13.5px] text-[hsl(var(--lp-muted))] leading-relaxed line-clamp-3">{p.excerpt}</p>}
                    <p className="text-[11.5px] text-[hsl(var(--lp-muted))] mt-3">
                      {p.author && <>por <span className="font-semibold text-[hsl(var(--lp-ink))]">{p.author}</span> · </>}
                      {new Date(p.published_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}




      {/* CTA WHATSAPP MIDDLE */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-5 md:px-10">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-r from-[#25D366] to-[#1ebe5d] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-5 shadow-[0_30px_70px_-25px_rgba(37,211,102,0.55)]">
            <div className="flex items-center gap-4 text-white">
              <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                <WhatsAppIcon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-[20px] md:text-[24px] font-extrabold tracking-tight">Fale agora com um especialista</h3>
                <p className="text-[14px] text-white/90 mt-0.5">Atendimento rápido e humanizado pelo WhatsApp.</p>
              </div>
            </div>
            <a
              href={wa()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white text-[#1ebe5d] text-[14.5px] font-bold hover:-translate-y-0.5 transition-all shadow-lg shrink-0"
            >
              <MessageCircle className="h-5 w-5" />
              Agende agora
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-white border-y border-[hsl(var(--lp-line))]">
        <div className="container mx-auto px-5 md:px-10">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--lp-line))] bg-[hsl(var(--lp-bg))] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--lp-blue))]">
              Dúvidas frequentes
            </span>
            <h2 className="mt-5 text-[28px] md:text-[42px] font-extrabold tracking-[-0.02em] leading-[1.1]">
              Perguntas <br className="hidden sm:block" /><span className="text-[hsl(var(--lp-blue))]">Frequentes</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-[hsl(var(--lp-line))] rounded-xl bg-[hsl(var(--lp-bg))] px-5 data-[state=open]:bg-white data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="text-left text-[15px] font-semibold hover:no-underline py-4">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[14px] text-[hsl(var(--lp-muted))] leading-relaxed pb-4">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-5 md:px-10">
          <div className="relative overflow-hidden rounded-3xl bg-[hsl(var(--lp-blue))] px-6 py-12 md:px-14 md:py-16 text-center shadow-[0_30px_70px_-25px_hsl(var(--lp-blue)/0.55)]">
            <div aria-hidden className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }} />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="relative max-w-2xl mx-auto">
              <h2 className="text-[28px] md:text-[40px] font-extrabold text-white tracking-tight leading-[1.1]">
                Cuide da sua saúde mental com especialistas em Brasília
              </h2>
              <p className="mt-4 text-[15.5px] md:text-[17px] text-white/90 leading-relaxed">
                Dê o primeiro passo. Estamos prontos para te acolher.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="h-12 px-7 rounded-xl bg-white text-[hsl(var(--lp-blue-ink))] hover:bg-white/90 text-[14.5px] font-bold shadow-lg hover:-translate-y-0.5 transition-all">
                  <Link to="/cadastro">
                    Agendar Consulta
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <a
                  href={wa()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-[14.5px] font-bold transition-all hover:-translate-y-0.5 shadow-lg"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Agende agora
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
