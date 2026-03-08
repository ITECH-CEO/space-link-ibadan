
-- Platform complaints table for general client inquiries/complaints about the platform
CREATE TABLE public.platform_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_complaints ENABLE ROW LEVEL SECURITY;

-- Clients can insert own complaints
CREATE POLICY "Users can insert own complaints"
  ON public.platform_complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view own complaints
CREATE POLICY "Users can view own complaints"
  ON public.platform_complaints FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Admins can manage all complaints
CREATE POLICY "Admins can manage platform complaints"
  ON public.platform_complaints FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add room_type info display to maintenance_requests (already has room_type_id column)
-- No schema change needed, just need to use it in the UI

-- Trigger for updated_at
CREATE TRIGGER update_platform_complaints_updated_at
  BEFORE UPDATE ON public.platform_complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notify admins on new platform complaint
CREATE OR REPLACE FUNCTION public.notify_on_platform_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin RECORD;
BEGIN
  FOR _admin IN
    SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'manager')
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      _admin.user_id,
      'New Platform Complaint',
      NEW.client_name || ' submitted a ' || NEW.category || ' complaint: ' || LEFT(NEW.subject, 80),
      CASE WHEN NEW.priority IN ('high', 'urgent') THEN 'error' ELSE 'info' END,
      '/dashboard'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_platform_complaint_notify
  AFTER INSERT ON public.platform_complaints
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_platform_complaint();
