"use client";

import { useEffect, useState } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const SyncDialog = ({ open, onClose, serverUrl }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [syncedCount, setSyncedCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    let timerId;
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
      setStatus("syncing");
      setError("");
      setProgress(8);
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
        setTimeout(() => {
          if (isMounted) onClose?.();
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
    };
  }, [open, serverUrl, status, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
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
            <p className="text-base font-semibold text-slate-900">
              Syncing emails
            </p>
            <p className="text-xs text-slate-500">
              We are securely importing your Gmail.
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
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{Math.round(progress)}%</span>
            {status === "done" ? (
              <span className="text-emerald-600">
                Synced {syncedCount} emails
              </span>
            ) : null}
          </div>
        </div>

        {status === "error" ? (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-600">
            <p>Sync failed.</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SyncDialog;
