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
  const { messages, status, error, sendMessage, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';
  const [isAdmin, setIsAdmin] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // History states
  const [sessions, setSessions] = useState<{id: string, date: string, preview: string, messages: any[]}[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

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
        preview = previewMsg.content || (previewMsg.parts && previewMsg.parts[0]?.text) || preview;
      }
      
      const updated = [
        {
          id: sessionId,
          date: new Date().toISOString(),
          preview: preview.substring(0, 50) + (preview.length > 50 ? '...' : ''),
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
    setShowHistoryModal(false);
  };

  const startNewChat = () => {
    setCurrentSessionId('');
    setMessages([]);
    setShowHistoryModal(false);
  };

  
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
          {messages.length > 0 && (
            <button 
              onClick={startNewChat}
              className="bg-primary text-white hover:bg-primary-hover px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
            >
              + Chat Baru
            </button>
          )}
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <History className="w-4 h-4" />
            Histori
          </button>
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
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Belum ada histori pencarian.</p>
                  <p className="text-sm text-gray-400 mt-1">Percakapan Anda sebelumnya akan muncul di sini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        currentSessionId === session.id 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-gray-900 truncate mb-1">{session.preview}</p>
                      <p className="text-xs text-gray-500 flex items-center justify-between">
                        <span>{new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-gray-400">{session.messages.length} pesan</span>
                      </p>
                    </button>
                  ))}
                </div>
              )}
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
