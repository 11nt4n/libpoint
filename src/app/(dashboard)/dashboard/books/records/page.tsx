'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Loader2, ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RecordsPage() {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchBorrowings(data.user.id);
      }
    });
  }, []);

  const fetchBorrowings = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('borrowings')
      .select('*, books(*)')
      .eq('user_id', userId)
      .order('borrow_date', { ascending: false });
    
    if (data) {
      setBorrowings(data);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/books" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C4A]">Catatan Peminjaman</h1>
          <p className="text-gray-500 mt-1">Pantau buku yang sedang atau pernah Anda pinjam di sini.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Buku</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Kode Item</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Tanggal Pinjam</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Batas Kembali</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-gray-100 rounded overflow-hidden shrink-0">
                            {book?.cover_url ? (
                              <img src={book.cover_url} alt={book?.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-gray-300" /></div>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900 line-clamp-2 max-w-[200px]">{book?.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{book?.item_code || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(b.borrow_date)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatDate(b.due_date)}</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(b)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
