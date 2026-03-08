
-- Room occupancies table to track actual tenants in rooms
CREATE TABLE public.room_occupancies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  status TEXT NOT NULL DEFAULT 'occupied' CHECK (status IN ('occupied', 'vacant', 'at_risk')),
  move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  move_out_date DATE,
  rent_status TEXT NOT NULL DEFAULT 'current' CHECK (rent_status IN ('current', 'overdue', 'paid_ahead')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_occupancies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all occupancies"
  ON public.room_occupancies FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Landlords can view own property occupancies"
  ON public.room_occupancies FOR SELECT TO authenticated
  USING (property_id IN (SELECT id FROM properties WHERE owner_user_id = auth.uid()));

CREATE POLICY "Clients can view own occupancy"
  ON public.room_occupancies FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Trigger to auto-create occupancy when match is accepted
CREATE OR REPLACE FUNCTION public.auto_create_occupancy_on_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _client RECORD;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    SELECT full_name, phone INTO _client FROM clients WHERE id = NEW.client_id;
    
    INSERT INTO room_occupancies (property_id, room_type_id, client_id, match_id, tenant_name, tenant_phone, status, rent_status)
    VALUES (NEW.property_id, NEW.room_type_id, NEW.client_id, NEW.id, COALESCE(_client.full_name, 'Unknown'), _client.phone, 'occupied', 'current')
    ON CONFLICT DO NOTHING;
    
    -- Decrement available rooms
    UPDATE properties SET available_rooms = GREATEST(COALESCE(available_rooms, 0) - 1, 0) WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_match_accepted_create_occupancy
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_occupancy_on_accept();

-- Trigger to flag occupancy as at_risk when rent is overdue
CREATE OR REPLACE FUNCTION public.flag_occupancy_on_rent_overdue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'overdue' AND (OLD.status IS NULL OR OLD.status <> 'overdue') THEN
    UPDATE room_occupancies 
    SET rent_status = 'overdue', status = 'at_risk', updated_at = now()
    WHERE property_id = NEW.property_id 
      AND tenant_name = NEW.tenant_name 
      AND status = 'occupied';
  ELSIF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    UPDATE room_occupancies 
    SET rent_status = 'current', status = 'occupied', updated_at = now()
    WHERE property_id = NEW.property_id 
      AND tenant_name = NEW.tenant_name 
      AND status = 'at_risk';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_rent_status_change_flag_occupancy
  AFTER UPDATE ON public.rent_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.flag_occupancy_on_rent_overdue();

-- Updated_at trigger
CREATE TRIGGER update_room_occupancies_updated_at
  BEFORE UPDATE ON public.room_occupancies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
