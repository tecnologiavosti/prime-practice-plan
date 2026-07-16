import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicHeader } from '@/components/site/PublicHeader';
import { PublicFooter } from '@/components/site/PublicFooter';
import { SeoHead } from '@/components/SeoHead';
import { Users, ArrowRight } from 'lucide-react';
import { makeProfessionalSlug } from '@/lib/slug';

interface TeamMember {
  id: string;
  full_name: string;
  photo_url: string | null;
  landing_bio: string | null;
  specialty_name: string | null;
}

const WHATSAPP = '5561981823984';
const wa = (msg: string) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

export default function EquipePublic() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.rpc as any)('get_landing_professionals');
      setTeam((data as TeamMember[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SeoHead />
      <PublicHeader />

      <main className="container mx-auto px-5 md:px-10 py-16 md:py-24 max-w-6xl">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
            Nossa equipe
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Conheça nossos <span className="text-sky-700">profissionais</span>
          </h1>
          <p className="mt-4 text-slate-600">
            Formação sólida, atualização constante e cuidado humanizado com você e sua família.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-slate-500">Carregando profissionais...</p>
        ) : team.length === 0 ? (
          <p className="text-center text-slate-500">Nenhum profissional disponível no momento.</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {team.map((m) => (
              <Link
                key={m.id}
                to={`/equipe/${makeProfessionalSlug(m.id, m.full_name)}`}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {m.photo_url ? (
                  <div className="mx-auto mb-4 h-28 w-28 rounded-full overflow-hidden border border-slate-200 bg-white">
                    <img
                      src={m.photo_url}
                      alt={m.full_name}
                      loading="lazy"
                      className="h-full w-full object-cover object-top scale-110"
                    />
                  </div>
                ) : (
                  <div className="mx-auto mb-4 inline-flex h-28 w-28 items-center justify-center rounded-full bg-white text-sky-700 border border-slate-200">
                    <Users className="h-9 w-9" />
                  </div>
                )}
                <h3 className="text-[16px] font-bold mb-0.5 group-hover:text-sky-700">
                  {m.full_name}
                </h3>
                {m.specialty_name && (
                  <p className="text-[13px] text-sky-700 font-semibold mb-2">{m.specialty_name}</p>
                )}
                {m.landing_bio && (
                  <p className="text-[13px] text-slate-600 line-clamp-3 mb-3">{m.landing_bio}</p>
                )}
                <span className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 group-hover:text-sky-700">
                  Ver perfil <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <a
            href={wa('Olá! Gostaria de conhecer a equipe da Clínica Pacem.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold transition-colors"
          >
            Agende agora
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
