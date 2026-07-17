'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import AdminLoansModal from '@/components/AdminLoansModal';

export default function RecordsPage() {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('member');
  const [showAdminLoans, setShowAdminLoans] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchBorrowings(data.user.id);
        supabase.from('profiles').select('role').eq('id', data.user.id).single().then(({ data: profileData }) => {
          if (profileData) setUserRole(profileData.role);
        });
      }
    });
  }, []);

  const fetchBorrowings = async (userId: string) => {
    setLoading(true);
    const { data: bData, error } = await supabase
      .from('borrowings')
      .select('*')
      .order('borrow_date', { ascending: false });
    
    if (bData) {
      const sortedByDate = [...bData].sort((a: any, b: any) => new Date(a.borrow_date).getTime() - new Date(b.borrow_date).getTime());
      const queueCounters: Record<string, number> = {};

      const withTokens = sortedByDate.map((b: any) => {
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
          generated_token: `${day}${month}${year}${queueNum}`
        };
      });

      const userBorrowings = withTokens.filter((b: any) => b.user_id === userId);
      userBorrowings.sort((a: any, b: any) => new Date(b.borrow_date).getTime() - new Date(a.borrow_date).getTime());

      const bookIds = [...new Set(userBorrowings.map((b: any) => b.book_id))].filter(Boolean);
      const { data: booksData } = await supabase.from('books').select('*').in('id', bookIds);
      const booksMap: any = {};
      if (booksData) {
        booksData.forEach((book: any) => {
          booksMap[book.id] = book;
        });
      }
      const mergedData = userBorrowings.map((b: any) => ({
        ...b,
        books: booksMap[b.book_id] || {}
      }));
      setBorrowings(mergedData);
    }
    setLoading(false);
  };

  const handleExtend = async (borrowingId: number, currentDueDate: string) => {
    try {
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + 7); // Perpanjang 7 hari

      await supabase
        .from('borrowings')
        .update({
          due_date: newDueDate.toISOString(),
          extend_count: 1
        })
        .eq('id', borrowingId);
      
      alert('Peminjaman berhasil diperpanjang 7 hari!');
      if (user) fetchBorrowings(user.id);
    } catch (error: any) {
      alert('Gagal memperpanjang peminjaman: ' + error.message);
    }
  };

  const handleReturnRequest = async (loanId: number) => {
    if (!confirm('Ajukan pengembalian buku ini?')) return;
    try {
      const { error } = await supabase.from('borrowings')
        .update({ status: 'Pending_Return' })
        .eq('id', loanId);
      if (error) throw error;
      alert('Pengajuan pengembalian berhasil dikirim.');
      if (user) fetchBorrowings(user.id);
    } catch (err: any) {
      alert('Gagal mengajukan pengembalian: ' + err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateStr));
  };

  const getStatusBadge = (borrowing: any) => {
    if (borrowing.status === 'Returned') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Dikembalikan</span>;
    }
    if (borrowing.status === 'Pending_Borrow') {
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Menunggu Approval</span>;
    }
    if (borrowing.status === 'Pending_Return') {
      return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Proses Kembali</span>;
    }
    if (borrowing.status === 'Rejected') {
      return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" /> Ditolak</span>;
    }
    
    if (borrowing.due_date) {
      const due = new Date(borrowing.due_date);
      const now = new Date();
      if (now > due) {
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" /> Terlambat</span>;
      }
    }
    
    return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Sedang Dipinjam</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative min-h-screen pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C4A]">Catatan Peminjaman</h1>
          <p className="text-gray-500 mt-1">Pantau buku yang sedang atau pernah Anda pinjam di sini.</p>
        </div>
        {userRole === 'admin' && (
          <button 
            onClick={() => setShowAdminLoans(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-primary shadow-sm transition-colors group"
          >
            <Clock className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" /> Data Peminjaman
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Buku</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Kode Item</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Tanggal Request</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">Batas Kembali</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    Memuat catatan...
                  </td>
                </tr>
              ) : borrowings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    Belum ada catatan peminjaman.
                  </td>
                </tr>
              ) : (
                borrowings.map((b) => {
                  const book = b.books;
                  
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden shrink-0 flex items-center justify-center">
                            {book?.cover_url ? (
                              <img src={book.cover_url} alt={book?.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="text-left">
                            <span className="font-semibold text-gray-900 line-clamp-2 max-w-[200px]">{book?.title}</span>
                            <div className="mt-2 text-xs text-gray-500">Token Antrian: <span className="font-mono font-medium text-gray-800">{b.generated_token || '-'}</span></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{book?.item_code || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(b.borrow_date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.status === 'Pending_Borrow' || b.status === 'Rejected' ? '-' : formatDate(b.due_date)}</td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(b)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {b.status === 'Borrowed' && (
                          <button 
                            onClick={() => handleReturnRequest(b.id)}
                            className="text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Kembalikan
                          </button>
                        )}
                        {b.status === 'Pending_Return' && (
                          <span className="text-xs text-gray-400">Proses Kembali</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {showAdminLoans && (
        <AdminLoansModal onClose={() => setShowAdminLoans(false)} />
      )}
    </div>
  );
}
