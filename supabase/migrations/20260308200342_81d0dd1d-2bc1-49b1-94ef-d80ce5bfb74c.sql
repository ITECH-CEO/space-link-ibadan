
-- Add context linking to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS context_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS context_id uuid DEFAULT NULL;

-- Add last_seen_at to profiles for online status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone DEFAULT NULL;

-- Allow users to update their own last_seen_at
CREATE POLICY "Users can update own last_seen"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update conversations policy so users can update last_message_at
CREATE POLICY "Users can update own conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING ((auth.uid() = participant_a) OR (auth.uid() = participant_b))
WITH CHECK ((auth.uid() = participant_a) OR (auth.uid() = participant_b));
