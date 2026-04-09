import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  UserCheck,
} from 'lucide-react';

const menuItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', roles: ['administrador', 'recepcao', 'profissional', 'financeiro'] },
  { to: '/admin/agenda', icon: Calendar, label: 'Agenda', roles: ['administrador', 'recepcao', 'profissional'] },
  { to: '/admin/agendamentos', icon: ClipboardList, label: 'Agendamentos', roles: ['administrador', 'recepcao', 'profissional'] },
  { to: '/admin/pacientes', icon: Users, label: 'Pacientes', roles: ['administrador', 'recepcao', 'profissional'] },
  { to: '/admin/pacientes-pendentes', icon: UserCheck, label: 'Pacientes Pendentes', roles: ['administrador'] },
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
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <Stethoscope className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Sistema Clínico</span>
      </div>
      
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="border-t p-4">
        <div className="mb-3 text-sm">
          <p className="font-medium truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {roles.join(', ') || 'Sem permissões'}
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
