import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_STAFF_ROLES: string[] = ['administrador', 'recepcao', 'financeiro'];

export function MainLayout() {
  const { user, loading, roles } = useAuth();

  if (loading) {
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
    return <Navigate to="/admin/auth" replace />;
  }

  const hasAdminRole = roles.some((r) => ADMIN_STAFF_ROLES.includes(r));
  const isProfessionalOnly = roles.includes('profissional') && !hasAdminRole;

  if (isProfessionalOnly) {
    return <Navigate to="/professional/dashboard" replace />;
  }

  if (!hasAdminRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
