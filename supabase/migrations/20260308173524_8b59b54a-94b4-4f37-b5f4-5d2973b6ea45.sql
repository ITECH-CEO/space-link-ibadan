
CREATE TABLE public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type text NOT NULL UNIQUE,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- Everyone can read fees (needed to display prices)
CREATE POLICY "Anyone can read active fees" ON public.platform_fees
  FOR SELECT USING (true);

-- Only admins can manage fees
CREATE POLICY "Admins can manage fees" ON public.platform_fees
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed default fees
INSERT INTO public.platform_fees (fee_type, amount, description) VALUES
  ('inspection', 2000, 'Fee charged per property inspection booking'),
  ('roommate_matching', 5000, 'Fee charged for AI roommate matching service');

-- Add payment tracking columns to inspection_bookings
ALTER TABLE public.inspection_bookings ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.inspection_bookings ADD COLUMN payment_reference text;

-- Add payment tracking to roommate match requests
ALTER TABLE public.roommate_matches ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.roommate_matches ADD COLUMN payment_reference text;

-- Updated_at trigger
CREATE TRIGGER update_platform_fees_updated_at BEFORE UPDATE ON public.platform_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
