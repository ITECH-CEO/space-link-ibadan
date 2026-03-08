
-- Trigger to notify landlord and admins when a new maintenance request is created
CREATE OR REPLACE FUNCTION public.notify_on_new_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _property RECORD;
  _admin RECORD;
BEGIN
  -- Get property details
  SELECT property_name, owner_user_id INTO _property FROM properties WHERE id = NEW.property_id;
  
  -- Notify landlord if property has an owner
  IF _property.owner_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      _property.owner_user_id,
      'New Maintenance Complaint',
      NEW.tenant_name || ' reported a ' || NEW.priority || ' priority issue at "' || COALESCE(_property.property_name, 'your property') || '": ' || LEFT(NEW.description, 100),
      CASE WHEN NEW.priority IN ('high', 'urgent') THEN 'error' ELSE 'warning' END,
      '/landlord'
    );
  END IF;
  
  -- Notify all admins (super_admin and manager)
  FOR _admin IN
    SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'manager')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      _admin.user_id,
      'New Maintenance Complaint',
      NEW.tenant_name || ' reported a ' || NEW.priority || ' priority issue at "' || COALESCE(_property.property_name, 'a property') || '"',
      CASE WHEN NEW.priority IN ('high', 'urgent') THEN 'error' ELSE 'info' END,
      '/dashboard'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_maintenance_request_notify
  AFTER INSERT ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_complaint();
