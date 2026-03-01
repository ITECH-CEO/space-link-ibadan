
-- Create storage bucket for property media
INSERT INTO storage.buckets (id, name, public) VALUES ('property-media', 'property-media', true);

-- Allow authenticated users to upload to property-media
CREATE POLICY "Admins can upload property media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-media' AND public.is_admin(auth.uid())
);

-- Allow anyone to view property media
CREATE POLICY "Anyone can view property media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'property-media');

-- Allow admins to delete property media
CREATE POLICY "Admins can delete property media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-media' AND public.is_admin(auth.uid()));
