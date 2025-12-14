import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

/**
 * Theme initialization executed at module load (client only).
 * This ensures the <html> receives the correct `dark` class
 * before React paints (avoids initial flash / mismatch).
 */
function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      // apply immediately
      if (stored === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return stored;
    }
    // fallback to system preference
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return prefersDark ? "dark" : "light";
  } catch (err) {
    console.log(err);
    return "dark";
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
        // only update if different
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
    <header className="flex items-center justify-between px-4 sm:px-5 py-3 bg-slate-800/80 dark:bg-slate-900/90 border-b border-slate-700 z-40">
      {/* --- keep the rest of your header markup exactly the same --- */}
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-slate-700/40 md:hidden"
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
          <div className="flex items-center justify-center w-10 h-10 rounded-md border border-slate-700 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-1 shadow-sm">
            <div className="w-8 h-8 rounded-sm bg-slate-900 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="EventMaster"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="leading-tight hidden sm:block">
            <div className="text-lg font-semibold text-slate-100">
              EventMaster{" "}
              <span className="text-sky-400 text-lg ml-1 font-normal">
                Playground
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link to="/docs" className="text-slate-300 hover:text-white">
            Docs
          </Link>
        </nav>

        {/* <button
          type="button"
          className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm shadow"
          onClick={() => {
            if (onReset) {
              onReset();
              return;
            }
            const prev = theme;
            setTimeout(() => setTheme(prev), 150);
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="opacity-90"
          >
            <path
              d="M21 12a9 9 0 1 1-3-6.7"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 3v6h-6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Reset
        </button> */}

        {/* <button
          aria-label="Toggle color theme"
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-slate-700/30"
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3v2"
                stroke="#FDE68A"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M12 19v2"
                stroke="#FDE68A"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M4.2 4.2l1.4 1.4"
                stroke="#FDE68A"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M18.4 18.4l1.4 1.4"
                stroke="#FDE68A"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="#FDE68A"
                strokeWidth="1.6"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"
                stroke="#93C5FD"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button> */}
      </div>
    </header>
  );
}
