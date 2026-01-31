"use client";

import { useState } from "react";

const initialChats = [];

const Sidebar = ({ onNewChat, user }) => {
  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleNewChat = () => {
    const newChat = {
      id: Math.random().toString(16).slice(2, 10),
      title: "New chat",
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    onNewChat?.();
  };

  const topActions = [
    {
      id: "new",
      label: "New chat",
      onClick: handleNewChat,
      icon: (
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
      ),
    },
  ];

  return (
    <aside
      className={`flex h-screen flex-col border-r border-slate-200 bg-white px-2 py-4 transition-all duration-200 ease-in-out ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      <div
        className={`flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed ? (
          <span className="text-sm font-semibold text-slate-700">Chats</span>
        ) : null}
        <button
          className="flex h-9 w-9 items-center justify-center text-slate-500 hover:text-slate-900"
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
        {topActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            className={
              collapsed
                ? "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                : "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }
          >
            {action.icon}
            {!collapsed ? <span>{action.label}</span> : null}
          </button>
        ))}
      </div>

      {!collapsed ? (
        <div className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`min-w-0 rounded-lg border px-3 py-1.5 text-left text-sm transition ${
                chat.id === activeChatId
                  ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                  : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => setActiveChatId(chat.id)}
              type="button"
            >
              <div className="truncate font-semibold">{chat.title}</div>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="border-t border-slate-200 pt-4">
          {!user ? (
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
            </div>
          ) : collapsed ? (
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200">
                {user?.photo || user?.avatarUrl ? (
                  <img
                    src={user?.photo || user?.avatarUrl}
                    alt={user?.name || user?.displayName || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-600">
                    {(
                      ((user?.name || user?.displayName || "User")
                        .split(" ")[0]?.[0] || "") +
                      ((user?.name || user?.displayName || "User")
                        .split(" ")[1]?.[0] || "")
                    ).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[36px_1fr] items-center gap-3 px-1">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                {user?.photo || user?.avatarUrl ? (
                  <img
                    src={user?.photo || user?.avatarUrl}
                    alt={user?.name || user?.displayName || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-600">
                    {(
                      ((user?.name || user?.displayName || "User")
                        .split(" ")[0]?.[0] || "") +
                      ((user?.name || user?.displayName || "User")
                        .split(" ")[1]?.[0] || "")
                    ).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || user?.displayName || "User"}
                </div>
                <div className="truncate text-xs text-slate-500">
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
