"use client";

const Header = ({ isAdmin, onConnect }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-lg font-semibold text-slate-900">MailBot</div>
      {isAdmin ? (
        <button
          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
          type="button"
          onClick={onConnect}
        >
          Connect Mail
        </button>
      ) : null}
    </div>
  );
};

export default Header;
