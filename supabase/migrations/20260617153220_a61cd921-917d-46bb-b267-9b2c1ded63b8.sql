CREATE POLICY "Professionals manage own schedules" ON public.professional_schedules
FOR ALL TO authenticated
USING (has_role(auth.uid(),'profissional'::app_role) AND professional_id = current_professional_id())
WITH CHECK (has_role(auth.uid(),'profissional'::app_role) AND professional_id = current_professional_id());

CREATE POLICY "Professionals manage own special periods" ON public.professional_special_periods
FOR ALL TO authenticated
USING (has_role(auth.uid(),'profissional'::app_role) AND professional_id = current_professional_id())
WITH CHECK (has_role(auth.uid(),'profissional'::app_role) AND professional_id = current_professional_id());

CREATE POLICY "Professionals manage own schedule blocks" ON public.schedule_blocks
FOR ALL TO authenticated
USING (has_role(auth.uid(),'profissional'::app_role) AND professional_id = current_professional_id())
WITH CHECK (has_role(auth.uid(),'profissional'::app_role) AND professional_id = current_professional_id());