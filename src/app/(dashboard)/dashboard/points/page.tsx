'use client';

import { Award, Info, History, Star, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PointsPage() {
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    async function fetchPoints() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('total_points').eq('id', session.user.id).single();
        if (data) {
          setTotalPoints(data.total_points || 0);
        }
      }
    }
    fetchPoints();
  }, []);

  const pointRules = [
    { no: 1, action: 'Mengunjungi perpustakaan dan melakukan presensi kunjungan melalui visitor counter', point: 1, unit: 'Kunjungan' },
    { no: 2, action: 'Memberikan komentar terhadap buku pada OPAC perpustakaan/mobile library (MoLib)', point: 1, unit: 'Komentar' },
    { no: 3, action: 'Peminjaman buku fisik/MoLib', point: 1.5, unit: 'Eksemplar' },
    { no: 4, action: 'Pengembalian buku fisik tepat waktu (tidak terlambat)', point: 1.5, unit: 'Eksemplar' },
    { no: 5, action: 'Menggunakan layanan cek kemiripan dokumen (plagiarism check)', point: 5, unit: 'Dokumen' },
    { no: 6, action: 'Menggunakan layanan bimbingan pemustaka', point: 5, unit: 'Kali' },
    { no: 7, action: 'Menghadiri acara perpustakaan (workshop, seminar, diskusi buku, sosialisasi, dll)', point: 2, unit: 'Kehadiran' },
    { no: 8, action: 'Mengirimkan artikel untuk website perpustakaan', point: 10, unit: 'Artikel yang diterima' },
    { no: 9, action: 'Membuat konten video pendek untuk reels instagram perpustakaan', point: 20, unit: 'Video yang diterima' },
  ];

  const dummyHistory = [
    { id: 1, date: '05 Jul 2026', action: 'Mengunjungi perpustakaan', point: '+1' },
    { id: 2, date: '03 Jul 2026', action: 'Peminjaman buku fisik (2 Eksemplar)', point: '+3' },
    { id: 3, date: '01 Jul 2026', action: 'Menghadiri acara perpustakaan (Seminar)', point: '+2' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2C4A]">Poin & Aktivitas</h1>
        <p className="text-gray-500 mt-1">Kumpulkan poin dari aktivitasmu dan tukarkan dengan merchandise menarik!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Points Summary Card */}
        <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl md:col-span-1 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Total Poin Saat Ini</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-bold text-gray-900">{totalPoints}</span>
              <span className="text-primary font-medium text-sm">Poin</span>
            </div>
          </div>
          
          <button className="mt-6 w-full py-2.5 bg-gray-50 hover:bg-primary hover:text-white text-gray-700 rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2 group">
            Tukar Poin
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </button>
        </div>

        {/* History Preview Card */}
        <div className="bg-white border border-gray-100 shadow-sm p-6 rounded-2xl md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800">Riwayat Terakhir</h2>
          </div>
          <div className="space-y-3">
            {dummyHistory.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-gray-800 text-sm font-medium">{item.action}</p>
                    <p className="text-gray-400 text-xs">{item.date}</p>
                  </div>
                </div>
                <span className="text-green-600 font-bold">{item.point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-800">Sistem Poin (Cara Mendapatkan Poin)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="py-4 px-6 font-semibold w-16 text-center">No</th>
                <th className="py-4 px-6 font-semibold">Aktivitas</th>
                <th className="py-4 px-6 font-semibold text-center w-24">Poin</th>
                <th className="py-4 px-6 font-semibold w-40">Satuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {pointRules.map((rule, idx) => (
                <tr key={rule.no} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-center text-gray-400">{rule.no}</td>
                  <td className="py-4 px-6 font-medium">{rule.action}</td>
                  <td className="py-4 px-6 text-center font-bold text-primary">{rule.point}</td>
                  <td className="py-4 px-6 text-gray-500">{rule.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
