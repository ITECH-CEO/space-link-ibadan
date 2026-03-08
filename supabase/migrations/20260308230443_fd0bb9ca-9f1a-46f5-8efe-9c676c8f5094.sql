-- Fix the overly permissive access log insert policy
DROP POLICY "System can insert access log" ON public.sensitive_data_access_log;

-- Only admins can insert access logs (they're the ones viewing sensitive data)
CREATE POLICY "Admins can insert access log"
  ON public.sensitive_data_access_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND accessor_user_id = auth.uid());
