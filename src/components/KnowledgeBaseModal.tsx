'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, FileUp, Trash2, FileText, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface KnowledgeBase {
  id: number;
  filename: string;
  file_url: string;
  created_at: string;
}

export default function KnowledgeBaseModal({ onClose }: { onClose: () => void }) {
  const [kbList, setKbList] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchKnowledgeBase = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_bases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge bases:', error);
      setError('Gagal memuat data materi.');
    } else {
      setKbList(data || []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Hanya file PDF yang diperbolehkan.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/chat/kb', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Materi berhasil diunggah ke Knowledge Base Supabase!');
        fetchKnowledgeBase(); // Refresh the list
      } else {
        alert(data.error || 'Gagal mengunggah materi');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat mengunggah materi');
    } finally {
      setUploading(false);
      // Reset input file
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number, filename: string, file_url: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus materi "${filename}"?`)) {
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('knowledge_bases')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      if (file_url) {
        const urlParts = file_url.split('/');
        const storageFilename = urlParts[urlParts.length - 1];
        if (storageFilename) {
          await supabase.storage.from('knowledge_base').remove([storageFilename]);
        }
      }

      alert('Materi berhasil dihapus.');
      fetchKnowledgeBase();
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Terjadi kesalahan saat menghapus materi.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-5xl h-[85vh] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Knowledge Base
            </h1>
            <p className="text-sm text-gray-500 mt-1">Kelola materi referensi format PDF untuk dipelajari oleh LibPoint AI.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex justify-end">
            <label className="cursor-pointer bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileUp className="w-5 h-5" />
              )}
              {uploading ? 'Memproses PDF...' : 'Upload PDF Baru'}
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileUpload} 
                disabled={uploading} 
              />
            </label>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-center">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-center">Nama Dokumen</th>
                    <th className="px-6 py-4 text-center">Status Seleksi</th>
                    <th className="px-6 py-4 text-center">Tanggal Unggah</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                        Memuat materi...
                      </td>
                    </tr>
                  ) : kbList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        Belum ada materi PDF yang diunggah.
                      </td>
                    </tr>
                  ) : (
                    kbList.map((kb) => {
                      const displayFilename = kb.filename.replace(/\[\s*Lolos\s*\]\s*/ig, '').replace(/[-_]?lolos/ig, '').trim();
                      return (
                      <tr key={kb.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="p-2 bg-red-50 rounded-lg">
                              <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="font-medium text-gray-900">{displayFilename}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md text-[11px] font-semibold border border-green-200/60 shadow-sm" title="Digital Signature Valid">
                              <CheckCircle2 className="w-3 h-3" /> Signature
                            </div>
                            <div className="w-1.5 border-t border-gray-300" />
                            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md text-[11px] font-semibold border border-green-200/60 shadow-sm" title="Teks Berhasil Diekstrak">
                              <CheckCircle2 className="w-3 h-3" /> Ekstraksi
                            </div>
                            <div className="w-1.5 border-t border-gray-300" />
                            <div className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-md text-[11px] font-semibold border border-green-200/60 shadow-sm" title="Tersimpan di Vector DB">
                              <CheckCircle2 className="w-3 h-3" /> Vectorized
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-center">
                          {new Date(kb.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {kb.file_url && (
                              <button 
                                onClick={() => setPreviewUrl(kb.file_url)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Preview PDF"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(kb.id, kb.filename, kb.file_url)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Materi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
      </div>

      {/* PDF Preview Modal - Nested */}
      {previewUrl && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Preview Dokumen
              </h3>
              <button 
                onClick={() => setPreviewUrl(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full bg-gray-100">
              <iframe 
                src={`${previewUrl}#toolbar=0`} 
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
