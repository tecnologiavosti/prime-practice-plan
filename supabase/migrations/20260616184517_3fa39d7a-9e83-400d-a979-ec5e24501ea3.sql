
CREATE TABLE public.subleased_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  tenant_name text NOT NULL,
  tenant_contact text,
  monthly_value numeric NOT NULL DEFAULT 0,
  due_day integer,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subleased_rooms TO authenticated;
GRANT ALL ON public.subleased_rooms TO service_role;

ALTER TABLE public.subleased_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and financeiro can manage subleased rooms"
ON public.subleased_rooms FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'financeiro'))
WITH CHECK (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'financeiro'));

CREATE TRIGGER update_subleased_rooms_updated_at
BEFORE UPDATE ON public.subleased_rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
