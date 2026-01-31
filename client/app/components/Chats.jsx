"use client";

import { useEffect, useRef } from "react";

const Chats = ({ messages }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="chat-scroll flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              message.role === "user"
                ? "bg-indigo-500 text-white"
                : "bg-slate-100 text-slate-900"
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default Chats;
