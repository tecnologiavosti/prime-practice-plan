import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import logoPacem from '@/assets/logoPacem.png';
import { 
  Calendar, 
  Clock, 
  Shield, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Heart,
  Star
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
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <img src={logoPacem} alt="Clínica Pacem" className="h-8 w-auto" />
            <span className="text-base font-semibold text-foreground tracking-tight">Clínica Pacem</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/cadastro">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-14">
        <div className="container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
              <Heart className="h-3 w-3" />
              Cuidando da sua saúde
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-foreground mb-5">
              Agende suas consultas com facilidade
            </h1>
            <p className="text-base text-muted-foreground mb-7 max-w-xl mx-auto">
              Simplifique o cuidado com sua saúde. Agende consultas online, acompanhe seu histórico 
              médico e gerencie seus atendimentos em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link to="/cadastro">
                  Criar Minha Conta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Já Tenho Conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Por que escolher a Clínica Pacem?</h2>
            <p className="text-sm text-muted-foreground">Experiência completa para o cuidado da sua saúde</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-none border">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted mb-3">
                    <feature.icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Tudo que você precisa para gerenciar sua saúde
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Nosso portal oferece uma experiência completa e intuitiva para você cuidar 
                da sua saúde de forma prática e organizada.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2.5">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" strokeWidth={1.75} />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-6" asChild>
                <Link to="/cadastro">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div>
              <Card className="shadow-none border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Próxima Consulta</h4>
                      <p className="text-xs text-muted-foreground">Segunda, 10:00</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Dr. João Silva', specialty: 'Cardiologista', rating: '4.9' },
                      { name: 'Dra. Maria Santos', specialty: 'Dermatologista', rating: '4.8' },
                    ].map((doc) => (
                      <div key={doc.name} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            <p className="text-[11px] text-muted-foreground">{doc.specialty}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3 fill-current text-primary" />
                          <span className="text-xs font-medium">{doc.rating}</span>
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
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold text-primary-foreground mb-3">
            Pronto para cuidar da sua saúde?
          </h2>
          <p className="text-sm text-primary-foreground/80 mb-6 max-w-lg mx-auto">
            Crie sua conta gratuitamente e comece a agendar suas consultas hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/cadastro">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/login">Fazer Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src={logoPacem} alt="Clínica Pacem" className="h-6 w-auto" />
              <span className="text-sm font-medium text-foreground">Clínica Pacem</span>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Clínica Pacem. Todos os direitos reservados.
            </p>
            <Link 
              to="/admin/auth" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Área Administrativa
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
