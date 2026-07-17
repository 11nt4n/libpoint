'use client';

import Image from 'next/image';

import { useChat } from '@ai-sdk/react';
import { Send, RefreshCw, AlertCircle, Bot, History, X, Plus, MessageSquare, Search, BookOpen, Lightbulb, PenTool, Paperclip, Sparkles, PanelLeftClose, PanelLeftOpen, Database, Edit2, Trash2, Check } from 'lucide-react';
import { ChatMessage } from '@/components/ChatMessage';
import { useEffect, useRef, useState } from 'react';
import { DefaultChatTransport } from 'ai';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import KnowledgeBaseModal from '@/components/KnowledgeBaseModal';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, status, error, sendMessage, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  // History states
  const [sessions, setSessions] = useState<{ id: string, date: string, preview: string, messages: any[] }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showKbModal, setShowKbModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { getEncryptedProfile } = await import('@/app/actions/profiles');
        const { data: profile } = await getEncryptedProfile(session.user.id);
        if (profile?.role === 'admin') setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('libpoint_chat_history');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save to local storage whenever messages update
  useEffect(() => {
    if (messages.length === 0) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
    }

    setSessions(prev => {
      const existingSessionIndex = prev.findIndex(s => s.id === sessionId);
      const existingSession = existingSessionIndex >= 0 ? prev[existingSessionIndex] : null;

      // Cek apakah ada chat baru (jumlah pesan bertambah)
      const isNewMessage = !existingSession || messages.length !== existingSession.messages.length;

      let preview = existingSession?.preview || 'Percakapan AI';
      if (!existingSession) {
        const previewMsg = messages.find(m => m.role === 'user');
        if (previewMsg) {
          const textPart = previewMsg.parts?.find((p: any) => p.type === 'text') as any;
          preview = textPart?.text || (previewMsg as any).content || preview;
          preview = preview.substring(0, 40) + (preview.length > 40 ? '...' : '');
        }
      }

      if (!isNewMessage && existingSession) {
        // Jika tidak ada pesan baru (misal hanya memuat histori), biarkan tanggal dan posisinya sama
        const updated = [...prev];
        updated[existingSessionIndex] = {
          ...existingSession,
          messages: messages
        };
        localStorage.setItem('libpoint_chat_history', JSON.stringify(updated));
        return updated;
      }

      // Jika ada pesan baru, update tanggal ke sekarang dan pindahkan ke atas
      const otherSessions = prev.filter(s => s.id !== sessionId);
      const updated = [
        {
          id: sessionId,
          date: new Date().toISOString(),
          preview: preview,
          messages: messages
        },
        ...otherSessions
      ];

      localStorage.setItem('libpoint_chat_history', JSON.stringify(updated));
      return updated;
    });
  }, [messages, currentSessionId]);

  const loadSession = (sessionData: any) => {
    setCurrentSessionId(sessionData.id);
    setMessages(sessionData.messages);
  };

  const startNewChat = () => {
    setCurrentSessionId('');
    setMessages([]);
    setInput('');
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('libpoint_chat_history', JSON.stringify(updated));
      return updated;
    });
    if (currentSessionId === id) {
      startNewChat();
    }
  };

  const startEditing = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.preview);
  };

  const saveEditing = (e?: React.KeyboardEvent | React.FocusEvent | React.MouseEvent) => {
    if (e && 'key' in e && (e as React.KeyboardEvent).key !== 'Enter') return;
    if (e) e.stopPropagation();
    if (!editingSessionId) return;

    setSessions(prev => {
      const updated = prev.map(s => s.id === editingSessionId ? { ...s, preview: editingTitle } : s);
      localStorage.setItem('libpoint_chat_history', JSON.stringify(updated));
      return updated;
    });
    setEditingSessionId(null);
  };

  const groupedSessions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const groups = {
      'Hari Ini': [] as any[],
      'Kemarin': [] as any[],
      '7 Hari Terakhir': [] as any[],
      'Lebih Lama': [] as any[]
    };

    sessions.forEach(s => {
      const d = new Date(s.date);
      if (d >= today) groups['Hari Ini'].push(s);
      else if (d >= yesterday) groups['Kemarin'].push(s);
      else if (d >= last7Days) groups['7 Hari Terakhir'].push(s);
      else groups['Lebih Lama'].push(s);
    });

    return groups;
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
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">

      {/* Sidebar Histori */}
      <div
        className={`bg-[#f9f9f9] border-r border-gray-100 flex-col shrink-0 transition-all duration-300 hidden md:flex ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'
          }`}
      >
        <div className="p-3">
          <button
            onClick={startNewChat}
            className="w-full bg-primary text-white hover:bg-primary-hover py-3 px-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-5 h-5" /> Percakapan Baru
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {sessions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">Belum ada riwayat.</div>
          ) : (
            Object.entries(groupedSessions()).map(([groupName, groupSessions]) => (
              groupSessions.length > 0 && (
                <div key={groupName} className="space-y-0.5">
                  <p className="text-xs font-semibold text-gray-500 px-3 py-1">{groupName}</p>
                  {groupSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        if (editingSessionId !== session.id) loadSession(session);
                      }}
                      className={`group relative flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${currentSessionId === session.id
                          ? 'bg-[#ececec] text-gray-900 font-medium'
                          : 'text-gray-800 hover:bg-[#ececec]/70'
                        }`}
                    >
                      {editingSessionId === session.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={saveEditing}
                            onBlur={saveEditing}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-primary w-full"
                          />
                          <button onClick={saveEditing} className="p-1 hover:text-green-600 transition-colors flex-shrink-0">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="truncate relative flex-1 pr-6">
                            {session.preview}
                            {currentSessionId === session.id && (
                              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#ececec] to-transparent pointer-events-none" />
                            )}
                          </div>
                          <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-gradient-to-l from-[#ececec] via-[#ececec] to-transparent pl-4">
                            <button
                              onClick={(e) => startEditing(e, session)}
                              className="p-1 text-gray-500 hover:text-primary transition-colors"
                              title="Ganti Nama"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => deleteSession(e, session.id)}
                              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white min-w-0 transition-all duration-300">

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-5 left-5 z-20 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>

        {/* Admin Knowledge Base Button */}
        {isAdmin && (
          <button
            onClick={() => setShowKbModal(true)}
            className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold transition-colors text-sm shadow-sm"
          >
            <Database className="w-4 h-4" /> Kelola Knowledge Base
          </button>
        )}

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 md:p-12">
              <Image src="/2.png" alt="LibPoint AI" width={80} height={80} className="mb-8 rotate-3 hover:rotate-0 transition-transform drop-shadow-xl" />
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3 text-center tracking-tight">Selamat Datang di LibChat</h2>
              <p className="text-gray-500 mb-12 text-center max-w-lg text-lg">Asisten akademik cerdas yang terhubung langsung dengan koleksi perpustakaan Anda.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto w-full pt-8 px-4 md:px-8 pb-32">
              {messages.map((m) => (
                <ChatMessage key={m.id} role={m.role} content={m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || ''} />
              ))}

              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                      <Image src="/2.png" alt="AI" width={32} height={32} className="object-cover" />
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
                <div className="flex items-center justify-between p-4 mb-6 text-red-800 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium">Terjadi kesalahan saat memproses permintaan.</span>
                  </div>
                  <button onClick={() => regenerate()} className="flex items-center gap-1 text-sm bg-white text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 font-bold transition-colors shadow-sm">
                    <RefreshCw className="w-4 h-4" /> Coba Lagi
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 md:px-8">
          <div className="max-w-4xl mx-auto w-full relative">


            <form
              onSubmit={handleSubmit}
              className="relative flex items-end shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[24px] bg-white border border-gray-200 overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300"
            >
              <div className="pl-5 pb-[15px] pt-[15px] text-gray-400">
                <Paperclip className="w-5 h-5 cursor-pointer hover:text-gray-600 transition-colors" />
              </div>
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
                placeholder="Ketik pertanyaanmu disini..."
                className="w-full pl-3 pr-16 py-4 bg-transparent focus:outline-none resize-none max-h-32 text-[15px] leading-relaxed font-medium text-gray-800 placeholder-gray-400"
                rows={1}
                style={{ minHeight: '56px' }}
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
                className="absolute right-3 bottom-2.5 p-2.5 bg-primary text-white rounded-full hover:bg-primary-hover disabled:bg-gray-200 disabled:text-gray-400 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4 ml-[-2px] mt-[1px]" />
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-xs text-gray-400">AI dapat melakukan kesalahan. Selalu verifikasi informasi penting dengan referensi buku asli.</span>
            </div>
          </div>
        </div>

      </div>

      {showKbModal && <KnowledgeBaseModal onClose={() => setShowKbModal(false)} />}
    </div>
  );
}
