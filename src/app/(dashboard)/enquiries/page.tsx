"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Search, Filter, MessageSquare, User, Clock } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/stores/authStore";

interface Enquiry {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  type: string;
  message?: string;
  packageName?: string;
  destination?: string;
  travelDate?: string;
  status: string;
  priority: string;
  assignedTo?: { _id: string; firstName: string; lastName: string };
  notes?: { text: string; by?: { firstName: string; lastName: string }; date: string }[];
  createdAt: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const canSeeAll = usePermission("enquiries.respond"); // manager+ can see all
  const user = useAuthStore((s) => s.user);
  const isStaffOnly = user?.role === "staff";

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  async function fetchEnquiries() {
    setLoading(true);
    try {
      // Staff sees /mine, admin/manager sees /all
      const endpoint = isStaffOnly ? "/enquiries/mine" : "/enquiries";
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`${endpoint}?${params}`);
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
      setEnquiries((prev) => prev.map((e) => e._id === id ? { ...e, status } : e));
    } catch {
      alert("Failed to update");
    }
  }

  async function updatePriority(id: string, priority: string) {
    try {
      await api.put(`/enquiries/${id}`, { priority });
      setEnquiries((prev) => prev.map((e) => e._id === id ? { ...e, priority } : e));
    } catch {
      alert("Failed to update");
    }
  }

  async function addNote(id: string) {
    const text = noteText[id]?.trim();
    if (!text) return;
    try {
      const res = await api.put(`/enquiries/${id}`, { note: text });
      if (res?.data) {
        setEnquiries((prev) => prev.map((e) => e._id === id ? res.data : e));
      }
      setNoteText((prev) => ({ ...prev, [id]: "" }));
    } catch {
      alert("Failed to add note");
    }
  }

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    assigned: "bg-indigo-100 text-indigo-700",
    "in-progress": "bg-amber-100 text-amber-700",
    "follow-up": "bg-purple-100 text-purple-700",
    converted: "bg-emerald-100 text-emerald-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-slate-100 text-slate-600",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    urgent: "bg-red-100 text-red-700",
  };

  const statuses = ["all", "new", "assigned", "in-progress", "follow-up", "converted", "resolved", "closed"];

  return (
    <RoleGuard permission="enquiries.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isStaffOnly ? "My Enquiries" : "All Enquiries"}
            </h2>
            <p className="text-xs text-slate-400">
              {isStaffOnly ? "Enquiries assigned to you via round-robin" : "All incoming enquiries across the team"}
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {enquiries.length} enquir{enquiries.length === 1 ? "y" : "ies"}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === s ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s === "all" ? "All" : s.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Enquiry Cards */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400">Loading...</div>
          ) : enquiries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <MessageSquare size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No enquiries found</p>
            </div>
          ) : (
            enquiries.map((e) => (
              <div key={e._id} className="bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-sm">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-800">{e.firstName} {e.lastName || ""}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityColors[e.priority] || ""}`}>
                        {e.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{e.email} • {e.phone}</p>
                    {e.packageName && <p className="text-xs text-cyan-600 mt-1 font-medium">📦 {e.packageName}</p>}
                    {e.destination && <p className="text-xs text-slate-400">📍 {e.destination}</p>}
                    {e.travelDate && <p className="text-xs text-slate-400">📅 Travel: {formatDate(e.travelDate)}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${statusColors[e.status] || ""}`}>
                      {e.status.replace("-", " ")}
                    </span>
                    {e.assignedTo && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User size={10} /> {e.assignedTo.firstName} {e.assignedTo.lastName}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-300 flex items-center gap-1">
                      <Clock size={10} /> {formatDate(e.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Message */}
                {e.message && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 mb-3 leading-relaxed">{e.message}</p>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={e.status}
                    onChange={(ev) => updateStatus(e._id, ev.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                  >
                    <option value="new">New</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="follow-up">Follow Up</option>
                    <option value="converted">Converted</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={e.priority}
                    onChange={(ev) => updatePriority(e._id, ev.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    onClick={() => setExpanded(expanded === e._id ? null : e._id)}
                    className="text-xs text-cyan-600 font-medium hover:underline"
                  >
                    {expanded === e._id ? "Hide Notes" : `Notes (${e.notes?.length || 0})`}
                  </button>
                  <Link href={`/itineraries/new?enquiryId=${e._id}`} className="text-xs text-emerald-600 font-medium hover:underline">
                    Create Itinerary
                  </Link>
                </div>

                {/* Expanded Notes */}
                {expanded === e._id && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {e.notes && e.notes.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {e.notes.map((note, i) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <span className="text-slate-400 shrink-0">{note.by ? `${note.by.firstName}:` : "Staff:"}</span>
                            <span className="text-slate-600">{note.text}</span>
                            <span className="text-slate-300 ml-auto shrink-0">{formatDate(note.date)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteText[e._id] || ""}
                        onChange={(ev) => setNoteText({ ...noteText, [e._id]: ev.target.value })}
                        onKeyDown={(ev) => ev.key === "Enter" && addNote(e._id)}
                        placeholder="Add a note..."
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button
                        onClick={() => addNote(e._id)}
                        className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
