-- 1. Create client_admin_notes table to separate internal admin notes from client-visible data
CREATE TABLE public.client_admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.client_admin_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can access admin notes
CREATE POLICY "Only admins can manage client admin notes"
  ON public.client_admin_notes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Migrate existing admin_notes data
INSERT INTO public.client_admin_notes (client_id, notes)
SELECT id, admin_notes FROM public.clients WHERE admin_notes IS NOT NULL;

-- 2. Create private bucket for client-sensitive documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own documents to private bucket
CREATE POLICY "Users can upload own client documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own documents
CREATE POLICY "Users can view own client documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'client-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin(auth.uid())
  )
);

-- Users can update their own documents
CREATE POLICY "Users can update own client documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'client-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all client documents
CREATE POLICY "Admins can manage all client documents"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'client-documents' AND
  public.is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'client-documents' AND
  public.is_admin(auth.uid())
);

-- 3. Create sensitive data access log
CREATE TABLE public.sensitive_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessor_user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view the access log
CREATE POLICY "Only super admins can view access log"
  ON public.sensitive_data_access_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert access log"
  ON public.sensitive_data_access_log FOR INSERT TO authenticated
  WITH CHECK (true);
