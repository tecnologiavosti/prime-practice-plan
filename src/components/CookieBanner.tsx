import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'cookie-consent-v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = (value: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-6 pointer-events-none">
      <div className="mx-auto max-w-5xl pointer-events-auto rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-12px_rgba(15,23,42,0.25)]">
        <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 md:p-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Cookie className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="text-[13.5px] leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-900 mb-0.5">Utilizamos cookies</p>
              <p>
                Usamos cookies para melhorar sua experiência, lembrar suas preferências e analisar o uso do site.
                Ao continuar navegando, você concorda com nossa{' '}
                <Link to="/politica-de-privacidade" className="text-blue-600 hover:underline font-medium">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => accept('declined')}
              className="h-9 px-4 text-[13px] rounded-lg"
            >
              Recusar
            </Button>
            <Button
              size="sm"
              onClick={() => accept('accepted')}
              className="h-9 px-5 text-[13px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              Aceitar cookies
            </Button>
            <button
              aria-label="Fechar"
              onClick={() => accept('declined')}
              className="ml-1 hidden md:inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
