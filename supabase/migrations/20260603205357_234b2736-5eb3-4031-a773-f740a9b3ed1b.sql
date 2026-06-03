-- Fix profiles UPDATE policy: add WITH CHECK to prevent ownership reassignment
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Tighten storage policies on food-scans bucket: restrict to owning user (folder = auth.uid())
DROP POLICY IF EXISTS "Public read access for food-scans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view food-scans" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Users can view their own food scan images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'food-scans'
  AND auth.uid()::text = (storage.foldername(name))[1]
);