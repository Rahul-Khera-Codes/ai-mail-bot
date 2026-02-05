"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import { useGetSessionUserQuery } from "./redux/api/authApi";

export default function Home() {
  const [chatSeed, setChatSeed] = useState(0);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:7894";

  const { data: sessionData, error: sessionError } =
    useGetSessionUserQuery();
  const user = sessionData?.user ?? null;

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (sessionError?.status === 401) {
      window.location.href = "/login";
    }
  }, [sessionError]);

  const connectGmail = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    window.location.href = `${serverUrl}/auth/gmail/connect`;
  };

  const handleNewChat = () => {
    setChatSeed((prev) => prev + 1);
  };

  const handleConversationCreated = () => {
    // Trigger sidebar refresh
    setSidebarRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="grid min-h-screen grid-cols-[auto_1fr]">
        <Sidebar 
          onNewChat={handleNewChat} 
          user={user} 
          refreshTrigger={sidebarRefreshTrigger}
        />

        <ChatPanel
          isAdmin={isAdmin}
          onConnect={connectGmail}
          resetKey={chatSeed}
          onConversationCreated={handleConversationCreated}
          user={user}
        />
      </div>
    </div>
  );
}
