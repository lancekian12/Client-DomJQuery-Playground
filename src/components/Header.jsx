import { Link } from "react-router-dom";
import IconLogo from "./IconLogo";

export default function Header({ onToggleSidebar }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-900/60 backdrop-blur-md border-b border-slate-800">
      <div className="flex items-center gap-4">
        <button
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-slate-800/40 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <IconLogo />
          <div>
            <div className="text-sm font-semibold text-slate-100">
              EventMaster
            </div>
            <div className="text-xs text-slate-400">Playground</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/docs" className="text-sm text-slate-300 hover:text-white">
          Docs
        </Link>
        <button className="px-3 py-1 rounded-md bg-slate-700/40 text-sm text-slate-200 hover:bg-slate-700">
          Reset
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-slate-900 font-medium">
          L
        </div>
      </div>
    </header>
  );
}
