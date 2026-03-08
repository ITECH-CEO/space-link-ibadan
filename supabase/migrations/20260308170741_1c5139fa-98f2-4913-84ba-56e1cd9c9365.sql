-- Allow users to view their own role (required for the app to detect landlord/admin status)
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());