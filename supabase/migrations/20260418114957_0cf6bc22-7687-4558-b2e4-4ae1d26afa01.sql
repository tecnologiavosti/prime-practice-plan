-- Tabela de configurações da clínica (singleton)
CREATE TABLE public.clinic_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  logo_url text,
  nome_fantasia text NOT NULL DEFAULT 'Clínica Pacem',
  razao_social text,
  cnpj text,
  endereco_completo text DEFAULT 'SCN Quadra 1 Bloco E Sala 1905 – Edifício Central Park – Asa Norte – Brasília/DF',
  telefone text DEFAULT '(61) 99649-7990',
  email_contato text DEFAULT 'contato@clinicapacem.com.br',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinic_settings_singleton_check CHECK (singleton = true)
);

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver (necessário para login/landing)
CREATE POLICY "Anyone can view clinic settings"
ON public.clinic_settings FOR SELECT
USING (true);

-- Apenas admins podem inserir/atualizar
CREATE POLICY "Admins can insert clinic settings"
ON public.clinic_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can update clinic settings"
ON public.clinic_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can delete clinic settings"
ON public.clinic_settings FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insere registro inicial
INSERT INTO public.clinic_settings (singleton) VALUES (true);

-- Bucket público para a logo da clínica
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para clinic-assets
CREATE POLICY "Anyone can view clinic assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-assets');

CREATE POLICY "Admins can upload clinic assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinic-assets' AND has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can update clinic assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clinic-assets' AND has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can delete clinic assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinic-assets' AND has_role(auth.uid(), 'administrador'::app_role));