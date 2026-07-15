'use client';

import { useChat } from '@ai-sdk/react';
import { Send, RefreshCw, AlertCircle, Bot, History, X, Plus, MessageSquare, Search, BookOpen, Lightbulb, PenTool, Paperclip, Sparkles, PanelLeftClose, PanelLeftOpen, Database } from 'lucide-react';
import { ChatMessage } from '@/components/ChatMessage';
import { useEffect, useRef, useState } from 'react';
import { DefaultChatTransport } from 'ai';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, status, error, sendMessage, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';
  
  // History states
  const [sessions, setSessions] = useState<{id: string, date: string, preview: string, messages: any[]}[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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
      const existing = prev.filter(s => s.id !== sessionId);
      const previewMsg = messages.find(m => m.role === 'user');
      let preview = 'Percakapan AI';
      if (previewMsg) {
        const textPart = previewMsg.parts?.find((p: any) => p.type === 'text') as any;
        preview = textPart?.text || (previewMsg as any).content || preview;
      }
      
      const updated = [
        {
          id: sessionId,
          date: new Date().toISOString(),
          preview: preview.substring(0, 40) + (preview.length > 40 ? '...' : ''),
          messages: messages
        },
        ...existing
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
        className={`bg-[#f9f9f9] border-r border-gray-100 flex-col shrink-0 transition-all duration-300 hidden md:flex ${
          isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-none'
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
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="text-xs font-semibold text-gray-500 px-3 py-2">Hari Ini</p>
          {sessions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">Belum ada riwayat.</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentSessionId === session.id 
                    ? 'bg-[#ececec] text-gray-900 font-medium' 
                    : 'text-gray-800 hover:bg-[#ececec]/70'
                }`}
              >
                <div className="truncate relative">
                  {session.preview}
                  {currentSessionId === session.id && (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#ececec] to-transparent pointer-events-none" />
                  )}
                </div>
              </button>
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
          <Link 
            href="/admin/knowledge-base"
            className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl font-bold transition-colors text-sm shadow-sm"
          >
            <Database className="w-4 h-4" /> Kelola AI Materi
          </Link>
        )}

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 md:p-12">
              <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20 mb-8 text-white rotate-3 hover:rotate-0 transition-transform">
                <Sparkles className="w-10 h-10 fill-current opacity-90" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3 text-center tracking-tight">Selamat Datang di AI LibPoint</h2>
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
                    <div className="flex-shrink-0 h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-sm">
                      <Sparkles className="text-primary h-4 w-4" />
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
                placeholder="Tanya AI LibPoint..."
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
    </div>
  );
}
