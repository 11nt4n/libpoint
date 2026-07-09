'use client';

import { Users, BookOpen, Gift, Trophy } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2C4A]">Dashboard Admin</h1>
        <p className="text-gray-500 mt-1">Selamat datang kembali. Kelola perpustakaan dan aktivitas anggota dengan mudah hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Cards */}
        <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-blue-100 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Anggota</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-purple-100 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Sirkulasi Buku</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-emerald-100 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Gift className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Penukaran Baru</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-primary-light transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Poin Dibagikan</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>

      {/* Placeholders for upcoming features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-64 flex items-center justify-center">
          <p className="text-gray-400 italic">Grafik Aktivitas Poin (Segera Hadir)</p>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 h-64 flex items-center justify-center">
          <p className="text-gray-400 italic">Riwayat Peminjaman Terbaru (Segera Hadir)</p>
        </div>
      </div>
    </div>
  );
}
