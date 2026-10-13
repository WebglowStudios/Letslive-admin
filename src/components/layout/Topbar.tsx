"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Bell, Search, Menu, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { UniversalSearchModal } from "@/components/ui/UniversalSearchModal";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/bookings": "Bookings",
  "/destinations": "Destinations",
  "/packages": "Packages",
  "/users": "Users",
  "/staff": "Staff Management",
  "/reviews": "Reviews",
  "/enquiries": "Enquiries",
  "/careers": "Careers",
  "/newsletter": "Newsletter",
  "/settings": "Settings",
  "/activity": "Activity Logs",
  "/performance": "Performance & Targets",
  "/operations": "Operations",
  "/finance": "Finance & Installments",
};

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Global hotkey: Cmd+K / Ctrl+K to open universal 360 search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (path === "/" && pathname === "/") return title;
      if (path !== "/" && pathname.startsWith(path)) return title;
    }
    return "Dashboard";
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">{getTitle()}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Universal 360 Search Trigger */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2 w-48 sm:w-72 md:w-80 text-left transition-all group shadow-xs cursor-pointer"
            title="Search unified ID, booking, enquiry, phone, or customer (Cmd+K)"
          >
            <Search size={16} className="text-slate-400 group-hover:text-cyan-600 transition-colors shrink-0" />
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 truncate flex-1">
              Search Unified ID, phone, lead...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User */}
          {user && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700">{user.firstName}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {user.firstName?.[0]}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Universal 360 Lifecycle Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
}
