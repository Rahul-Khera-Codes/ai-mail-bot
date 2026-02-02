"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import Chats from "./Chats";

const ChatPanel = ({ isAdmin, onConnect, resetKey }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:7894";

  const emptyState = useMemo(() => messages.length === 0, [messages.length]);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [resetKey]);

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: Math.random().toString(16).slice(2, 10),
      role: "user",
      content: trimmed,
    };

    const assistantId = Math.random().toString(16).slice(2, 10);
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        content: "Working on that...",
        citations: [],
        pending: true,
      },
    ]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${serverUrl}/auth/gmail/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to get response");
      }

      const payload = await res.json();
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: payload.answer || "No answer available.",
                citations: payload.citations || [],
                pending: false,
              }
            : message
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  "Sorry, I couldn't answer that right now. Please try again.",
                pending: false,
              }
            : message
        )
      );
      setError(err?.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="relative flex h-screen flex-col overflow-hidden">
      <div className="absolute left-2 right-2 top-3 z-10">
        <Header isAdmin={isAdmin} onConnect={onConnect} />
      </div>

      <div className="flex h-full flex-col gap-3 px-8 pb-6 pt-0">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-3 overflow-hidden">
          <section className="flex min-h-0 flex-1 flex-col rounded-2xl p-6">
            {emptyState ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md text-center">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Start a new conversation
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Ask about inbox summaries, draft replies, or follow-ups.
                    Your assistant will keep the conversation organized here.
                  </p>
                </div>
              </div>
            ) : (
              <Chats messages={messages} />
            )}
          </section>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          <form
            className="rounded-full border border-slate-200 bg-white px-3 py-2"
            onSubmit={handleSend}
          >
            <div className="flex items-center gap-3">
              <input
                className="flex-1 border-none px-4 py-2 text-sm text-slate-900 outline-none"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your inbox or draft a reply..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
                aria-label="Send"
                disabled={isLoading}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M5 12h12M13 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ChatPanel;
