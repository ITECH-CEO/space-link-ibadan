
-- 1. Create inspection_feedback table
CREATE TABLE public.inspection_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.inspection_bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  interested BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.inspection_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own feedback" ON public.inspection_feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage feedback" ON public.inspection_feedback
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 2. Replace increment_slot_bookings to also notify landlord
CREATE OR REPLACE FUNCTION public.increment_slot_bookings()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _slot RECORD;
  _property RECORD;
BEGIN
  UPDATE inspection_slots SET current_bookings = current_bookings + 1 WHERE id = NEW.slot_id;
  
  -- Get slot details
  SELECT slot_date, slot_time INTO _slot FROM inspection_slots WHERE id = NEW.slot_id;
  
  -- Notify the user
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'Inspection Confirmed',
    'Your inspection is booked for ' || COALESCE(_slot.slot_date::text, '') || ' at ' || COALESCE(_slot.slot_time::text, '') || '. Check your bookings for details.',
    'success',
    '/my-matches'
  );
  
  -- Notify the landlord (property owner)
  SELECT owner_user_id, property_name INTO _property FROM properties WHERE id = NEW.property_id;
  IF _property.owner_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      _property.owner_user_id,
      'New Inspection Booking',
      'A client has booked an inspection for "' || COALESCE(_property.property_name, 'your property') || '" on ' || COALESCE(_slot.slot_date::text, '') || ' at ' || COALESCE(_slot.slot_time::text, ''),
      'info',
      '/landlord'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Create decrement function for cancellations
CREATE OR REPLACE FUNCTION public.decrement_slot_bookings()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
    UPDATE inspection_slots SET current_bookings = GREATEST(current_bookings - 1, 0) WHERE id = NEW.slot_id;
    
    -- Notify user
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      'Inspection Cancelled',
      'Your inspection booking has been cancelled.',
      'info',
      '/my-matches'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Create trigger for cancellation
CREATE TRIGGER on_booking_status_change
  BEFORE UPDATE ON public.inspection_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_slot_bookings();

-- 5. Allow users to update their own bookings (for cancellation)
CREATE POLICY "Users can cancel own bookings" ON public.inspection_bookings
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
