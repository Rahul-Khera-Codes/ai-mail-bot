"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ChatPanel from "../../components/ChatPanel";

const serverUrl =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:7894";

function mapChatToMessage(chat) {
  return {
    id: chat.id,
    role: chat.role === "system" ? "assistant" : chat.role,
    content: chat.message ?? "",
    citations: [],
  };
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id;
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const res = await fetch(`${serverUrl}/auth/session-user`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok && res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok && isMounted) {
          const data = await res.json();
          setUser(data.user ?? null);
        }
      } catch {
        if (isMounted) router.push("/login");
      }
    };
    loadUser();
    return () => { isMounted = false; };
  }, [router]);

  const loadChats = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${serverUrl}/conversations/${conversationId}/chats`,
        { credentials: "include" }
      );
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403 || res.status === 404) {
        setError("Conversation not found");
        setMessages([]);
        return;
      }
      if (!res.ok) {
        setError("Failed to load messages");
        setMessages([]);
        return;
      }
      const data = await res.json();
      setMessages(Array.isArray(data) ? data.map(mapChatToMessage) : []);
    } catch {
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, router]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  if (!conversationId) {
    router.replace("/");
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 text-indigo-400 hover:underline"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const connectGmail = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    window.location.href = `${serverUrl}/auth/gmail/connect`;
  };

  const handleConversationCreated = () => {
    // Trigger sidebar refresh
    setSidebarRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="grid min-h-screen grid-cols-[auto_1fr]">
        <Sidebar user={user} refreshTrigger={sidebarRefreshTrigger} />
        <ChatPanel
          isAdmin={isAdmin}
          onConnect={connectGmail}
          conversationId={conversationId}
          initialMessages={messages}
          onMessagesLoaded={loadChats}
          loadingMessages={loading}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  );
}
