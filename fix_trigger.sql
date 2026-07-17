-- Perbarui fungsi trigger untuk mencakup semua kolom yang mungkin dibutuhkan (terutama kolom yang NOT NULL)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    total_points, 
    npm, 
    nama_lengkap, 
    nama_panggilan,
    program_studi,
    user_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    0,
    COALESCE(NEW.raw_user_meta_data->>'npm', ''), 
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'User ' || split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nama_panggilan', ''),
    NEW.raw_user_meta_data->>'program_studi',
    COALESCE(NEW.raw_user_meta_data->>'npm', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
