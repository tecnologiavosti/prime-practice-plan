import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Calendar,
  User,
  LogOut,
  Home,
  FileText,
  CalendarPlus,
} from 'lucide-react';

const menuItems = [
  { to: '/dashboard', icon: Home, label: 'Início', end: true },
  { to: '/agendamentos', icon: Calendar, label: 'Meus Agendamentos' },
  { to: '/agendar', icon: CalendarPlus, label: 'Agendar Consulta' },
  { to: '/meus-dados', icon: User, label: 'Meus Dados' },
  { to: '/historico', icon: FileText, label: 'Histórico Médico' },
];

export function PatientLayout() {
  const { user, loading, isPatient, isAdmin, patientProfile, signOut } = usePatientAuth();
  const navigate = useNavigate();
  const [rolesChecked, setRolesChecked] = useState(false);

  // Wait for roles to be fetched before making decisions
  useEffect(() => {
    if (!loading && user) {
      // Give a small delay for fetchPatientProfile to complete
      const timer = setTimeout(() => setRolesChecked(true), 300);
      return () => clearTimeout(timer);
    }
    if (!loading && !user) {
      setRolesChecked(true);
    }
  }, [loading, user]);

  if (loading || (user && !rolesChecked)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin users should be redirected to admin panel
  if (isAdmin && !isPatient) {
    return <Navigate to="/admin" replace />;
  }

  if (!isPatient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Sua conta não está vinculada a um perfil de paciente. Por favor, cadastre-se como paciente ou entre em contato com a clínica.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              signOut();
              navigate('/login');
            }}
          >
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex h-screen w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Portal do Paciente</span>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
            <p className="font-medium truncate">{patientProfile?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
