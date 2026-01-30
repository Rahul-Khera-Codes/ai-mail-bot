"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");

  const connectGmail = async () => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

    try {
      const res = await fetch(`${serverUrl}/auth/dashboard`, {
        credentials: "include",
      });

      if (!res.ok) {
        window.location.href = "/login";
        return;
      }
    } catch (error) {
      window.location.href = "/login";
      return;
    }

    window.location.href = `${serverUrl}/auth/gmail/connect`;
  };

  const fetchEmails = async () => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    setLoadingMessages(true);
    setMessageError("");

    try {
      const res = await fetch(
        `${serverUrl}/auth/gmail/messages?all=true`,
        { credentials: "include" }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch emails");
      }

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      setMessageError(error.message || "Failed to fetch emails");
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={connectGmail}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Connect Gmail
        </button>

        <button
          onClick={fetchEmails}
          disabled={loadingMessages}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {loadingMessages ? "Fetching..." : "Fetch Emails"}
        </button>
      </div>

      {messageError ? (
        <p style={{ color: "crimson", marginTop: 16 }}>{messageError}</p>
      ) : null}

      <div style={{ marginTop: 20 }}>
        <p>Fetched Emails: {messages.length}</p>
        <ul style={{ paddingLeft: 16 }}>
          {messages.map((message) => (
            <li key={message.id} style={{ marginBottom: 12 }}>
              <div>
                <strong>{message.subject || "(No subject)"}</strong>
              </div>
              <div>From: {message.from || "Unknown sender"}</div>
              <div>Date: {message.date || "Unknown date"}</div>
              <div style={{ color: "#555" }}>{message.snippet}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
