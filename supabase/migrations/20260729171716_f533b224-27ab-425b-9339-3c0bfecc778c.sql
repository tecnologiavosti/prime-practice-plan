
CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content public read"
  ON public.site_content FOR SELECT
  USING (true);

CREATE POLICY "site_content admin insert"
  ON public.site_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "site_content admin update"
  ON public.site_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "site_content admin delete"
  ON public.site_content FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role));

CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS landing_order int NOT NULL DEFAULT 0;
