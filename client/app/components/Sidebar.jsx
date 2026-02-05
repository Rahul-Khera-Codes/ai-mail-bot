"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const serverUrl =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:7894";

const Sidebar = ({ onNewChat, user, refreshTrigger }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/chats/")) {
      const id = pathname.replace(/^\/chats\/?/, "").split("/")[0] || null;
      setActiveChatId(id || null);
    } else {
      setActiveChatId(null);
    }
  }, [pathname]);

  const avatarUrl = user?.photo || user?.avatarUrl;
  const displayName = user?.name || user?.displayName || "User";
  const initials = (
    (displayName.split(" ")[0]?.[0] || "") +
    (displayName.split(" ")[1]?.[0] || "")
  ).toUpperCase();

  const showAvatar = avatarUrl && !avatarError;

  const loadConversations = async () => {
    try {
      const res = await fetch(`${serverUrl}/conversations`, {
        credentials: "include",
      });
      if (res.status === 401) {
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setChats(data);
    } catch {
      // ignore for now
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Refresh conversations when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadConversations();
    }
  }, [refreshTrigger]);

  const handleNewChat = () => {
    // Just navigate to home page - conversation will be created on first message
    router.push("/");
    onNewChat?.();
  };

  const newChatIcon = (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M12 5v14M5 12h14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <aside
      className={`flex h-screen flex-col border-r border-neutral-900 bg-[#0a0a0a] px-2 py-4 transition-all duration-200 ease-in-out ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      <div
        className={`flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed ? (
          <span className="text-sm font-semibold text-slate-200">Chats</span>
        ) : null}
        <button
          className="flex h-9 w-9 items-center justify-center text-[#b3b3b3] hover:text-white"
          onClick={() => setCollapsed((prev) => !prev)}
          type="button"
          aria-label="Toggle sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 6v12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div
        className={`mt-4 flex flex-col gap-1 ${
          collapsed ? "items-center" : "items-stretch"
        }`}
      >
        <button
          type="button"
          onClick={handleNewChat}
          aria-label="New Chat"
          className={
            collapsed
              ? "flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-400"
              : "flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400  "
          }
        >
          {newChatIcon}
          {!collapsed ? <span>New Chat</span> : null}
        </button>
      </div>

      {!collapsed ? (
        <div className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`min-w-0 rounded-lg border px-3 py-1.5 text-left text-sm transition ${
                chat.id === activeChatId
                  ? "border-transparent bg-[#1a1a1a] text-slate-100"
                  : "border-transparent text-slate-300 hover:border-[#262626] hover:bg-[#1a1a1a] hover:text-slate-100"
              }`}
              onClick={() => router.push(`/chats/${chat.id}`)}
              type="button"
            >
              <div className="truncate text-xs font-normal">{chat.title}</div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="border-t border-neutral-900 pt-4">
          {!user ? (
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
            </div>
          ) : collapsed ? (
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-800">
                {showAvatar ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-200">
                    {initials}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[36px_1fr] items-center gap-3 px-1">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-800">
                {showAvatar ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-200">
                    {initials}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-100">
                  {displayName}
                </div>
                <div className="truncate text-xs text-[#b3b3b3]">
                  {user?.email || ""}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
