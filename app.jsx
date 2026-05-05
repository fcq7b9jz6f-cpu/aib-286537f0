import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, CornerDownLeft, Plus, MessageSquare, Trash2, Menu, X, Sun, Moon } from "lucide-react";

// --- UTILS & HOOKS ---
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

function SimpleMarkdown({ content }) {
    const formattedContent = useMemo(() => {
        let html = content
            .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br />');
        return { __html: html };
    }, [content]);

    return <div dangerouslySetInnerHTML={formattedContent} />;
}

// --- COMPONENTS ---

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";
  const Icon = isUser ? User : Bot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 p-4 md:p-6`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-bg-subtle' : 'bg-brand text-text-inverse'}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 pt-0.5 prose prose-invert max-w-full">
        <SimpleMarkdown content={message.content} />
      </div>
    </motion.div>
  );
};

const ChatView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useLocalStorage("chats", {});
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const activeChat = useMemo(() => chats[id] || { title: "محادثة جديدة", messages: [] }, [chats, id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [activeChat.messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const newMessages = [...activeChat.messages, { role: "user", content: currentMessage }];
    let currentId = id;

    if (!currentId) {
        currentId = `chat_${Date.now()}`;
        const newChat = {
            title: currentMessage.substring(0, 30),
            messages: newMessages
        };
        setChats(prev => ({...prev, [currentId]: newChat}));
        navigate(`/chat/${currentId}`, { replace: true });
    } else {
        setChats(prev => ({ ...prev, [id]: { ...prev[id], messages: newMessages } }));
    }
    
    setCurrentMessage("");
    setIsLoading(true);

    try {
        const response = await fetch(window.__AI_ENDPOINT__, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages })
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantResponse = "";

        setChats(prev => ({
            ...prev,
            [currentId]: { ...prev[currentId], messages: [...newMessages, { role: "assistant", content: "..." }] }
        }));

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            assistantResponse += decoder.decode(value, { stream: true });
            setChats(prev => {
                const updatedMessages = [...newMessages, { role: "assistant", content: assistantResponse }];
                return { ...prev, [currentId]: { ...prev[currentId], messages: updatedMessages }};
            });
        }
    } catch (error) {
        console.error("Fetch error:", error);
        setChats(prev => {
            const updatedMessages = [...newMessages, { role: "assistant", content: "عذراً، حدث خطأ ما." }];
            return { ...prev, [currentId]: { ...prev[currentId], messages: updatedMessages }};
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          if(!isLoading) {
              handleSendMessage(e);
          }
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
            <p className="text-text-muted mt-2">كيف يمكنني مساعدتك اليوم؟ ابدأ بكتابة رسالتك أدناه.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activeChat.messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
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
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا..."
            rows="1"
            className="w-full bg-bg-inset border border-border rounded-lg py-3 pr-4 pl-12 resize-none focus:ring-2 focus:ring-brand focus:outline-none transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !currentMessage.trim()}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-brand text-text-inverse flex items-center justify-center disabled:bg-bg-subtle disabled:text-text-muted transition-colors"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div> : <CornerDownLeft size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const [chats, setChats] = useLocalStorage("chats", {});
  const { id: activeChatId } = useParams();

  const sortedChats = useMemo(() => {
      return Object.entries(chats)
          .sort(([keyA], [keyB]) => parseInt(keyB.split('_')[1]) - parseInt(keyA.split('_')[1]))
          .map(([id, chat]) => ({ id, ...chat }));
  }, [chats]);

  const createNewChat = () => {
    setSidebarOpen(false);
  };

  const deleteChat = (chatIdToDelete, e) => {
      e.stopPropagation();
      e.preventDefault();
      setChats(prev => {
          const newChats = { ...prev };
          delete newChats[chatIdToDelete];
          return newChats;
      });
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
        initial={{ x: "100%" }} 
        animate={{ x: isSidebarOpen ? 0 : "100%" }} 
        exit={{ x: "100%" }} 
        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
        className="fixed top-0 right-0 h-full w-72 bg-bg-subtle border-l border-border z-20 flex flex-col md:relative md:w-72 md:translate-x-0"
      >
        <div className="p-4 flex justify-between items-center border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold">المحادثات</h2>
          <Link to="/" onClick={createNewChat} className="p-2 hover:bg-bg-inset rounded-md">
            <Plus size={20}/>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {sortedChats.map(chat => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
              onClick={() => setSidebarOpen(false)}
              className={`group flex items-center justify-between p-2 rounded-md transition-colors ${activeChatId === chat.id ? 'bg-brand/20 text-brand' : 'hover:bg-bg-inset'}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate text-sm font-medium">{chat.title}</span>
              </div>
              <button onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 hover:text-red-500 transition-opacity">
                <Trash2 size={14} />
              </button>
            </Link>
          ))}
        </nav>
         <div className="p-2 border-t border-border">
            <p className="text-xs text-center text-text-muted">صُنع بواسطة Gemini</p>
        </div>
      </motion.div>
    </>
  );
};

const App = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  return (
    <HashRouter>
      <div className="flex h-screen w-full overflow-hidden">
        <main className="flex-1 flex flex-col h-full">
            <div className="md:hidden p-2 flex items-center border-b border-border">
                <button onClick={() => setSidebarOpen(true)} className="p-2"><Menu size={20}/></button>
                <h1 className="text-center font-bold flex-1">مساعد الذكاء الاصطناعي</h1>
            </div>
            <Routes>
                <Route path="/" element={<ChatView />} />
                <Route path="/chat/:id" element={<ChatView />} />
            </Routes>
        </main>
        <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      </div>
    </HashRouter>
  );
};

createRoot(document.getElementById("root")).render(<App />);
