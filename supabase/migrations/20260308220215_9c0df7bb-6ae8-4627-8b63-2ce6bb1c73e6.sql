
CREATE POLICY "Clients can insert maintenance requests"
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  property_id IN (
    SELECT m.property_id FROM matches m
    JOIN clients c ON c.id = m.client_id
    WHERE c.user_id = auth.uid() AND m.status = 'accepted'
  )
);

CREATE POLICY "Clients can view own maintenance requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  tenant_name IN (
    SELECT c.full_name FROM clients c WHERE c.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
  OR property_id IN (
    SELECT p.id FROM properties p WHERE p.owner_user_id = auth.uid()
  )
);
