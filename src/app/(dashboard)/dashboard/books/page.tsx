'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Search, Filter, BookmarkPlus, Loader2, ShoppingCart, CheckCircle2, BookmarkCheck, X, Check, Plus, Ticket, Calendar, Clock, User, Trash2, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserBooksCatalog() {
  const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [userBorrowings, setUserBorrowings] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [borrowReceipt, setBorrowReceipt] = useState<any>(null);
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedCheckoutIds, setSelectedCheckoutIds] = useState<number[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchUserBorrowings(data.user.id);
        fetchWishlist(data.user.id);
        supabase.from('profiles').select('role').eq('id', data.user.id).single().then(({ data: profileData }) => {
          if (profileData) setUserRole(profileData.role);
        });
      }
    });
  }, []);

  const fetchUserBorrowings = async (userId: string) => {
    const { data } = await supabase
      .from('borrowings')
      .select('book_id')
      .eq('user_id', userId)
      .in('status', ['Borrowed', 'Pending_Borrow', 'Pending_Return']);
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
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
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
      if (!wishlistIds.includes(book.id)) {
        await supabase.from('wishlists').insert({ user_id: user.id, book_id: book.id });
        await fetchWishlist(user.id);
      }
      
      setShowCart(true);
    } catch (error: any) {
      alert('Gagal melanjutkan proses pinjam: ' + error.message);
    }
  }

  async function handleReturn(book: any) {
    if (!user) return;
    try {
      await supabase.from('borrowings')
        .update({ status: 'Pending_Return', return_request_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .eq('status', 'Borrowed');

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
      alert('Gagal mengupdate wishlist: ' + error.message);
    }
  }

  async function removeFromWishlist(bookId: number) {
    if (!user) return;
    try {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('book_id', bookId);
      fetchWishlist(user.id);
    } catch (error: any) {
      alert('Gagal menghapus: ' + error.message);
    }
  }

  async function handleCheckout() {
    if (!user || selectedCheckoutIds.length === 0) return;
    setIsCheckingOut(true);

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // Default 14 hari pinjam

      for (const book of wishlist) {
        if (selectedCheckoutIds.includes(book.id) && (book.stok_tersedia ?? 1) > 0) {
          const token = "TKN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          await supabase.from('borrowings').insert({
            book_id: book.id,
            user_id: user.id,
            status: 'Pending_Borrow',
            due_date: dueDate.toISOString(),
            extend_count: 0
          });
          await supabase.from('books').update({
            stok_tersedia: (book.stok_tersedia ?? 1) - 1,
            stok_dipinjam: (book.stok_dipinjam ?? 0) + 1
          }).eq('id', book.id);
          
          await supabase.from('wishlists').delete().eq('user_id', user.id).eq('book_id', book.id);
        }
      }
      
      setSelectedCheckoutIds([]);
      
      fetchWishlist(user.id);
      fetchBooks();
      fetchUserBorrowings(user.id);
      setShowCart(false);
      alert('Permintaan pinjaman berhasil dikirim! Menunggu persetujuan Admin.');
    } catch (error: any) {
      alert('Gagal checkout: ' + error.message);
    } finally {
      setIsCheckingOut(false);
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
    <div className="max-w-[1600px] mx-auto relative min-h-screen pb-12 px-4 sm:px-8">
      {/* Container for Layout */}
      <div className="flex flex-col lg:flex-row gap-8 mt-6">
        
        {/* Left Sidebar (Filters) */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          {/* Kategori Filter (Static UI) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Kategori</h3>
            <div className="space-y-3">
              {['Sains & Teknologi', 'Ilmu Sosial', 'Bahasa & Sastra', 'Seni & Budaya'].map((cat, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center group-hover:border-primary transition-colors"></div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ketersediaan Filter (Static UI) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Ketersediaan</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 border border-primary rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <span className="text-sm text-gray-900 font-medium">Tersedia Sekarang</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 border border-gray-300 rounded-full flex items-center justify-center group-hover:border-primary transition-colors"></div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900">Semua Buku</span>
              </label>
            </div>
          </div>

          {/* Format Filter (Static UI) */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Format</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200">E-Book</span>
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200">Fisik</span>
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-200">Audiobook</span>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#0B2C4A]">Jelajahi Perpustakaan</h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">Temukan ribuan sumber belajar untuk mendukung perjalanan akademikmu.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm text-gray-800 placeholder-gray-400 transition-all shadow-sm"
                  placeholder="Cari judul, penulis, atau ISBN..."
                />
              </div>
              <button 
                onClick={() => setShowCart(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-primary shadow-sm transition-colors group relative"
              >
                <Heart className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" /> Wishlist
                {wishlist.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {wishlist.length}
                  </span>
                )}
              </button>
              {userRole === 'admin' && (
                <Link 
                  href="/admin/books"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-primary shadow-sm transition-colors group"
                >
                  <BookOpen className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" /> Data Buku
                </Link>
              )}
            </div>
          </div>

          {/* Main Book Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p>Memuat koleksi buku...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-20 text-gray-400 italic bg-white rounded-2xl border border-gray-100 shadow-sm">
                Buku tidak ditemukan. Coba cari dengan kata kunci lain.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {currentBooks.map((book) => (
                    <div key={book.id} className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      
                      {/* Image Container */}
                      <div className="relative aspect-[3/4] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <BookOpen className="w-12 h-12 text-gray-300" />
                        )}
                        

                      </div>
                      
                      {/* Card Body */}
                      <div className="p-3.5 flex flex-col flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            {book.coll_type_name || 'Buku'}
                          </span>

                        </div>

                        <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedBook(book)}>
                          {book.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4 truncate">
                          {book.author || 'Penulis Tidak Diketahui'}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="mt-auto flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedBook(book)}
                            className="flex-1 py-1.5 border-2 border-primary/20 text-primary rounded-lg text-xs font-bold hover:bg-primary/5 transition-colors"
                          >
                            Lihat Detail
                          </button>
                          
                          {(book.stok_tersedia ?? 1) > 0 ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleWishlist(book); }}
                              className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors shadow-sm ${
                                wishlistIds.includes(book.id) 
                                  ? 'bg-red-500 text-white hover:bg-red-600 border border-transparent' 
                                  : 'bg-white text-gray-400 border border-gray-200 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${wishlistIds.includes(book.id) ? 'fill-current' : ''}`} />
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="w-8 h-8 shrink-0 bg-gray-200 text-gray-400 rounded-lg flex items-center justify-center cursor-not-allowed shadow-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed bg-white transition-all shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    
                    <div className="flex gap-2">
                      {getVisiblePages().map((page, i) => (
                        <button
                          key={i}
                          onClick={() => typeof page === 'number' && setCurrentPage(page)}
                          disabled={page === '...'}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm ${
                            currentPage === page 
                              ? 'bg-orange-700 text-white' 
                              : page === '...'
                              ? 'text-gray-400 cursor-default bg-transparent shadow-none'
                              : 'bg-white border border-gray-200 text-gray-600 hover:text-orange-700 hover:border-orange-700'
                          } flex items-center justify-center`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-primary hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed bg-white transition-all shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                )}
                
                {/* Trending Section */}
                <div className="mt-12 mb-4">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Trending di Komunitas</h2>
                      <p className="text-sm text-gray-500 mt-1">Buku yang paling banyak didiskusikan minggu ini.</p>
                    </div>
                    <button className="text-sm font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1 group">
                      Lihat Semua <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dummy Trending Card 1 */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-all cursor-pointer">
                      <div className="w-20 h-28 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center shadow-sm overflow-hidden">
                         <BookOpen className="w-8 h-8 text-gray-300" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">#1 Hot</span>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-300 rounded-full border border-white"></div>
                            <div className="w-3 h-3 bg-gray-400 rounded-full border border-white -ml-1.5"></div>
                            <span className="text-[10px] text-gray-500 font-medium ml-1">+120 orang membaca</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">Biologi Molekuler Modern</h3>
                        <p className="text-xs text-gray-500 italic">"Sangat relevan untuk praktikum semester ini!"</p>
                      </div>
                    </div>
                    
                    {/* Dummy Trending Card 2 */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-all cursor-pointer">
                      <div className="w-20 h-28 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center shadow-sm overflow-hidden">
                         <BookOpen className="w-8 h-8 text-gray-300" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded">#2 Rising</span>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-gray-300 rounded-full border border-white"></div>
                            <div className="w-3 h-3 bg-gray-400 rounded-full border border-white -ml-1.5"></div>
                            <span className="text-[10px] text-gray-500 font-medium ml-1">+85 orang meminjam</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">Ekonomi Kreatif Desa</h3>
                        <p className="text-xs text-gray-500 italic">"Wajib baca untuk mahasiswa pengabdian."</p>
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        </div>
      </div>


      {/* Shopee-style Product Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={() => setSelectedBook(null)}>
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

                
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {selectedBook.title}
                </h2>
                
                <div className="text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100 flex items-center divide-x divide-gray-300">
                  <span className="pr-3">Oleh <span className="font-semibold text-primary">{selectedBook.author || 'Tidak Diketahui'}</span></span>
                  <span className="px-3">Kode: <span className="font-mono text-gray-700">{selectedBook.item_code}</span></span>
                  <span className="pl-3 font-mono text-gray-700 uppercase">{selectedBook.coll_type_name || 'Buku'}</span>
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
                      <Heart className={`w-5 h-5 ${wishlistIds.includes(selectedBook.id) ? 'fill-current' : ''}`} />
                      {wishlistIds.includes(selectedBook.id) ? "Hapus dari Wishlist" : "Masukkan Wishlist"}
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto" onClick={() => setBorrowReceipt(null)}>
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



      {/* Cart Modal / Drawer */}
      {showCart && (
        <div className="fixed inset-0 top-16 z-[90] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowCart(false)}>
          <div 
            className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">

                <div>
                  <h2 className="text-xl font-bold text-gray-900">Wishlist</h2>
                  <p className="text-sm text-gray-500">{wishlist.length} buku dipilih</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCart(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <Heart className="w-10 h-10 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Wishlist Kosong</h3>
                    <p className="text-gray-500 text-sm mt-1">Belum ada buku yang dipilih untuk dipinjam.</p>
                  </div>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="mt-2 text-primary font-bold text-sm hover:underline"
                  >
                    Mulai Eksplorasi
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-2 pb-3 border-b border-gray-200 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedCheckoutIds.length === wishlist.length && wishlist.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCheckoutIds(wishlist.map(b => b.id));
                          } else {
                            setSelectedCheckoutIds([]);
                          }
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 font-bold group-hover:text-primary transition-colors">Pilih Semua</span>
                    </label>
                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">{selectedCheckoutIds.length} dipilih</span>
                  </div>
                  {wishlist.map((book) => (
                    <div key={book.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm relative group">
                      <input 
                        type="checkbox"
                        checked={selectedCheckoutIds.includes(book.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCheckoutIds(prev => [...prev, book.id]);
                          } else {
                            setSelectedCheckoutIds(prev => prev.filter(id => id !== book.id));
                          }
                        }}
                        className="w-5 h-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <div className="w-16 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{book.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{book.author || 'Penulis Tidak Diketahui'}</p>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                            (book.stok_tersedia ?? 1) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            Stok: {book.stok_tersedia ?? 1}
                          </span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => removeFromWishlist(book.id)}
                        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {wishlist.length > 0 && (
              <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600 font-medium">Total Pinjaman</span>
                  <span className="text-lg font-bold text-gray-900">{selectedCheckoutIds.length} Buku</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut || selectedCheckoutIds.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3.5 px-6 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
                >
                  {isCheckingOut ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                  ) : (
                    <>Pinjam Sekarang <CheckCircle2 className="w-5 h-5" /></>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Tenggat peminjaman 14 hari
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
