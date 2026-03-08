-- 1. Create property_admin_notes table
CREATE TABLE public.property_admin_notes (
  property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.property_admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage property admin notes"
  ON public.property_admin_notes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Migrate existing data
INSERT INTO public.property_admin_notes (property_id, notes)
SELECT id, admin_notes FROM public.properties WHERE admin_notes IS NOT NULL;

-- 2. Create match_admin_notes table
CREATE TABLE public.match_admin_notes (
  match_id UUID PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.match_admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage match admin notes"
  ON public.match_admin_notes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Migrate existing data
INSERT INTO public.match_admin_notes (match_id, notes)
SELECT id, admin_notes FROM public.matches WHERE admin_notes IS NOT NULL;

-- 3. Fix notifications INSERT policy to not use WITH CHECK (true)
DROP POLICY "Authenticated can receive notifications" ON public.notifications;

CREATE POLICY "Authenticated can receive notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
