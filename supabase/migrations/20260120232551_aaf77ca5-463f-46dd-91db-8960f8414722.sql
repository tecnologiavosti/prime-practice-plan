-- Formas de pagamento
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Guias de atendimento
CREATE TABLE public.medical_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_number TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  guide_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity INTEGER DEFAULT 1,
  unit_value DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'faturado', 'recebido', 'glosado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Lançamentos financeiros (Contas a Receber)
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('particular', 'convenio')),
  description TEXT,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  medical_guide_id UUID REFERENCES public.medical_guides(id) ON DELETE SET NULL,
  patient_package_id UUID REFERENCES public.patient_packages(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE,
  payment_date DATE,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Configuração de repasse por profissional
CREATE TABLE public.professional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('fixed', 'percentage', 'per_procedure')),
  fixed_value DECIMAL(10,2) DEFAULT 0,
  percentage_value DECIMAL(5,2) DEFAULT 0,
  per_procedure_value DECIMAL(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (professional_id, procedure_id)
);

-- Lançamentos de repasse
CREATE TABLE public.professional_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  medical_guide_id UUID REFERENCES public.medical_guides(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  payout_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Faturamento por lote (para convênios)
CREATE TABLE public.billing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL,
  health_insurance_id UUID REFERENCES public.health_insurances(id) ON DELETE SET NULL,
  administrator_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_guides INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'enviado', 'recebido', 'parcial')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Guias incluídas no lote
CREATE TABLE public.billing_batch_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.billing_batches(id) ON DELETE CASCADE NOT NULL,
  guide_id UUID REFERENCES public.medical_guides(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (batch_id, guide_id)
);

-- Habilitar RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_batch_guides ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view payment_methods" ON public.payment_methods
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage payment_methods" ON public.payment_methods
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view medical_guides" ON public.medical_guides
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Staff can manage medical_guides" ON public.medical_guides
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'recepcao') OR
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Authenticated users can view financial_transactions" ON public.financial_transactions
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Financial staff can manage financial_transactions" ON public.financial_transactions
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Authenticated users can view professional_fees" ON public.professional_fees
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage professional_fees" ON public.professional_fees
  FOR ALL USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Authenticated users can view professional_payouts" ON public.professional_payouts
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Financial staff can manage professional_payouts" ON public.professional_payouts
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Authenticated users can view billing_batches" ON public.billing_batches
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Financial staff can manage billing_batches" ON public.billing_batches
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'financeiro')
  );

CREATE POLICY "Authenticated users can view billing_batch_guides" ON public.billing_batch_guides
  FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

CREATE POLICY "Financial staff can manage billing_batch_guides" ON public.billing_batch_guides
  FOR ALL USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'financeiro')
  );

-- Triggers de updated_at
CREATE TRIGGER update_medical_guides_updated_at BEFORE UPDATE ON public.medical_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_fees_updated_at BEFORE UPDATE ON public.professional_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professional_payouts_updated_at BEFORE UPDATE ON public.professional_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_batches_updated_at BEFORE UPDATE ON public.billing_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_medical_guides_patient ON public.medical_guides(patient_id);
CREATE INDEX idx_medical_guides_insurance ON public.medical_guides(health_insurance_id);
CREATE INDEX idx_medical_guides_status ON public.medical_guides(status);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX idx_professional_payouts_professional ON public.professional_payouts(professional_id);
CREATE INDEX idx_billing_batches_insurance ON public.billing_batches(health_insurance_id);

-- Inserir formas de pagamento padrão
INSERT INTO public.payment_methods (name) VALUES 
  ('Dinheiro'),
  ('PIX'),
  ('Cartão de Crédito'),
  ('Cartão de Débito'),
  ('Transferência Bancária');