import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { PublicHeader } from '@/components/site/PublicHeader';
import { SeoHead } from '@/components/SeoHead';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  author: string | null;
  published_at: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Post[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      setPost(data as Post | null);
      setLoading(false);

      if (data) {
        const { data: r } = await supabase
          .from('blog_posts')
          .select('id, title, slug, excerpt, cover_url, author, published_at, content')
          .eq('published', true)
          .neq('id', (data as Post).id)
          .order('published_at', { ascending: false })
          .limit(3);
        setRelated((r as Post[]) || []);
      }
      window.scrollTo(0, 0);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter',_sans-serif] text-slate-900">
      <SeoHead />
      <PublicHeader floating={false} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-5 md:px-10 max-w-3xl">
          <Link
            to="/#blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para o blog
          </Link>

          {loading ? (
            <div className="py-20 text-center text-slate-500">Carregando...</div>
          ) : !post ? (
            <div className="py-20 text-center">
              <h1 className="text-2xl font-bold mb-2">Post não encontrado</h1>
              <p className="text-slate-600">O artigo que você procura pode ter sido removido.</p>
            </div>
          ) : (
            <article>
              <h1 className="text-[28px] md:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1] mb-4">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8">
                {post.author && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4" /> {post.author}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.published_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>

              {post.cover_url && (
                <img
                  src={post.cover_url}
                  alt={post.title}
                  className="w-full rounded-2xl mb-8 aspect-[16/9] object-cover"
                />
              )}

              <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-8 prose-h3:text-xl prose-p:leading-relaxed prose-a:text-sky-600 prose-strong:text-slate-900">
                <ReactMarkdown>{post.content || post.excerpt || ''}</ReactMarkdown>
              </div>
            </article>
          )}

          {related.length > 0 && (
            <section className="mt-16 border-t pt-10">
              <h2 className="text-xl font-bold mb-6">Leia também</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.slug}`}
                    className="block rounded-xl border bg-white overflow-hidden hover:shadow-lg transition"
                  >
                    {r.cover_url && (
                      <img src={r.cover_url} alt={r.title} className="w-full h-32 object-cover" loading="lazy" />
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-bold line-clamp-2">{r.title}</h3>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(r.published_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
