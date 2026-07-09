# Panduan Migrasi Skema ke Supabase (PostgreSQL)

Karena aplikasi Anda sebelumnya menggunakan MySQL, Anda perlu mengubah sedikit struktur (schema) saat membuat tabel di *SQL Editor* Supabase. 

Berikut adalah perbedaan utama MySQL vs PostgreSQL yang harus Anda perhatikan:

## 1. Primary Key Auto Increment
- **MySQL**: `id INT AUTO_INCREMENT PRIMARY KEY`
- **PostgreSQL**: `id SERIAL PRIMARY KEY` atau `id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`

## 2. Tipe Data Tanggal/Waktu
- **MySQL**: `DATETIME`
- **PostgreSQL**: `TIMESTAMP` (atau `TIMESTAMP WITH TIME ZONE`)

## 3. Backticks (`)
- **MySQL**: Menggunakan *backticks* untuk membungkus nama tabel/kolom, misal: ```SELECT * FROM `profiles` ```
- **PostgreSQL**: Menggunakan *double quotes*, misal: `SELECT * FROM "profiles"` (atau tidak usah dibungkus jika tidak ada spasi).

---

## Contoh Migrasi Tabel

### Sebelum (MySQL):
```sql
CREATE TABLE profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  npm VARCHAR(50) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  total_points INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Sesudah (PostgreSQL untuk Supabase):
Buka menu **SQL Editor** di *dashboard* Supabase Anda, dan jalankan perintah seperti ini:

```sql
CREATE TYPE user_role AS ENUM ('admin', 'user');

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  npm VARCHAR(50) NOT NULL,
  role user_role DEFAULT 'user',
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Bagaimana Melanjutkan?
Karena ada lebih dari 20 file lain yang masih menggunakan fungsi `mysqli_*` (seperti `mysqli_query`, `mysqli_fetch_assoc`), Anda (atau saya) perlu mengubahnya menjadi sintaks **PDO** (seperti yang sudah saya contohkan di file `auth/proses_login.php`). Jika Anda ingin saya mengubah sisanya, Anda bisa mengatakan *"Lanjutkan ubah semua mysqli ke PDO"*.

---

## 4. Tabel Buku (Data SLiMS)

Gunakan skema ini untuk membuat tabel `books` di Supabase Anda, sesuai dengan 6 kolom yang kita ekstrak dari data ekspor Senayan (SLiMS).

```sql
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  item_code VARCHAR(100) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  item_status_name VARCHAR(100),
  call_number VARCHAR(100),
  coll_type_name VARCHAR(100),
  location_name VARCHAR(255),
  stok_tersedia INT DEFAULT 1,
  stok_dipinjam INT DEFAULT 0,
  cover_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Borrowings (Peminjaman)
CREATE TABLE IF NOT EXISTS borrowings (
  id SERIAL PRIMARY KEY,
  book_id INT REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  return_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Borrowed'
);

-- 6. Tabel Wishlists (Keranjang Pinjam)
CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INT REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id)
);

-- 7. Tabel Gallery Activities (Galeri Kegiatan)
CREATE TABLE IF NOT EXISTS gallery_activities (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  image_url TEXT NOT NULL,
  article_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Pembaruan Tabel Borrowings (Fitur Tenggat Waktu & Perpanjangan)
-- Jalankan perintah ini di Supabase SQL Editor Anda:
ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE borrowings ADD COLUMN IF NOT EXISTS extend_count INT DEFAULT 0;
```
