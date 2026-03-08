
-- Add individual consent columns to roommate_matches
ALTER TABLE public.roommate_matches
  ADD COLUMN IF NOT EXISTS client_a_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS client_b_status text NOT NULL DEFAULT 'pending';

-- Update RLS: allow clients to update their own status on roommate matches they belong to
CREATE POLICY "Clients can update own roommate match status"
ON public.roommate_matches
FOR UPDATE
TO authenticated
USING (
  (client_a_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  OR
  (client_b_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
)
WITH CHECK (
  (client_a_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  OR
  (client_b_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
);
