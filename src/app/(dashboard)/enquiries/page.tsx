"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Enquiry } from "@/types";
import { formatDate } from "@/lib/utils";
import { Search, Filter, MessageSquare } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const canRespond = usePermission("enquiries.respond");

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  async function fetchEnquiries() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`/enquiries?${params}`);
      setEnquiries(res?.data || []);
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await api.put(`/enquiries/${id}`, { status });
      setEnquiries((prev) => prev.map((e) => e._id === id ? { ...e, status: status as Enquiry["status"] } : e));
    } catch {
      alert("Failed to update");
    }
  }

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    "in-progress": "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-slate-100 text-slate-600",
  };

  return (
    <RoleGuard permission="enquiries.view">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search enquiries..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {["all", "new", "in-progress", "resolved", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  statusFilter === s ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400">Loading...</div>
          ) : enquiries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
              No enquiries found
            </div>
          ) : (
            enquiries.map((e) => (
              <div key={e._id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MessageSquare size={16} className="text-cyan-600" />
                      <p className="text-sm font-medium text-slate-700">{e.name}</p>
                      <span className="text-xs text-slate-400">• {e.email}</span>
                    </div>
                    {e.subject && <p className="text-sm font-medium text-slate-600 mb-1">{e.subject}</p>}
                    <p className="text-sm text-slate-500 leading-relaxed">{e.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{formatDate(e.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[e.status] || ""}`}>
                      {e.status}
                    </span>
                    {canRespond && (
                      <select
                        value={e.status}
                        onChange={(ev) => updateStatus(e._id, ev.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      >
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
