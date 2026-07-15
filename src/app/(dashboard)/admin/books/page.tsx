'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Book, Plus, Search, Edit, Trash2, X, Loader2, Image as ImageIcon } from 'lucide-react';

export default function AdminBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editBookId, setEditBookId] = useState<number | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    description: '',
    item_code: '',
    item_status_name: 'Available',
    call_number: '',
    coll_type_name: 'Textbook',
    location_name: '',
    stok_tersedia: 1,
    stok_dipinjam: 0,
    cover_url: ''
  });

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchBooks();
  }, [search, currentPage]);

  async function fetchBooks() {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase.from('books').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,item_code.ilike.%${search}%`);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      setBooks(data || []);
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage) || 1);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBook(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let final_cover_url = newBook.cover_url;

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(filePath, coverFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('book-covers')
          .getPublicUrl(filePath);
          
        final_cover_url = publicUrlData.publicUrl;
      }

      const bookDataToSave = { ...newBook, cover_url: final_cover_url };

      if (editBookId) {
        const { error } = await supabase.from('books').update(bookDataToSave).eq('id', editBookId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('books').insert([bookDataToSave]);
        if (error) throw error;
      }
      
      setIsAddModalOpen(false);
      setEditBookId(null);
      setCoverFile(null);
      setNewBook({
        title: '',
        author: '',
        description: '',
        item_code: '',
        item_status_name: 'Available',
        call_number: '',
        coll_type_name: 'Textbook',
        location_name: '',
        stok_tersedia: 1,
        stok_dipinjam: 0,
        cover_url: ''
      });
      fetchBooks(); // Refresh data
    } catch (error: any) {
      alert('Gagal menyimpan buku: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openAddModal() {
    setEditBookId(null);
    setNewBook({
      title: '',
      author: '',
      description: '',
      item_code: '',
      item_status_name: 'Available',
      call_number: '',
      coll_type_name: 'Textbook',
      location_name: '',
      stok_tersedia: 1,
      stok_dipinjam: 0,
      cover_url: ''
    });
    setCoverFile(null);
    setIsAddModalOpen(true);
  }

  function openEditModal(book: any) {
    setEditBookId(book.id);
    setNewBook({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      item_code: book.item_code || '',
      item_status_name: book.item_status_name || 'Available',
      call_number: book.call_number || '',
      coll_type_name: book.coll_type_name || 'Textbook',
      location_name: book.location_name || '',
      stok_tersedia: book.stok_tersedia !== undefined ? book.stok_tersedia : 1,
      stok_dipinjam: book.stok_dipinjam || 0,
      cover_url: book.cover_url || ''
    });
    setCoverFile(null);
    setIsAddModalOpen(true);
  }

  async function handleDeleteBook(id: number) {
    if (!confirm('Apakah Anda yakin ingin menghapus buku ini?')) return;
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
      fetchBooks();
    } catch (error: any) {
      alert('Gagal menghapus buku: ' + error.message);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2C4A]">Sirkulasi Buku</h1>
          <p className="text-gray-500 mt-1">Kelola data buku yang tersedia di perpustakaan.</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden flex flex-col mt-4">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm text-gray-800 placeholder-gray-400 transition-all"
              placeholder="Cari judul buku atau kode eksemplar..."
            />
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Buku
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p>Memuat data katalog...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic">
              Belum ada data buku. Pastikan Anda sudah membuat tabel `books` di database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Sampul</th>
                    <th className="px-6 py-4">Judul Buku</th>
                    <th className="px-6 py-4">Kode Eksemplar</th>
                    <th className="px-6 py-4">Call Number</th>
                    <th className="px-6 py-4">Rak</th>
                    <th className="px-6 py-4">Stok</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {books.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 line-clamp-2 max-w-xs">{book.title}</div>
                        {book.author && <div className="text-xs text-gray-500 mt-1">{book.author}</div>}
                      </td>
                      <td className="px-6 py-4"><span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">{book.item_code}</span></td>
                      <td className="px-6 py-4"><span className="font-mono text-gray-600 text-xs">{book.call_number || '-'}</span></td>
                      <td className="px-6 py-4 text-gray-600">{book.location_name || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold w-fit ${
                            (book.stok_tersedia ?? 1) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            Tersedia: {book.stok_tersedia ?? 0}
                          </span>
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold w-fit bg-orange-100 text-orange-700">
                            Dipinjam: {book.stok_dipinjam ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEditModal(book)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Buku"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBook(book.id)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Hapus Buku"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
          <span className="text-sm text-gray-500">
            Halaman <span className="font-semibold text-gray-900">{currentPage}</span> dari <span className="font-semibold text-gray-900">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Modal Tambah Buku */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editBookId ? 'Edit Buku' : 'Tambah Buku Baru'}</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-book-form" onSubmit={handleSaveBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Judul Buku *</label>
                  <input 
                    type="text" 
                    required
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="Masukkan judul buku..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penulis Buku</label>
                  <input 
                    type="text" 
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="Masukkan nama penulis..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Buku</label>
                  <textarea 
                    value={newBook.description}
                    onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-y min-h-[80px]"
                    placeholder="Masukkan deskripsi singkat atau sinopsis buku..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Sampul</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                      {coverFile ? (
                        <img src={URL.createObjectURL(coverFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : newBook.cover_url ? (
                        <img src={newBook.cover_url} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kode Eksemplar *</label>
                  <input 
                    type="text" 
                    required
                    value={newBook.item_code}
                    onChange={(e) => setNewBook({...newBook, item_code: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-mono"
                    placeholder="Contoh: B00123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Koleksi</label>
                    <select 
                      value={newBook.coll_type_name}
                      onChange={(e) => setNewBook({...newBook, coll_type_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white"
                    >
                      <option value="Textbook">Textbook</option>
                      <option value="Reference">Reference</option>
                      <option value="Fiction">Fiction</option>
                      <option value="Journal">Journal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call Number</label>
                    <input 
                      type="text" 
                      value={newBook.call_number}
                      onChange={(e) => setNewBook({...newBook, call_number: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-mono"
                      placeholder="Contoh: 005.8 RAI"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Rak</label>
                    <input 
                      type="text" 
                      value={newBook.location_name}
                      onChange={(e) => setNewBook({...newBook, location_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                      placeholder="Nama lokasi/rak"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Buku</label>
                    <select 
                      value={newBook.item_status_name}
                      onChange={(e) => setNewBook({...newBook, item_status_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white"
                    >
                      <option value="Available">Available</option>
                      <option value="Missing">Missing</option>
                      <option value="Weeding">Weeding</option>
                      <option value="Repair">Repair</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Tersedia</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newBook.stok_tersedia}
                      onChange={(e) => setNewBook({...newBook, stok_tersedia: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Dipinjam</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newBook.stok_dipinjam}
                      onChange={(e) => setNewBook({...newBook, stok_dipinjam: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="add-book-form"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Buku'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
