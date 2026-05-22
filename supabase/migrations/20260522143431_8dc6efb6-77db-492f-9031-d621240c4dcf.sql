
CREATE TABLE public.cash_flow_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('entrada','saida')),
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial staff can manage cash_flow_entries"
ON public.cash_flow_entries
FOR ALL
USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE TRIGGER update_cash_flow_entries_updated_at
BEFORE UPDATE ON public.cash_flow_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cash_flow_entries_date ON public.cash_flow_entries(entry_date DESC);
CREATE INDEX idx_cash_flow_entries_type ON public.cash_flow_entries(entry_type);
