-- Drop the old constraint
ALTER TABLE public.medical_guides 
DROP CONSTRAINT IF EXISTS medical_guides_status_check;

-- Add updated constraint with autorizada status
ALTER TABLE public.medical_guides 
ADD CONSTRAINT medical_guides_status_check 
CHECK (status = ANY (ARRAY['pendente'::text, 'autorizada'::text, 'faturada'::text, 'recebida'::text, 'glosada'::text]));

-- Update existing records to use correct status names
UPDATE public.medical_guides SET status = 'faturada' WHERE status = 'faturado';
UPDATE public.medical_guides SET status = 'recebida' WHERE status = 'recebido';
UPDATE public.medical_guides SET status = 'glosada' WHERE status = 'glosado';