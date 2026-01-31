"use client";

import { useEffect, useState } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function GmailSyncPage() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("syncing");
  const [error, setError] = useState("");
  const [syncedCount, setSyncedCount] = useState(0);

  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:7894";

  useEffect(() => {
    let timerId;
    let redirectId;
    let isMounted = true;

    const tickProgress = () => {
      setProgress((current) => {
        if (status !== "syncing") return current;
        const next = current + Math.random() * 7 + 2;
        return clamp(next, 0, 92);
      });
    };

    const sync = async () => {
      if (!serverUrl) {
        setStatus("error");
        setError("Missing NEXT_PUBLIC_SERVER_URL");
        return;
      }
      timerId = setInterval(tickProgress, 700);
      try {
        const res = await fetch(`${serverUrl}/auth/gmail/sync?all=true`, {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to sync emails");
        }

        const data = await res.json();
        if (!isMounted) return;
        setSyncedCount(data.syncedCount || 0);
        setProgress(100);
        setStatus("done");
        redirectId = setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setError(err.message || "Failed to sync emails");
      } finally {
        if (timerId) clearInterval(timerId);
      }
    };

    sync();

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
      if (redirectId) clearTimeout(redirectId);
    };
  }, [serverUrl, status]);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 px-6 py-0 text-slate-900">
      <div className="mx-auto flex h-full w-full max-w-sm items-center">
        <div className="w-full rounded-2xl border border-slate-100 bg-white px-5 py-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M4 6h16M4 10h16M4 14h10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Syncing Gmail</h1>
              <p className="text-xs text-slate-500">
                Your emails are being imported securely.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all ${
                  status === "error" ? "bg-rose-500" : "bg-indigo-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{Math.round(progress)}%</span>
              {status === "done" ? (
                <span className="text-emerald-600">
                  Synced {syncedCount} emails
                </span>
              ) : null}
            </div>
          </div>

          <p className="mt-5 text-[11px] text-slate-400">
            You can keep this tab open while we finish syncing.
          </p>
        </div>
      </div>
    </div>
  );
}
