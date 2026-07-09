'use client';

import { useChat } from 'ai/react';
import { Send, RefreshCw, AlertCircle } from 'lucide-react';
import { ChatMessage } from '@/components/ChatMessage';
import { useEffect, useRef } from 'react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload } = useChat({
    api: '/api/chat',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">LibPoint AI Assistant</h1>
        <p className="text-gray-500">Tanyakan apa saja seputar perpustakaan dan koleksi buku kami.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Send className="w-8 h-8 text-gray-300" />
              </div>
              <p>Mulai percakapan dengan LibPoint AI</p>
            </div>
          ) : (
            messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} content={m.content} />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl rounded-tl-none text-gray-500">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between p-4 mb-6 text-red-800 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span>Terjadi kesalahan saat menghubungi model AI lokal. Pastikan Ollama berjalan.</span>
              </div>
              <button onClick={() => reload()} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
                <RefreshCw className="w-4 h-4" /> Coba Lagi
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Tulis pesan..."
              className="w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-400">AI ini menggunakan Qwen3 8B secara lokal.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
