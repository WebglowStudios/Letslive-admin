"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { hasPermission } from "@/lib/permissions";
import {
  LayoutDashboard,
  CalendarCheck,
  MapPin,
  Package,
  Users,
  UserCog,
  Star,
  MessageSquare,
  Briefcase,
  Mail,
  Settings,
  Activity,
  ChevronLeft,
  LogOut,
  TrendingUp,
  KanbanSquare,
  BadgeDollarSign,
} from "lucide-react";

import { getInitials } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebarStore";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Bookings", href: "/bookings", icon: <CalendarCheck size={20} />, permission: "bookings.view" },
      { label: "Enquiries", href: "/enquiries", icon: <MessageSquare size={20} />, permission: "enquiries.view" },
      { label: "Pipeline", href: "/enquiries/pipeline", icon: <KanbanSquare size={20} />, permission: "enquiries.view" },
      { label: "Custom Itineraries", href: "/itineraries", icon: <MapPin size={20} />, permission: "packages.view" },
      { label: "Post-Sales Ops", href: "/operations", icon: <TrendingUp size={20} />, permission: "bookings.view" },
      { label: "Finance Approvals", href: "/finance-approvals", icon: <BadgeDollarSign size={20} />, permission: "finance.approve" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Destinations", href: "/destinations", icon: <MapPin size={20} />, permission: "destinations.view" },
      { label: "Packages", href: "/packages", icon: <Package size={20} />, permission: "packages.view" },
      { label: "Careers", href: "/careers", icon: <Briefcase size={20} />, permission: "careers.view" },
      { label: "Applications", href: "/applications", icon: <Briefcase size={20} />, permission: "careers.edit" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Reviews", href: "/reviews", icon: <Star size={20} />, permission: "reviews.view" },
      { label: "Articles", href: "/articles", icon: <MessageSquare size={20} />, permission: "reviews.view" },
      { label: "Newsletter", href: "/newsletter", icon: <Mail size={20} />, permission: "newsletter.view" },
    ],
  },
  {
    title: "Team",
    items: [
      { label: "Users", href: "/users", icon: <Users size={20} />, permission: "users.view" },
      { label: "Staff", href: "/staff", icon: <UserCog size={20} />, permission: "staff.view" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: <Settings size={20} />, permission: "settings.view" },
      { label: "Activity", href: "/activity", icon: <Activity size={20} />, permission: "activity.view" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { collapsed, toggle } = useSidebarStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const roleBadgeColor: Record<string, string> = {
    admin: "bg-red-500/20 text-red-300",
    manager: "bg-amber-500/20 text-amber-300",
    staff: "bg-cyan-500/20 text-cyan-300",
    guest: "bg-slate-500/20 text-slate-400",
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-slate-800">
        {!collapsed && (
          <Link href="/" className="text-white font-bold text-lg tracking-wide">
            LetsLive<span className="text-cyan-400"> Admin</span>
          </Link>
        )}
        <button
          onClick={toggle}
          className={`ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-transform ${
            collapsed ? "rotate-180 mx-auto" : ""
          }`}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.permission) return true;
            if (!user) return false;
            return hasPermission(user, item.permission as never);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-cyan-600/15 text-cyan-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    } ${collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span style={collapsed ? { transform: "scale(1.2)" } : undefined}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-slate-800 p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${roleBadgeColor[user.role] || ""}`}>
                  {user.role}
                </span>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
