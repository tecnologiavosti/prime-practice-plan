import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PublicHeader } from '@/components/site/PublicHeader';
import { PublicFooter } from '@/components/site/PublicFooter';
import { SeoHead } from '@/components/SeoHead';
import { ArrowLeft, Users } from 'lucide-react';

interface PublicProfessional {
  id: string;
  full_name: string;
  photo_url: string | null;
  landing_bio: string | null;
  landing_about: string | null;
  landing_curriculum: string | null;
  specialty_name: string | null;
}

export default function ProfessionalPublic() {
  const { id } = useParams<{ id: string }>();
  const [prof, setProf] = useState<PublicProfessional | null>(null);
  const [insurances, setInsurances] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data }, { data: ins }] = await Promise.all([
        (supabase.rpc as any)('get_landing_professional', { _id: id }),
        (supabase.rpc as any)('get_professional_insurances', { _id: id }),
      ]);
      setProf((data?.[0] as PublicProfessional) ?? null);
      setInsurances((ins as any) ?? []);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SeoHead />
      <PublicHeader />

      <main className="container mx-auto px-5 md:px-10 py-12 max-w-4xl">
        <Link to="/#equipe" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar para a equipe
        </Link>

        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : !prof ? (
          <p className="text-slate-500">Profissional não encontrado.</p>
        ) : (
          <article>
            <header className="flex flex-col sm:flex-row gap-6 items-start sm:items-center border-b pb-8 mb-8">
              {prof.photo_url ? (
                <div className="h-32 w-32 rounded-full overflow-hidden border bg-white">
                  <img src={prof.photo_url} alt={prof.full_name}
                    className="h-full w-full object-cover object-top scale-110" />
                </div>
              ) : (
                <div className="h-32 w-32 rounded-full border bg-slate-100 inline-flex items-center justify-center">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
              )}
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{prof.full_name}</h1>
                {prof.specialty_name && (
                  <p className="mt-2 text-base font-semibold text-sky-700">{prof.specialty_name}</p>
                )}
                {insurances.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Convênios atendidos</p>
                    <div className="flex flex-wrap gap-1.5">
                      {insurances.map((i) => (
                        <span key={i.id} className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs">
                          {i.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {prof.landing_bio && (
                  <p className="mt-3 text-slate-600 max-w-xl">{prof.landing_bio}</p>
                )}
              </div>
            </header>

            {prof.landing_about && (
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-3">Sobre</h2>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{prof.landing_about}</p>
              </section>
            )}

            {prof.landing_curriculum && (
              <section className="mb-8">
                <h2 className="text-xl font-bold mb-3">Histórico curricular</h2>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{prof.landing_curriculum}</p>
              </section>
            )}
          </article>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
