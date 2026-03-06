-- Add course, faculty, level columns to clients for better roommate matching
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS course text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS faculty text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS seeking_roommate boolean NOT NULL DEFAULT false;

-- Update the auto_assign_super_admin trigger to handle both email variants
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN ('sentinelipconsult@gmail.com', 'sentinelipconsults@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Also insert the role for the already-signed-up user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' FROM auth.users WHERE email = 'sentinelipconsults@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Allow notifications insert via triggers (SECURITY DEFINER functions)
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can receive notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);