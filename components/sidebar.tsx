'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { Chat } from '@/lib/types';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
}

export function Sidebar({ isSidebarOpen, setSidebarOpen, activeChatId, setActiveChatId }: SidebarProps) {
  const [chats, setChats] = useLocalStorage<Record<string, Chat>>('chats', {});

  const sortedChats = useMemo(() => {
    return Object.entries(chats)
      .sort(([keyA], [keyB]) => parseInt(keyB.split('_')[1]) - parseInt(keyA.split('_')[1]))
      .map(([id, chat]) => ({ id, ...chat }));
  }, [chats]);

  const createNewChat = () => {
    setActiveChatId(null);
    setSidebarOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, chatIdToDelete: string) => {
    e.stopPropagation();
    e.preventDefault();
    setChats(prev => {
      const newChats = { ...prev };
      delete newChats[chatIdToDelete];
      return newChats;
    });
    if (activeChatId === chatIdToDelete) {
        setActiveChatId(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isSidebarOpen ? 0 : '100%' }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        className="fixed top-0 right-0 h-full w-72 bg-bg-subtle border-l border-border z-20 flex flex-col md:relative md:w-72 md:translate-x-0"
      >
        <div className="p-4 flex justify-between items-center border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold">المحادثات</h2>
          <button onClick={createNewChat} className="p-2 hover:bg-bg-inset rounded-md">
            <Plus size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sortedChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => { setActiveChatId(chat.id); setSidebarOpen(false); }}
              className={`w-full group flex items-center justify-between p-2 rounded-md transition-colors text-right ${
                activeChatId === chat.id ? 'bg-brand/20 text-brand' : 'hover:bg-bg-inset'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </div>
              <div onClick={(e) => deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 hover:text-red-500 transition-opacity">
                <Trash2 size={14} />
              </div>
            </button>
          ))}
        </nav>
         <div className="p-2 border-t border-border">
            <p className="text-xs text-center text-text-muted">صُنع بواسطة Gemini</p>
        </div>
      </motion.div>
    </>
  );
}
