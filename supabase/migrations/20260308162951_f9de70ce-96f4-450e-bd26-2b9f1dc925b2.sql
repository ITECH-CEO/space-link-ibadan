
-- Inspection slots (admin/landlord creates available times)
CREATE TABLE public.inspection_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  max_bookings INTEGER NOT NULL DEFAULT 3,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, slot_date, slot_time)
);

-- Inspection bookings (client picks a slot)
CREATE TABLE public.inspection_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES public.inspection_slots(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_bookings ENABLE ROW LEVEL SECURITY;

-- Slots: anyone authenticated can view
CREATE POLICY "Anyone can view inspection slots" ON public.inspection_slots
  FOR SELECT TO authenticated USING (true);

-- Slots: admins and property owners can manage
CREATE POLICY "Admins and owners can manage slots" ON public.inspection_slots
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()) OR created_by = auth.uid());

-- Bookings: users can view their own
CREATE POLICY "Users can view own bookings" ON public.inspection_bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Bookings: authenticated users can insert their own
CREATE POLICY "Users can book inspections" ON public.inspection_bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Bookings: admins can manage all
CREATE POLICY "Admins can manage bookings" ON public.inspection_bookings
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- Trigger to increment current_bookings
CREATE OR REPLACE FUNCTION public.increment_slot_bookings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE inspection_slots SET current_bookings = current_bookings + 1 WHERE id = NEW.slot_id;
  
  -- Notify the user
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'Inspection Confirmed',
    'Your inspection has been confirmed. Check your bookings for details.',
    'success',
    '/my-matches'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_inspection_booked
  AFTER INSERT ON public.inspection_bookings
  FOR EACH ROW EXECUTE FUNCTION public.increment_slot_bookings();
