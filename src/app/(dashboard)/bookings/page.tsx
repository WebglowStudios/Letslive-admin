"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Booking } from "@/types";
import { Search, Filter } from "lucide-react";
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
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`/bookings?${params}`);
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
      await api.put(`/bookings/${id}`, { status });
      fetchBookings();
    } catch {
      alert("Failed to update status");
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-cyan-100 text-cyan-700",
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
                  {canUpdate && <th className="px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No bookings found</td></tr>
                ) : (
                  bookings.map((b) => {
                    const user = typeof b.user === "object" ? b.user : null;
                    const pkg = typeof b.package === "object" ? b.package : null;
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
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[b.status] || ""}`}>
                            {b.status}
                          </span>
                        </td>
                        {canUpdate && (
                          <td className="px-6 py-4">
                            <select
                              value={b.status}
                              onChange={(e) => updateStatus(b._id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        )}
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
