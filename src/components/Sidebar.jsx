import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar({ isOpen = true }) {
  return (
    <aside
      className={`flex-shrink-0 bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } md:w-64 w-72 h-full`}
    >
      <nav className="h-full flex flex-col justify-between">
        <div>
          <div className="px-4 py-6">
            <div className="text-slate-300 uppercase tracking-wide text-xs font-semibold mb-4">
              Event Categories
            </div>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="group flex items-center gap-3 px-3 py-2 rounded-md text-slate-200 bg-slate-800/30"
                >
                  {" "}
                  <span className="w-9 text-center">🔵</span>{" "}
                  <span>Mouse Events</span>{" "}
                </Link>
              </li>
              <li>
                <Link
                  to="/keyboard"
                  className="group flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800/20"
                >
                  {" "}
                  <span className="w-9 text-center">⌨️</span>{" "}
                  <span>Keyboard Events</span>{" "}
                </Link>
              </li>
              <li>
                <Link
                  to="/form"
                  className="group flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800/20"
                >
                  {" "}
                  <span className="w-9 text-center">📝</span>{" "}
                  <span>Form Inputs</span>{" "}
                </Link>
              </li>
              <li>
                <Link
                  to="/effects"
                  className="group flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800/20"
                >
                  {" "}
                  <span className="w-9 text-center">✨</span>{" "}
                  <span>jQuery Effects</span>{" "}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4">
          <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-700 to-slate-700 text-white">
            <div className="font-semibold">Pro Challenge</div>
            <div className="text-xs text-indigo-100/80 mt-1">
              Try the master event challenge to test your skills.
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
