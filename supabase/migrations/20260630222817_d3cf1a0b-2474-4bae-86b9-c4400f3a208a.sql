CREATE TABLE public.package_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.private_packages(id) ON DELETE CASCADE,
  name text NOT NULL,
  section_value numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_sections TO authenticated;
GRANT ALL ON public.package_sections TO service_role;
ALTER TABLE public.package_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manages package sections" ON public.package_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'recepcao') OR public.has_role(auth.uid(),'financeiro'))
  WITH CHECK (public.has_role(auth.uid(),'administrador') OR public.has_role(auth.uid(),'recepcao') OR public.has_role(auth.uid(),'financeiro'));
CREATE TRIGGER trg_package_sections_updated_at BEFORE UPDATE ON public.package_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.package_procedures ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.package_sections(id) ON DELETE SET NULL;