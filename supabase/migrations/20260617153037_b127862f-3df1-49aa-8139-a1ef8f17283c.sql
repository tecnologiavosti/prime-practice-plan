CREATE POLICY "Professionals can insert own appointments" ON public.appointments
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'profissional'::app_role) AND professional_id = current_professional_id());

CREATE POLICY "Professionals can delete own appointments" ON public.appointments
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'profissional'::app_role) AND professional_id = current_professional_id());