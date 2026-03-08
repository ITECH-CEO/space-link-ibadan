
-- Create platform_settings table for key-value config (payment details, etc.)
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL DEFAULT '',
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Only super_admin/manager can manage settings
CREATE POLICY "Admins can manage platform settings"
  ON public.platform_settings FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Seed with Moniepoint payment details
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('payment_account_name', 'Lawal Olawale', 'Bank account holder name'),
  ('payment_account_number', '9137425552', 'Bank account number'),
  ('payment_bank_name', 'Moniepoint MFB', 'Bank name');
