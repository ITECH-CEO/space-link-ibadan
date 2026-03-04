
-- Roommate matches table
CREATE TABLE public.roommate_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_a_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  client_b_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  room_type_id UUID REFERENCES public.room_types(id) ON DELETE SET NULL,
  compatibility_score NUMERIC DEFAULT 0,
  ai_reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_roommate_pair UNIQUE (client_a_id, client_b_id)
);

-- Enable RLS
ALTER TABLE public.roommate_matches ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage roommate matches"
ON public.roommate_matches FOR ALL
USING (is_admin(auth.uid()));

-- Clients can view their own roommate matches
CREATE POLICY "Clients can view own roommate matches"
ON public.roommate_matches FOR SELECT
USING (
  client_a_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  OR client_b_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_roommate_matches_updated_at
BEFORE UPDATE ON public.roommate_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
