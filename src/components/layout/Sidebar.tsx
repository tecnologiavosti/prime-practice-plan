import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logoPacem from '@/assets/logoPacem.png';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { ADMIN_MODULES } from '@/lib/adminModules';
import {
  Calendar,
  Users,
  UserCog,
  Stethoscope,
  FileText,
  Building2,
  CreditCard,
  Package,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Receipt,
  Wallet,
  FileBarChart,
  Banknote,
  Settings,
  UsersRound,
  TrendingUp,
  Search,
  Newspaper,
  Home,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  agenda: Calendar,
  agendamentos: ClipboardList,
  pacientes: Users,
  profissionais: UserCog,
  procedimentos: FileText,
  convenios: Building2,
  administradoras: CreditCard,
  pacotes: Package,
  especialidades: Stethoscope,
  financeiro: DollarSign,
  'fluxo-caixa': TrendingUp,
  guias: Receipt,
  'lotes-faturamento': FileBarChart,
  repasses: Wallet,
  'repasse-convenios': Banknote,
  'relatorios-financeiros': FileBarChart,
  'formas-pagamento': Banknote,
  escalas: Calendar,
  'perfil-clinica': Settings,
  equipe: UsersRound,
  seo: Search,
  blog: Newspaper,
};

export function Sidebar() {
  const { signOut, roles, user, allowedModules } = useAuth();
  const { settings } = useClinicSettings();
  const navigate = useNavigate();
  const logoSrc = settings?.logo_url || logoPacem;
  const clinicName = settings?.nome_fantasia || 'Pacem';

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  const isAdmin = roles.includes('administrador');

  // Administradores veem tudo. Para os demais, filtra pelas permissões.
  // Se nenhum módulo foi definido, mantém o comportamento antigo (apenas por role).
  const filteredItems = ADMIN_MODULES.filter((item) => {
    const allowedByRole = item.roles.some((role) => roles.includes(role as any));
    if (!allowedByRole) return false;
    if (isAdmin) return true;
    if (!allowedModules || allowedModules.length === 0) return true;
    return allowedModules.includes(item.key);
  });

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <img src={logoSrc} alt={clinicName} className="h-8 w-auto rounded object-contain" />
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight truncate">{clinicName}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {filteredItems.map((item) => {
            const Icon = ICONS[item.key] ?? LayoutDashboard;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-accent text-accent-foreground font-semibold'
                      : 'text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-primary-foreground'
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-1">
          <p className="text-xs font-medium text-sidebar-primary-foreground truncate">{user?.email}</p>
          <p className="text-[11px] text-sidebar-foreground/60 capitalize">
            {roles.join(', ') || 'Sem permissões'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:text-sidebar-primary-foreground hover:bg-sidebar-foreground/10 text-xs h-8"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
          Sair
        </Button>
      </div>
    </aside>
  );
}
