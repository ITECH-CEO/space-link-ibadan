
-- Fix overly permissive INSERT policy - triggers use SECURITY DEFINER so they bypass RLS
-- Remove the permissive "true" policy and keep only admin insert
DROP POLICY "System can insert notifications" ON public.notifications;
