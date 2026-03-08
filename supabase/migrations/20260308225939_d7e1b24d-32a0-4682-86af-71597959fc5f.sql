
-- Sponsors/Backers table
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  description TEXT,
  tier TEXT NOT NULL DEFAULT 'bronze',
  sponsor_type TEXT NOT NULL DEFAULT 'platform',
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Admins can manage sponsors
CREATE POLICY "Admins can manage sponsors"
  ON public.sponsors FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Anyone can view active sponsors (for display on public pages)
CREATE POLICY "Anyone can view active sponsors"
  ON public.sponsors FOR SELECT TO authenticated
  USING (is_active = true);

-- Updated at trigger
CREATE TRIGGER update_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
