"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Filter, Plus, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";

interface OperationItem {
  _id: string;
  operationId: string;
  customer: { name: string; email: string; pax: number };
  destination: string;
  travelDates: { start: string; end: string };
  assignedTo?: { firstName: string; lastName: string };
  sellingPrice: number;
  totalVendorCost: number;
  grossProfit: number;
  profitPercentage: number;
  status: string;
  createdAt: string;
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOperations();
  }, [statusFilter]);

  async function fetchOperations() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`/operations?${params}`);
      setOperations(res?.data || []);
    } catch {
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    planning: "bg-blue-100 text-blue-700",
    booked: "bg-cyan-100 text-cyan-700",
    "in-progress": "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const filtered = operations.filter((op) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      op.operationId.toLowerCase().includes(q) ||
      op.customer.name.toLowerCase().includes(q) ||
      op.destination.toLowerCase().includes(q)
    );
  });

  return (
    <RoleGuard permission="bookings.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Operations</h1>
            <p className="text-xs text-slate-400">Post-sales trip management — flights, hotels, vendors, payments</p>
          </div>
          <div className="flex gap-2">
            <Link href="/operations/vendors" className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200">
              Vendors
            </Link>
            <Link href="/operations/finance" className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100">
              <AlertTriangle size={14} /> Finance
            </Link>
            <Link href="/operations/salesperson" className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100">
              Performance
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search size={16} className="text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, customer, destination..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            {["all", "planning", "booked", "in-progress", "completed"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${statusFilter === s ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {s === "all" ? "All" : s.replace("-", " ")}
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
                  <th className="px-5 py-3">Operation</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Travel Date</th>
                  <th className="px-5 py-3">Selling</th>
                  <th className="px-5 py-3">Vendor Cost</th>
                  <th className="px-5 py-3">Profit</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">Loading operations...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-400">No operations found. Confirm a booking to auto-create one.</td></tr>
                ) : (
                  filtered.map((op) => (
                    <tr key={op._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-cyan-700">{op.operationId}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(op.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">{op.customer.name}</p>
                        <p className="text-[10px] text-slate-400">{op.customer.pax} pax</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{op.destination}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{op.travelDates?.start ? formatDate(op.travelDates.start) : "—"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{formatCurrency(op.sellingPrice)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatCurrency(op.totalVendorCost)}</td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold" style={{ color: op.grossProfit >= 0 ? "#10b981" : "#ef4444" }}>
                          {formatCurrency(op.grossProfit)}
                        </div>
                        <div className="text-[10px] text-slate-400">{op.profitPercentage}% margin</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${statusColors[op.status] || "bg-slate-100 text-slate-600"}`}>
                          {op.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/operations/${op._id}`} className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 inline-flex">
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
