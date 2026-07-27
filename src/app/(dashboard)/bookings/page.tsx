"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Booking } from "@/types";
import { Search, Filter, ExternalLink } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";


export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const canUpdate = usePermission("bookings.update");

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (statusFilter !== "all") params.set("bookingStatus", statusFilter);
      const res = await api.get(`/bookings/all?${params}`);
      setBookings(res?.data || []);
      setTotalPages(res?.pages || 1);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.put(`/bookings/${id}/status`, { bookingStatus: status });
      fetchBookings();
    } catch {
      alert("Failed to update status");
    }
  }

  async function updatePaymentStatus(id: string, paymentStatus: string) {
    try {
      await api.put(`/bookings/${id}/status`, { paymentStatus });
      fetchBookings();
    } catch {
      alert("Failed to update payment status");
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-cyan-100 text-cyan-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <RoleGuard permission="bookings.view">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search bookings..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {["all", "pending", "confirmed", "completed", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Package</th>
                  <th className="px-6 py-3">Travel Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Payment</th>
                  {canUpdate && <th className="px-6 py-3">Actions</th>}
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No bookings found</td></tr>
                ) : (
                  bookings.map((b) => {
                    const user = typeof b.user === "object" ? b.user : null;
                    const pkg = typeof b.package === "object" ? b.package : null;
                    const bStatus = b.bookingStatus || b.status || "pending";
                    return (
                      <tr key={b._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700">{user ? `${user.firstName} ${user.lastName}` : "—"}</p>
                          <p className="text-xs text-slate-400">{user?.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-[180px] truncate">{pkg?.name || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(b.travelDate)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{formatCurrency(b.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[bStatus] || ""}`}>
                            {bStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            b.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" :
                            b.paymentStatus === "partial" ? "bg-blue-100 text-blue-700" :
                            b.paymentStatus === "refunded" ? "bg-purple-100 text-purple-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {b.paymentStatus || "pending"}
                          </span>
                        </td>
                        {canUpdate && (
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <select
                                value={bStatus}
                                onChange={(e) => updateStatus(b._id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <select
                                value={b.paymentStatus || "pending"}
                                onChange={(e) => updatePaymentStatus(b._id, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                              >
                                <option value="pending">Pay: Pending</option>
                                <option value="partial">Pay: Partial</option>
                                <option value="paid">Pay: Paid</option>
                                <option value="refunded">Pay: Refunded</option>
                              </select>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <Link
                            href={`/bookings/${b._id}`}
                            className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                          >
                            View <ExternalLink size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40">Prev</button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 text-xs rounded-lg border border-slate-200 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
