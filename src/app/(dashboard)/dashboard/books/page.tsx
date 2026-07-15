'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Search, Filter, BookmarkPlus, Loader2, ShoppingCart, CheckCircle2, BookmarkCheck, X, Check, Plus, Ticket, Calendar, Clock, User } from 'lucide-react';
import Link from 'next/link';

import BooksNavigation from '@/components/BooksNavigation';

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
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [borrowReceipt, setBorrowReceipt] = useState<any>(null);

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
      
      setBorrowReceipt({
        book,
        borrowDate: new Date(),
        dueDate,
        user
      });
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
    <div className="space-y-6 max-w-7xl mx-auto relative min-h-screen pb-12">
      <BooksNavigation />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C4A]">Sirkulasi Buku</h1>
          <p className="text-gray-500 mt-1">Temukan buku favoritmu dan ajukan peminjaman.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-end bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
              placeholder="Cari judul buku..."
            />
          </div>
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
                <div key={book.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => setSelectedBook(book)}>
                  <div className="relative aspect-[3/4] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <BookOpen className="w-12 h-12 text-gray-300" />
                    )}
                    
                    <div className="absolute top-2 right-2 z-10">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold shadow-sm backdrop-blur-md ${
                        (book.stok_tersedia ?? 1) > 0 ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
                      }`}>
                        {(book.stok_tersedia ?? 1) > 0 ? `Stok: ${book.stok_tersedia}` : 'Habis'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 mb-4 truncate">
                      {book.author || 'Penulis Tidak Diketahui'}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      {userBorrowings.includes(book.id) ? (
                        <button 
                          onClick={() => handleReturn(book)}
                          className="flex-1 flex items-center justify-center gap-1 bg-orange-500 text-white py-2 rounded-xl hover:bg-orange-600 transition-colors shadow-sm text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Dikembalikan
                        </button>
                      ) : (book.stok_tersedia ?? 1) > 0 ? (
                        <>
                          <button 
                            onClick={() => handleBorrow(book)}
                            className="flex-1 flex items-center justify-center gap-1 bg-primary text-white py-2 rounded-xl hover:bg-primary-hover transition-colors shadow-sm text-xs font-semibold"
                          >
                            Pinjam
                          </button>
                          <button 
                            onClick={() => toggleWishlist(book)}
                            title={wishlistIds.includes(book.id) ? "Hapus dari Keranjang" : "Tambah ke Keranjang"}
                            className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl border transition-colors ${
                              wishlistIds.includes(book.id) 
                                ? 'bg-primary border-primary text-white' 
                                : 'bg-white border-gray-200 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <ShoppingCart className={`w-4 h-4 ${wishlistIds.includes(book.id) ? 'fill-current' : ''}`} />
                          </button>
                        </>
                      ) : (
                        <button disabled className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-400 py-2 rounded-xl cursor-not-allowed shadow-sm text-xs font-semibold">
                          <X className="w-4 h-4" /> Habis
                        </button>
                      )}
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


      {/* Shopee-style Product Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedBook(null)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative my-auto animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedBook(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            {/* Left Side: Cover Image */}
            <div className="w-full md:w-2/5 bg-gray-50 p-6 flex flex-col items-center justify-center border-r border-gray-100 min-h-[300px]">
              <div className="relative w-full max-w-[240px] aspect-[3/4] bg-white rounded-lg shadow-md overflow-hidden flex items-center justify-center">
                {selectedBook.cover_url ? (
                  <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-16 h-16 text-gray-300" />
                )}
              </div>
            </div>
            
            {/* Right Side: Details & Actions */}
            <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {selectedBook.coll_type_name || 'Buku'}
                  </span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {selectedBook.item_status_name || 'Available'}
                  </span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {selectedBook.title}
                </h2>
                
                <div className="text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100 flex items-center divide-x divide-gray-300">
                  <span className="pr-3">Oleh <span className="font-semibold text-primary">{selectedBook.author || 'Tidak Diketahui'}</span></span>
                  <span className="px-3">Kode: <span className="font-mono text-gray-700">{selectedBook.item_code}</span></span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase font-semibold mb-1">Stok Tersedia</p>
                    <p className="text-lg font-bold text-green-600">{selectedBook.stok_tersedia ?? 0} <span className="text-sm font-medium text-gray-500">Buku</span></p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase font-semibold mb-1">Lokasi Rak</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedBook.location_name || '-'}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">Call: {selectedBook.call_number || '-'}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Deskripsi Buku</h3>
                  <div className="text-gray-600 text-sm leading-relaxed max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedBook.description ? (
                      <p className="whitespace-pre-line">{selectedBook.description}</p>
                    ) : (
                      <p className="italic text-gray-400">Deskripsi tidak tersedia untuk buku ini.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Shopee Style Bottom Fixed/Relative) */}
              <div className="mt-auto pt-4 flex items-center gap-3">
                {userBorrowings.includes(selectedBook.id) ? (
                  <button 
                    onClick={() => handleReturn(selectedBook)}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3.5 px-6 rounded-xl hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Kembalikan Buku
                  </button>
                ) : (selectedBook.stok_tersedia ?? 1) > 0 ? (
                  <>
                    <button 
                      onClick={() => toggleWishlist(selectedBook)}
                      className={`flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border-2 transition-all font-bold ${
                        wishlistIds.includes(selectedBook.id) 
                          ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' 
                          : 'bg-white border-primary text-primary hover:bg-primary/5'
                      }`}
                    >
                      <ShoppingCart className={`w-5 h-5 ${wishlistIds.includes(selectedBook.id) ? 'fill-current' : ''}`} />
                      {wishlistIds.includes(selectedBook.id) ? "Hapus dari Keranjang" : "Masukkan Keranjang"}
                    </button>
                    <button 
                      onClick={() => {
                        handleBorrow(selectedBook);
                        setSelectedBook(null); // Auto close on borrow
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3.5 px-6 rounded-xl hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 font-bold"
                    >
                      Pinjam Sekarang
                    </button>
                  </>
                ) : (
                  <button disabled className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-500 py-3.5 px-6 rounded-xl cursor-not-allowed font-bold">
                    <X className="w-5 h-5" /> Stok Habis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Tgl Pinjam</p>
                    <div className="flex items-center gap-2 text-gray-800 font-semibold">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {borrowReceipt.borrowDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
