import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessionalSidebar } from './ProfessionalSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationBell } from './NotificationBell';
import { LiveClock } from './LiveClock';

export function ProfessionalLayout() {
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

  if (!user) return <Navigate to="/admin/auth" replace />;
  if (!roles.includes('profissional')) return <Navigate to="/admin" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ProfessionalSidebar />
      <main className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="sticky top-0 z-30 flex justify-end items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur border-b min-w-max">
          <LiveClock />
          <NotificationBell />
        </div>
        <div className="min-w-max md:min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
