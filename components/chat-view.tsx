'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Bot, User, CornerDownLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { Chat, Message } from '@/lib/types';
import { MarkdownRenderer } from './markdown-renderer';

interface ChatViewProps {
  chatId: string | null;
  setChatId: (id: string) => void;
}

export function ChatView({ chatId, setChatId }: ChatViewProps) {
  const [chats, setChats] = useLocalStorage<Record<string, Chat>>('chats', {});
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = useMemo(() => chats[chatId!] || { title: 'New Chat', messages: [] }, [chats, chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [activeChat.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: currentMessage };
    const newMessages = [...activeChat.messages, userMessage];
    let currentChatId = chatId;

    if (!currentChatId) {
      currentChatId = `chat_${Date.now()}`;
      const newChat: Chat = { title: currentMessage.substring(0, 30), messages: newMessages };
      setChats(prev => ({ ...prev, [currentChatId!]: newChat }));
      setChatId(currentChatId);
    } else {
      setChats(prev => ({ ...prev, [chatId]: { ...prev[chatId], messages: newMessages } }));
    }

    setCurrentMessage('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/ai', { // NOTE: Assumes a Next.js API route proxy
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages })
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantResponse = '';

        setChats(prev => ({
            ...prev,
            [currentChatId!]: { ...prev[currentChatId!], messages: [...newMessages, { role: 'assistant', content: '...' }] }
        }));

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            assistantResponse += decoder.decode(value, { stream: true });
             setChats(prev => {
                const updatedMessages = [...newMessages, { role: 'assistant', content: assistantResponse }];
                return { ...prev, [currentChatId!]: { ...prev[currentChatId!], messages: updatedMessages }};
            });
        }
    } catch (error) {
        console.error('Fetch error:', error);
        setChats(prev => {
            const updatedMessages = [...newMessages, { role: 'assistant', content: 'عذراً، حدث خطأ ما.' }];
            return { ...prev, [currentChatId!]: { ...prev[currentChatId!], messages: updatedMessages }};
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {activeChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <div className="w-16 h-16 bg-brand/20 text-brand rounded-full flex items-center justify-center mb-4">
                <Bot size={40} />
            </div>
            <h1 className="text-2xl font-bold text-text-default">مساعد الذكاء الاصطناعي</h1>
            <p className="text-text-muted mt-2">كيف يمكنني مساعدتك اليوم؟</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeChat.messages.map((msg, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-4 p-4 md:p-6`}
                >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-bg-subtle' : 'bg-brand text-text-inverse'}`}>
                        {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                    </div>
                    <div className="flex-1 pt-0.5 prose prose-invert max-w-full">
                        <MarkdownRenderer content={msg.content} />
                    </div>
                </motion.div>
            ))}
             <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="p-4 bg-bg-default border-t border-border">
        <form onSubmit={handleSendMessage} className="relative">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            rows={1}
            className="w-full bg-bg-inset border border-border rounded-lg py-3 pr-4 pl-12 resize-none focus:ring-2 focus:ring-brand focus:outline-none transition-all duration-200"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !currentMessage.trim()} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-brand text-text-inverse flex items-center justify-center disabled:bg-bg-subtle disabled:text-text-muted transition-colors">
            {isLoading ? <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div> : <CornerDownLeft size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}