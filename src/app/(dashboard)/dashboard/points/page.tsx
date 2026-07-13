'use client';

import { Award, Info, History, Star, ArrowRight, User, Sparkles, TrendingUp, ChevronRight, Gift, X, ChevronLeft, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createPortal } from 'react-dom';

export default function PointsPage() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [identityText, setIdentityText] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Modal & Pagination State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setMounted(true);
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Pengguna');
        setAvatarUrl(session.user.user_metadata?.avatar_url || '');
        
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
          setTotalPoints(data.total_points || 0);
          setUserName(data.nama_panggilan || data.full_name || data.nama_lengkap || 'Pengguna');
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          
          if (data.npm || data.user_id) {
            setIdentityText(`Mahasiswa - ${data.npm || data.user_id}`);
          } else if (data.nip) {
            setIdentityText(`NonMahasiswa - ${data.nip}`);
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  let levelName = 'Kenalan';
  let levelNumber = 1;
  let nextLevelPoints = 500;

  if (totalPoints >= 1000) {
    levelName = 'Sahabat';
    levelNumber = 3;
    nextLevelPoints = 1000;
  } else if (totalPoints >= 500) {
    levelName = 'Teman';
    levelNumber = 2;
    nextLevelPoints = 1000;
  } else {
    levelName = 'Kenalan';
    levelNumber = 1;
    nextLevelPoints = 500;
  }

  const displayProgressPercent = totalPoints >= 1000 ? 100 : (totalPoints / nextLevelPoints) * 100;

  const pointRules = [
    { no: 1, action: 'Mengunjungi perpustakaan dan melakukan presensi kunjungan', point: 1, unit: 'Kunjungan' },
    { no: 2, action: 'Memberikan komentar terhadap buku pada OPAC / MoLib', point: 1, unit: 'Komentar' },
    { no: 3, action: 'Peminjaman buku fisik/MoLib', point: 1.5, unit: 'Eksemplar' },
    { no: 4, action: 'Pengembalian buku fisik tepat waktu (tidak terlambat)', point: 1.5, unit: 'Eksemplar' },
    { no: 5, action: 'Menggunakan layanan cek kemiripan dokumen (plagiarism check)', point: 5, unit: 'Dokumen' },
    { no: 6, action: 'Menggunakan layanan bimbingan pemustaka', point: 5, unit: 'Kali' },
    { no: 7, action: 'Menghadiri acara perpustakaan (workshop, seminar, dll)', point: 2, unit: 'Kehadiran' },
    { no: 8, action: 'Mengirimkan artikel untuk website perpustakaan', point: 10, unit: 'Artikel' },
    { no: 9, action: 'Membuat konten video pendek untuk reels instagram perpustakaan', point: 20, unit: 'Video' },
  ];

  const dummyHistory = [
    { id: 1, date: '2026-07-05', action: 'Mengunjungi perpustakaan', point: '+1' },
    { id: 2, date: '2026-07-03', action: 'Peminjaman buku fisik (2 Eksemplar)', point: '+3' },
    { id: 3, date: '2026-07-01', action: 'Menghadiri acara perpustakaan (Seminar)', point: '+2' },
    { id: 4, date: '2026-06-28', action: 'Menggunakan layanan plagiarism check', point: '+5' },
    { id: 5, date: '2026-06-25', action: 'Pengembalian buku tepat waktu', point: '+1.5' },
    { id: 6, date: '2026-06-20', action: 'Memberikan komentar pada OPAC', point: '+1' },
    { id: 7, date: '2026-06-15', action: 'Mengunjungi perpustakaan', point: '+1' },
    { id: 8, date: '2026-06-10', action: 'Peminjaman buku fisik (1 Eksemplar)', point: '+1.5' },
    { id: 9, date: '2026-06-05', action: 'Menghadiri acara perpustakaan (Workshop)', point: '+2' },
    { id: 10, date: '2026-06-01', action: 'Membuat konten reels', point: '+20' },
  ];

  const filteredHistory = dummyHistory.filter(item => {
    if (startDateFilter && item.date < startDateFilter) return false;
    if (endDateFilter && item.date > endDateFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setHistoryPage(1);
  }, [startDateFilter, endDateFilter]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2C4A] tracking-tight">Poin & Aktivitas</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Kumpulkan poin dari aktivitasmu dan capai level tertinggi!</p>
        </div>
      </div>

      {/* Main Profile & Level Card */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-shadow duration-500">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-primary/10 to-teal-400/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
        
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-1.5 shadow-xl relative z-10 group-hover:shadow-2xl transition-shadow duration-500">
            <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white flex items-center justify-center relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-blue-300" />
              )}
            </div>
          </div>
          {/* Level Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-black px-5 py-1.5 rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.4)] border-2 border-white z-20 whitespace-nowrap transform group-hover:-translate-y-1 transition-transform duration-300">
            {levelName}
          </div>
        </div>
        
        {/* User Info & Progress */}
        <div className="flex-1 w-full space-y-5 relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex flex-col space-y-0.5">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">{loading ? 'Memuat...' : userName}</h2>
              {!loading && identityText && (
                <div className="text-sm font-medium text-slate-500">
                  {identityText}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Riwayat
              <History className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress Bar Container */}
          <div className="pt-2">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-500">Progress ke Level {Math.min(levelNumber + 1, 3)}</span>
              {totalPoints >= 1000 ? (
                <span className="text-sm font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">Max Level</span>
              ) : (
                <span className="text-sm font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md shadow-sm border border-slate-100">
                  {totalPoints.toLocaleString('id-ID')} / {nextLevelPoints.toLocaleString('id-ID')} XP
                </span>
              )}
            </div>
            <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${displayProgressPercent}%` }}
              >
                {/* Animated shimmer effect on progress bar */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* Level System Cards */}
        <div className="bg-white border border-slate-100 shadow-md shadow-slate-200/40 rounded-[2rem] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Level Keanggotaan</h2>
              <p className="text-sm text-slate-500 font-medium">Tingkatan berdasarkan XP (Poin) yang dikumpulkan</p>
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center relative overflow-hidden group hover:border-amber-300 hover:shadow-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-slate-100 group-hover:border-amber-400 group-hover:scale-110 transition-all">
                  <span className="text-xl font-black text-slate-400">1</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Kenalan</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Tanpa minimal poin</p>
                <div className="bg-white py-2 px-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                  <span className="font-bold text-slate-700">&lt; 500 XP</span>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center relative overflow-hidden group hover:border-amber-400 hover:shadow-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-amber-300 group-hover:border-amber-500 group-hover:scale-110 transition-all">
                  <span className="text-xl font-black text-amber-500">2</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Teman</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Minimal 500 poin</p>
                <div className="bg-white py-2 px-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                  <span className="font-bold text-slate-700">500 - 999 XP</span>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center relative overflow-hidden group hover:border-amber-500 hover:shadow-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border-2 border-white group-hover:scale-110 transition-all">
                  <span className="text-xl font-black text-white">3</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Sahabat</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Minimal 1.000 poin</p>
                <div className="bg-white py-2 px-4 rounded-xl border border-amber-200 inline-block shadow-sm">
                  <span className="font-bold text-amber-600">≥ 1.000 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 shadow-md shadow-slate-200/40 rounded-[2rem] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Sistem Poin</h2>
                <p className="text-sm text-slate-500 font-medium">Cara mendapatkan poin (XP)</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-sm">
                  <th className="py-4 px-6 md:px-8 font-bold w-16 text-center">No</th>
                  <th className="py-4 px-6 md:px-8 font-bold">Aktivitas</th>
                  <th className="py-4 px-6 md:px-8 font-bold text-center w-24">Poin</th>
                  <th className="py-4 px-6 md:px-8 font-bold w-32">Satuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 text-sm text-slate-700">
                {pointRules.map((rule) => (
                  <tr key={rule.no} className="hover:bg-primary/5 transition-colors group">
                    <td className="py-4 px-6 md:px-8 text-center text-slate-400 font-semibold">{rule.no}</td>
                    <td className="py-4 px-6 md:px-8 font-medium group-hover:text-primary transition-colors">{rule.action}</td>
                    <td className="py-4 px-6 md:px-8 text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-lg">
                        +{rule.point}
                      </span>
                    </td>
                    <td className="py-4 px-6 md:px-8 text-slate-500 font-medium">{rule.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-[#0B2C4A] to-slate-800 rounded-[2rem] p-8 shadow-xl text-white flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors duration-500"></div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-2xl font-bold">Tukar Poinmu!</h3>
            <p className="text-slate-300 max-w-sm">Tukarkan poin yang telah kamu kumpulkan dengan berbagai merchandise eksklusif perpustakaan.</p>
          </div>
          <button className="relative z-10 bg-primary hover:bg-teal-400 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(31,144,144,0.4)] hover:shadow-[0_0_30px_rgba(31,144,144,0.6)] transition-all hover:-translate-y-1 flex items-center gap-2">
            Katalog Hadiah
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* History Modal */}
      {mounted && isHistoryModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Riwayat Poin</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Log aktivitas dan perolehan poin XP Anda</p>
                </div>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                    <span className="text-sm font-bold text-slate-400">Dari:</span>
                    <input 
                      type="date" 
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="text-sm font-medium border-none focus:outline-none text-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                  <span className="text-slate-300 font-bold px-1">-</span>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                    <span className="text-sm font-bold text-slate-400">Sampai:</span>
                    <input 
                      type="date" 
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="text-sm font-medium border-none focus:outline-none text-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Body: Table */}
            <div className="p-0 overflow-y-auto max-h-[50vh]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-sm z-10">
                  <tr className="text-slate-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-6 font-bold border-y border-slate-100">Aktivitas</th>
                    <th className="py-3 px-6 font-bold border-y border-slate-100 w-32">Tanggal</th>
                    <th className="py-3 px-6 font-bold border-y border-slate-100 text-right w-28">Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80 text-sm text-slate-700">
                  {paginatedHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="py-4 px-6 font-medium group-hover:text-primary transition-colors text-sm">
                        {item.action}
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-sm font-medium whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 font-black text-xs px-2.5 py-1 rounded-lg whitespace-nowrap shadow-sm border border-emerald-100/50">
                          {item.point} XP
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer: Pagination */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-sm font-bold text-slate-500">
                Halaman {historyPage} dari {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                  disabled={historyPage === totalPages}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
