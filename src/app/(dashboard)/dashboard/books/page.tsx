'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Search, Filter, BookmarkPlus, Loader2, ShoppingCart, CheckCircle2, BookmarkCheck, X, Check, Plus } from 'lucide-react';
import Link from 'next/link';

export default function UserBooksCatalog() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  
  const [user, setUser] = useState<any>(null);
  const [userBorrowings, setUserBorrowings] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchUserBorrowings(data.user.id);
        fetchWishlist(data.user.id);
      }
    });
  }, []);

  const fetchUserBorrowings = async (userId: string) => {
    const { data } = await supabase
      .from('borrowings')
      .select('book_id')
      .eq('user_id', userId)
      .eq('status', 'Borrowed');
    if (data) {
      setUserBorrowings(data.map(b => b.book_id));
    }
  };

  const fetchWishlist = async (userId: string) => {
    const { data, error } = await supabase
      .from('wishlists')
      .select('book_id, books(*)')
      .eq('user_id', userId);
    
    if (data) {
      setWishlist(data.map(w => w.books));
      setWishlistIds(data.map(w => w.book_id));
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    let query = supabase.from('books').select('*').order('created_at', { ascending: false });
    
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setBooks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
    setCurrentPage(1);
  }, [search]);

  async function handleBorrow(book: any) {
    if (!user) return alert('Silakan login terlebih dahulu');
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

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
      
      fetchBooks();
      fetchUserBorrowings(user.id);
    } catch (error: any) {
      alert('Gagal meminjam: ' + error.message);
    }
  }

  async function handleReturn(book: any) {
    if (!user) return;
    try {
      await supabase.from('borrowings')
        .update({ status: 'Returned', return_date: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .eq('status', 'Borrowed');
        
      await supabase.from('books').update({
        stok_tersedia: (book.stok_tersedia ?? 1) + 1,
        stok_dipinjam: (book.stok_dipinjam ?? 0) - 1
      }).eq('id', book.id);

      fetchBooks();
      fetchUserBorrowings(user.id);
    } catch (error: any) {
      alert('Gagal mengembalikan: ' + error.message);
    }
  }

  async function toggleWishlist(book: any) {
    if (!user) return alert('Silakan login terlebih dahulu');
    
    try {
      if (wishlistIds.includes(book.id)) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('book_id', book.id);
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, book_id: book.id });
      }
      fetchWishlist(user.id);
    } catch (error: any) {
      alert('Gagal mengupdate keranjang: ' + error.message);
    }
  }

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE);
  const currentBooks = books.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getVisiblePages = () => {
    if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C4A]">Sirkulasi Buku</h1>
          <p className="text-gray-500 mt-1">Temukan buku favoritmu dan ajukan peminjaman.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
              placeholder="Cari judul buku yang ingin kamu pinjam..."
            />
          </div>
          
          <Link 
            href="/dashboard/books/wishlist"
            className="relative bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
          >
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm">Keranjang</span>
            {wishlist.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce group-hover:animate-none">
                {wishlist.length}
              </span>
            )}
          </Link>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Memuat koleksi buku...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic">
              Buku tidak ditemukan. Coba cari dengan kata kunci lain.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {currentBooks.map((book) => (
                <div key={book.id} className="group relative flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative aspect-[3/4] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-12 h-12 text-gray-300" />
                    )}
                    
                    {/* Hover Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                      {userBorrowings.includes(book.id) ? (
                        <button 
                          onClick={() => handleReturn(book)}
                          className="px-4 py-2 w-32 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 hover:scale-105 transition-transform shadow-lg text-xs"
                        >
                          Kembalikan
                        </button>
                      ) : (book.stok_tersedia ?? 1) > 0 ? (
                        <>
                          <button 
                            onClick={() => handleBorrow(book)}
                            className="px-4 py-2 w-32 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 hover:scale-105 transition-transform shadow-lg text-xs"
                          >
                            Pinjam Langsung
                          </button>
                          <button 
                            onClick={() => toggleWishlist(book)}
                            className={`px-4 py-2 w-32 border-2 font-medium rounded-xl hover:scale-105 transition-all shadow-lg text-xs flex items-center justify-center gap-1 ${
                              wishlistIds.includes(book.id) 
                                ? 'bg-white/20 border-white text-white' 
                                : 'bg-transparent border-white text-white hover:bg-white/20'
                            }`}
                          >
                            {wishlistIds.includes(book.id) ? (
                              <><Check className="w-3 h-3" /> Di Keranjang</>
                            ) : (
                              <><Plus className="w-3 h-3" /> Keranjang</>
                            )}
                          </button>
                        </>
                      ) : (
                        <button disabled className="px-4 py-2 w-32 bg-gray-500 text-gray-300 font-medium rounded-xl cursor-not-allowed text-xs">
                          Stok Habis
                        </button>
                      )}
                    </div>
                    
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-sm backdrop-blur-md ${
                        (book.stok_tersedia ?? 1) > 0 ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                      }`}>
                        {(book.stok_tersedia ?? 1) > 0 ? `Stok: ${book.stok_tersedia}` : 'Habis'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <div className="mt-auto space-y-1">
                      <p className="text-[11px] text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                        {book.item_code}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate" title={book.location_name}>
                        Rak: {book.location_name || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  
                  <div className="flex gap-1">
                    {getVisiblePages().map((page, i) => (
                      <button
                        key={i}
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        disabled={page === '...'}
                        className={`min-w-[36px] h-9 px-2 rounded-sm text-sm transition-colors ${
                          currentPage === page 
                            ? 'bg-blue-600 text-white font-bold' 
                            : page === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-600 hover:text-blue-600 font-medium'
                        } flex items-center justify-center`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>


    </div>
  );
}
