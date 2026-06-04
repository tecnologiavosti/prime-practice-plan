
-- Junction: specialties <-> health_insurances
CREATE TABLE public.specialty_health_insurances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id uuid NOT NULL,
  health_insurance_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (specialty_id, health_insurance_id)
);

GRANT SELECT ON public.specialty_health_insurances TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialty_health_insurances TO authenticated;
GRANT ALL ON public.specialty_health_insurances TO service_role;

ALTER TABLE public.specialty_health_insurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view specialty_health_insurances"
ON public.specialty_health_insurances FOR SELECT
USING (true);

CREATE POLICY "Admins can manage specialty_health_insurances"
ON public.specialty_health_insurances FOR ALL
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

-- Blog posts
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_url text,
  author text,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published posts"
ON public.blog_posts FOR SELECT
USING (published = true);

CREATE POLICY "Admins can view all posts"
ON public.blog_posts FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins manage posts"
ON public.blog_posts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
