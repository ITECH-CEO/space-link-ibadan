
-- Add rich message columns
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS file_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS file_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reply_to_id uuid DEFAULT NULL REFERENCES public.messages(id) ON DELETE SET NULL;

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view reactions on messages in their conversations
CREATE POLICY "Users can view reactions in own conversations"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (
  message_id IN (
    SELECT m.id FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.participant_a = auth.uid() OR c.participant_b = auth.uid()
  )
);

-- RLS: Users can add reactions to messages in their conversations
CREATE POLICY "Users can add reactions"
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  message_id IN (
    SELECT m.id FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.participant_a = auth.uid() OR c.participant_b = auth.uid()
  )
);

-- RLS: Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create message-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Storage policy: anyone can view
CREATE POLICY "Anyone can view message attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'message-attachments');
