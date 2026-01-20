-- Function to auto-assign 'administrador' role to the first user
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if there are any users with roles
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    -- This is the first user, assign 'administrador' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'administrador');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_first_admin();