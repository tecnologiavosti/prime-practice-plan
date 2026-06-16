
ALTER TABLE public.subleased_rooms ADD COLUMN IF NOT EXISTS room_number text;
ALTER TABLE public.subleased_rooms ALTER COLUMN tenant_name DROP NOT NULL;
