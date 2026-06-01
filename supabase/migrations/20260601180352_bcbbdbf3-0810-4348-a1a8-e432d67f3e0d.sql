
CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  meta_title text DEFAULT 'Clínica Pacem - Agendamento Online',
  meta_description text DEFAULT 'Agende sua consulta online na Clínica Pacem. Atendimento particular e por convênio.',
  meta_keywords text,
  og_image_url text,
  google_site_verification text,
  bing_site_verification text,
  ga4_measurement_id text,
  gtm_container_id text,
  meta_pixel_id text,
  robots_txt text DEFAULT E'User-agent: *\nAllow: /\n',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seo_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_settings TO authenticated;
GRANT ALL ON public.seo_settings TO service_role;

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seo settings"
  ON public.seo_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert seo settings"
  ON public.seo_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can update seo settings"
  ON public.seo_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can delete seo settings"
  ON public.seo_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE TRIGGER update_seo_settings_updated_at
  BEFORE UPDATE ON public.seo_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.seo_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;
