'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Loader2, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchWishlist(data.user.id);
      }
    });
  }, []);

  const fetchWishlist = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlists')
      .select('book_id, books(*)')
      .eq('user_id', userId);
    
    if (data) {
      setWishlist(data.map(w => w.books));
    }
    setLoading(false);
  };

  async function handleRemove(bookId: number) {
    if (!user) return;
    try {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('book_id', bookId);
      fetchWishlist(user.id);
    } catch (error: any) {
      alert('Gagal menghapus dari keranjang: ' + error.message);
    }
  }

  async function handleCheckoutAll() {
    if (!user || wishlist.length === 0) return;
    setIsCheckingOut(true);

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // Default 14 hari pinjam

      for (const book of wishlist) {
        const { data: currentBook } = await supabase.from('books').select('stok_tersedia').eq('id', book.id).single();
        if (currentBook && currentBook.stok_tersedia > 0) {
          await supabase.from('borrowings').insert({
            book_id: book.id,
            user_id: user.id,
            status: 'Borrowed',
            due_date: dueDate.toISOString(),
            extend_count: 0
          });
          await supabase.from('books').update({
            stok_tersedia: (book.stok_tersedia ?? 1) - 1,
            stok_dipinjam: (book.stok_dipinjam ?? 0) + 1
          }).eq('id', book.id);
        }
      }
      
      await supabase.from('wishlists').delete().eq('user_id', user.id);
      
      fetchWishlist(user.id);
      alert('Checkout berhasil! Semua buku yang tersedia telah dipinjam (Tenggat 14 Hari).');
    } catch (error: any) {
      alert('Gagal checkout: ' + error.message);
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/books" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C4A]">Keranjang Pinjam (Wishlist)</h1>
          <p className="text-gray-500 mt-1">Daftar buku yang ingin Anda pinjam.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Memuat keranjang...</p>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-4">
              <ShoppingCart className="w-16 h-16 text-gray-200" />
              <p>Keranjang masih kosong. Yuk cari buku di Katalog!</p>
              <Link href="/dashboard/books" className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors">
                Kembali ke Katalog
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map((book) => (
                <div key={book.id} className="flex gap-6 p-4 border rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-colors">
                  <div className="w-24 h-36 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col py-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-mono">{book.item_code}</p>
                    <p className="text-sm text-gray-500">Rak: {book.location_name || '-'}</p>
                    
                    <div className="mt-auto flex justify-between items-center">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        (book.stok_tersedia ?? 1) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        Stok Tersedia: {book.stok_tersedia ?? 1}
                      </span>
                      <button 
                        onClick={() => handleRemove(book.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {wishlist.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600 font-medium">Total Buku di Keranjang:</span>
              <span className="text-xl font-bold text-gray-900">{wishlist.length} Buku</span>
            </div>
            <button 
              onClick={handleCheckoutAll}
              disabled={isCheckingOut}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isCheckingOut ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Memproses Peminjaman...</>
              ) : (
                <><ShoppingCart className="w-5 h-5" /> Pinjam Semua Buku (Tenggat 14 Hari)</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
