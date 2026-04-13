import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logoPacem from '@/assets/logoPacem.png';
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
} from 'lucide-react';

const menuItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['administrador', 'recepcao', 'profissional', 'financeiro'] },
  { to: '/admin/agenda', icon: Calendar, label: 'Agenda', roles: ['administrador', 'recepcao', 'profissional'] },
  { to: '/admin/agendamentos', icon: ClipboardList, label: 'Agendamentos', roles: ['administrador', 'recepcao', 'profissional'] },
  { to: '/admin/pacientes', icon: Users, label: 'Pacientes', roles: ['administrador', 'recepcao', 'profissional'] },
  
  { to: '/admin/profissionais', icon: UserCog, label: 'Profissionais', roles: ['administrador'] },
  { to: '/admin/procedimentos', icon: FileText, label: 'Procedimentos', roles: ['administrador'] },
  { to: '/admin/convenios', icon: Building2, label: 'Convênios', roles: ['administrador'] },
  { to: '/admin/administradoras', icon: CreditCard, label: 'Administradoras', roles: ['administrador'] },
  { to: '/admin/pacotes', icon: Package, label: 'Pacotes', roles: ['administrador', 'recepcao'] },
  { to: '/admin/especialidades', icon: Stethoscope, label: 'Especialidades', roles: ['administrador'] },
  // Financeiro
  { to: '/admin/financeiro', icon: DollarSign, label: 'Financeiro', roles: ['administrador', 'financeiro'] },
  { to: '/admin/guias', icon: Receipt, label: 'Guias Médicas', roles: ['administrador', 'financeiro', 'recepcao'] },
  { to: '/admin/lotes-faturamento', icon: FileBarChart, label: 'Faturamento', roles: ['administrador', 'financeiro'] },
  { to: '/admin/repasses', icon: Wallet, label: 'Repasses', roles: ['administrador', 'financeiro'] },
  { to: '/admin/repasse-convenios', icon: Banknote, label: 'Rep. Convênios', roles: ['administrador', 'financeiro'] },
  { to: '/admin/relatorios-financeiros', icon: FileBarChart, label: 'Relatórios', roles: ['administrador', 'financeiro'] },
  { to: '/admin/formas-pagamento', icon: Banknote, label: 'Formas Pgto', roles: ['administrador'] },
  { to: '/admin/escalas', icon: Calendar, label: 'Configurar Escalas', roles: ['administrador'] },
];

export function Sidebar() {
  const { signOut, roles, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  const filteredItems = menuItems.filter((item) =>
    item.roles.some((role) => roles.includes(role as any))
  );

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <img src={logoPacem} alt="Clínica Pacem" className="h-8 w-auto" />
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-semibold text-foreground tracking-tight">Pacem</span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">Gestão</span>
        </div>
      </div>
      
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <div className="space-y-0.5">
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      
      {/* User */}
      <div className="border-t border-border p-3">
        <div className="mb-2 px-1">
          <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
          <p className="text-[11px] text-muted-foreground capitalize">
            {roles.join(', ') || 'Sem permissões'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
          Sair
        </Button>
      </div>
    </aside>
  );
}
