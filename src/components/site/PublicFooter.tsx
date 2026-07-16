import { Link } from 'react-router-dom';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import logoPacem from '@/assets/logoPacem.png';
import {
  Instagram,
  Facebook,
  Clock,
  MapPin,
  Phone,
  Mail,
  Lock,
  Building2,
} from 'lucide-react';

const COWORKING_WA = `https://wa.me/5561981823984?text=${encodeURIComponent(
  'Olá! Tenho interesse em locação de consultório no coworking saúde da Clínica Pacem. Poderiam me passar mais informações?'
)}`;

const especialidades = [
  'Psicologia',
  'Psiquiatria',
  'Nutrição',
  'Fonoaudiologia',
  'Clínico Geral',
  'RN1',
];

export function PublicFooter() {
  const { settings } = useClinicSettings();
  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';
  const clinicLogo = settings?.logo_url || logoPacem;

  return (
    <footer id="contato" className="bg-white border-t border-[hsl(214_32%_91%)] text-[hsl(215_16%_47%)]">
      <div className="container mx-auto px-5 md:px-10 py-12 md:py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src={clinicLogo} alt={clinicName} className="h-9 w-auto object-contain" />
            <div className="leading-tight">
              <div className="text-[hsl(222_47%_11%)] font-bold">{clinicName}</div>
              <div className="text-[10px] uppercase tracking-[0.22em]">Saúde Mental · Brasília</div>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed">
            Clínica multidisciplinar especializada em saúde mental, com atendimento humanizado em Brasília.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="https://www.instagram.com/clinicapacem" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(214_32%_91%)] bg-white hover:text-[hsl(221_83%_53%)] hover:border-[hsl(221_83%_53%/0.4)] transition-colors">
              <Instagram className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </a>
            <a href="https://www.facebook.com/clinicapacem" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(214_32%_91%)] bg-white hover:text-[hsl(221_83%_53%)] hover:border-[hsl(221_83%_53%/0.4)] transition-colors">
              <Facebook className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </a>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(222_47%_11%)] mb-4">Especialidades</p>
          <ul className="space-y-2.5 text-[13.5px]">
            {especialidades.map((s) => (
              <li key={s}><a href="/#especialidades" className="hover:text-[hsl(221_83%_53%)]">{s}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(222_47%_11%)] mb-4">Atendimento</p>
          <ul className="space-y-2.5 text-[13.5px]">
            <li className="flex items-start gap-2"><Clock className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(221_83%_53%)]" /><div><div className="text-[hsl(222_47%_11%)] font-semibold">Seg a Sex</div>08h às 19h</div></li>
            <li className="flex items-start gap-2"><Clock className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(221_83%_53%)]" /><div><div className="text-[hsl(222_47%_11%)] font-semibold">Sábado</div>08h às 13h</div></li>
            <li><Link to="/convenios" className="hover:text-[hsl(221_83%_53%)]">Convênios</Link></li>
            <li><a href="/#blog" className="hover:text-[hsl(221_83%_53%)]">Blog</a></li>
            <li><Link to="/politica-de-privacidade" className="inline-flex items-center gap-1.5 hover:text-[hsl(221_83%_53%)]"><Lock className="h-3.5 w-3.5" />Política de Privacidade</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[hsl(222_47%_11%)] mb-4">Contato</p>
          <ul className="space-y-2.5 text-[13.5px]">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(221_83%_53%)]" />{settings?.endereco_completo || 'SCN Quadra 1 Bloco E Sala 1905 — Asa Norte, Brasília/DF'}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-[hsl(221_83%_53%)]" />(61) 98182-3984</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-[hsl(221_83%_53%)]" />{settings?.email_contato || 'contato@clinicapacem.com.br'}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[hsl(214_32%_91%)]">
        <div className="container mx-auto px-5 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12.5px]">
          <p>© {new Date().getFullYear()} {clinicName}. Todos os direitos reservados.</p>
          <Link to="/admin/auth" className="hover:text-[hsl(221_83%_53%)] transition-colors">Área Administrativa</Link>
        </div>
      </div>
    </footer>
  );
}
