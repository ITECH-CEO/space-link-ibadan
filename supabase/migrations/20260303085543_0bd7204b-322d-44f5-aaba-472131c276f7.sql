
-- Create maintenance_requests table
CREATE TABLE public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Landlords can view maintenance requests for their properties
CREATE POLICY "Landlords can view own property maintenance"
ON public.maintenance_requests FOR SELECT TO authenticated
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE owner_user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- Admins can manage all maintenance requests
CREATE POLICY "Admins can manage maintenance requests"
ON public.maintenance_requests FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Landlords can insert maintenance requests for their properties
CREATE POLICY "Landlords can insert maintenance for own properties"
ON public.maintenance_requests FOR INSERT TO authenticated
WITH CHECK (
  property_id IN (
    SELECT id FROM public.properties WHERE owner_user_id = auth.uid()
  )
);

-- Landlords can update maintenance requests for their properties
CREATE POLICY "Landlords can update own property maintenance"
ON public.maintenance_requests FOR UPDATE TO authenticated
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE owner_user_id = auth.uid()
  )
);

-- is_landlord helper function
CREATE OR REPLACE FUNCTION public.is_landlord(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'landlord'
  )
$$;

-- Landlords can view commissions related to their properties
CREATE POLICY "Landlords can view own commissions"
ON public.commissions FOR SELECT TO authenticated
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE owner_user_id = auth.uid()
  )
);

-- Landlords can view matches for their properties
CREATE POLICY "Landlords can view own property matches"
ON public.matches FOR SELECT TO authenticated
USING (
  property_id IN (
    SELECT id FROM public.properties WHERE owner_user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_maintenance_requests_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
