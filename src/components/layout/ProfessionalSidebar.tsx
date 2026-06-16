import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logoPacem from '@/assets/logoPacem.png';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { Calendar, LayoutDashboard, Wallet, LogOut, Users, Settings as SettingsIcon, CalendarCog, UserPlus, FileText, CalendarDays } from 'lucide-react';

const menuItems = [
  { to: '/professional/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/professional/agenda', icon: Calendar, label: 'Minha Agenda' },
  { to: '/professional/agendamentos', icon: CalendarDays, label: 'Agendamentos' },
  { to: '/professional/escalas', icon: CalendarCog, label: 'Minhas Escalas' },
  { to: '/professional/pacientes', icon: Users, label: 'Meus Pacientes' },
  { to: '/professional/cadastro-pacientes', icon: UserPlus, label: 'Cadastrar Paciente' },
  { to: '/professional/guias', icon: FileText, label: 'Guias' },
  { to: '/professional/repasses', icon: Wallet, label: 'Meus Repasses' },
  { to: '/professional/configuracoes', icon: SettingsIcon, label: 'Minha Conta' },
];

export function ProfessionalSidebar() {
  const { signOut, user } = useAuth();
  const { settings } = useClinicSettings();
  const navigate = useNavigate();
  const logoSrc = settings?.logo_url || logoPacem;
  const clinicName = settings?.nome_fantasia || 'Pacem';

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth');
  };

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <img src={logoSrc} alt={clinicName} className="h-8 w-auto rounded object-contain" />
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight truncate">
            {clinicName}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-sidebar-accent text-accent-foreground font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-primary-foreground'
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-1">
          <p className="text-xs font-medium text-sidebar-primary-foreground truncate">{user?.email}</p>
          <p className="text-[11px] text-sidebar-foreground/60">Profissional</p>
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
