import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';
  
  if (role === 'system' || role === 'data') return null;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUser ? 'bg-primary' : 'bg-gray-800'}`}>
          {isUser ? <User className="text-white h-5 w-5" /> : <Bot className="text-white h-5 w-5" />}
        </div>
        
        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="text-sm text-gray-500 mb-1">{isUser ? 'Anda' : 'LibPoint AI (Qwen)'}</div>
          <div className={`p-4 rounded-2xl ${isUser ? 'bg-primary/10 text-primary-900 rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'} prose prose-sm max-w-none`}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
