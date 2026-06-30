ALTER TABLE public.insurance_administrators_map
ADD COLUMN IF NOT EXISTS billing_rate numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.insurance_administrators_map.billing_rate IS 'Valor de referência/faturamento específico deste convênio para esta administradora';

UPDATE public.insurance_administrators_map iam
SET billing_rate = COALESCE(hi.billing_rate, 0)
FROM public.health_insurances hi
WHERE hi.id = iam.insurance_id
  AND iam.billing_rate = 0
  AND COALESCE(hi.billing_rate, 0) > 0;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_administrators_map TO authenticated;
GRANT ALL ON public.insurance_administrators_map TO service_role;