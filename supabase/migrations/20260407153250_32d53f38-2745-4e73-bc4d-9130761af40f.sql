
-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Staff can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');

-- Patient documents table
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage patient_documents"
ON public.patient_documents FOR ALL TO authenticated
USING (has_any_role(auth.uid()));

CREATE POLICY "Patients can view own documents"
ON public.patient_documents FOR SELECT
USING (patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid()));

-- Medical guide documents table
CREATE TABLE public.medical_guide_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_guide_id UUID NOT NULL REFERENCES public.medical_guides(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_guide_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage medical_guide_documents"
ON public.medical_guide_documents FOR ALL TO authenticated
USING (has_any_role(auth.uid()));

-- Insurance reimbursements table
CREATE TABLE public.insurance_reimbursements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  health_insurance_id UUID REFERENCES public.health_insurances(id),
  reference_month TEXT NOT NULL,
  expected_amount NUMERIC NOT NULL DEFAULT 0,
  received_amount NUMERIC NOT NULL DEFAULT 0,
  receipt_file_path TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_reimbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial staff can manage insurance_reimbursements"
ON public.insurance_reimbursements FOR ALL TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE POLICY "Authenticated users can view insurance_reimbursements"
ON public.insurance_reimbursements FOR SELECT TO authenticated
USING (has_any_role(auth.uid()));
