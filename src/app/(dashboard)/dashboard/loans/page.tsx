'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { History, BookOpen, Loader2, CheckCircle2, Ticket, Calendar, Clock, User, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function LoansPage() {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [borrowReceipt, setBorrowReceipt] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchBorrowings(data.user.id);
      } else {
        setLoading(false);
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

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'Returned') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Pending_Borrow') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'Pending_Return') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (status === 'Rejected') return 'bg-gray-100 text-gray-700 border-gray-200';
    if (new Date(dueDate) < new Date()) return 'bg-red-100 text-red-700 border-red-200'; // Overdue
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'Returned') return 'Dikembalikan';
    if (status === 'Pending_Borrow') return 'Menunggu Approval';
    if (status === 'Pending_Return') return 'Proses Kembali';
    if (status === 'Rejected') return 'Ditolak';
    if (new Date(dueDate) < new Date()) return 'Terlambat';
    return 'Dipinjam';
  };

  const pendingBorrowLoans = borrowings.filter(b => b.status === 'Pending_Borrow');
  const activeLoans = borrowings.filter(b => b.status === 'Borrowed');
  const pendingReturnLoans = borrowings.filter(b => b.status === 'Pending_Return');
  const pastLoans = borrowings.filter(b => b.status === 'Returned' || b.status === 'Rejected');

  const renderLoanGroup = (title: string, icon: React.ReactNode, loans: any[], isPast = false) => {
    if (loans.length === 0) return null;
    return (
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          {icon} {title} ({loans.length})
        </h2>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isPast ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}`}>
          {loans.map((loan) => (
            <div key={loan.id} className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${isPast ? 'bg-gray-50 grayscale-[30%]' : ''}`}>
              <div className="flex gap-4">
                <div className="w-16 h-24 bg-gray-100 rounded-lg shrink-0 overflow-hidden border border-gray-100">
                  {loan.books.cover_url ? (
                    <img src={loan.books.cover_url} alt={loan.books.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-6 h-6 text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{loan.books.title}</h3>
                  <div className="mb-2">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Token Antrian</p>
                    <p className="font-mono font-bold text-gray-700 text-sm">{loan.generated_token || '-'}</p>
                  </div>
                  
                  <div className="mt-auto space-y-1">
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" /> Req: {new Date(loan.borrow_date).toLocaleDateString('id-ID')}
                    </p>
                    {(loan.status === 'Borrowed' || loan.status === 'Pending_Return') && (
                       <p className="text-xs text-gray-600 flex items-center gap-1.5">
                         <Clock className="w-3 h-3 text-orange-400" /> Tgt: {new Date(loan.due_date).toLocaleDateString('id-ID')}
                       </p>
                    )}
                    {(loan.status === 'Returned' && loan.return_date) && (
                       <p className="text-xs text-gray-600 flex items-center gap-1.5">
                         <CheckCircle2 className="w-3 h-3 text-green-400" /> Kmb: {new Date(loan.return_date).toLocaleDateString('id-ID')}
                       </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getStatusColor(loan.status, loan.due_date)}`}>
                  {getStatusText(loan.status, loan.due_date)}
                </span>
                
                <div className="flex items-center gap-2">
                  {loan.status === 'Borrowed' && (
                    <button 
                      onClick={() => handleReturnRequest(loan.id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Kembalikan
                    </button>
                  )}
                  <button 
                    onClick={() => setBorrowReceipt({
                      book: loan.books,
                      loan: loan,
                      borrowDate: new Date(loan.borrow_date),
                      dueDate: new Date(loan.due_date),
                      user: user
                    })}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Ticket className="w-4 h-4" /> Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative min-h-screen pb-12">
      {/* Background Dasar Custom */}
      <div className="fixed inset-0 bg-[#a8caca] -z-10 pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C4A]">Catatan Peminjaman</h1>
          <p className="text-gray-500 mt-1">Lacak riwayat buku yang Anda pinjam dan tenggat waktunya.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p>Memuat catatan peminjaman...</p>
          </div>
        ) : borrowings.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <History className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Belum Ada Peminjaman</h3>
            <p className="text-gray-500 mb-6 max-w-sm">Anda belum meminjam buku apapun. Ayo mulai eksplorasi perpustakaan kami!</p>
            <Link href="/dashboard/books" className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-hover transition-colors">
              Cari Buku Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {renderLoanGroup("Menunggu Persetujuan Pinjam", <Clock className="w-5 h-5 text-amber-500" />, pendingBorrowLoans)}
            {renderLoanGroup("Sedang Dipinjam", <BookOpen className="w-5 h-5 text-blue-500" />, activeLoans)}
            {renderLoanGroup("Menunggu Konfirmasi Kembali", <History className="w-5 h-5 text-purple-500" />, pendingReturnLoans)}
            {renderLoanGroup("Selesai (Riwayat)", <CheckCircle2 className="w-5 h-5 text-green-500" />, pastLoans, true)}
          </div>
        )}
      </div>

      {/* Cinema Ticket Borrowing Receipt Modal */}
      {borrowReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto" onClick={() => setBorrowReceipt(null)}>
          <div className="relative animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            {/* The Ticket Container */}
            <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full">
              
              {/* Main Ticket Section */}
              <div className="p-6 sm:p-8 flex-1 relative bg-gradient-to-br from-white to-gray-50 border-r-0 sm:border-r-2 border-dashed border-gray-300">
                {/* Decorative cutouts for the dashed line */}
                <div className="hidden sm:block absolute -top-3 -right-3 w-6 h-6 bg-black rounded-full"></div>
                <div className="hidden sm:block absolute -bottom-3 -right-3 w-6 h-6 bg-black rounded-full"></div>
                
                <div className="flex items-center gap-2 mb-6">
                  <Ticket className="w-6 h-6 text-primary" />
                  <span className="font-mono text-sm tracking-widest text-primary font-bold">LIBRARY TICKET</span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{borrowReceipt.book.title}</h2>
                <p className="text-sm text-gray-500 mb-6">{borrowReceipt.book.author || 'Penulis Tidak Diketahui'}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Token Pinjaman</p>
                    <div className="flex items-center gap-2 text-gray-800 font-semibold font-mono">
                      {borrowReceipt.loan?.token || '-'}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Tenggat Kembali</p>
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {borrowReceipt.dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="col-span-2 mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Peminjam</p>
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <User className="w-4 h-4 text-green-500" />
                      {borrowReceipt.user.email}
                    </div>
                  </div>

                  <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-3">Tracing Aktivitas</p>
                    <div className="relative border-l-2 border-gray-100 ml-2 space-y-4 pb-2">
                      
                      {/* Req Pinjam */}
                      <div className="relative pl-4">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                        <p className="text-xs font-bold text-gray-900">Pengajuan Peminjaman</p>
                        <p className="text-[10px] text-gray-500">{new Date(borrowReceipt.borrowDate).toLocaleString('id-ID')}</p>
                      </div>

                      {/* Approved */}
                      {borrowReceipt.loan?.approved_at && (
                        <div className="relative pl-4">
                          <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                          <p className="text-xs font-bold text-gray-900">Disetujui Admin</p>
                          <p className="text-[10px] text-gray-500">{new Date(borrowReceipt.loan.approved_at).toLocaleString('id-ID')}</p>
                        </div>
                      )}

                      {/* Return Req */}
                      {borrowReceipt.loan?.return_request_at && (
                        <div className="relative pl-4">
                          <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                          <p className="text-xs font-bold text-gray-900">Pengajuan Kembali</p>
                          <p className="text-[10px] text-gray-500">{new Date(borrowReceipt.loan.return_request_at).toLocaleString('id-ID')}</p>
                        </div>
                      )}

                      {/* Returned */}
                      {borrowReceipt.loan?.return_date && (
                        <div className="relative pl-4">
                          <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                          <p className="text-xs font-bold text-gray-900">Selesai & Buku Dikembalikan</p>
                          <p className="text-[10px] text-gray-500">{new Date(borrowReceipt.loan.return_date).toLocaleString('id-ID')}</p>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Stub Section */}
              <div className="p-6 sm:p-8 w-full sm:w-56 bg-gray-50 flex flex-col justify-between relative border-t-2 sm:border-t-0 border-dashed border-gray-300">
                {/* Decorative cutouts for mobile */}
                <div className="block sm:hidden absolute -left-3 -top-3 w-6 h-6 bg-black rounded-full"></div>
                <div className="block sm:hidden absolute -right-3 -top-3 w-6 h-6 bg-black rounded-full"></div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold text-center mb-1">Kode Item</p>
                  <p className="font-mono text-lg font-bold text-center text-gray-900 mb-4">{borrowReceipt.book.item_code}</p>
                  
                  {/* Fake Barcode using CSS */}
                  <div className="flex justify-center h-16 w-full opacity-60 px-4">
                     <div className="w-1 bg-black h-full mx-[1px]"></div>
                     <div className="w-2 bg-black h-full mx-[1px]"></div>
                     <div className="w-1 bg-black h-full mx-[1px]"></div>
                     <div className="w-3 bg-black h-full mx-[1px]"></div>
                     <div className="w-1 bg-black h-full mx-[1px]"></div>
                     <div className="w-2 bg-black h-full mx-[1px]"></div>
                     <div className="w-4 bg-black h-full mx-[1px]"></div>
                     <div className="w-1 bg-black h-full mx-[1px]"></div>
                     <div className="w-2 bg-black h-full mx-[1px]"></div>
                     <div className="w-1 bg-black h-full mx-[1px]"></div>
                     <div className="w-2 bg-black h-full mx-[1px]"></div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setBorrowReceipt(null)}
                  className="mt-6 w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-colors shadow-md"
                >
                  Selesai
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
