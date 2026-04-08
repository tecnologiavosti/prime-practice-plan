
-- Allow new users to create their own patient record during signup
CREATE POLICY "Users can insert own patient record"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow new users to assign themselves the 'paciente' role during signup
CREATE POLICY "Users can insert own paciente role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'paciente');
