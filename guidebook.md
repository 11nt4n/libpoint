# Guidebook LibPoint

Selamat datang di panduan resmi aplikasi **LibPoint**. Aplikasi ini adalah platform web modern untuk sistem informasi perpustakaan yang dibangun menggunakan **Next.js**, **Tailwind CSS**, dan **Supabase**. Aplikasi ini dirancang dengan antarmuka bergaya premium (Glassmorphism) dan dilengkapi dengan berbagai fitur modern.

---

## 🌟 Fitur Utama (Features)

Aplikasi LibPoint dilengkapi dengan berbagai fitur modern untuk mendukung ekosistem perpustakaan yang interaktif dan aman:

1. **Autentikasi & Keamanan Tingkat Lanjut (Supabase Auth)**
   - Login dan Pendaftaran pengguna dengan pemisahan peran (Mahasiswa & Non-Mahasiswa).
   - Menggunakan NPM/NIP sebagai lapisan kredensial tambahan.
   - **Enkripsi Data PII**: Data pribadi pengguna (Personally Identifiable Information) dienkripsi di tingkat database menggunakan `ENCRYPTION_KEY` untuk menjaga privasi.

2. **Dashboard Interaktif & Modern**
   - Antarmuka pengguna (UI/UX) premium menggunakan **Tailwind CSS** dengan efek Glassmorphism.
   - Panel terpusat untuk memantau semua aktivitas perpustakaan.

3. **Manajemen Koleksi Buku (Books)**
   - **Records**: Pencatatan dan penelusuran katalog buku perpustakaan.
   - **Wishlist**: Pengguna dapat menambahkan buku yang diinginkan ke dalam daftar harapan (wishlist).

4. **Sistem Peminjaman (Loans)**
   - Manajemen sirkulasi, pelacakan peminjaman, dan pengembalian buku secara digital.

5. **AI Assistant & Knowledge Base Chat**
   - Asisten cerdas berbasis AI yang terintegrasi untuk membantu pengguna mencari informasi atau bertanya seputar koleksi perpustakaan (Knowledge Base).

6. **Gamifikasi: Sistem Poin & Hadiah (Points & Rewards)**
   - Program Loyalitas Pemustaka: Pengguna mendapatkan poin dari aktivitas (seperti meminjam buku) yang dapat ditukarkan dengan berbagai hadiah (Rewards).

7. **Komunitas (Community)**
   - Ruang interaksi antar pemustaka untuk berbagi ulasan, diskusi, atau rekomendasi buku.

---

## 🚀 Cara Menjalankan Secara Lokal (How to Run)

Ikuti langkah-langkah berikut untuk menjalankan aplikasi LibPoint di komputer Anda (Local Environment):

### 1. Persyaratan Sistem
Pastikan sistem Anda telah terinstal:
- **Node.js** (Versi 18 atau lebih baru disarankan).
- **Git** (Opsional, untuk version control).

### 2. Instalasi Dependensi
Buka terminal (Command Prompt, PowerShell, atau Terminal bawaan OS), arahkan ke folder root proyek, lalu jalankan perintah berikut untuk menginstal semua library yang dibutuhkan:
```bash
npm install
```

### 3. Konfigurasi Environment Variables (.env)
Aplikasi ini membutuhkan beberapa kredensial layanan pihak ketiga (Supabase).
1. Buat file baru bernama **`.env.local`** di folder root proyek (sejajar dengan `package.json`).
2. Tambahkan variabel berikut ke dalam file tersebut (sesuaikan nilainya dengan kredensial Anda, atau copy dari `.env.local` yang sudah ada jika ada):

```env
# Koneksi Database & Auth Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]

# Kunci Enkripsi (Gunakan string hex 32-byte rahasia)
ENCRYPTION_KEY=[YOUR_SECRET_ENCRYPTION_KEY]

# Opsional: Jika menggunakan model/provider AI eksternal, masukkan API key yang relevan
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
```

### 4. Jalankan Development Server
Setelah semua terkonfigurasi, jalankan server mode pengembang (development):
```bash
npm run dev
```
Buka browser Anda dan akses **[http://localhost:3000](http://localhost:3000)**. Aplikasi akan memuat ulang secara otomatis jika Anda melakukan perubahan pada kode.

---

## 🌐 Cara Melakukan Deployment (How to Deploy)

Aplikasi berbasis Next.js sangat direkomendasikan untuk di-deploy menggunakan **Vercel** karena integrasinya yang otomatis dan mudah.

### Langkah-langkah Deployment via Vercel:
1. **Push ke Repository**: Pastikan seluruh kode proyek Anda sudah di-push ke repository Git online (GitHub, GitLab, atau Bitbucket).
2. **Buat Proyek di Vercel**:
   - Login ke akun [Vercel](https://vercel.com/).
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. **Hubungkan Repository**:
   - Pilih repository Git yang berisi proyek LibPoint Anda dan klik **"Import"**.
4. **Konfigurasi Variabel Lingkungan (Environment Variables)**:
   - Sebelum mengklik Deploy, buka bagian **Environment Variables**.
   - Tambahkan satu per satu kunci (keys) yang ada di file `.env.local` Anda (seperti `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ENCRYPTION_KEY`) beserta nilainya.
5. **Proses Deploy**:
   - Klik tombol **"Deploy"**.
   - Vercel akan mulai mengunduh dependensi, membangun (build) proyek, dan mempublikasikannya.
6. **Selesai**:
   - Setelah proses selesai, Vercel akan memberikan URL publik (domain) di mana aplikasi Anda sudah live dan dapat diakses oleh siapa saja.
