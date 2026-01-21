-- Add user_id column to patients table to link patients with their auth accounts
ALTER TABLE public.patients 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_patients_user_id ON public.patients(user_id);

-- Add 'paciente' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'paciente';

-- Create RLS policy for patients to view their own data
CREATE POLICY "Patients can view own data" 
ON public.patients 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create RLS policy for patients to update their own data
CREATE POLICY "Patients can update own data" 
ON public.patients 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for patients to view their own appointments
CREATE POLICY "Patients can view own appointments" 
ON public.appointments 
FOR SELECT 
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  )
);

-- Create policy for patients to insert their own appointments
CREATE POLICY "Patients can create own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  )
);

-- Create policy for patients to view their own anamnesis
CREATE POLICY "Patients can view own anamnesis" 
ON public.anamnesis 
FOR SELECT 
USING (
  patient_id IN (
    SELECT id FROM public.patients WHERE user_id = auth.uid()
  )
);

-- Create policy for patients to view procedures (for booking)
CREATE POLICY "Patients can view active procedures" 
ON public.procedures 
FOR SELECT 
USING (active = true);

-- Create policy for patients to view professionals (for booking)
CREATE POLICY "Patients can view active professionals" 
ON public.professionals 
FOR SELECT 
USING (active = true);

-- Create policy for patients to view professional schedules (for booking)
CREATE POLICY "Patients can view professional_schedules" 
ON public.professional_schedules 
FOR SELECT 
USING (active = true);

-- Create policy for patients to view schedule blocks (for booking)
CREATE POLICY "Patients can view schedule_blocks" 
ON public.schedule_blocks 
FOR SELECT 
USING (true);

-- Create policy for patients to view specialties
CREATE POLICY "Patients can view specialties" 
ON public.specialties 
FOR SELECT 
USING (active = true);

-- Create policy for patients to view health insurances
CREATE POLICY "Patients can view health_insurances" 
ON public.health_insurances 
FOR SELECT 
USING (active = true);