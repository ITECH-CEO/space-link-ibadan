
-- Trigger function: notify users with matching saved searches when a property is approved
CREATE OR REPLACE FUNCTION public.notify_saved_search_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _search RECORD;
  _min_price NUMERIC;
BEGIN
  -- Only fire when property becomes approved
  IF NEW.verification_status = 'approved' AND (OLD IS NULL OR OLD.verification_status <> 'approved') THEN
    -- Get min room price for this property
    SELECT MIN(price) INTO _min_price FROM room_types WHERE property_id = NEW.id;

    FOR _search IN
      SELECT ss.* FROM saved_searches ss WHERE ss.notify_enabled = true
    LOOP
      -- Check location match
      IF _search.location IS NOT NULL AND _search.location <> '' THEN
        IF NOT (
          LOWER(NEW.address) LIKE '%' || LOWER(_search.location) || '%' OR
          LOWER(COALESCE(NEW.location, '')) LIKE '%' || LOWER(_search.location) || '%' OR
          LOWER(NEW.property_name) LIKE '%' || LOWER(_search.location) || '%'
        ) THEN
          CONTINUE;
        END IF;
      END IF;

      -- Check property type match
      IF _search.property_type IS NOT NULL AND _search.property_type <> '' AND _search.property_type <> 'all' THEN
        IF NEW.property_type::text <> _search.property_type THEN
          CONTINUE;
        END IF;
      END IF;

      -- Check budget match
      IF _search.budget_max IS NOT NULL AND _min_price IS NOT NULL THEN
        IF _min_price > _search.budget_max THEN
          CONTINUE;
        END IF;
      END IF;

      IF _search.budget_min IS NOT NULL AND _min_price IS NOT NULL THEN
        IF _min_price < _search.budget_min THEN
          CONTINUE;
        END IF;
      END IF;

      -- Match found - create notification
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        _search.user_id,
        'New Property Match!',
        '"' || NEW.property_name || '" at ' || NEW.address || COALESCE(' from ₦' || _min_price::text, '') || ' matches your saved search "' || _search.search_name || '".',
        'success',
        '/property/' || NEW.id
      );

      -- Update last notified
      UPDATE saved_searches SET last_notified_at = now() WHERE id = _search.id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_notify_saved_search_matches ON properties;
CREATE TRIGGER trg_notify_saved_search_matches
  AFTER INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION notify_saved_search_matches()
