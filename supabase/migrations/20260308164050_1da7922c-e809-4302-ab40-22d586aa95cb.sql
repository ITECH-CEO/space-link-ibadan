
-- 1. Saved properties table
CREATE TABLE public.saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved properties" ON public.saved_properties
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. Referral codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral codes" ON public.referral_codes
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can create own referral code" ON public.referral_codes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage referral codes" ON public.referral_codes
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 3. Referral uses tracking
CREATE TABLE public.referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referral_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral uses" ON public.referral_uses
  FOR SELECT TO authenticated USING (
    referral_code_id IN (SELECT id FROM public.referral_codes WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  );

CREATE POLICY "Anyone can insert referral use" ON public.referral_uses
  FOR INSERT TO authenticated WITH CHECK (referred_user_id = auth.uid());

-- 4. Function to increment referral uses count
CREATE OR REPLACE FUNCTION public.increment_referral_uses()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE referral_codes SET uses = uses + 1 WHERE id = NEW.referral_code_id;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_referral_use
  AFTER INSERT ON public.referral_uses
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_referral_uses();

-- 5. Add latitude/longitude to properties for map view
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude NUMERIC;
