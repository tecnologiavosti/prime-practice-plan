import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE as unknown as number[] } },
} as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

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
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Ambient global background — radial spotlights + grid */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.07),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border)/0.6) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.6) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage:
              'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
          }}
        />
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-border/60 bg-background/70 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.4)]'
            : 'border-b border-transparent bg-background/30 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg opacity-60" aria-hidden />
              <img src={clinicLogo} alt={clinicName} className="relative h-9 w-auto object-contain" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              {clinicName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-foreground/80 hover:text-foreground">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="relative shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.55)] hover:shadow-[0_10px_28px_-6px_hsl(var(--primary)/0.7)] transition-shadow"
            >
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16">
        {/* Spotlight glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[1100px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-24 left-[8%] h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 right-[6%] h-80 w-80 rounded-full bg-accent/60 blur-3xl"
        />

        <div className="container mx-auto px-4 md:px-6 py-28 lg:py-40">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={fadeUp} className="flex justify-center mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3.5 py-1.5 text-[11px] md:text-xs font-medium text-foreground/80 backdrop-blur-md shadow-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <Sparkles className="h-3 w-3 text-primary" />
                Solução Completa em Gestão de Saúde
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-[-0.03em] text-foreground mb-7"
            >
              Agende suas consultas{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                  com facilidade
                </span>
                <span
                  aria-hidden
                  className="absolute -inset-x-4 -inset-y-2 -z-10 bg-primary/15 blur-2xl"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Simplifique o cuidado com sua saúde. Agende consultas online, acompanhe seu histórico
              médico e gerencie seus atendimentos em um só lugar.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                asChild
                className="h-12 px-7 text-[15px] shadow-[0_14px_40px_-12px_hsl(var(--primary)/0.6)] hover:shadow-[0_18px_50px_-12px_hsl(var(--primary)/0.8)] transition-all hover:-translate-y-0.5"
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
                className="h-12 px-7 text-[15px] border-border/80 bg-card/60 backdrop-blur-md hover:bg-accent/60 transition-all hover:-translate-y-0.5"
              >
                <Link to="/login">Já Tenho Conta</Link>
              </Button>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              variants={fadeUp}
              className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80"
            >
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Criptografia ponta a ponta</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Disponível 24/7</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Conformidade LGPD</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-28 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-16 max-w-2xl mx-auto"
          >
            <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90 mb-3">
              Por que a {clinicName}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-semibold tracking-[-0.025em] text-foreground mb-4 leading-[1.1]"
            >
              Tecnologia que cuida de você
            </motion.h2>
            <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground">
              Experiência completa e segura para o cuidado da sua saúde.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeUp}>
                <Card className="group relative h-full overflow-hidden rounded-2xl border-border/60 bg-card/60 backdrop-blur-md shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_10px_30px_-20px_hsl(var(--primary)/0.25)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_hsl(var(--primary)/0.45)]">
                  {/* Spotlight on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        'radial-gradient(400px circle at 50% 0%, hsl(var(--primary)/0.18), transparent 60%)',
                    }}
                  />
                  {/* Top border glow */}
                  <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <CardContent className="relative p-7 text-center">
                    <div className="relative mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center">
                      <div className="absolute inset-0 rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20" />
                      <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <feature.icon className="relative h-6 w-6 text-primary" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-2 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-28 lg:py-32 border-t border-border/50">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,hsl(var(--primary)/0.06),transparent_60%)]"
        />
        <div className="container mx-auto px-4 md:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.p variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/90 mb-3">
                Benefícios
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-4xl md:text-5xl font-semibold tracking-[-0.025em] text-foreground mb-5 leading-[1.08]"
              >
                Tudo que você precisa para gerenciar sua saúde
              </motion.h2>
              <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground mb-9 leading-relaxed">
                Nosso portal oferece uma experiência completa e intuitiva para você cuidar
                da sua saúde de forma prática e organizada.
              </motion.p>
              <motion.ul variants={stagger} className="space-y-3.5">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={index}
                    variants={fadeUp}
                    className="group flex items-center gap-3.5 rounded-xl border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-card/60"
                  >
                    <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/12 text-primary shrink-0">
                      <span className="absolute inset-0 rounded-full bg-primary/30 blur-md opacity-0 transition-opacity group-hover:opacity-100" />
                      <CheckCircle className="relative h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <span className="text-[15px] text-foreground/90">{benefit}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp}>
                <Button
                  className="mt-10 h-12 px-7 text-[15px] shadow-[0_14px_40px_-12px_hsl(var(--primary)/0.6)] hover:shadow-[0_18px_50px_-12px_hsl(var(--primary)/0.8)] transition-all hover:-translate-y-0.5"
                  size="lg"
                  asChild
                >
                  <Link to="/cadastro">
                    Começar Agora
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Glow underlay */}
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-2xl"
              />
              <Card className="relative rounded-2xl border-border/60 bg-card/80 backdrop-blur-xl shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]">
                <div aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative h-12 w-12">
                      <div className="absolute inset-0 rounded-xl bg-primary/15 blur-md" />
                      <div className="relative h-12 w-12 rounded-xl bg-primary/12 text-primary flex items-center justify-center border border-primary/20">
                        <Calendar className="h-5 w-5" strokeWidth={1.75} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Próxima Consulta</h4>
                      <p className="text-xs text-muted-foreground">Segunda, 10:00</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Dr. João Silva', specialty: 'Cardiologista', rating: '4.9' },
                      { name: 'Dra. Maria Santos', specialty: 'Dermatologista', rating: '4.8' },
                    ].map((doc) => (
                      <div
                        key={doc.name}
                        className="group flex items-center justify-between p-3.5 rounded-xl bg-background/60 border border-border/60 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-background/90"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-card border border-border/60 flex items-center justify-center text-muted-foreground transition-colors group-hover:text-primary">
                            <Users className="h-4 w-4" strokeWidth={1.75} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            <p className="text-[11px] text-muted-foreground">{doc.specialty}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-xs font-semibold">{doc.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/85 px-6 py-20 md:py-24 text-center max-w-5xl mx-auto shadow-[0_40px_100px_-30px_hsl(var(--primary)/0.6)]"
          >
            {/* Spotlight + dot pattern */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl"
            />
            <div aria-hidden className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.025em] text-primary-foreground mb-5 leading-[1.1]">
                Pronto para cuidar da sua saúde?
              </h2>
              <p className="text-base md:text-lg text-primary-foreground/85 mb-10 max-w-xl mx-auto leading-relaxed">
                Crie sua conta gratuitamente e comece a agendar suas consultas hoje mesmo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="h-12 px-7 text-[15px] shadow-xl hover:-translate-y-0.5 transition-transform"
                >
                  <Link to="/cadastro">
                    Criar Conta Grátis
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-7 text-[15px] bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground hover:-translate-y-0.5 transition-all"
                  asChild
                >
                  <Link to="/login">Fazer Login</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={clinicLogo} alt={clinicName} className="h-7 w-auto object-contain" />
              <span className="text-sm font-medium text-foreground">{clinicName}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {clinicName}. Todos os direitos reservados.
            </p>
            <Link
              to="/admin/auth"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Área Administrativa
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
