
ALTER TABLE public.medical_guides ADD COLUMN IF NOT EXISTS attachment_url text;

NOTIFY pgrst, 'reload schema';
