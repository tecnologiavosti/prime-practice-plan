import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import logoPacem from '@/assets/logoPacem.png';

const WHATSAPP = '5561998117985';
const waUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  'Olá! Gostaria de agendar uma consulta na Clínica Pacem.'
)}`;

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
  </svg>
);

const NAV_LINKS = [
  { label: 'Especialidades', href: '/#especialidades' },
  { label: 'Diferenciais', href: '/#diferenciais' },
  { label: 'Equipe', href: '/#equipe' },
  { label: 'Convênios', href: '/convenios' },
  { label: 'Blog', href: '/#blog' },
  { label: 'FAQ', href: '/#faq' },
];

export function PublicHeader({ floating = false }: { floating?: boolean }) {
  const { settings } = useClinicSettings();
  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';
  const clinicLogo = settings?.logo_url || logoPacem;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!floating) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [floating]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const headerClass = floating
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[hsl(214_32%_91%)] bg-white/90 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`
    : 'border-b border-[hsl(214_32%_91%)] bg-white';

  return (
    <header className={headerClass}>
      <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-4 md:px-10 py-2 md:py-3">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <img src={clinicLogo} alt={clinicName} className="h-9 w-auto object-contain shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="text-[15px] font-bold tracking-tight truncate">{clinicName}</div>
            <div className="hidden sm:block text-[9px] font-medium uppercase tracking-[0.22em] text-[hsl(215_16%_47%)]">
              Psicologia · Psiquiatria · Brasília
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-[hsl(222_47%_11%)]/75">
          {NAV_LINKS.map((l) =>
            l.href.startsWith('/#') ? (
              <a key={l.href} href={l.href} className="hover:text-[hsl(221_83%_53%)] transition-colors">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} to={l.href} className="hover:text-[hsl(221_83%_53%)] transition-colors">
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Agendar
          </a>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex rounded-xl border-[hsl(221_83%_53%)] text-[hsl(221_83%_53%)] hover:bg-[hsl(221_83%_53%)] hover:text-white px-3 md:px-4"
          >
            <Link to="/login">Entrar / Cadastrar-se</Link>
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Abrir menu"
                className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-[hsl(214_32%_91%)] bg-white text-[hsl(222_47%_11%)]"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-[360px] p-0 [&>button]:hidden">
              <div className="flex items-center justify-between border-b border-[hsl(214_32%_91%)] px-5 h-16">
                <div className="flex items-center gap-2">
                  <img src={clinicLogo} alt={clinicName} className="h-8 w-auto object-contain" />
                  <span className="text-[15px] font-bold">{clinicName}</span>
                </div>
                <button
                  aria-label="Fechar"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-[hsl(210_40%_96%)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col p-3">
                {NAV_LINKS.map((l) =>
                  l.href.startsWith('/#') ? (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="px-3 py-3 rounded-lg text-[15px] font-medium text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.href}
                      to={l.href}
                      onClick={() => setOpen(false)}
                      className="px-3 py-3 rounded-lg text-[15px] font-medium text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
                    >
                      {l.label}
                    </Link>
                  )
                )}
              </nav>

              <div className="px-4 pt-2 pb-6 space-y-3 border-t border-[hsl(214_32%_91%)] mt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d]"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Agendar pelo WhatsApp
                </a>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center h-11 rounded-xl border border-[hsl(221_83%_53%)] text-[hsl(221_83%_53%)] text-sm font-semibold hover:bg-[hsl(221_83%_53%)] hover:text-white"
                >
                  Entrar / Cadastrar-se
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
