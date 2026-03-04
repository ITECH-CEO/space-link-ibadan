
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_notifications_user_read ON public.notifications (user_id, read);

-- Trigger: notify on match status change
CREATE OR REPLACE FUNCTION public.notify_match_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _client_user_id UUID;
  _property_name TEXT;
BEGIN
  SELECT c.user_id INTO _client_user_id FROM clients c WHERE c.id = NEW.client_id;
  SELECT p.property_name INTO _property_name FROM properties p WHERE p.id = NEW.property_id;
  
  IF _client_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      _client_user_id,
      'Match Update',
      'Your match for "' || COALESCE(_property_name, 'a property') || '" is now ' || NEW.status,
      CASE WHEN NEW.status = 'accepted' THEN 'success' WHEN NEW.status = 'rejected' THEN 'error' ELSE 'info' END,
      '/my-matches'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_match_status_change
AFTER UPDATE OF status ON public.matches
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_match_update();

-- Trigger: notify on roommate match
CREATE OR REPLACE FUNCTION public.notify_roommate_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_a UUID;
  _user_b UUID;
  _name_a TEXT;
  _name_b TEXT;
BEGIN
  SELECT c.user_id, c.full_name INTO _user_a, _name_a FROM clients c WHERE c.id = NEW.client_a_id;
  SELECT c.user_id, c.full_name INTO _user_b, _name_b FROM clients c WHERE c.id = NEW.client_b_id;
  
  IF _user_a IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (_user_a, 'New Roommate Match', 'You''ve been matched with ' || COALESCE(_name_b, 'a roommate') || '! Score: ' || COALESCE(NEW.compatibility_score::text, 'N/A') || '%', 'info', '/my-matches');
  END IF;
  IF _user_b IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (_user_b, 'New Roommate Match', 'You''ve been matched with ' || COALESCE(_name_a, 'a roommate') || '! Score: ' || COALESCE(NEW.compatibility_score::text, 'N/A') || '%', 'info', '/my-matches');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_roommate_match_created
AFTER INSERT ON public.roommate_matches
FOR EACH ROW
EXECUTE FUNCTION public.notify_roommate_match();
