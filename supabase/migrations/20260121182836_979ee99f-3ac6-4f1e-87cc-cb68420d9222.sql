-- Add validity_date to medical_guides
ALTER TABLE public.medical_guides 
ADD COLUMN IF NOT EXISTS validity_date date;

-- Create medical_guide_items table for multiple procedures per guide
CREATE TABLE IF NOT EXISTS public.medical_guide_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_guide_id uuid NOT NULL REFERENCES public.medical_guides(id) ON DELETE CASCADE,
  procedure_id uuid REFERENCES public.procedures(id),
  professional_id uuid REFERENCES public.professionals(id),
  appointment_id uuid REFERENCES public.appointments(id),
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  quantity integer NOT NULL DEFAULT 1,
  unit_value numeric NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_guide_items ENABLE ROW LEVEL SECURITY;

-- Create policies for medical_guide_items
CREATE POLICY "Authenticated users can view medical_guide_items" 
ON public.medical_guide_items 
FOR SELECT 
USING (has_any_role(auth.uid()));

CREATE POLICY "Staff can manage medical_guide_items" 
ON public.medical_guide_items 
FOR ALL 
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'recepcao'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_medical_guide_items_updated_at
BEFORE UPDATE ON public.medical_guide_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();