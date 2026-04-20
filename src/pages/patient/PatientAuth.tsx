import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import logoPacem from '@/assets/logoPacem-2.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupBaseSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(6, 'A senha precisa de no mínimo 6 caracteres')
    .regex(/\d/, 'A senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const translateAuthError = (message: string): string => {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email ainda não confirmado. Verifique sua caixa de entrada.',
    'User already registered': 'Este email já está cadastrado',
    'Password should be at least 6 characters': 'A senha precisa de no mínimo 6 caracteres',
    'Signup requires a valid password': 'A senha informada é inválida',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
    'For security purposes, you can only request this after': 'Por segurança, aguarde antes de tentar novamente.',
    'Unable to validate email address: invalid format': 'Formato de email inválido',
    'Password should contain at least one character of each': 'A senha precisa de no mínimo 6 caracteres e um número',
  };

  for (const [key, value] of Object.entries(translations)) {
    if (message.includes(key)) return value;
  }

  if (message.includes('password') || message.includes('Password')) {
    return 'A senha informada não atende aos requisitos. Use no mínimo 6 caracteres e um número.';
  }
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'Este email já está cadastrado';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }

  return message;
};

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
  
  const { signIn, signUp, user, isPatient, isAdmin, loading } = usePatientAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect based on user role
  useEffect(() => {
    if (!loading && user) {
      if (isAdmin && !isPatient) {
        navigate('/admin/dashboard', { replace: true });
      } else if (isPatient) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, user, isPatient, isAdmin, navigate]);

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
          description: translateAuthError(error.message),
        });
        return;
      }

    } else {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const { data: inviteCheck } = await (supabase.rpc as any)('is_authorized_admin_email', {
        _email: normalizedEmail,
      });
      const isInvitedAdmin = Boolean(inviteCheck);

      const result = signupBaseSchema.safeParse(formData);
      const fieldErrors: Record<string, string> = {};

      if (!result.success) {
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
        });
      }

      if (!isInvitedAdmin) {
        const cpfDigits = formData.cpf.replace(/\D/g, '');
        if (cpfDigits.length < 11) {
          fieldErrors.cpf = 'CPF inválido';
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setIsLoading(true);
      const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.cpf);

      if (error) {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Erro ao cadastrar',
          description: translateAuthError(error.message),
        });
        return;
      }

      setIsLoading(false);

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Se necessário, confirme seu e-mail para concluir o primeiro acesso.',
      });
    }
  };

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
          <div className="mx-auto">
            <img src={logoPacem} alt="Pacem Logo" className="w-[180px] h-auto mx-auto" />
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
                  <p className="text-xs text-muted-foreground">
                    Se você recebeu convite para a equipe, o CPF é opcional neste cadastro.
                  </p>
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
              {!isLogin && formData.password.length > 0 && (
                <div className="space-y-1 text-xs">
                  <p className={formData.password.length >= 6 ? 'text-green-600' : 'text-muted-foreground'}>
                    {formData.password.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres
                  </p>
                  <p className={/\d/.test(formData.password) ? 'text-green-600' : 'text-muted-foreground'}>
                    {/\d/.test(formData.password) ? '✓' : '○'} Pelo menos um número
                  </p>
                </div>
              )}
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
