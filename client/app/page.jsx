"use client";

import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";

export default function Home() {
  const [chatSeed, setChatSeed] = useState(0);
  const [user, setUser] = useState(null);

  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:7894";

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let isMounted = true;
    const getCookieValue = (name) => {
      if (typeof document === "undefined") return "";
      const match = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${name}=`));
      return match ? match.slice(name.length + 1) : "";
    };
    const loadUser = async () => {
      try {
        const sessionToken = getCookieValue("connect.sid");
        const authBody = sessionToken ? { token: sessionToken } : null;
        const res = await fetch(`${serverUrl}/auth/session-user`, {
          method: "POST",
          credentials: "include",
          headers: {
            ...(authBody ? { "Content-Type": "application/json" } : {}),
            ...(sessionToken ? { "X-Connect-Sid": sessionToken } : {}),
          },
          body: authBody ? JSON.stringify(authBody) : undefined,
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen grid-cols-[auto_1fr]">
        <Sidebar onNewChat={handleNewChat} user={user} />

        <ChatPanel
          isAdmin={isAdmin}
          onConnect={connectGmail}
          resetKey={chatSeed}
        />
      </div>
    </div>
  );
}
