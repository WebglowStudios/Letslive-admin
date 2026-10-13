"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CalendarCheck,
  DollarSign,
  Users,
  Package,
  MapPin,
  Star,
  MessageSquare,
  TrendingUp,
  Phone,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";


interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  totalPackages: number;
  totalDestinations: number;
  pendingBookings: number;
  pendingReviews: number;
  newEnquiries: number;
}

interface RecentBooking {
  _id: string;
  bookingId?: string;
  user?: { firstName?: string; lastName?: string; email?: string };
  primaryTraveller?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  package?: { name?: string };
  destination?: { name?: string };
  packageName?: string;
  totalAmount: number;
  bookingStatus?: string;
  status?: string;
  paymentStatus?: string;
  createdAt: string;
}

interface CrmStats {
  byStatus: Record<string, number>;
  conversionRate: number;
  avgDaysToConvert: number;
  totalConversionValue: number;
  followUpsDueToday: number;
  total: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [crmStats, setCrmStats] = useState<CrmStats | null>(null);
  const [pipelinePeriod, setPipelinePeriod] = useState<"month" | "all">("month");
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Try the admin stats endpoint first
        const statsRes = await api.get("/admin/stats");
        if (statsRes?.status === "success" && statsRes.data) {
          setStats(statsRes.data);
        } else {
          // Fallback: fetch individual counts
          const [bookingsRes, packagesRes, destsRes] = await Promise.all([
            api.get("/bookings/all?limit=1&includeInactive=true"),
            api.get("/packages?limit=1"),
            api.get("/destinations?limit=1"),
          ]);
          setStats({
            totalBookings: bookingsRes?.total || 0,
            totalRevenue: 0,
            totalUsers: 0,
            totalPackages: packagesRes?.total || 0,
            totalDestinations: destsRes?.total || 0,
            pendingBookings: 0,
            pendingReviews: 0,
            newEnquiries: 0,
          });
        }

        // Fetch recent bookings using admin all-bookings endpoint
        const bookingsRes = await api.get("/bookings/all?limit=5&includeInactive=true&sort=-createdAt");
        setRecentBookings(bookingsRes?.data?.slice(0, 5) || []);

        // Fetch CRM stats (non-blocking)
        try {
          const crmRes = await api.get(`/enquiries/stats?period=${pipelinePeriod}`);
          if (crmRes?.status === "success" && crmRes.data) {
            setCrmStats(crmRes.data);
          }
        } catch {
          // CRM stats are optional — don't block dashboard
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [pipelinePeriod]);

