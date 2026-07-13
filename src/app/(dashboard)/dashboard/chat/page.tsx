'use client';

import { useChat } from '@ai-sdk/react';
import { Send, RefreshCw, AlertCircle, Bot, History, X } from 'lucide-react';
import { ChatMessage } from '@/components/ChatMessage';
import { useEffect, useRef, useState } from 'react';
import { DefaultChatTransport } from 'ai';
import { supabase } from '@/lib/supabase';
import { FileUp } from 'lucide-react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, status, error, sendMessage, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setIsAdmin(data?.role === 'admin');
      }
    };
    fetchRole();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/chat/kb', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        alert('Knowledge base berhasil diunggah!');
      } else {
        alert('Gagal mengunggah knowledge base.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengunggah file.');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto w-full pt-4">
      {/* Header */}
      <div className="mb-4 flex justify-between items-center px-4 md:px-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">LibPoint AI</h1>
          <p className="text-sm text-gray-500">Tanyakan apa saja seputar perpustakaan dan koleksi buku kami.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <History className="w-4 h-4" />
            Histori
          </button>
          
          {isAdmin && (
            <label className="cursor-pointer bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm">
              <FileUp className="w-4 h-4" />
              {uploading ? 'Mengunggah...' : 'Knowledge Base'}
              <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                Histori Pencarian
              </h2>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Belum ada histori pencarian.</p>
                <p className="text-sm text-gray-400 mt-1">Percakapan Anda sebelumnya akan muncul di sini.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0 scrollbar-hide pb-32">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
                <Bot className="w-6 h-6 text-gray-600" />
              </div>
              <p className="text-gray-500 font-medium">Bagaimana saya bisa membantu Anda hari ini?</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full pt-4">
              {messages.map((m) => (
                <ChatMessage key={m.id} role={m.role} content={m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || ''} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center bg-white">
                      <Bot className="text-gray-900 h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5 py-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-between p-4 mb-6 text-red-800 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">Terjadi kesalahan saat menghubungi model AI lokal. Pastikan Ollama berjalan.</span>
                  </div>
                  <button onClick={() => regenerate()} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium">
                    <RefreshCw className="w-4 h-4" /> Coba Lagi
                  </button>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 px-4 md:px-0">
          <div className="max-w-3xl mx-auto w-full relative">
            <form onSubmit={handleSubmit} className="relative flex items-end shadow-[0_0_15px_rgba(0,0,0,0.05)] rounded-[26px] bg-gray-50 border border-gray-200 overflow-hidden focus-within:border-gray-300 focus-within:bg-white transition-colors duration-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      const formEvent = new Event('submit', { cancelable: true, bubbles: true });
                      e.currentTarget.form?.dispatchEvent(formEvent);
                    }
                  }
                }}
                placeholder="Tulis pesan..."
                className="w-full pl-5 pr-14 py-3.5 bg-transparent focus:outline-none resize-none max-h-32 text-[15px] leading-relaxed"
                rows={1}
                style={{ minHeight: '52px' }}
                disabled={isLoading}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 bottom-2.5 p-1.5 bg-black text-white rounded-full hover:bg-gray-800 disabled:bg-gray-300 disabled:text-white transition-all flex items-center justify-center h-8 w-8"
              >
                <Send className="w-4 h-4 ml-[-2px] mt-[1px]" />
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-xs text-gray-400">AI dapat membuat kesalahan. Periksa info penting.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
