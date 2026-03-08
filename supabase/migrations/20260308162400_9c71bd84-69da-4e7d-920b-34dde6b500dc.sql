
-- Messages table for in-app chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_a UUID NOT NULL,
  participant_b UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_a, participant_b)
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversations: users can view their own
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Conversations: users can insert where they are a participant
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Messages: users can view messages in their conversations
CREATE POLICY "Users can view conversation messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_a = auth.uid() OR participant_b = auth.uid()
    )
  );

-- Messages: users can send messages in their conversations
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_a = auth.uid() OR participant_b = auth.uid()
    )
  );

-- Messages: users can update (mark as read) messages sent to them
CREATE POLICY "Users can mark messages read" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    sender_id != auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE participant_a = auth.uid() OR participant_b = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can manage conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage messages" ON public.messages
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
