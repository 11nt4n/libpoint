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
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] sm:max-w-[75%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar for Assistant only (ChatGPT style) */}
        {!isUser && (
          <div className="flex-shrink-0 h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center bg-white">
            <Bot className="text-gray-900 h-5 w-5" />
          </div>
        )}
        
        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
          {isUser ? (
            <div className="px-5 py-3 rounded-[24px] bg-gray-100 text-gray-900 text-[15px] leading-relaxed">
              <ReactMarkdown className="prose prose-sm max-w-none break-words">{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="py-1 text-gray-900 text-[15px] leading-relaxed w-full">
              <div className="font-semibold text-gray-900 mb-1">LibPoint AI</div>
              <ReactMarkdown className="prose prose-sm max-w-none break-words">{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
