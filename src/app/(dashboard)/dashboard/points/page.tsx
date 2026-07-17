'use client';

import { Award, Info, History, Star, ArrowRight, User, Sparkles, TrendingUp, ChevronRight, Gift, X, ChevronLeft, Calendar, BookOpen, MessageSquare, Video, Users, FileText, CheckCircle, Package, ExternalLink } from 'lucide-react';
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
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);

  // Modal & Pagination State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const ITEMS_PER_PAGE = 5;

  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [activeLevelInfo, setActiveLevelInfo] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Pengguna');
        setAvatarUrl(session.user.user_metadata?.avatar_url || '');
        
        const { getEncryptedProfile } = await import('@/app/actions/profiles');
        const { data } = await getEncryptedProfile(session.user.id);
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

        // Fetch point_history
        const { data: historyData } = await supabase
          .from('point_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (historyData) {
          const mappedHistory = historyData.map(item => ({
            id: item.id,
            date: new Date(item.created_at).toISOString().split('T')[0],
            action: item.activity,
            point: '+' + item.points
          }));
          setPointsHistory(mappedHistory);
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
    { no: 1, action: 'Kunjungan Perpustakaan', desc: 'Melakukan presensi kedatangan di perpustakaan', point: 1, unit: 'Kunjungan', icon: User, color: 'bg-blue-100 text-blue-600', border: 'hover:border-blue-300', glow: 'group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
    { no: 2, action: 'Komentar Buku', desc: 'Memberikan komentar / ulasan pada OPAC', point: 1, unit: 'Komentar', icon: MessageSquare, color: 'bg-indigo-100 text-indigo-600', border: 'hover:border-indigo-300', glow: 'group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]' },
    { no: 3, action: 'Peminjaman Buku', desc: 'Meminjam buku fisik atau e-book MoLib', point: 1.5, unit: 'Eksemplar', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', border: 'hover:border-emerald-300', glow: 'group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
    { no: 4, action: 'Pengembalian Tepat', desc: 'Mengembalikan buku tanpa terlambat', point: 1.5, unit: 'Eksemplar', icon: CheckCircle, color: 'bg-teal-100 text-teal-600', border: 'hover:border-teal-300', glow: 'group-hover:shadow-[0_0_15px_rgba(20,184,166,0.3)]' },
    { no: 5, action: 'Cek Plagiarisme', desc: 'Menggunakan layanan cek kemiripan', point: 5, unit: 'Dokumen', icon: FileText, color: 'bg-purple-100 text-purple-600', border: 'hover:border-purple-300', glow: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
    { no: 6, action: 'Bimbingan Pemustaka', desc: 'Konsultasi referensi ke pustakawan', point: 5, unit: 'Kali', icon: Users, color: 'bg-pink-100 text-pink-600', border: 'hover:border-pink-300', glow: 'group-hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]' },
    { no: 7, action: 'Hadir Acara Perpus', desc: 'Mengikuti workshop, seminar, literasi', point: 2, unit: 'Kehadiran', icon: Calendar, color: 'bg-orange-100 text-orange-600', border: 'hover:border-orange-300', glow: 'group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]' },
    { no: 8, action: 'Kontributor Web', desc: 'Mengirimkan artikel ke web perpustakaan', point: 10, unit: 'Artikel', icon: Sparkles, color: 'bg-amber-100 text-amber-600', border: 'hover:border-amber-300', glow: 'group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]' },
    { no: 9, action: 'Kreator Konten', desc: 'Membuat video reels/tiktok perpus', point: 20, unit: 'Video', icon: Video, color: 'bg-red-100 text-red-600', border: 'hover:border-red-300', glow: 'group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]' },
  ];

  const filteredHistory = pointsHistory.filter(item => {
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
              <div 
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center relative overflow-hidden group hover:border-amber-300 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
                onClick={() => setActiveLevelInfo(activeLevelInfo === 1 ? null : 1)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-slate-100 group-hover:border-amber-400 group-hover:scale-110 transition-all">
                  <span className="text-xl font-black text-slate-400">1</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">Kenalan</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Tanpa minimal poin</p>
                <div className="bg-white py-2 px-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                  <span className="font-bold text-slate-700">&lt; 500 XP</span>
                </div>
                {/* Level Details Popover */}
                <div className={`mt-4 text-left overflow-hidden transition-all duration-300 ${activeLevelInfo === 1 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                    <p className="font-bold mb-1 text-slate-800">Benefit:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Akses dasar peminjaman</li>
                      <li>Kapasitas pinjam standar</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center relative overflow-hidden group hover:border-amber-400 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
                onClick={() => setActiveLevelInfo(activeLevelInfo === 2 ? null : 2)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-100/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border-2 border-amber-300 group-hover:border-amber-500 group-hover:scale-110 transition-all">
                  <span className="text-xl font-black text-amber-500">2</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">Teman</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Minimal 500 poin</p>
                <div className="bg-white py-2 px-4 rounded-xl border border-slate-200 inline-block shadow-sm">
                  <span className="font-bold text-slate-700">500 - 999 XP</span>
                </div>
                <div className={`mt-4 text-left overflow-hidden transition-all duration-300 ${activeLevelInfo === 2 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-xs text-slate-600">
                    <p className="font-bold mb-1 text-amber-800">Benefit Tambahan:</p>
                    <ul className="list-disc pl-4 space-y-1 text-amber-900/70">
                      <li>Batas pinjam buku +1</li>
                      <li>Prioritas request buku</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center relative overflow-hidden group hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1"
                onClick={() => setActiveLevelInfo(activeLevelInfo === 3 ? null : 3)}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border-2 border-white group-hover:scale-110 transition-all shadow-amber-500/30">
                  <span className="text-xl font-black text-white">3</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">Sahabat</h3>
                <p className="text-sm text-slate-500 mb-4 font-medium">Minimal 1.000 poin</p>
                <div className="bg-white py-2 px-4 rounded-xl border border-amber-200 inline-block shadow-sm">
                  <span className="font-bold text-amber-600">≥ 1.000 XP</span>
                </div>
                <div className={`mt-4 text-left overflow-hidden transition-all duration-300 ${activeLevelInfo === 3 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-xs text-orange-800">
                    <p className="font-bold mb-1">Benefit Eksklusif:</p>
                    <ul className="list-disc pl-4 space-y-1 opacity-80">
                      <li>Batas pinjam buku +3</li>
                      <li>Perpanjang pinjaman 2x</li>
                      <li>Akses merchandise khusus</li>
                    </ul>
                  </div>
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
          
          <div className="p-6 md:p-8 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pointRules.map((rule) => {
                const Icon = rule.icon;
                return (
                  <div 
                    key={rule.no} 
                    className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 ${rule.border} group relative ${rule.glow}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${rule.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-bold text-slate-800 leading-snug">{rule.action}</h3>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{rule.desc}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">/ {rule.unit}</span>
                          <span className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-sm shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                            +{rule.point} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-[#0B2C4A] to-slate-800 rounded-[2rem] p-8 shadow-xl text-white flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors duration-500"></div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-2xl font-bold">Tukar Poinmu!</h3>
            <p className="text-slate-300 max-w-sm">Tukarkan poin yang telah kamu kumpulkan dengan berbagai merchandise eksklusif perpustakaan.</p>
          </div>
          <button 
            onClick={() => setIsCatalogModalOpen(true)}
            className="relative z-10 bg-primary hover:bg-teal-400 text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(31,144,144,0.4)] hover:shadow-[0_0_30px_rgba(31,144,144,0.6)] transition-all hover:-translate-y-1 flex items-center gap-2 group-hover:scale-105"
          >
            Buka Katalog Hadiah
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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

      {/* Catalog Modal */}
      {mounted && isCatalogModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCatalogModalOpen(false)}></div>
          <div className="bg-slate-50 rounded-[2rem] w-full max-w-4xl shadow-2xl relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-300 overflow-hidden h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-200 bg-white relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Katalog Penukaran Poin</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Tukarkan poin XP Anda dengan reward menarik</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-8 right-20 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-500 fill-current" />
                <span className="font-black text-emerald-700">{totalPoints.toLocaleString('id-ID')} XP</span>
              </div>
            </div>
            
            {/* Modal Body: Product Grid */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { id: 1, name: 'Voucher Kopi Kantin', desc: 'Gratis 1 gelas Es Kopi Susu', points: 250, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80', stock: 15 },
                  { id: 2, name: 'Tote Bag Perpus', desc: 'Tote bag kanvas premium', points: 500, img: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=400&q=80', stock: 5 },
                  { id: 3, name: 'Tumbler Eksklusif', desc: 'Botol minum insulasi panas/dingin', points: 800, img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80', stock: 2 },
                  { id: 4, name: 'Buku Catatan Premium', desc: 'Notes spiral 100 lembar + pulpen', points: 300, img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80', stock: 20 },
                  { id: 5, name: 'Kaos "Bookworm"', desc: 'Kaos katun distro ukuran M/L/XL', points: 1200, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80', stock: 0 },
                  { id: 6, name: 'Lanyard Kartu Mahasiswa', desc: 'Tali ID card official design baru', points: 150, img: 'https://images.unsplash.com/photo-1627473770146-24ab339832c3?auto=format&fit=crop&w=400&q=80', stock: 45 },
                ].map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
                    <div className="h-40 w-full overflow-hidden relative bg-slate-100">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      {item.stock === 0 && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">Habis</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-800 text-base mb-1 leading-tight">{item.name}</h4>
                      <p className="text-xs text-slate-500 mb-4">{item.desc}</p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Harga:</span>
                          <span className="font-black text-primary text-sm">{item.points} XP</span>
                        </div>
                        <button 
                          disabled={item.stock === 0 || totalPoints < item.points}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            item.stock === 0 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : totalPoints < item.points
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20 hover:-translate-y-0.5'
                          }`}
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menukar ${item.points} XP untuk ${item.name}?`)) {
                              alert('Permintaan penukaran berhasil dikirim! Silakan ambil hadiah Anda di meja sirkulasi.');
                              setIsCatalogModalOpen(false);
                            }
                          }}
                        >
                          Tukar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
