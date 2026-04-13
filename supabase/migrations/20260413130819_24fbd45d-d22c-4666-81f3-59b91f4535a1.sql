
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS document_url text;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
