# Guidebook LibPoint

Selamat datang di panduan instalasi dan penggunaan aplikasi **LibPoint**. Aplikasi ini adalah prototipe web modern untuk sistem informasi perpustakaan dengan antarmuka bergaya premium (Tailwind CSS & Glassmorphism).

## Persyaratan Sistem (Prerequisites)

Sebelum menjalankan aplikasi, pastikan sistem Anda telah memiliki:

1. **Web Server & Database**: Disarankan menggunakan [XAMPP](https://www.apachefriends.org/index.html) (sudah termasuk Apache dan MySQL/MariaDB).
2. **PHP**: Versi 7.4 atau lebih baru.
3. **Composer**: Dependency Manager untuk PHP. Bisa diunduh di [getcomposer.org](https://getcomposer.org/).

## Langkah-Langkah Instalasi & Menjalankan Aplikasi

### 1. Persiapan Database (Lokal / MySQL)
Aplikasi ini secara bawaan (default) menggunakan database MySQL bernama `db_libpoint_v2`.
- Buka aplikasi XAMPP dan jalankan modul **Apache** serta **MySQL**.
- Buka browser dan akses [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
- Buat database baru dengan nama `db_libpoint_v2`.
- Import file SQL database Anda ke dalam database `db_libpoint_v2` yang baru saja dibuat.

### 2. Konfigurasi Kredensial (.env)
Aplikasi ini sekarang menggunakan sistem *environment variables* untuk mengelola kredensial database dengan aman.
- Cari file `.env.example` di dalam direktori `libpoint`.
- *Copy/Paste* file tersebut dan ubah namanya menjadi tepat **`.env`**.
- Buka file `.env` tersebut dan sesuaikan isinya jika password MySQL Anda berbeda:
  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASS=password_anda
  DB_NAME=db_libpoint_v2
  ```

### 3. Instalasi Dependency (Composer)
Aplikasi ini menggunakan Composer untuk library eksternal (seperti DomPDF).
Buka terminal (Command Prompt/PowerShell) dan arahkan ke folder proyek ini (`d:\4. Lomba\libpoint`), kemudian jalankan perintah:
```bash
composer install
```
Perintah ini akan membaca file `composer.json` dan mengunduh library ke dalam folder `vendor/`.

### 4. Menjalankan Aplikasi
Anda dapat menjalankan aplikasi dengan 2 cara:

#### Opsi A: Menggunakan XAMPP (Apache)
Pindahkan seluruh folder `libpoint` ini ke dalam direktori `htdocs` pada instalasi XAMPP Anda (misalnya `C:\xampp\htdocs\libpoint`).
Kemudian akses di browser:
[http://localhost/libpoint](http://localhost/libpoint)

#### Opsi B: Menggunakan PHP Built-in Server
Jika PHP sudah terdaftar di Environment Variables sistem Anda, buka terminal di folder proyek ini (`d:\4. Lomba\libpoint`) dan jalankan:
```bash
php -S localhost:8000
```
Buka browser dan akses:
[http://localhost:8000](http://localhost:8000)

---

## Opsi Lanjutan: Integrasi ke Supabase
Sesuai rancangan, database aplikasi ini siap untuk dipindahkan ke layanan awan **Supabase** (PostgreSQL).
Jika Anda ingin mengubah koneksi ke Supabase:
1. Pastikan Anda telah membuat proyek di Supabase dan menyalin sintaks skema PostgreSQL dari file `supabase_schema_migration.md`.
2. Ubah `config/koneksi.php` agar menggunakan metode **PDO** (PostgreSQL) karena sintaks bawaan `mysqli_` tidak didukung oleh Postgres.
3. Masukkan kredensial Supabase Anda ke dalam file `.env` yang baru.

## Struktur Aplikasi Saat Ini
- **`index.php`**: Entry point utama. Mencegah akses tak sah dan mengatur routing ke dasbor terkait.
- **`auth/`**: Sistem login dan register dengan desain CSS kustom.
- **`user/` & `admin/`**: Panel dasbor dengan **UI/UX standar modern** (Tailwind CSS, Glassmorphism). Seluruh kode berantakan sebelumnya telah dibersihkan.
- **`partials/`**: Sidebar & Header dinamis yang tidak lagi menduplikasi tag HTML utama, mencegah kerusakan tata letak halaman.
