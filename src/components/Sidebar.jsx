import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaMouse, FaKeyboard, FaRegListAlt, FaMagic } from "react-icons/fa";

export default function Sidebar({
  isOpen = true,
  onClose = () => {},
  onReset = () => {},
  isDesktopStatic = false,
}) {
  const baseBg = "bg-slate-800/90 dark:bg-slate-900/95 border-r border-slate-700";

  const items = [
    { to: "/", label: "Mouse Events", icon: FaMouse },
    { to: "/keyboard", label: "Keyboard Events", icon: FaKeyboard },
    { to: "/form", label: "Form Inputs", icon: FaRegListAlt },
    { to: "/effects", label: "jQuery Effects", icon: FaMagic },
  ];

  // static desktop sidebar (in layout flow)
  if (isDesktopStatic) {
    return (
      <aside className={`hidden md:flex flex-col w-64 ${baseBg} ]`}>
        <nav className="flex flex-col h-full">
          <div className="overflow-y-auto px-4 py-6 flex-1">
            <div className="text-slate-300 uppercase tracking-wide text-xs font-semibold mb-4">
              Event Categories
            </div>

            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${
                        isActive
                          ? "bg-sky-700/90 text-white shadow-inner"
                          : "text-slate-300 hover:bg-slate-700/20 hover:text-white"
                      }`
                    }
                  >
                    <span className="w-9 text-center flex items-center justify-center text-lg">
                      <item.icon className="shrink-0" />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* footer: Docs + Reset — hidden on desktop static as requested */}
          <div className="p-4 border-t border-slate-700 hidden">
            <div className="flex items-center justify-between gap-3">
              <NavLink to="/docs" className="text-slate-300 hover:text-white text-sm">
                Docs
              </NavLink>

              <button
                onClick={onReset}
                className="px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </nav>
      </aside>
    );
  }

  // MOBILE overlay sidebar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div
        aria-hidden={!isOpen}
        onClick={() => onClose(false)}
        className={`fixed inset-0 z-20 md:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <aside
        className={`fixed top-0 left-0 bottom-0 z-30 transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:flex md:flex-col md:w-64 w-72 ${baseBg}`}
        aria-hidden={!isOpen}
      >
        <nav className="relative flex flex-col h-full md:min-h-[calc(100vh-56px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 md:border-b-0">
            <div className="text-lg font-semibold text-slate-100">EventMaster</div>
            <button
              onClick={() => onClose(false)}
              aria-label="Close sidebar"
              className="md:hidden p-2 rounded-md hover:bg-slate-700/30"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-200">
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="px-4 py-6 overflow-y-auto flex-1 pb-28 md:pb-4 md:overflow-visible">
            <div className="text-slate-300 uppercase tracking-wide text-xs font-semibold mb-4">
              Event Categories
            </div>

            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth < 768) onClose(false);
                    }}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm ${
                        isActive ? "bg-sky-700/90 text-white shadow-inner" : "text-slate-300 hover:bg-slate-700/20 hover:text-white"
                      }`
                    }
                  >
                    <span className="w-9 text-center flex items-center justify-center text-lg">
                      <item.icon className="shrink-0" />
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* footer: visible only on mobile (hidden on md and up) */}
          <div className="absolute left-0 right-0 bottom-0 md:relative md:mt-auto bg-slate-900/95 md:bg-transparent border-t border-slate-700 p-4 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <NavLink
                to="/docs"
                onClick={() => onClose(false)}
                className="text-slate-300 hover:text-white text-sm"
              >
                Docs
              </NavLink>

              <button
                onClick={() => {
                  onReset();
                  onClose(false);
                }}
                className="px-3 py-1 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
