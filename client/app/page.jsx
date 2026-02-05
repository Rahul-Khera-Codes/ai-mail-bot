"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";

export default function Home() {
  const [chatSeed, setChatSeed] = useState(0);
  const [user, setUser] = useState(null);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:7894";

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const res = await fetch(`${serverUrl}/auth/session-user`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        if (isMounted) setUser(data.user || null);
      } catch (error) {
        if (isMounted) setUser(null);
        window.location.href = "/login";
      }
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [serverUrl]);

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
        />
      </div>
    </div>
  );
}
