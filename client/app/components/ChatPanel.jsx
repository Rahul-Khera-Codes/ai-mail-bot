"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Chats from "./Chats";
import {
  useCreateConversationMutation,
  useSendConversationMessageMutation,
} from "../redux/api/conversationApi";

const EMPTY_MESSAGES = [];

const ChatPanel = ({
  isAdmin,
  onConnect,
  resetKey,
  conversationId,
  initialMessages,
  onMessagesLoaded,
  loadingMessages = false,
  onConversationCreated,
}) => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createConversation] = useCreateConversationMutation();
  const [sendConversationMessage] = useSendConversationMessageMutation();

  const emptyState = useMemo(() => messages.length === 0, [messages.length]);

  // Use stable empty when initialMessages not provided to avoid infinite effect loop
  const messagesToSync = useMemo(
    () =>
      initialMessages === undefined || initialMessages === null
        ? EMPTY_MESSAGES
        : Array.isArray(initialMessages)
          ? initialMessages
          : EMPTY_MESSAGES,
    [initialMessages]
  );

  useEffect(() => {
    if (conversationId != null) {
      setMessages(messagesToSync);
    } else {
      setMessages([]);
      setInput("");
    }
  }, [conversationId, messagesToSync]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setInput("");
    }
  }, [resetKey, conversationId]);

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
      // If no conversationId, create a new conversation first
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const conversation = await createConversation({
          title: "New chat",
        }).unwrap();
        currentConversationId = conversation.id;
        
        // Notify parent component about the new conversation
        if (typeof onConversationCreated === "function") {
          onConversationCreated(conversation);
        }
      }
      await sendConversationMessage({
        conversationId: currentConversationId,
        message: trimmed,
        onMetadata: (data) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, citations: data.citations ?? [] }
                : msg
            )
          );
        },
        onChunk: (content) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content:
                      msg.content === "Working on that..."
                        ? content
                        : msg.content + content,
                  }
                : msg
            )
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content:
                      msg.content === "..."
                        ? "No answer available."
                        : msg.content,
                    pending: false,
                  }
                : msg
            )
          );
        },
      }).unwrap();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, pending: false } : msg
        )
      );

      // If we created a new conversation, navigate to it after message is sent
      if (!conversationId && currentConversationId) {
        router.push(`/chats/${currentConversationId}`);
      }
    } catch (err) {
      if (err?.status === 401) {
        router.push("/login");
        return;
      }
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
      const message =
        err?.data?.message ||
        err?.data?.error ||
        err?.message ||
        "Failed to send message";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="relative flex h-screen flex-col overflow-hidden text-slate-100">
      <div className="absolute left-2 right-2 top-3 z-10">
        <Header isAdmin={isAdmin} onConnect={onConnect} />
      </div>

      <div className="flex h-full flex-col gap-3 px-8 pb-6 pt-0">
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-3 overflow-hidden">
          <section className="flex min-h-0 flex-1 flex-col p-6">
            {conversationId && loadingMessages ? (
              <div className="flex flex-1 items-center justify-center text-slate-400 text-sm">
                Loading conversation...
              </div>
            ) : emptyState ? (
              <div className="flex h-full items-center justify-center">
                <div className="w-full max-w-xl px-8 py-10 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111111] text-[#615fff]">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M8 9h8M8 13h5M7 4h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5 3V7a3 3 0 0 1 3-3z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-100">
                    Start a new conversation
                  </h2>
                  <p className="mt-3 text-sm text-[#b3b3b3]">
                    Ask about inbox summaries, draft replies, or follow-ups. Your
                    assistant keeps everything organized in one place.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-200">
                    {[
                      "Summarize my latest emails",
                      "Draft a reply to a client",
                      "Show follow-ups due today",
                    ].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full border border-[#262626] bg-black px-3 py-1 text-[#b3b3b3]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Chats messages={messages} />
            )}
          </section>

          {error ? (
            <div className="rounded-lg border border-rose-900/60 bg-rose-950/50 px-4 py-2 text-xs text-rose-200">
              {error}
            </div>
          ) : null}

          <form className="flex items-center gap-3" onSubmit={handleSend}>
            <div className="flex-1">
              <input
                className="w-full rounded-lg border border-neutral-800 bg-black px-4 py-3 text-sm text-slate-100 placeholder:text-[#b3b3b3] outline-none focus:border-[#615fff]"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your inbox or draft a reply..."
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#615fff] text-white hover:bg-[#4f4dff] disabled:cursor-not-allowed disabled:bg-[#3f3dd9]"
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
          </form>
        </div>
      </div>
    </main>
  );
};

export default ChatPanel;
