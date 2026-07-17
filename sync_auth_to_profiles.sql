-- Buat fungsi untuk memasukkan user baru secara otomatis ke tabel profiles
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
    user_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    0,
    COALESCE(NEW.raw_user_meta_data->>'npm', ''), 
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'User ' || split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'npm', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger jika sudah ada sebelumnya agar tidak error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Buat trigger pada tabel auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
