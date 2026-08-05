-- Create subleased_tenants table
CREATE TABLE IF NOT EXISTS public.subleased_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT, -- CPF or CNPJ
    contact TEXT,
    email TEXT,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subleased_tenants TO authenticated;
GRANT ALL ON public.subleased_tenants TO service_role;

-- Enable RLS
ALTER TABLE public.subleased_tenants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin and financeiro can manage tenants"
ON public.subleased_tenants
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'financeiro'))
WITH CHECK (public.has_role(auth.uid(), 'administrador') OR public.has_role(auth.uid(), 'financeiro'));

-- Add tenant_id to subleased_rooms
ALTER TABLE public.subleased_rooms ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.subleased_tenants(id);

-- Trigger for updated_at
CREATE TRIGGER update_subleased_tenants_updated_at 
BEFORE UPDATE ON public.subleased_tenants 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
