-- 1. Mengaktifkan Row Level Security (RLS) untuk semua tabel
ALTER TABLE gallery_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_details ENABLE ROW LEVEL SECURITY;

-- 2. Menambahkan Policy dasar untuk mengizinkan akses ke semua tabel.
-- Karena aplikasi Anda saat ini mengandalkan akses publik/anonim (terutama melalui Server Actions),
-- kita tambahkan policy yang memberikan izin agar fitur aplikasi tidak rusak (broken).
-- Di tahap produksi (production), policy ini sebaiknya diperketat hanya untuk user terautentikasi.

CREATE POLICY "Allow public read and write" ON gallery_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON borrowings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON wishlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON knowledge_bases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON knowledge_chunks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON book_loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON point_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON redemptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read and write" ON redemption_details FOR ALL USING (true) WITH CHECK (true);
