'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ChatView } from '@/components/chat-view';
import { Menu } from 'lucide-react';

export default function Home() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <main className="flex-1 flex flex-col h-full">
        <div className="md:hidden p-2 flex items-center border-b border-border">
            <button onClick={() => setSidebarOpen(true)} className="p-2"><Menu size={20}/></button>
            <h1 className="text-center font-bold flex-1">مساعد الذكاء الاصطناعي</h1>
        </div>
        <ChatView chatId={activeChatId} setChatId={setActiveChatId} />
      </main>
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
      />
    </div>
  );
}