  const statCards = [
    { label: "Total Bookings", value: stats?.totalBookings || 0, icon: <CalendarCheck size={22} />, color: "bg-cyan-50 text-cyan-600", href: "/bookings" },
    { label: "Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: <DollarSign size={22} />, color: "bg-emerald-50 text-emerald-600", href: "/bookings" },
    { label: "Users", value: stats?.totalUsers || 0, icon: <Users size={22} />, color: "bg-violet-50 text-violet-600", href: "/users" },
    { label: "Packages", value: stats?.totalPackages || 0, icon: <Package size={22} />, color: "bg-amber-50 text-amber-600", href: "/packages" },
    { label: "Destinations", value: stats?.totalDestinations || 0, icon: <MapPin size={22} />, color: "bg-rose-50 text-rose-600", href: "/destinations" },
    { label: "Enquiries", value: stats?.newEnquiries || 0, icon: <MessageSquare size={22} />, color: "bg-blue-50 text-blue-600", href: "/enquiries" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    "staff-confirmed": "bg-blue-100 text-blue-700",
    "vendor-confirmed": "bg-indigo-100 text-indigo-700",
    confirmed: "bg-cyan-100 text-cyan-700",
    "in-progress": "bg-purple-100 text-purple-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    "staff-confirmed": "Staff Confirmed",
    "vendor-confirmed": "Vendor Confirmed",
    confirmed: "Confirmed",
    "in-progress": "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all"
          >
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* CRM Sales Pipeline Widget */}
      {crmStats && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-cyan-600" />
              <h2 className="text-base font-semibold text-slate-900">Sales Pipeline</h2>
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium ml-2">
                <button
                  type="button"
                  onClick={() => setPipelinePeriod("month")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    pipelinePeriod === "month"
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  This month
                </button>
                <button
                  type="button"
                  onClick={() => setPipelinePeriod("all")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    pipelinePeriod === "all"
                      ? "bg-white text-slate-900 shadow-sm font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All time
                </button>
              </div>
            </div>
            <Link href="/enquiries" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
              View all →
            </Link>
          </div>
          <div className="p-5">
            {/* Stage counts */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              {[
                { key: "new", label: "New", color: "text-blue-600 bg-blue-50 border border-blue-100/60", href: "/enquiries?status=new" },
                { key: "in-progress", label: "In Progress", color: "text-amber-600 bg-amber-50 border border-amber-100/60", href: "/enquiries?status=in-progress,assigned,responded,whatsapp-sent,negotiation,ytc" },
                { key: "follow-up", label: "Follow-Up", color: "text-purple-600 bg-purple-50 border border-purple-100/60", href: "/enquiries?status=follow-up,callback-scheduled,callback-requested,dnp,busy" },
                { key: "converted", label: "Converted", color: "text-emerald-600 bg-emerald-50 border border-emerald-100/60", href: "/enquiries?status=converted" },
                { key: "closed", label: "Closed", color: "text-slate-500 bg-slate-50 border border-slate-100/60", href: "/enquiries?status=closed,resolved" },
              ].map((stage) => (
                <Link
                  key={stage.key}
                  href={stage.href}
                  className={`rounded-xl p-3 text-center hover:opacity-85 hover:shadow-sm transition-all ${stage.color}`}
                >
                  <p className="text-2xl font-bold">{crmStats.byStatus[stage.key] || 0}</p>
                  <p className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide">{stage.label}</p>
                </Link>
              ))}
            </div>
            {/* Metrics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400">Conversion Rate</p>
                <p className="text-lg font-bold text-slate-800">{crmStats.conversionRate}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Avg. Close Time</p>
                <p className="text-lg font-bold text-slate-800">{crmStats.avgDaysToConvert} days</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">CRM Revenue</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(crmStats.totalConversionValue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Follow-ups Today</p>
                <Link href="/enquiries?tab=follow-ups" className="flex items-center gap-1 group">
                  <p className={`text-lg font-bold ${crmStats.followUpsDueToday > 0 ? "text-purple-600" : "text-slate-400"}`}>
                    {crmStats.followUpsDueToday}
                  </p>
                  {crmStats.followUpsDueToday > 0 && (
                    <ArrowRight size={14} className="text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Bookings</h2>
          <Link href="/bookings" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50/60">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Package</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => {
                  const customerName =
                    [booking.primaryTraveller?.firstName, booking.primaryTraveller?.lastName].filter(Boolean).join(" ") ||
                    [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(" ") ||
                    "Guest Traveller";
                  const customerEmail =
                    booking.primaryTraveller?.email || booking.user?.email || "";
                  const pkgName =
                    booking.package?.name || booking.packageName || booking.destination?.name || "Custom Tour Package";
                  const bookingCode =
                    booking.bookingId || String(booking._id).slice(-6).toUpperCase();
                  const currentStatus =
                    booking.bookingStatus || booking.status || "pending";

                  return (
                    <tr key={booking._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/bookings?search=${encodeURIComponent(bookingCode)}`} className="block group-hover:text-cyan-600">
                          <p className="text-sm font-semibold text-slate-800">
                            {customerName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-cyan-700 font-semibold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">
                              #{bookingCode}
                            </span>
                            {customerEmail && (
                              <span className="text-xs text-slate-400 truncate max-w-[180px]">{customerEmail}</span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-[220px]">
                        <p className="font-medium text-slate-700 truncate" title={pkgName}>{pkgName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(booking.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            statusColors[currentStatus] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabels[currentStatus] || currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(booking.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Add Destination", href: "/destinations/new", icon: <MapPin size={18} />, color: "text-cyan-600" },
          { label: "Add Package", href: "/packages/new", icon: <Package size={18} />, color: "text-emerald-600" },
          { label: "Moderate Reviews", href: "/reviews", icon: <Star size={18} />, color: "text-amber-600" },
          { label: "View Analytics", href: "/activity", icon: <TrendingUp size={18} />, color: "text-violet-600" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-4 hover:shadow-sm hover:border-slate-300 transition-all"
          >
            <span className={action.color}>{action.icon}</span>
            <span className="text-sm font-medium text-slate-700">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
