"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ChatPanel from "../../components/ChatPanel";
import {
  useGetConversationChatsQuery,
} from "../../redux/api/conversationApi";
import { useGetSessionUserQuery } from "../../redux/api/authApi";

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
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: sessionData, error: sessionError } = useGetSessionUserQuery();
  const user = sessionData?.user ?? null;
  const {
    data: chatsData,
    error: chatsError,
    isLoading: loadingMessages,
  } = useGetConversationChatsQuery(conversationId, {
    skip: !conversationId,
  });

  const messages = useMemo(
    () => (Array.isArray(chatsData) ? chatsData.map(mapChatToMessage) : []),
    [chatsData]
  );

  const errorMessage = useMemo(() => {
    if (!chatsError) return null;
    if (chatsError?.status === 403 || chatsError?.status === 404) {
      return "Conversation not found";
    }
    return "Failed to load messages";
  }, [chatsError]);

  useEffect(() => {
    if (sessionError?.status === 401) {
      router.push("/login");
    }
  }, [router, sessionError]);

  useEffect(() => {
    if (chatsError?.status === 401) {
      router.push("/login");
    }
  }, [router, chatsError]);

  if (!conversationId) {
    router.replace("/");
    return null;
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300">{errorMessage}</p>
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
      <div className="grid min-h-screen grid-cols-1 sm:grid-cols-[auto_1fr]">
        <Sidebar
          user={user}
          refreshTrigger={sidebarRefreshTrigger}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <ChatPanel
          isAdmin={isAdmin}
          onConnect={connectGmail}
          conversationId={conversationId}
          initialMessages={messages}
          loadingMessages={loadingMessages}
          onConversationCreated={handleConversationCreated}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
