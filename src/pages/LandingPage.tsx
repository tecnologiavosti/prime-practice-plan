import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import logoPacem from '@/assets/logoPacem.png';
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

const specialties = [
  { icon: HeartPulse, name: 'Cardiologia' },
  { icon: Stethoscope, name: 'Clínica Geral' },
  { icon: Users, name: 'Pediatria' },
  { icon: FileText, name: 'Dermatologia' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

// Ocean Deep scoped palette — does NOT affect admin/app theme
const oceanStyles = {
  '--od-ink': '210 60% 8%',
  '--od-deep': '210 56% 14%',
  '--od-navy': '210 50% 24%',
  '--od-teal': '189 56% 40%',
  '--od-mint': '177 42% 58%',
  '--od-cream': '40 35% 96%',
  '--od-paper': '210 30% 98%',
  '--od-line': '210 25% 88%',
} as React.CSSProperties;

export default function LandingPage() {
  const { settings } = useClinicSettings();
  const [scrolled, setScrolled] = useState(false);

  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';
  const clinicLogo = settings?.logo_url || logoPacem;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      style={oceanStyles}
      className="relative min-h-screen overflow-x-hidden font-['IBM_Plex_Sans',_sans-serif] text-[hsl(var(--od-ink))]"
    >
      {/* ============== HEADER ============== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-[hsl(var(--od-line)/0.6)] bg-[hsl(var(--od-paper)/0.85)] backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--od-line)/0.4)]'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-3">
            <img src={clinicLogo} alt={clinicName} className="h-10 w-auto object-contain" />
            <div className="leading-tight">
              <div className="font-['Libre_Baskerville',_serif] text-[15px] font-bold tracking-tight text-[hsl(var(--od-ink))]">
                {clinicName}
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--od-navy))]/70">
                Cuidado · Confiança
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] text-[hsl(var(--od-deep))]/80">
            <a href="#sobre" className="hover:text-[hsl(var(--od-teal))] transition-colors">Sobre</a>
            <a href="#especialidades" className="hover:text-[hsl(var(--od-teal))] transition-colors">Especialidades</a>
            <a href="#beneficios" className="hover:text-[hsl(var(--od-teal))] transition-colors">Benefícios</a>
            <a href="#contato" className="hover:text-[hsl(var(--od-teal))] transition-colors">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-[hsl(var(--od-ink))] hover:bg-[hsl(var(--od-deep)/0.06)]">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full bg-[hsl(var(--od-deep))] text-white hover:bg-[hsl(var(--od-ink))] shadow-[0_10px_30px_-12px_hsl(var(--od-deep)/0.6)]"
            >
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ============== HERO — full width, deep navy ============== */}
      <section className="relative min-h-screen flex items-center bg-[hsl(var(--od-ink))] text-white overflow-hidden">
        {/* atmospheric backgrounds */}
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--od-teal)/0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--od-navy)/0.6),transparent_60%)]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '72px 72px',
              maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
            }}
          />
          {/* floating orbs */}
          <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--od-teal)/0.35)] blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--od-mint)/0.18)] blur-[140px]" />
        </div>

        <div className="container mx-auto px-5 md:px-10 pt-32 pb-20 relative">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid lg:grid-cols-12 gap-12 items-center"
          >
            <div className="lg:col-span-7">
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-white/85 backdrop-blur-md">
                  <Sparkles className="h-3 w-3 text-[hsl(var(--od-mint))]" />
                  Solução completa em gestão de saúde
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-['Libre_Baskerville',_serif] mt-8 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-[-0.02em]"
              >
                Agende suas consultas{' '}
                <span className="relative inline-block italic font-normal">
                  <span className="bg-gradient-to-br from-[hsl(var(--od-mint))] via-[hsl(var(--od-teal))] to-[hsl(var(--od-mint))] bg-clip-text text-transparent">
                    com facilidade
                  </span>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 text-lg md:text-xl text-white/75 max-w-xl leading-relaxed"
              >
                Simplifique o cuidado com sua saúde. Agende consultas online, acompanhe seu histórico
                médico e gerencie seus atendimentos em um só lugar.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  asChild
                  className="h-13 px-8 rounded-full bg-[hsl(var(--od-teal))] hover:bg-[hsl(var(--od-mint))] text-[hsl(var(--od-ink))] text-[15px] font-semibold shadow-[0_18px_50px_-12px_hsl(var(--od-teal)/0.7)] transition-all hover:-translate-y-0.5"
                >
                  <Link to="/cadastro">
                    Criar Minha Conta
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-13 px-8 rounded-full border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-md transition-all hover:-translate-y-0.5"
                >
                  <Link to="/login">Já Tenho Conta</Link>
                </Button>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-white/55"
              >
                <span className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Criptografia ponta a ponta</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Disponível 24/7</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5" /> Conformidade LGPD</span>
              </motion.div>
            </div>

            {/* Hero card visual */}
            <motion.div variants={fadeUp} className="lg:col-span-5 relative">
              <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-[hsl(var(--od-teal)/0.3)] via-transparent to-[hsl(var(--od-mint)/0.2)] blur-2xl" />
              <div className="relative rounded-[1.75rem] border border-white/15 bg-white/[0.06] backdrop-blur-2xl p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
                <div aria-hidden className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--od-mint))] to-transparent" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--od-teal)/0.2)] border border-[hsl(var(--od-teal)/0.3)] flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[hsl(var(--od-mint))]" />
                  </div>
                  <div>
                    <p className="font-['Libre_Baskerville',_serif] text-sm font-bold text-white">Próxima Consulta</p>
                    <p className="text-xs text-white/60">Segunda-feira · 10:00</p>
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
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[hsl(var(--od-teal)/0.4)] hover:bg-white/[0.08] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                          <Stethoscope className="h-4 w-4 text-[hsl(var(--od-mint))]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{doc.name}</p>
                          <p className="text-[11px] text-white/60">{doc.specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[hsl(var(--od-mint))]">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-xs font-semibold">{doc.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* bottom stats band */}
        <div className="absolute bottom-0 inset-x-0 border-t border-white/10 bg-[hsl(var(--od-ink)/0.6)] backdrop-blur-xl">
          <div className="container mx-auto px-5 md:px-10 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { v: '15+', l: 'Anos de experiência' },
              { v: '50k+', l: 'Consultas realizadas' },
              { v: '120+', l: 'Profissionais' },
              { v: '4.9★', l: 'Avaliação média' },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-['Libre_Baskerville',_serif] text-2xl font-bold text-white">{s.v}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/55 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== SOBRE / FEATURES ============== */}
      <section id="sobre" className="relative py-32 bg-[hsl(var(--od-paper))]">
        <div className="container mx-auto px-5 md:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[hsl(var(--od-teal))] mb-4">
              Por que a {clinicName}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-['Libre_Baskerville',_serif] text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(var(--od-ink))] mb-5 leading-[1.08] tracking-[-0.02em]"
            >
              Tecnologia que <em className="text-[hsl(var(--od-teal))] font-normal">cuida</em> de você
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-[hsl(var(--od-deep))]/70 leading-relaxed">
              Experiência completa e segura para o cuidado da sua saúde, com a confiança de uma clínica
              tradicional e a praticidade de um sistema moderno.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(var(--od-line))] rounded-3xl overflow-hidden border border-[hsl(var(--od-line))] shadow-[0_30px_80px_-40px_hsl(var(--od-deep)/0.3)]"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group relative bg-white p-10 transition-all duration-500 hover:bg-[hsl(var(--od-cream))]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[hsl(var(--od-teal))] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--od-deep))] text-white group-hover:bg-[hsl(var(--od-teal))] transition-colors">
                  <feature.icon className="h-6 w-6" strokeWidth={1.6} />
                </div>
                <h3 className="font-['Libre_Baskerville',_serif] text-xl font-bold text-[hsl(var(--od-ink))] mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-[hsl(var(--od-deep))]/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============== ESPECIALIDADES — full width band ============== */}
      <section id="especialidades" className="relative py-32 bg-[hsl(var(--od-deep))] text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--od-teal)/0.18),transparent_65%)]" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="container mx-auto px-5 md:px-10 relative">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[hsl(var(--od-mint))] mb-4">
              Especialidades
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-['Libre_Baskerville',_serif] text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-[-0.02em]">
              Um time completo, à sua disposição
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
          >
            {specialties.map((sp) => (
              <motion.div
                key={sp.name}
                variants={fadeUp}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-8 text-center transition-all duration-500 hover:-translate-y-1.5 hover:border-[hsl(var(--od-mint)/0.5)] hover:bg-white/[0.08]"
              >
                <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--od-teal)/0.18)] border border-[hsl(var(--od-teal)/0.3)] text-[hsl(var(--od-mint))]">
                  <sp.icon className="h-7 w-7" strokeWidth={1.6} />
                </div>
                <h3 className="font-['Libre_Baskerville',_serif] text-lg font-bold">{sp.name}</h3>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============== BENEFÍCIOS — editorial split ============== */}
      <section id="beneficios" className="relative py-32 bg-[hsl(var(--od-cream))]">
        <div className="container mx-auto px-5 md:px-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[hsl(var(--od-teal))] mb-4">
                Benefícios
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="font-['Libre_Baskerville',_serif] text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(var(--od-ink))] mb-6 leading-[1.05] tracking-[-0.02em]"
              >
                Tudo que você precisa para <em className="text-[hsl(var(--od-teal))] font-normal">gerenciar</em> sua saúde
              </motion.h2>
              <motion.p variants={fadeUp} className="text-lg text-[hsl(var(--od-deep))]/70 mb-10 leading-relaxed">
                Nosso portal oferece uma experiência completa e intuitiva para você cuidar
                da sua saúde de forma prática e organizada.
              </motion.p>
              <motion.ul variants={stagger} className="space-y-4 mb-10">
                {benefits.map((b, i) => (
                  <motion.li
                    key={i}
                    variants={fadeUp}
                    className="flex items-start gap-4 group"
                  >
                    <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--od-deep))] text-[hsl(var(--od-mint))] shrink-0 group-hover:bg-[hsl(var(--od-teal))] group-hover:text-white transition-colors">
                      <CheckCircle className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span className="text-[16px] text-[hsl(var(--od-ink))] pt-1">{b}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp}>
                <Button
                  size="lg"
                  asChild
                  className="h-13 px-8 rounded-full bg-[hsl(var(--od-deep))] hover:bg-[hsl(var(--od-ink))] text-white text-[15px] font-semibold shadow-[0_18px_50px_-12px_hsl(var(--od-deep)/0.5)] transition-all hover:-translate-y-0.5"
                >
                  <Link to="/cadastro">
                    Começar Agora
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* large editorial quote card */}
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[hsl(var(--od-teal)/0.2)] to-transparent blur-2xl" />
              <div className="relative rounded-[1.75rem] bg-[hsl(var(--od-ink))] text-white p-10 overflow-hidden shadow-[0_40px_100px_-30px_hsl(var(--od-deep)/0.6)]">
                <div aria-hidden className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[hsl(var(--od-teal)/0.4)] blur-3xl" />
                <div aria-hidden className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--od-mint))] to-transparent" />

                <div className="relative">
                  <div className="font-['Libre_Baskerville',_serif] text-6xl text-[hsl(var(--od-mint))] leading-none mb-6">"</div>
                  <p className="font-['Libre_Baskerville',_serif] italic text-2xl md:text-3xl leading-[1.4] text-white mb-8">
                    Cuidar de você é a nossa especialidade.
                    Com tecnologia, empatia e excelência clínica.
                  </p>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                    <div className="h-12 w-12 rounded-full bg-[hsl(var(--od-teal)/0.2)] border border-[hsl(var(--od-teal)/0.4)] flex items-center justify-center">
                      <HeartPulse className="h-5 w-5 text-[hsl(var(--od-mint))]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Equipe {clinicName}</p>
                      <p className="text-xs text-white/60">Comprometidos com seu bem-estar</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== CTA — full width ocean ============== */}
      <section className="relative py-32 bg-[hsl(var(--od-ink))] text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--od-teal)/0.3),transparent_60%)]" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute -top-32 left-1/2 h-80 w-[800px] -translate-x-1/2 rounded-full bg-[hsl(var(--od-teal)/0.35)] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="container mx-auto px-5 md:px-10 relative text-center max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[hsl(var(--od-mint))] mb-5">
            Comece hoje
          </p>
          <h2 className="font-['Libre_Baskerville',_serif] text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-[-0.02em] mb-6">
            Pronto para cuidar da sua <em className="text-[hsl(var(--od-mint))] font-normal">saúde?</em>
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto leading-relaxed">
            Crie sua conta gratuitamente e comece a agendar suas consultas hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              asChild
              className="h-13 px-8 rounded-full bg-[hsl(var(--od-teal))] hover:bg-[hsl(var(--od-mint))] text-[hsl(var(--od-ink))] text-[15px] font-semibold shadow-[0_18px_50px_-12px_hsl(var(--od-teal)/0.7)] transition-all hover:-translate-y-0.5"
            >
              <Link to="/cadastro">
                Criar Conta Grátis
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-13 px-8 rounded-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white transition-all hover:-translate-y-0.5"
            >
              <Link to="/login">Fazer Login</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer id="contato" className="bg-[hsl(var(--od-ink))] border-t border-white/10 text-white/70">
        <div className="container mx-auto px-5 md:px-10 py-16 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <img src={clinicLogo} alt={clinicName} className="h-9 w-auto object-contain" />
              <div>
                <div className="font-['Libre_Baskerville',_serif] text-white font-bold">{clinicName}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/50">Cuidado · Confiança</div>
              </div>
            </div>
            <p className="text-sm max-w-md leading-relaxed">
              Cuidado humano, tecnologia de ponta e atendimento que respeita cada momento da sua vida.
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--od-mint))] mb-4">Navegação</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#sobre" className="hover:text-white">Sobre</a></li>
              <li><a href="#especialidades" className="hover:text-white">Especialidades</a></li>
              <li><a href="#beneficios" className="hover:text-white">Benefícios</a></li>
              <li><Link to="/login" className="hover:text-white">Entrar</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--od-mint))] mb-4">Contato</p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" />{settings?.endereco || 'Endereço da clínica'}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />{settings?.telefone || '(00) 0000-0000'}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" />{settings?.email || 'contato@clinica.com'}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container mx-auto px-5 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>© {new Date().getFullYear()} {clinicName}. Todos os direitos reservados.</p>
            <Link to="/admin/auth" className="hover:text-white">Área Administrativa</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
