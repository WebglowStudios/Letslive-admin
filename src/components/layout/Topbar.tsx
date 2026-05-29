"use client";

import { useAuthStore } from "@/stores/authStore";
import { Bell, Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

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
};

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (path === "/" && pathname === "/") return title;
      if (path !== "/" && pathname.startsWith(path)) return title;
    }
    return "Dashboard";
  };

  return (
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
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-64">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
          />
        </div>

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
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold">
              {user.firstName?.[0]}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
