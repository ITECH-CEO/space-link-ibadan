
-- Create a trigger to auto-assign landlord role when a property is inserted with owner_user_id
CREATE OR REPLACE FUNCTION public.auto_assign_landlord_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_user_id, 'landlord')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_property_created_assign_landlord
AFTER INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_landlord_role();
