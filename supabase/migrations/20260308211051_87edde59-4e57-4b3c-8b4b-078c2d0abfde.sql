
CREATE TABLE public.lease_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
  landlord_user_id UUID NOT NULL,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT,
  tenant_phone TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC NOT NULL DEFAULT 0,
  payment_frequency TEXT NOT NULL DEFAULT 'annually',
  security_deposit NUMERIC DEFAULT 0,
  custom_terms TEXT[] DEFAULT '{}'::TEXT[],
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged')),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage own leases"
  ON public.lease_agreements FOR ALL
  USING (landlord_user_id = auth.uid())
  WITH CHECK (landlord_user_id = auth.uid());

CREATE POLICY "Admins can manage all leases"
  ON public.lease_agreements FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_lease_agreements_updated_at
  BEFORE UPDATE ON public.lease_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
