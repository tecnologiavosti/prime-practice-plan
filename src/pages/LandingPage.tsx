import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Heart,
  Star,
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-border/60 bg-background/70 backdrop-blur-xl shadow-sm'
            : 'border-b border-transparent bg-background/40 backdrop-blur-md'
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src={clinicLogo} alt={clinicName} className="h-9 w-auto object-contain" />
            <span className="text-base font-semibold tracking-tight text-foreground">
              {clinicName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-foreground/80 hover:text-foreground">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild className="shadow-sm">
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        {/* Soft gradient + subtle grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)',
            backgroundSize: '28px 28px',
            maskImage:
              'radial-gradient(ellipse at center top, black 40%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center top, black 40%, transparent 75%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />

        <div className="container mx-auto px-4 md:px-6 py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary mb-6">
              <Heart className="h-3.5 w-3.5" strokeWidth={2} />
              Cuidando da sua saúde
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight text-foreground mb-6">
              Agende suas consultas{' '}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                com facilidade
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-9 max-w-2xl mx-auto leading-relaxed">
              Simplifique o cuidado com sua saúde. Agende consultas online, acompanhe seu histórico
              médico e gerencie seus atendimentos em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild className="shadow-md shadow-primary/20">
                <Link to="/cadastro">
                  Criar Minha Conta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-border/80 bg-transparent hover:bg-accent/60">
                <Link to="/login">Já Tenho Conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 lg:py-28 border-t border-border/60">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-3">
              Por que escolher a {clinicName}?
            </h2>
            <p className="text-base text-muted-foreground">
              Experiência completa e segura para o cuidado da sua saúde.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group rounded-xl border-border/70 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-colors group-hover:bg-primary/15">
                    <feature.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 lg:py-28 border-t border-border/60 bg-gradient-to-b from-background to-accent/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-5 leading-tight">
                Tudo que você precisa para gerenciar sua saúde
              </h2>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                Nosso portal oferece uma experiência completa e intuitiva para você cuidar
                da sua saúde de forma prática e organizada.
              </p>
              <ul className="space-y-3.5">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="text-sm text-foreground/90">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 shadow-md shadow-primary/20" size="lg" asChild>
                <Link to="/cadastro">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div>
              <Card className="rounded-2xl border-border/70 bg-card shadow-xl shadow-primary/5">
                <CardContent className="p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Calendar className="h-5 w-5" strokeWidth={1.75} />
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
                        className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60 transition-colors hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-background border border-border/60 flex items-center justify-center text-muted-foreground">
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
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-28 border-t border-border/60">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-16 md:py-20 text-center max-w-5xl mx-auto shadow-xl shadow-primary/20">
            <div
              aria-hidden
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-primary-foreground mb-4">
                Pronto para cuidar da sua saúde?
              </h2>
              <p className="text-base text-primary-foreground/85 mb-8 max-w-xl mx-auto leading-relaxed">
                Crie sua conta gratuitamente e comece a agendar suas consultas hoje mesmo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" variant="secondary" asChild className="shadow-md">
                  <Link to="/cadastro">
                    Criar Conta Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  asChild
                >
                  <Link to="/login">Fazer Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border/60">
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
