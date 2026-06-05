import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { SeoHead } from '@/components/SeoHead';
import logoPacem from '@/assets/logoPacem.png';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, ArrowLeft, ShieldCheck, Stethoscope } from 'lucide-react';

interface Specialty { id: string; name: string }
interface Insurance { id: string; name: string; code: string | null; ans_registration: string | null }

const LOGO_MAP: [RegExp, string][] = [
  [/unimed/i, 'unimed.coop.br'],
  [/amil/i, 'amil.com.br'],
  [/bradesco/i, 'bradescosaude.com.br'],
  [/sul ?am[eé]rica/i, 'sulamerica.com.br'],
  [/hapvida/i, 'hapvida.com.br'],
  [/notre ?dame|gndi|interm[eé]dica/i, 'gndi.com.br'],
  [/cassi/i, 'cassi.com.br'],
  [/geap/i, 'geap.com.br'],
  [/allianz/i, 'allianz.com.br'],
  [/porto ?seguro/i, 'portoseguro.com.br'],
  [/golden ?cross/i, 'goldencross.com.br'],
  [/care ?plus/i, 'careplus.com.br'],
  [/omint/i, 'omint.com.br'],
  [/medsenior/i, 'medsenior.com.br'],
  [/prevent ?senior/i, 'preventsenior.com.br'],
  [/petrobr[aá]s|petrobras|apse?b?/i, 'petrobras.com.br'],
  [/banco do brasil|cassi/i, 'bb.com.br'],
  [/saude ?caixa|caixa/i, 'caixa.gov.br'],
  [/postal ?sa[uú]de|correios/i, 'correios.com.br'],
];

function logoFor(name: string): string | null {
  for (const [r, d] of LOGO_MAP) if (r.test(name)) return `https://logo.clearbit.com/${d}`;
  return null;
}

export default function Convenios() {
  const { settings } = useClinicSettings();
  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';
  const clinicLogo = settings?.logo_url || logoPacem;

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('specialties')
        .select('id, name')
        .eq('active', true)
        .order('name');
      if (data) setSpecialties(data);
    })();
  }, []);

  useEffect(() => {
    if (!selected) { setInsurances([]); return; }
    setLoading(true);
    (async () => {
      const { data: links } = await supabase
        .from('specialty_health_insurances')
        .select('health_insurance_id')
        .eq('specialty_id', selected);
      const ids = (links || []).map((r: any) => r.health_insurance_id);
      if (ids.length === 0) { setInsurances([]); setLoading(false); return; }
      const { data: ins } = await supabase
        .from('health_insurances')
        .select('id, name, code, ans_registration, active')
        .in('id', ids)
        .eq('active', true)
        .order('name');
      setInsurances((ins || []) as Insurance[]);
      setLoading(false);
    })();
  }, [selected]);

  return (
    <div className="min-h-screen bg-[hsl(210_40%_98%)] font-['Inter',_sans-serif] text-[hsl(222_47%_11%)]">
      <SeoHead />
      <header className="border-b border-[hsl(214_32%_91%)] bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={clinicLogo} alt={clinicName} className="h-9 w-auto object-contain" />
            <span className="text-[15px] font-bold tracking-tight">{clinicName}</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[hsl(215_16%_47%)] hover:text-[hsl(221_83%_53%)]">
            <ArrowLeft className="h-4 w-4" /> Início
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-5 md:px-10 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(214_32%_91%)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(221_83%_53%)]">
            Convênios
          </span>
          <h1 className="mt-5 text-[32px] md:text-[44px] font-extrabold tracking-[-0.02em] leading-[1.1]">
            Convênios <span className="text-[hsl(221_83%_53%)]">aceitos</span>
          </h1>
          <p className="mt-4 text-[15.5px] text-[hsl(215_16%_47%)]">
            Selecione a especialidade desejada para ver os convênios atendidos.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-10">
          <label className="block text-[13px] font-semibold mb-2 text-[hsl(215_16%_47%)]">Especialidade</label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-12 bg-white">
              <SelectValue placeholder="Selecione uma especialidade" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="inline-flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-[hsl(221_83%_53%)]" /> {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-w-5xl mx-auto">
          {!selected ? (
            <div className="text-center text-[14px] text-[hsl(215_16%_47%)] py-12">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-[hsl(221_83%_53%)]/40" />
              Escolha uma especialidade acima.
            </div>
          ) : loading ? (
            <div className="text-center text-sm text-[hsl(215_16%_47%)] py-12">Carregando…</div>
          ) : insurances.length === 0 ? (
            <div className="text-center text-[14px] text-[hsl(215_16%_47%)] py-12">
              Nenhum convênio cadastrado para esta especialidade ainda.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {insurances.map((ins) => {
                const logo = logoFor(ins.name);
                return (
                  <div key={ins.id} className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-5 hover:shadow-[0_18px_40px_-18px_hsl(221_83%_53%/0.25)] transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 rounded-xl bg-[hsl(214_95%_93%)] flex items-center justify-center shrink-0 overflow-hidden p-1">
                        {logo ? (
                          <img
                            src={logo}
                            alt={`Logo ${ins.name}`}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              const t = e.currentTarget;
                              t.style.display = 'none';
                              const fb = t.nextElementSibling as HTMLElement | null;
                              if (fb) fb.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-full w-full items-center justify-center text-[hsl(221_83%_53%)]"
                          style={{ display: logo ? 'none' : 'flex' }}
                        >
                          <Building2 className="h-6 w-6" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15.5px] font-bold leading-tight">{ins.name}</h3>
                        <p className="text-[12px] text-[hsl(215_16%_47%)] mt-1">
                          {ins.code && <>Código: {ins.code} · </>}
                          {ins.ans_registration && <>ANS: {ins.ans_registration}</>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
