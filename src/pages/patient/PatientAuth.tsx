import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Calendar, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

interface PatientAuthProps {
  mode: 'login' | 'signup';
}

export default function PatientAuth({ mode }: PatientAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, signUp, signOut, user, isPatient, isAdmin, isPending } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Redirect based on user role
  useEffect(() => {
    if (user) {
      if (isPending) {
        // Stay on page, show pending message
        return;
      }
      if (isAdmin && !isPatient) {
        navigate('/admin');
      } else if (isPatient) {
        navigate('/dashboard');
      }
    }
  }, [user, isPatient, isAdmin, isPending, navigate]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (mode === 'login') {
      const result = loginSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setIsLoading(true);
      const { error } = await signIn(formData.email, formData.password);
      setIsLoading(false);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao entrar',
          description: error.message === 'Invalid login credentials' 
            ? 'Email ou senha incorretos' 
            : error.message,
        });
        return;
      }

      navigate('/dashboard');
    } else {
      const result = signupSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setIsLoading(true);
      const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.cpf);
      setIsLoading(false);

      if (error) {
        let message = error.message;
        if (error.message.includes('already registered')) {
          message = 'Este email já está cadastrado';
        }
        toast({
          variant: 'destructive',
          title: 'Erro ao cadastrar',
          description: message,
        });
        return;
      }

      toast({
        title: 'Cadastro realizado!',
        description: 'Seu acesso será liberado após aprovação do administrador.',
      });
      
      // Don't navigate, let the pending state show
    }
  };

  // Show pending message
  if (user && isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg">
              <Calendar className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Acesso Pendente</CardTitle>
            <CardDescription className="text-base">
              Seu cadastro foi recebido com sucesso! Aguarde a aprovação do administrador para acessar o portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" className="w-full" onClick={signOut}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLogin = mode === 'login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <Link 
            to="/" 
            className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25 transition-transform hover:scale-105">
            <Calendar className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {isLogin ? 'Bem-vindo de volta!' : 'Criar sua conta'}
            </CardTitle>
            <CardDescription className="text-base">
              {isLogin 
                ? 'Entre para acessar suas consultas' 
                : 'Cadastre-se para agendar consultas'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    maxLength={14}
                    className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary"
                  />
                  {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="h-11 bg-background/50 border-muted-foreground/20 focus:border-primary"
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25" 
              disabled={isLoading}
            >
              {isLoading 
                ? (isLogin ? 'Entrando...' : 'Cadastrando...') 
                : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <Link 
                to={isLogin ? '/cadastro' : '/login'} 
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
