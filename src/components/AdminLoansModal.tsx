'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, BookOpen, X } from 'lucide-react';

export default function AdminLoansModal({ onClose }: { onClose: () => void }) {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchBorrowings();
  }, []);

  const fetchBorrowings = async () => {
    setLoading(true);
    const { data: bData, error } = await supabase
      .from('borrowings')
      .select('*')
      .order('borrow_date', { ascending: false });

    if (bData) {
      const bookIds = [...new Set(bData.map((b: any) => b.book_id))].filter(Boolean);
      const userIds = [...new Set(bData.map((b: any) => b.user_id))].filter(Boolean);
      
      const { data: booksData } = await supabase.from('books').select('*').in('id', bookIds);
      const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);
      
      const booksMap: any = {};
      if (booksData) {
        booksData.forEach((book: any) => {
          booksMap[book.id] = book;
        });
      }
      const profilesMap: any = {};
      if (profilesData) {
        profilesData.forEach((profile: any) => {
          profilesMap[profile.id] = profile;
        });
      }
      
      const sortedByDate = [...bData].sort((a: any, b: any) => new Date(a.borrow_date).getTime() - new Date(b.borrow_date).getTime());
      const queueCounters: Record<string, number> = {};

      const mergedData = sortedByDate.map((b: any) => {
        const d = new Date(b.borrow_date);
        const dateStr = d.toLocaleDateString('id-ID');
        if (!queueCounters[dateStr]) queueCounters[dateStr] = 0;
        queueCounters[dateStr]++;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        const queueNum = String(queueCounters[dateStr]).padStart(3, '0');
        return {
          ...b,
          generated_token: `${day}${month}${year}${queueNum}`,
          books: booksMap[b.book_id] || {},
          profiles: profilesMap[b.user_id] || {}
        };
      });
      
      mergedData.sort((a: any, b: any) => new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime());
      setBorrowings(mergedData);
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  const handleApproveBorrow = async (loan: any) => {
    try {
      const approvedAt = new Date();
      const dueDate = new Date(approvedAt);
      dueDate.setDate(dueDate.getDate() + 14);

      await supabase.from('borrowings').update({
        status: 'Borrowed',
        due_date: dueDate.toISOString()
      }).eq('id', loan.id);
      
      const pointsToEarn = 1.5;
      const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', loan.user_id).single();
      const currentPoints = profile?.total_points || 0;
      await supabase.from('profiles').update({ total_points: currentPoints + pointsToEarn }).eq('id', loan.user_id);
      
      await supabase.from('point_history').insert({
        user_id: loan.user_id,
        activity: `Peminjaman Buku: ${loan.books?.title || 'Selesai'}`,
        points: pointsToEarn
      });

      fetchBorrowings();
      alert('Peminjaman disetujui!');
    } catch (err: any) {
      alert('Gagal menyetujui: ' + err.message);
    }
  };

  const handleRejectBorrow = async (loan: any) => {
    try {
      await supabase.from('borrowings').update({
        status: 'Rejected'
      }).eq('id', loan.id);

      const { data: latestBook } = await supabase
        .from('books')
        .select('stok_tersedia, stok_dipinjam')
        .eq('id', loan.book_id)
        .single();

      if (latestBook) {
        await supabase.from('books').update({
          stok_tersedia: (latestBook.stok_tersedia ?? 0) + 1,
          stok_dipinjam: Math.max(0, (latestBook.stok_dipinjam ?? 0) - 1)
        }).eq('id', loan.book_id);
      }

      fetchBorrowings();
      alert('Peminjaman ditolak!');
    } catch (err: any) {
      alert('Gagal menolak: ' + err.message);
    }
  };

  const handleApproveReturn = async (loan: any) => {
    try {
      await supabase.from('borrowings').update({
        status: 'Returned',
        return_date: new Date().toISOString()
      }).eq('id', loan.id);

      const { data: latestBook } = await supabase
        .from('books')
        .select('stok_tersedia, stok_dipinjam')
        .eq('id', loan.book_id)
        .single();

      if (latestBook) {
        await supabase.from('books').update({
          stok_tersedia: (latestBook.stok_tersedia ?? 0) + 1,
          stok_dipinjam: Math.max(0, (latestBook.stok_dipinjam ?? 0) - 1)
        }).eq('id', loan.book_id);
      }

      let pointsToEarn = 0;
      
      // Hitung apakah terlambat
      const returnDate = new Date();
      const dueDate = new Date(loan.due_date);
      
      // Jika kembali tepat waktu atau lebih awal, beri poin
      if (returnDate <= dueDate || loan.status === 'Pending_Borrow' || !loan.due_date) {
        pointsToEarn = 1.5;
      }
      
      if (pointsToEarn > 0) {
        const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', loan.user_id).single();
        const currentPoints = profile?.total_points || 0;
        await supabase.from('profiles').update({ total_points: currentPoints + pointsToEarn }).eq('id', loan.user_id);
        
        await supabase.from('point_history').insert({
          user_id: loan.user_id,
          activity: `Pengembalian Buku Tepat Waktu: ${loan.books?.title || 'Selesai'}`,
          points: pointsToEarn
        });
      }

      fetchBorrowings();
      alert('Pengembalian disetujui!');
    } catch (err: any) {
      alert('Gagal menyetujui pengembalian: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col relative my-auto animate-in fade-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manajemen Peminjaman (Admin)</h1>
            <p className="text-sm text-gray-500 mt-1">Setujui peminjaman, tolak, atau konfirmasi pengembalian buku dari anggota.</p>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {(() => {
            const filteredBorrowings = borrowings.filter(loan => {
              if (!dateFilter) return true;
              const loanDate = new Date(loan.borrow_date).toISOString().split('T')[0];
              return loanDate === dateFilter;
            });
            const totalPages = Math.ceil(filteredBorrowings.length / ITEMS_PER_PAGE);
            const currentBorrowings = filteredBorrowings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Token / Waktu</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Peminjam</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Buku</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      </td>
                    </tr>
                  ) : currentBorrowings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Tidak ada data peminjaman.
                      </td>
                    </tr>
                  ) : (
                    currentBorrowings.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-bold font-mono text-gray-900">{loan.generated_token || '-'}</div>
                          <div className="text-xs text-gray-500">{new Date(loan.borrow_date).toLocaleDateString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900">{loan.profiles?.nama_lengkap || 'Tanpa Nama'}</div>
                          <div className="text-xs text-gray-500">{loan.profiles?.npm ? `NPM/NIP: ${loan.profiles.npm}` : 'User ID: ' + loan.user_id?.substring(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-8 h-12 bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center">
                              {loan.books?.cover_url ? (
                                <img src={loan.books.cover_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">{loan.books?.title}</div>
                              <div className="text-xs text-gray-500">Kode: {loan.books?.item_code || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${loan.status === 'Pending_Borrow' ? 'bg-amber-100 text-amber-800' : ''}
                            ${loan.status === 'Pending_Return' ? 'bg-purple-100 text-purple-800' : ''}
                            ${loan.status === 'Borrowed' ? 'bg-blue-100 text-blue-800' : ''}
                            ${loan.status === 'Returned' ? 'bg-green-100 text-green-800' : ''}
                            ${loan.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {loan.status === 'Pending_Borrow' && (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleRejectBorrow(loan)} className="text-red-600 hover:text-red-900 p-1 bg-red-50 rounded" title="Tolak">
                                <XCircle className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleApproveBorrow(loan)} className="text-green-600 hover:text-green-900 p-1 bg-green-50 rounded" title="Setujui Peminjaman">
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          {loan.status === 'Pending_Return' && (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleApproveReturn(loan)} className="text-purple-600 hover:text-purple-900 p-1 bg-purple-50 rounded" title="Terima Buku">
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          {(loan.status === 'Borrowed' || loan.status === 'Returned' || loan.status === 'Rejected') && (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-500">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
