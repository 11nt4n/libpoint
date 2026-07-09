'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Trophy, CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function AdminPointsPage() {
  const [npm, setNpm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const pointRules = [
    { id: '1', action: 'Mengunjungi perpustakaan (presensi)', point: 1, unit: 'Kunjungan' },
    { id: '2', action: 'Memberikan komentar terhadap buku', point: 1, unit: 'Komentar' },
    { id: '3', action: 'Peminjaman buku fisik/MoLib', point: 1.5, unit: 'Eksemplar' },
    { id: '4', action: 'Pengembalian buku fisik tepat waktu', point: 1.5, unit: 'Eksemplar' },
    { id: '5', action: 'Layanan cek kemiripan dokumen', point: 5, unit: 'Dokumen' },
    { id: '6', action: 'Layanan bimbingan pemustaka', point: 5, unit: 'Kali' },
    { id: '7', action: 'Menghadiri acara perpustakaan', point: 2, unit: 'Kehadiran' },
    { id: '8', action: 'Mengirimkan artikel untuk website', point: 10, unit: 'Artikel' },
    { id: '9', action: 'Membuat konten video pendek (Reels)', point: 20, unit: 'Video' },
  ];

  const selectedRule = pointRules.find(r => r.id === selectedActivity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npm || !selectedRule) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1. Cari user berdasarkan NPM
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('npm, total_points, nama_lengkap')
        .eq('npm', npm)
        .single();

      if (userError || !user) {
        throw new Error('Mahasiswa dengan NPM tersebut tidak ditemukan.');
      }

      // 2. Tambahkan poin ke profil (kalau ada tabel point_transactions, tambahkan juga kesana nanti)
      const newTotal = (user.total_points || 0) + selectedRule.point;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_points: newTotal })
        .eq('npm', npm);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: `Berhasil menambahkan ${selectedRule.point} poin kepada ${user.nama_lengkap} (${user.npm}). Total saat ini: ${newTotal} Poin.` });
      setNpm('');
      setSelectedActivity('');

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2C4A]">Input Poin Aktivitas</h1>
        <p className="text-gray-500 mt-1">Berikan poin kepada mahasiswa berdasarkan aktivitas yang telah mereka lakukan.</p>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nomor Induk Mahasiswa (NPM)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={npm}
                onChange={(e) => setNpm(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-gray-800"
                placeholder="Masukkan NPM mahasiswa..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pilih Aktivitas (Otomatis)</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-gray-800"
            >
              <option value="" disabled>-- Pilih Aktivitas --</option>
              {pointRules.map(rule => (
                <option key={rule.id} value={rule.id}>
                  {rule.action} (+{rule.point} Poin / {rule.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedRule && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Trophy className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Ringkasan Input</p>
                <p className="text-sm text-blue-700 mt-1">
                  Mahasiswa ini akan mendapatkan tambahan <strong>{selectedRule.point} poin</strong> untuk aktivitas <em>"{selectedRule.action}"</em>.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !npm || !selectedActivity}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : (
              <>
                <Save className="w-5 h-5" />
                Simpan & Tambahkan Poin
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
