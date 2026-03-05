-- Remove old super_admin and manager roles from lawalolawale2001@gmail.com
DELETE FROM public.user_roles WHERE user_id = 'bd4c1485-e337-45c3-9b4c-28bea32645f2' AND role = 'super_admin';
DELETE FROM public.user_roles WHERE user_id = 'bd4c1485-e337-45c3-9b4c-28bea32645f2' AND role = 'manager';

-- Create trigger to auto-assign super_admin to sentinelipconsult@gmail.com on signup
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.email = 'sentinelipconsult@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_super_admin();