
-- Rent payments table for landlord rent tracking
CREATE TABLE public.rent_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

-- Landlords can manage rent payments for their own properties
CREATE POLICY "Landlords can manage own rent payments"
  ON public.rent_payments
  FOR ALL
  USING (property_id IN (SELECT id FROM properties WHERE owner_user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE owner_user_id = auth.uid()));

-- Admins can manage all rent payments
CREATE POLICY "Admins can manage all rent payments"
  ON public.rent_payments
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_rent_payments_updated_at
  BEFORE UPDATE ON public.rent_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
