import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { SeoHead } from '@/components/SeoHead';
import { PublicHeader } from '@/components/site/PublicHeader';
import { PublicFooter } from '@/components/site/PublicFooter';
import { fetchSiteContent } from '@/hooks/useSiteContent';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, Brain, Stethoscope, Apple, MessageSquare,
  HeartPulse, Briefcase, CheckCircle2, Sparkles, Clock, Users, ShieldCheck,
  ClipboardList, Cross, BookOpen, Activity,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Brain, Stethoscope, Apple, MessageSquare, HeartPulse, Briefcase,
  ClipboardList, Cross, BookOpen, Activity,
};


const WHATSAPP = '5561981823984';
const wa = (msg: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;


type Especialidade = {
  slug: string;
  title: string;
  tagline: string;
  intro: string;
  icon: LucideIcon;
  beneficios: string[];
  indicacoes: string[];
  custom?: 'rn1';
};

const ESPECIALIDADES: Record<string, Especialidade> = {
  'psicologia': {
    slug: 'psicologia',
    title: 'Psicologia',
    tagline: 'Cuidado emocional contínuo para todas as fases da vida',
    intro: 'Atendimento psicoterapêutico individual para crianças, adolescentes, adultos e idosos. Trabalhamos ansiedade, depressão, autoestima, relacionamentos e desenvolvimento pessoal com abordagens baseadas em evidências.',
    icon: Brain,
    beneficios: [
      'Acolhimento humanizado e sigiloso',
      'Atendimento presencial e online',
      'Abordagens TCC, psicanálise e humanista',
      'Acompanhamento contínuo personalizado',
    ],
    indicacoes: [
      'Ansiedade e crises de pânico',
      'Depressão e tristeza persistente',
      'Estresse, burnout e sobrecarga',
      'Conflitos familiares e relacionais',
      'Luto e fases de transição',
    ],
  },
  'psiquiatria': {
    slug: 'psiquiatria',
    title: 'Psiquiatria',
    tagline: 'Tratamento médico especializado em saúde mental',
    intro: 'Avaliação clínica completa e acompanhamento medicamentoso quando necessário, sempre integrado ao processo psicoterapêutico para resultados mais consistentes.',
    icon: Stethoscope,
    beneficios: [
      'Diagnóstico preciso e individualizado',
      'Prescrição responsável e segura',
      'Integração com a psicoterapia',
      'Reavaliações periódicas',
    ],
    indicacoes: [
      'Transtornos de ansiedade',
      'Depressão moderada e grave',
      'TDAH em adultos e crianças',
      'Transtorno bipolar',
      'Insônia e distúrbios do sono',
    ],
  },
  'nutricao': {
    slug: 'nutricao',
    title: 'Nutrição',
    tagline: 'Nutrição comportamental integrada à saúde mental',
    intro: 'Plano alimentar individualizado considerando rotina, preferências e saúde emocional. Foco em qualidade de vida, não em dietas restritivas.',
    icon: Apple,
    beneficios: [
      'Plano alimentar personalizado',
      'Educação alimentar duradoura',
      'Integração com saúde mental',
      'Acompanhamento de evolução',
    ],
    indicacoes: [
      'Reeducação alimentar',
      'Compulsão alimentar',
      'Emagrecimento saudável',
      'Nutrição clínica',
      'Performance e bem-estar',
    ],
  },
  'fonoaudiologia': {
    slug: 'fonoaudiologia',
    title: 'Fonoaudiologia',
    tagline: 'Comunicação, linguagem e desenvolvimento infantil',
    intro: 'Avaliação e terapia para linguagem, fala, voz e desenvolvimento da comunicação, com foco em resultados práticos no dia a dia.',
    icon: MessageSquare,
    beneficios: [
      'Avaliação detalhada e diagnóstica',
      'Plano terapêutico individualizado',
      'Orientação para família e escola',
      'Sessões lúdicas para crianças',
    ],
    indicacoes: [
      'Atraso de linguagem infantil',
      'Trocas e dificuldades de fala',
      'Gagueira',
      'Alterações de voz',
      'Apoio a TEA e TDAH',
    ],
  },
  'rn1': {
    slug: 'rn1',
    title: 'RN-1',
    tagline: 'Plano corporativo de saúde mental e bem-estar',
    intro: 'Cuidado completo para colaboradores com acesso à Psiquiatria, Psicologia, Nutrição e Personal Trainer, além de atendimento médico 24h e teleconsultas. Mais saúde, bem-estar e produtividade para sua equipe.',
    icon: Briefcase,
    beneficios: [],
    indicacoes: [],
    custom: 'rn1',
  },
  'avaliacao-neuropsicologica': {
    slug: 'avaliacao-neuropsicologica',
    title: 'Avaliação Neuropsicológica',
    tagline: 'Mapeamento aprofundado das funções cognitivas',
    intro: 'Bateria completa de testes padronizados para avaliar memória, atenção, linguagem, raciocínio e funções executivas. Emitimos laudo detalhado com orientações para tratamento, escola e trabalho.',
    icon: ClipboardList,
    beneficios: [
      'Laudo técnico completo e detalhado',
      'Testes padronizados internacionalmente',
      'Orientação para escola, família e trabalho',
      'Integração com psicologia e psiquiatria',
    ],
    indicacoes: [
      'Suspeita de TDAH em crianças e adultos',
      'Investigação de dificuldades de aprendizagem',
      'Avaliação de TEA (Transtorno do Espectro Autista)',
      'Diagnóstico diferencial em quadros complexos',
      'Avaliação de demências e declínio cognitivo',
    ],
  },
  'clinico-medico': {
    slug: 'clinico-medico',
    title: 'Clínico Médico',
    tagline: 'Cuidado médico integral para toda a família',
    intro: 'Consulta clínica ampla com anamnese detalhada, exame físico, solicitação e análise de exames, além de acompanhamento de doenças crônicas e cuidado preventivo em todas as fases da vida.',
    icon: Cross,
    beneficios: [
      'Avaliação médica completa',
      'Coordenação com outras especialidades',
      'Renovação e ajuste de medicações',
      'Foco em prevenção e qualidade de vida',
    ],
    indicacoes: [
      'Check-up periódico',
      'Hipertensão, diabetes e colesterol',
      'Avaliação pré-operatória',
      'Sintomas gerais sem diagnóstico definido',
      'Acompanhamento de doenças crônicas',
    ],
  },
  'psicopedagogia': {
    slug: 'psicopedagogia',
    title: 'Psicopedagogia',
    tagline: 'Aprender com autonomia, confiança e prazer',
    intro: 'Avaliação e intervenção psicopedagógica para crianças, adolescentes e adultos com dificuldades de aprendizagem, foco, organização de estudos e desempenho escolar.',
    icon: BookOpen,
    beneficios: [
      'Diagnóstico psicopedagógico completo',
      'Intervenção lúdica e personalizada',
      'Orientação a pais e escolas',
      'Estratégias práticas de estudo',
    ],
    indicacoes: [
      'Dificuldades de leitura e escrita',
      'Baixo rendimento escolar',
      'TDAH e problemas de atenção',
      'Dislexia, discalculia e disgrafia',
      'Ansiedade em provas e concursos',
    ],
  },
  'neurologia': {
    slug: 'neurologia',
    title: 'Neurologia',
    tagline: 'Cuidado especializado para o sistema nervoso',
    intro: 'Diagnóstico e tratamento de doenças neurológicas com abordagem baseada em evidências, incluindo cefaleias, epilepsia, distúrbios do sono, tonturas e doenças neurodegenerativas.',
    icon: Activity,
    beneficios: [
      'Avaliação neurológica detalhada',
      'Solicitação e leitura de exames especializados',
      'Tratamento medicamentoso individualizado',
      'Acompanhamento contínuo de longo prazo',
    ],
    indicacoes: [
      'Enxaquecas e cefaleias crônicas',
      'Epilepsia e crises convulsivas',
      'Tonturas, vertigens e desequilíbrios',
      'Insônia e distúrbios do sono',
      'Doenças neurodegenerativas (Alzheimer, Parkinson)',
    ],
  },
};

const RN1_DIFERENCIAIS = [
  { icon: Stethoscope, title: 'Psiquiatria', desc: 'Acompanhamento especializado para saúde emocional.' },
  { icon: Brain, title: 'Psicologia (1x mês)', desc: 'Sessões mensais para equilíbrio mental.' },
  { icon: Apple, title: 'Nutrição (1x mês)', desc: 'Plano alimentar personalizado.' },
  { icon: HeartPulse, title: 'Personal Trainer (1x mês)', desc: 'Orientação para qualidade de vida.' },
];
const RN1_ESTRUTURA = [
  'Médico Clínico Geral 24h por dia',
  'Atendimento 7 dias por semana',
  'Teleconsulta imediata',
  'Especialidades mediante agendamento',
];
const RN1_BENEFICIOS_EMPRESAS = [
  'Redução de afastamentos',
  'Valorização da equipe',
  'Diferencial competitivo',
  'Recorrência com alto valor percebido',
];

export default function EspecialidadePage() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useClinicSettings();
  const clinicName = settings?.nome_fantasia || 'Clínica Pacem';

  const [override, setOverride] = useState<any | null>(null);
  const [loadedCms, setLoadedCms] = useState(false);

  useEffect(() => {
    (async () => {
      const items = await fetchSiteContent<any[]>('especialidades');
      if (Array.isArray(items) && slug) {
        const found = items.find((x) => (x?.slug || '') === slug);
        if (found) setOverride(found);
      }
      setLoadedCms(true);
    })();
  }, [slug]);

  const base = slug ? ESPECIALIDADES[slug] : null;

  if (!base && !override && loadedCms) return <Navigate to="/" replace />;
  if (!base && !loadedCms) return null;

  const splitLines = (s?: string) =>
    (s || '').split('\n').map((l) => l.trim()).filter(Boolean);

  const data = {
    slug: slug || base?.slug || '',
    title: override?.title || base?.title || '',
    tagline: override?.subtitle || base?.tagline || '',
    intro: override?.intro || base?.intro || '',
    icon: (override?.icon && ICON_MAP[override.icon]) || base?.icon || Stethoscope,
    beneficios: override?.benefits ? splitLines(override.benefits) : (base?.beneficios || []),
    indicacoes: override?.indications ? splitLines(override.indications) : (base?.indicacoes || []),
    custom: base?.custom,
  };

  const Icon = data.icon;
  const isRn1 = data.custom === 'rn1';


  return (
    <div className="min-h-screen bg-[hsl(210_40%_98%)] font-['Inter',_sans-serif] text-[hsl(222_47%_11%)]">
      <SeoHead />
      <PublicHeader />


      <section className="container mx-auto px-5 md:px-10 py-12 md:py-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(214_32%_91%)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(221_83%_53%)]">
            Especialidade
          </span>
          <div className="mt-6 flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(214_95%_93%)] text-[hsl(221_83%_53%)] flex items-center justify-center shrink-0">
              <Icon className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-[32px] md:text-[44px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                {data.title}
              </h1>
              <p className="mt-2 text-[16px] text-[hsl(221_83%_53%)] font-semibold">{data.tagline}</p>
            </div>
          </div>
          <p className="mt-6 text-[15.5px] text-[hsl(215_16%_47%)] leading-relaxed">{data.intro}</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={wa(`Olá! Gostaria de saber mais sobre ${data.title} na ${clinicName}.`)}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold transition-all"
            >
              <Sparkles className="h-4 w-4" /> Agende agora
            </a>
            <Link to="/convenios"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl border border-[hsl(214_32%_91%)] bg-white text-[hsl(222_47%_11%)] font-semibold hover:border-[hsl(221_83%_53%)] hover:text-[hsl(221_83%_53%)] transition-all">
              Ver convênios
            </Link>
          </div>
        </div>
      </section>

      {isRn1 ? (
        <section className="container mx-auto px-5 md:px-10 pb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-[22px] md:text-[26px] font-extrabold text-[hsl(221_83%_53%)] mb-5">Diferenciais Premium</h2>
              <div className="space-y-3">
                {RN1_DIFERENCIAIS.map((d) => (
                  <div key={d.title} className="flex items-start gap-3 rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-4">
                    <div className="h-11 w-11 rounded-xl bg-[hsl(214_95%_93%)] text-[hsl(221_83%_53%)] flex items-center justify-center shrink-0">
                      <d.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-[15.5px] font-bold">{d.title}</h3>
                      <p className="text-[13.5px] text-[hsl(215_16%_47%)]">{d.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-[22px] md:text-[26px] font-extrabold text-[hsl(221_83%_53%)] mb-5">Estrutura do Plano</h2>
              <ul className="space-y-3 mb-8">
                {RN1_ESTRUTURA.map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[15px]">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-5 mb-8">
                <p className="text-[13px] font-semibold text-[hsl(215_16%_47%)]">Investimento por vida:</p>
                <p className="text-[14px] text-[hsl(215_16%_47%)] mt-1">Implantação rápida · Gestão 100% digital · Sem estrutura</p>
              </div>
              <h3 className="text-[18px] font-extrabold text-[hsl(221_83%_53%)] mb-3">Ideal para empresas que buscam:</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-[14px]">
                {RN1_BENEFICIOS_EMPRESAS.map((b) => (
                  <li key={b} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : (
        <section className="container mx-auto px-5 md:px-10 pb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-7">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-[hsl(221_83%_53%)]" />
                <h2 className="text-[18px] font-extrabold">Benefícios</h2>
              </div>
              <ul className="space-y-2.5">
                {data.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14.5px]">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-7">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[hsl(221_83%_53%)]" />
                <h2 className="text-[18px] font-extrabold">Indicações</h2>
              </div>
              <ul className="space-y-2.5">
                {data.indicacoes.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-[14.5px]">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 bg-[hsl(221_83%_53%)] text-white">
        <div className="container mx-auto px-5 md:px-10 text-center max-w-2xl">
          <Clock className="h-8 w-8 mx-auto mb-3 opacity-90" />
          <h2 className="text-[24px] md:text-[30px] font-extrabold">Pronto para começar?</h2>
          <p className="mt-3 text-white/90">Fale com nossa equipe e agende seu atendimento.</p>
          <a
            href={wa(`Olá! Quero agendar ${data.title} na ${clinicName}.`)}
            target="_blank" rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-white text-[hsl(221_83%_53%)] font-bold hover:-translate-y-0.5 transition-all shadow-lg"
          >
            Agendar agora <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
