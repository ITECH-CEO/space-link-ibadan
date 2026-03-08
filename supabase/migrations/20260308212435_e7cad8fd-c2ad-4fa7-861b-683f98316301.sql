
-- Add access token to lease_agreements for tenant access
ALTER TABLE public.lease_agreements ADD COLUMN access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex');

-- Create saved_searches table
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_name TEXT NOT NULL DEFAULT 'My Search',
  location TEXT,
  property_type TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  facilities TEXT[] DEFAULT '{}'::TEXT[],
  notify_enabled BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved searches"
  ON public.saved_searches FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Allow public read of lease by access_token (for tenant acknowledgment)
CREATE POLICY "Anyone can view lease by access token"
  ON public.lease_agreements FOR SELECT
  USING (true);

-- Allow tenant to acknowledge via access_token
CREATE POLICY "Anyone can acknowledge lease by token"
  ON public.lease_agreements FOR UPDATE
  USING (access_token IS NOT NULL)
  WITH CHECK (access_token IS NOT NULL);
