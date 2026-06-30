
ALTER TABLE public.specialty_health_insurances
  ADD COLUMN IF NOT EXISTS administrator_id uuid REFERENCES public.administrators(id) ON DELETE CASCADE;

-- Drop any existing unique constraint that doesn't include administrator_id and recreate
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.specialty_health_insurances'::regclass
    AND contype = 'u';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.specialty_health_insurances DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS specialty_health_insurances_unique_idx
  ON public.specialty_health_insurances (specialty_id, health_insurance_id, COALESCE(administrator_id, '00000000-0000-0000-0000-000000000000'::uuid));
