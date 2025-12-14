import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import LiveSource from "../components/LiveSource";

export default function EventMasterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onReset={reset}
      />

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Left sidebar (desktop static) */}
        {isDesktop && (
          <Sidebar
            isDesktopStatic={true}
            isOpen={true}
            onClose={() => {}}
            onReset={reset}
          />
        )}

        {/* Main content area - add bottom padding on mobile so content isn't hidden behind the fixed LiveSource */}
        <main className="flex-1 min-h-[calc(100vh-56px)] p-4 sm:p-6 pb-24 md:pb-0 overflow-auto bg-slate-50 dark:bg-transparent transition-colors duration-200">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* LiveSource: visible on desktop to the right */}
        <div className="hidden md:block">
          <LiveSource />
        </div>
      </div>

      {/* Mobile overlay sidebar */}
      {!isDesktop && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onReset={reset}
        />
      )}

      {/* Mobile LiveSource: fixed bottom sheet */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        {/* pass the mobile prop so LiveSource switches to bottom-sheet styling */}
        <LiveSource mobile />
      </div>
    </div>
  );
}
