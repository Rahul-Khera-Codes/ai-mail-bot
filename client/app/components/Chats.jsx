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
    <div className="chat-scroll flex flex-1 flex-col gap-3 overflow-y-auto pr-1 pt-4 sm:gap-4 sm:pr-2 pt-15 xl:pt-8">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex min-w-0 ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div className="min-w-0 w-fit max-w-[88%] sm:max-w-[70%]">
            <div
              className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed overflow-hidden break-words whitespace-normal [overflow-wrap:anywhere] prose prose-invert prose-sm max-w-none shadow-[0_10px_26px_rgba(0,0,0,0.35)] sm:text-xs [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:bg-[#1a1a1a] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2 [&_pre]:[-ms-overflow-style:none] [&_pre]:[scrollbar-width:none] [&_pre::-webkit-scrollbar]:hidden [&_pre_code]:whitespace-pre [&_code]:bg-[#1a1a1a] [&_code]:px-1 [&_code]:rounded [&_code]:break-all [&_a]:text-[#a27bff] [&_a]:underline [&_a]:break-all [&_table]:border-collapse [&_table]:table-auto [&_table]:w-full [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 ${
                message.role === "user"
                  ? "bg-[#a27bff] text-white border border-[#a27bff]"
                  : "bg-[#0f0f16] text-slate-100 border border-[#2a2a3a]"
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
