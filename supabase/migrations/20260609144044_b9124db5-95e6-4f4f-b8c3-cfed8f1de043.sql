ALTER TABLE public.authorized_admins ADD COLUMN IF NOT EXISTS allowed_modules text[] NOT NULL DEFAULT '{}';
DROP POLICY IF EXISTS "Users can read own authorized_admin row" ON public.authorized_admins;
CREATE POLICY "Users can read own authorized_admin row" ON public.authorized_admins FOR SELECT TO authenticated USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));