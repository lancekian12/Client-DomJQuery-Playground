import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

/**
 * Immediate theme initialization at module load to avoid flash.
 * (This runs once when the module is imported in the browser.)
 */
(function initTheme() {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // fallback to system
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  } catch (err) {
    // ignore
  }
})();

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    const prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  } catch (err) {
    return "light";
  }
}

export default function Header({ onToggleSidebar, onReset = () => {} }) {
  const [theme, setThemeState] = useState(() => getInitialTheme());

  // helper that updates DOM + localStorage then React state
  const setTheme = (newTheme) => {
    if (typeof window === "undefined") {
      setThemeState(newTheme);
      return;
    }
    try {
      const root = window.document.documentElement;
      if (newTheme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
      localStorage.setItem("theme", newTheme);
    } catch (err) {
      console.log(err);
    }
    setThemeState(newTheme);
  };

  // sync theme across tabs/clients (updates DOM + state)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "theme") {
        const incoming = e.newValue === "dark" ? "dark" : "light";
        setTheme(incoming);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 z-40 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="flex items-center justify-center w-10 h-10 rounded-md border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="w-8 h-8 rounded-sm bg-white flex items-center justify-center overflow-hidden dark:bg-slate-900">
              <img src={logo} alt="EventMaster" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="leading-tight hidden sm:block">
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              EventMaster{" "}
              <span className="text-sky-600 dark:text-sky-400 text-lg ml-1 font-normal">
                Playground
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link
            to="/docs"
            className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Docs
          </Link>
        </nav>

        <button
          aria-label="Toggle color theme"
          onClick={toggleTheme}
          className="    p-2 rounded-md
    bg-transparent
    border border-slate-300 dark:border-slate-600
    hover:border-slate-400 dark:hover:border-slate-500
    hover:bg-transparent
    focus:outline-none focus:ring-2 focus:ring-sky-500/40
    transition"
        >
          {theme === "dark" ? (
            /* sun (indicates currently dark; press to go light) */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3v2" stroke="#FDE68A" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M12 19v2" stroke="#FDE68A" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4.2 4.2l1.4 1.4" stroke="#FDE68A" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M18.4 18.4l1.4 1.4" stroke="#FDE68A" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="12" r="4" stroke="#FDE68A" strokeWidth="1.6" />
            </svg>
          ) : (
            /* moon (indicates currently light; press to go dark) */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"
                stroke="#0369A1"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
