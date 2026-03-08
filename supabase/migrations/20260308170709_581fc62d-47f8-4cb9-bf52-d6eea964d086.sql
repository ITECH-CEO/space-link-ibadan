-- Auto-create a commission when a match is accepted
CREATE OR REPLACE FUNCTION public.auto_create_commission_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _room_price NUMERIC;
  _commission_amount NUMERIC;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    -- Get the room type price if available
    SELECT price INTO _room_price FROM room_types WHERE id = NEW.room_type_id;
    
    -- Default commission: 10% of room price, minimum 5000
    _commission_amount := GREATEST(COALESCE(_room_price * 0.10, 5000), 5000);
    
    -- Insert commission record
    INSERT INTO commissions (match_id, client_id, property_id, amount, commission_type, status)
    VALUES (NEW.id, NEW.client_id, NEW.property_id, _commission_amount, 'match_fee', 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_match_accepted_create_commission
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_commission_on_accept();

-- Also handle already-accepted matches: backfill commissions
INSERT INTO commissions (match_id, client_id, property_id, amount, commission_type, status)
SELECT m.id, m.client_id, m.property_id, 
  GREATEST(COALESCE(rt.price * 0.10, 5000), 5000),
  'match_fee', 'pending'
FROM matches m
LEFT JOIN room_types rt ON rt.id = m.room_type_id
WHERE m.status = 'accepted'
AND NOT EXISTS (SELECT 1 FROM commissions c WHERE c.match_id = m.id)
ON CONFLICT DO NOTHING;

-- Allow clients to view their own commissions
CREATE POLICY "Clients can view own commissions"
ON public.commissions
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);