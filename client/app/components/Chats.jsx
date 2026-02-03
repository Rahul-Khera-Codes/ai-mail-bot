"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

const Chats = ({ messages }) => {
  const endRef = useRef(null);

  const lastContentLength =
    messages.length > 0
      ? messages[messages.length - 1]?.content?.length ?? 0
      : 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, lastContentLength]);

  return (
    <div className="chat-scroll flex flex-1 flex-col gap-4 overflow-y-auto pr-2 pt-8">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="max-w-[70%]">
            <div
              className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                message.role === "user"
                  ? "bg-indigo-500 text-white"
                  : "bg-[#0a0a0a] text-slate-100 border border-[#262626]"
              }`}
            >
              {message.role === "user" ? (
                message.content
              ) : (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              )}
            </div>
            {/* {message.role === "assistant" &&
            Array.isArray(message.citations) &&
            message.citations.length ? (
              <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500">
                {message.citations.map((citation, index) => (
                  <div
                    key={`${message.id}-citation-${index}`}
                    className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                  >
                    <div className="font-medium text-slate-600">
                      {citation.subject || "Untitled email"}
                    </div>
                    <div>
                      {citation.from ? `From: ${citation.from}` : "From: Unknown"}
                    </div>
                    <div>
                      {citation.date ? `Date: ${citation.date}` : "Date: Unknown"}
                    </div>
                    {citation.snippet ? (
                      <div className="mt-1 text-slate-400">
                        {citation.snippet}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null} */}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default Chats;
