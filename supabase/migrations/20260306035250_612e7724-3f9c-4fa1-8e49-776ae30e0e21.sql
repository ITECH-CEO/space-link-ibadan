-- Tighten the notification insert policy - only authenticated users
DROP POLICY IF EXISTS "Anyone can receive notifications" ON public.notifications;
CREATE POLICY "Authenticated can receive notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);