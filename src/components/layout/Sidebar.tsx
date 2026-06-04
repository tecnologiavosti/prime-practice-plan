import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logoPacem from '@/assets/logoPacem.png';
import { useClinicSettings } from '@/hooks/useClinicSettings';
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
} from 'lucide-react';

const menuItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['administrador', 'recepcao', 'financeiro'] },
  { to: '/admin/agenda', icon: Calendar, label: 'Agenda', roles: ['administrador', 'recepcao'] },
  { to: '/admin/agendamentos', icon: ClipboardList, label: 'Agendamentos', roles: ['administrador', 'recepcao'] },
  { to: '/admin/pacientes', icon: Users, label: 'Pacientes', roles: ['administrador', 'recepcao'] },
  { to: '/admin/profissionais', icon: UserCog, label: 'Profissionais', roles: ['administrador'] },
  { to: '/admin/procedimentos', icon: FileText, label: 'Procedimentos', roles: ['administrador'] },
  { to: '/admin/convenios', icon: Building2, label: 'Convênios', roles: ['administrador'] },
  { to: '/admin/administradoras', icon: CreditCard, label: 'Administradoras', roles: ['administrador'] },
  { to: '/admin/pacotes', icon: Package, label: 'Pacotes', roles: ['administrador', 'recepcao'] },
  { to: '/admin/especialidades', icon: Stethoscope, label: 'Especialidades', roles: ['administrador'] },
  { to: '/admin/financeiro', icon: DollarSign, label: 'Contas a Receber', roles: ['administrador', 'financeiro'] },
  { to: '/admin/fluxo-caixa', icon: TrendingUp, label: 'Fluxo de Caixa', roles: ['administrador', 'financeiro'] },
  { to: '/admin/guias', icon: Receipt, label: 'Guias Médicas', roles: ['administrador', 'financeiro', 'recepcao'] },
  { to: '/admin/lotes-faturamento', icon: FileBarChart, label: 'Faturamento', roles: ['administrador', 'financeiro'] },
  { to: '/admin/repasses', icon: Wallet, label: 'Repasses', roles: ['administrador', 'financeiro'] },
  { to: '/admin/repasse-convenios', icon: Banknote, label: 'Rep. Convênios', roles: ['administrador', 'financeiro'] },
  { to: '/admin/relatorios-financeiros', icon: FileBarChart, label: 'Relatórios', roles: ['administrador', 'financeiro'] },
  { to: '/admin/formas-pagamento', icon: Banknote, label: 'Formas Pgto', roles: ['administrador'] },
  { to: '/admin/escalas', icon: Calendar, label: 'Configurar Escalas', roles: ['administrador'] },
  { to: '/admin/perfil-clinica', icon: Settings, label: 'Perfil da Clínica', roles: ['administrador'] },
  { to: '/admin/equipe', icon: UsersRound, label: 'Equipe / Usuários', roles: ['administrador'] },
  { to: '/admin/seo', icon: Search, label: 'SEO / Google', roles: ['administrador'] },
  
];

export function Sidebar() {
  const { signOut, roles, user } = useAuth();
  const { settings } = useClinicSettings();
  const navigate = useNavigate();
  const logoSrc = settings?.logo_url || logoPacem;
  const clinicName = settings?.nome_fantasia || 'Pacem';

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  const filteredItems = menuItems.filter((item) =>
    item.roles.some((role) => roles.includes(role as any))
  );

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
          {filteredItems.map((item) => (
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
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive(item.to) ? 2.25 : 1.75} />
              {item.label}
            </NavLink>
          ))}
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

function isActive(to: string): boolean {
  return typeof window !== 'undefined' && window.location.pathname === to;
}
