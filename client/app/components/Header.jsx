"use client";

import { Mail } from "lucide-react";

const Header = ({ isAdmin, onConnect }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xl font-semibold bg-gradient-to-t from-[#a27bff] to-white text-transparent bg-clip-text">
        MailBot
      </div>
      {isAdmin ? (
        <button
          className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-[#333333] hover:bg-[#111111]"
          type="button"
          onClick={onConnect}
        >
          <Mail className="h-3.5 w-3.5" />
          Connect Mail
        </button>
      ) : null}
    </div>
  );
};

export default Header;
