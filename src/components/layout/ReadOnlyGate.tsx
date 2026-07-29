import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

interface Props {
  moduleKey: string;
  children: React.ReactNode;
}

/**
 * Wraps a page content and, when the current user has "view-only" access to
 * the given module, applies CSS-based neutralization of mutating controls
 * (buttons that aren't tab/combobox/nav) and shows a banner.
 *
 * Filters, tabs, select/combobox triggers and inputs remain usable so the
 * user can still browse and filter the data.
 */
export const ReadOnlyGate: React.FC<Props> = ({ moduleKey, children }) => {
  const { canEditModule, loading } = useAuth();
  if (loading) return <>{children}</>;
  const editable = canEditModule(moduleKey);
  if (editable) return <>{children}</>;

  return (
    <div className="readonly-mode">
      <div className="sticky top-0 z-40 bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm flex items-center gap-2">
        <Lock className="h-4 w-4" />
        <span>
          Modo <b>somente visualização</b>: você pode consultar os dados deste módulo, mas não pode criar, editar ou excluir.
        </span>
      </div>
      {children}
    </div>
  );
};
