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
  user: { firstName: string; lastName: string; email: string };
  package: { name: string };
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsRes, usersRes, packagesRes, destsRes, reviewsRes, enquiriesRes] =
          await Promise.all([
            api.get("/bookings?limit=5&sort=-createdAt"),
            api.get("/users?limit=1"),
            api.get("/packages?limit=1"),
            api.get("/destinations?limit=1"),
            api.get("/reviews/featured"),
            api.get("/enquiries?limit=1"),
          ]);

        setStats({
          totalBookings: bookingsRes?.total || 0,
          totalRevenue: 0, // Would need a stats endpoint
          totalUsers: usersRes?.total || 0,
          totalPackages: packagesRes?.total || 0,
          totalDestinations: destsRes?.total || 0,
          pendingBookings: 0,
          pendingReviews: 0,
          newEnquiries: enquiriesRes?.total || 0,
        });

        setRecentBookings(bookingsRes?.data?.slice(0, 5) || []);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
    confirmed: "bg-cyan-100 text-cyan-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
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

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Bookings</h2>
          <Link href="/bookings" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                recentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {booking.user?.firstName} {booking.user?.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{booking.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">
                      {booking.package?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {formatCurrency(booking.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[booking.status] || "bg-slate-100 text-slate-600"}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(booking.createdAt)}
                    </td>
                  </tr>
                ))
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
