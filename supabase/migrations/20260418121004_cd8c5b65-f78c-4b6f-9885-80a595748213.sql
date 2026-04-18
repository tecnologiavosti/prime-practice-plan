-- Create junction table for many-to-many relationship
CREATE TABLE public.insurance_administrators_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insurance_id UUID NOT NULL REFERENCES public.health_insurances(id) ON DELETE CASCADE,
  administrator_id UUID NOT NULL REFERENCES public.administrators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (insurance_id, administrator_id)
);

CREATE INDEX idx_iam_insurance ON public.insurance_administrators_map(insurance_id);
CREATE INDEX idx_iam_administrator ON public.insurance_administrators_map(administrator_id);

-- Migrate existing single relations to the new junction table
INSERT INTO public.insurance_administrators_map (insurance_id, administrator_id)
SELECT id, administrator_id
FROM public.health_insurances
WHERE administrator_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.insurance_administrators_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage insurance_administrators_map"
ON public.insurance_administrators_map
FOR ALL
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Authenticated users can view insurance_administrators_map"
ON public.insurance_administrators_map
FOR SELECT
TO authenticated
USING (has_any_role(auth.uid()));

-- Remove redundant column from health_insurances
ALTER TABLE public.health_insurances DROP COLUMN IF EXISTS administrator_id;