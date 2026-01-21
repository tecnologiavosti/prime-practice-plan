-- Add billing_value column to health_insurances for the expected/reference value per insurance
ALTER TABLE public.health_insurances 
ADD COLUMN IF NOT EXISTS billing_rate numeric DEFAULT 0;

-- Add a comment explaining the field
COMMENT ON COLUMN public.health_insurances.billing_rate IS 'Taxa/valor de referência para faturamento deste convênio';