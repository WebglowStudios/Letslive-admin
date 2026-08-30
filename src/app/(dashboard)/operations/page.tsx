"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Filter, Plus, Eye, AlertTriangle, Trash2, X } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { useAuthStore } from "@/stores/authStore";

interface OperationItem {
  _id: string;
  operationId: string;
  customer: { name: string; email: string; pax: number };
  destination: string;
  travelDates: { start: string; end: string };
  assignedTo?: { firstName: string; lastName: string };
  sellingPrice: number;
  effectiveSelling?: number;   // live total billed (from CustomerPayments)
  totalReceived?: number;      // live total received
  totalVendorCost: number;
  grossProfit: number;
  profitPercentage: number;
  pendingPayment?: number;
  status: string;
  createdAt: string;
}

export default function OperationsPage() {
  const [operations, setOperations] = useState<OperationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [pendingIncentivesOnly, setPendingIncentivesOnly] = useState(false);
  const [search, setSearch] = useState("");
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchOperations();
  }, [statusFilter, hasPendingPayment, pendingIncentivesOnly]);

  async function fetchOperations() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all" && !pendingIncentivesOnly) params.set("status", statusFilter);
      if (hasPendingPayment) params.set("hasPendingPayment", "true");
      if (pendingIncentivesOnly) params.set("incentiveStatus", "pending");
      const res = await api.get(`/operations?${params}`);
      setOperations(res?.data || []);
    } catch {
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(id: string) {
    setOperationToDelete(id);
    setDeleteReason("");
    setDeleteModalOpen(true);
  }

  async function executeDelete() {
    if (!operationToDelete) return;
    if (!deleteReason.trim()) {
      alert("A reason is required to delete an operation.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await api.del(`/operations/${operationToDelete}`, { body: JSON.stringify({ reason: deleteReason }) });
      if (res?.status === "success" || !res) {
        setDeleteModalOpen(false);
        setOperationToDelete(null);
        setDeleteReason("");
        fetchOperations();
      } else {
        alert("Failed to delete operation");
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete operation");
    } finally {
      setIsDeleting(false);
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
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} />
                <h2 className="font-bold">Delete Operation</h2>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to delete this operation? This will permanently remove all associated vendor payments, customer payments, and records.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Reason for Deletion <span className="text-red-500">*</span></label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="E.g., Customer cancelled trip, duplicate operation..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[80px]"
                ></textarea>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex items-center gap-3 justify-end">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                disabled={isDeleting || !deleteReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0">
            <button onClick={() => setHasPendingPayment(!hasPendingPayment)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${hasPendingPayment ? "bg-amber-100 text-amber-700 border-amber-200 border" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {hasPendingPayment ? "Clear Unpaid" : "Show Unpaid"}
            </button>
            {isAdmin && (
              <button 
                onClick={() => { setPendingIncentivesOnly(!pendingIncentivesOnly); if(!pendingIncentivesOnly) setStatusFilter("all"); }} 
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pendingIncentivesOnly ? "bg-indigo-100 text-indigo-700 border-indigo-200 border" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {pendingIncentivesOnly ? "Clear Incentives Filter" : "Pending Incentives"}
              </button>
            )}
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <Filter size={14} className="text-slate-400" />
            {["all", "planning", "booked", "in-progress", "completed"].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPendingIncentivesOnly(false); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${statusFilter === s && !pendingIncentivesOnly ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
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
                  <th className="px-5 py-3">Billed</th>
                  <th className="px-5 py-3">Received</th>
                  <th className="px-5 py-3">Pending</th>
                  <th className="px-5 py-3">Vendor Cost</th>
                  <th className="px-5 py-3">Profit</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-400">Loading operations...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-5 py-12 text-center text-sm text-slate-400">No operations found. Confirm a booking to auto-create one.</td></tr>
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
                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">{formatCurrency(op.effectiveSelling ?? op.sellingPrice)}</td>
                      <td className="px-5 py-4">
                        {op.totalReceived !== undefined && op.totalReceived > 0 ? (
                          <div className="text-sm font-bold text-emerald-600">{formatCurrency(op.totalReceived)}</div>
                        ) : (
                          <div className="text-sm text-slate-400">—</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {op.pendingPayment !== undefined && op.pendingPayment > 0 ? (
                          <div className="text-sm font-bold text-amber-600">{formatCurrency(op.pendingPayment)}</div>
                        ) : (
                          <div className="text-sm text-emerald-500 font-medium">All Paid</div>
                        )}
                      </td>
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
                        <div className="flex items-center gap-2">
                          <Link href={`/operations/${op._id}`} className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 inline-flex">
                            <Eye size={16} />
                          </Link>
                          {isAdmin && (
                            <button onClick={() => confirmDelete(op._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete Operation">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
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
