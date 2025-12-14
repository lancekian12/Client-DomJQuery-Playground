import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function EventMasterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  // update breakpoint-aware state so layout switches cleanly on resize
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // shared reset handler used by header + mobile sidebar
  const reset = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    if (hadDark) root.classList.remove("dark");
    else root.classList.add("dark");
    setTimeout(() => {
      if (hadDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }, 150);
  };

  return (
    // outer container
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* HEADER is first and always at the top */}
      <Header
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onReset={reset}
      />

      {/* layout row: sidebar (static on desktop) + main */}
      <div className="flex">
        {/* Desktop: render sidebar inline (static, part of layout) */}
        {isDesktop && (
          <Sidebar
            isDesktopStatic={true}
            // these won't be used when static, but keep for typings
            isOpen={true}
            onClose={() => {}}
            onReset={reset}
          />
        )}

        {/* Main content area */}
        <main className="flex-1 min-h-[calc(100vh-56px)] p-4 sm:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay sidebar (render only when not desktop) */}
      {!isDesktop && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onReset={reset}
        />
      )}
    </div>
  );
}
