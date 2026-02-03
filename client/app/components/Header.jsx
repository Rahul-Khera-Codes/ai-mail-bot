"use client";

const Header = ({ isAdmin, onConnect }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-lg font-semibold text-slate-100">MailBot</div>
      {isAdmin ? (
        <button
          className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-[#333333] hover:bg-[#111111]"
          type="button"
          onClick={onConnect}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M4 7l8 5 8-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="4"
              y="5"
              width="16"
              height="14"
              rx="2"
              ry="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Connect Mail
        </button>
      ) : null}
    </div>
  );
};

export default Header;
