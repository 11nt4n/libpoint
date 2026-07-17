-- Ubah tipe data kolom agar bisa menampung string hasil enkripsi yang panjang
ALTER TABLE profiles ALTER COLUMN nama_lengkap TYPE TEXT;
ALTER TABLE profiles ALTER COLUMN npm TYPE TEXT;
