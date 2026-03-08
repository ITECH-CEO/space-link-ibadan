
CREATE POLICY "Tenants can view own rent payments"
ON public.rent_payments
FOR SELECT
TO authenticated
USING (
  tenant_name ILIKE (SELECT full_name FROM public.clients WHERE user_id = auth.uid() LIMIT 1)
)
