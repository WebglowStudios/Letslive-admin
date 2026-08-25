"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Search, Filter, MessageSquare, User, Clock, Phone, Plus,
  AlertTriangle, Calendar, CheckSquare, Square, ChevronDown, Download, X
} from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/stores/authStore";
import { Enquiry } from "@/types";
import PhoneInput from "@/components/ui/PhoneInput";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  assigned: "bg-indigo-100 text-indigo-700",
  "in-progress": "bg-amber-100 text-amber-700",
  "follow-up": "bg-purple-100 text-purple-700",
  converted: "bg-emerald-100 text-emerald-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "💬", phone: "📞", website: "🌐",
  instagram: "📸", google: "🔍", referral: "🤝",
  "walk-in": "🚶", repeat: "🔄", other: "📋",
};

const ALL_STATUSES = ["all", "new", "assigned", "in-progress", "follow-up", "converted", "resolved", "closed"];
const ALL_CHANNELS = ["all", "website", "whatsapp", "phone", "walk-in", "instagram", "google", "referral"];

// ─── Manual Lead Modal ────────────────────────────────────────────────────────
function AddLeadModal({ onClose, onSave, staffList }: { onClose: () => void; onSave: () => void; staffList: { _id: string; firstName: string; lastName: string }[] }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    destination: "", packageName: "", message: "",
    channel: "phone", travelDate: "", travellerCount: "", budget: "",
    assignedTo: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.firstName || !form.email || !form.phone) {
      setError("First name, email and phone are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/enquiries/manual", {
        ...form,
        travellerCount: form.travellerCount ? Number(form.travellerCount) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        assignedTo: form.assignedTo || undefined,
      });
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Add Lead Manually</h3>
            <p className="text-xs text-slate-400">For walk-in / phone / WhatsApp leads</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
              <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
              <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
              <PhoneInput value={form.phone} onChange={(val) => set("phone", val)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
              <select value={form.channel} onChange={(e) => set("channel", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                {["phone", "whatsapp", "walk-in", "instagram", "google", "referral", "repeat", "other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
              <input value={form.destination} onChange={(e) => set("destination", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Maldives" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Package interested in</label>
            <input value={form.packageName} onChange={(e) => set("packageName", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Package name (optional)" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Travel Date</label>
              <input type="date" value={form.travelDate} onChange={(e) => set("travelDate", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Travellers</label>
              <input type="number" min="1" value={form.travellerCount} onChange={(e) => set("travellerCount", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Pax" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Budget (₹)</label>
              <input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Assign To (optional)</label>
            <select value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
              <option value="">Unassigned — admin will assign later</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Initial Notes</label>
            <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" placeholder="What did the customer ask about?" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50">
            {saving ? "Saving..." : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "follow-ups">("all");
  const [showAddLead, setShowAddLead] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");


  const canSeeAll = usePermission("enquiries.respond");
  const canBulk = usePermission("bookings.update"); // manager+
  const user = useAuthStore((s) => s.user);
  const isStaffOnly = user?.role === "staff";
  const isManager = user?.role === "admin" || user?.role === "manager";

  // Staff list for quick-assign dropdown (manager+ only)
  const [staffList, setStaffList] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "follow-ups") {
        const res = await api.get("/enquiries/follow-ups/today");
        setEnquiries(res?.data || []);
      } else {
        const endpoint = "/enquiries";
        const params = new URLSearchParams({ limit: "100" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (channelFilter !== "all") params.set("channel", channelFilter);
        if (search) params.set("search", search);
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
        const res = await api.get(`${endpoint}?${params}`);
        setEnquiries(res?.data || []);
      }
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, search, dateFrom, dateTo, activeTab, isStaffOnly]);


  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

  // Fetch staff list for quick-assign (manager+ only)
  useEffect(() => {
    if (!isManager) return;
    api.get("/users/staff").then((res) => {
      const list = res?.data || res || [];
      setStaffList(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [isManager]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === enquiries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(enquiries.map((e) => e._id)));
    }
  }

  async function quickAssign(enquiryId: string, staffId: string) {
    if (!staffId) return;
    try {
      await api.put(`/enquiries/${enquiryId}`, { assignedTo: staffId });
      fetchEnquiries();
    } catch {
      alert("Failed to assign enquiry");
    }
  }

  async function executeBulkAction() {
    if (!bulkAction || selected.size === 0) return;
    if (!confirm(`Apply "${bulkAction}" to ${selected.size} enquiries?`)) return;
    try {
      await api.post("/enquiries/bulk", {
        ids: Array.from(selected),
        action: bulkAction,
        payload: bulkAction === "close" ? { lostReason: "other" } : {},
      });
      setSelected(new Set());
      setBulkAction("");
      fetchEnquiries();
    } catch {
      alert("Bulk action failed");
    }
  }

  const followUpsDue = enquiries.filter((e) => {
    if (!e.followUpDate) return false;
    const today = new Date().toDateString();
    return new Date(e.followUpDate).toDateString() === today;
  }).length;

  return (
    <RoleGuard permission="enquiries.view">
      {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onSave={fetchEnquiries} staffList={staffList} />}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isStaffOnly ? "My Enquiries" : "All Enquiries"}
            </h2>
            <p className="text-xs text-slate-400">
              {isStaffOnly ? "Enquiries assigned to you" : "Full CRM pipeline — all incoming leads"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{enquiries.length} lead{enquiries.length !== 1 ? "s" : ""}</span>
            {!isStaffOnly && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/enquiries/export`}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Download size={13} /> Export CSV
              </a>
            )}
            <button
              onClick={() => setShowAddLead(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700"
            >
              <Plus size={13} /> Add Lead
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          {[
            { id: "all", label: "All Enquiries" },
            { id: "follow-ups", label: `Follow-ups Today${followUpsDue > 0 ? ` (${followUpsDue})` : ""}` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "all" | "follow-ups")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-cyan-600 text-cyan-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        {activeTab === "all" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[220px] max-w-sm">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, email, phone, package..."
                className="bg-transparent border-none outline-none text-sm w-full"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); }}><X size={13} className="text-slate-400" /></button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-slate-400" />
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                    statusFilter === s ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s === "all" ? "All" : s.replace("-", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              {ALL_CHANNELS.slice(1).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannelFilter(channelFilter === c ? "all" : c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                    channelFilter === c ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {CHANNEL_ICONS[c]} {c}
                </button>
              ))}
            </div>

            {/* Date range filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Date:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="flex items-center gap-0.5 text-[11px] text-red-500 hover:text-red-700"
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bulk action bar */}
        {selected.size > 0 && canBulk && (
          <div className="flex items-center gap-3 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3">
            <span className="text-sm font-semibold text-cyan-700">{selected.size} selected</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Choose action...</option>
              <option value="mark-follow-up">Mark as Follow-up</option>
              <option value="close">Close (No Response)</option>
            </select>
            <button
              onClick={executeBulkAction}
              disabled={!bulkAction}
              className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-cyan-700"
            >
              Apply
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-700 ml-auto">
              Clear selection
            </button>
          </div>
        )}

        {/* Enquiry Cards */}
        <div className="space-y-2.5">
          {/* Select all row */}
          {!isStaffOnly && enquiries.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700">
                {selected.size === enquiries.length
                  ? <CheckSquare size={16} className="text-cyan-600" />
                  : <Square size={16} />
                }
              </button>
              <span className="text-xs text-slate-400">Select all</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400">Loading...</div>
          ) : enquiries.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <MessageSquare size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                {activeTab === "follow-ups" ? "No follow-ups due today 🎉" : "No enquiries found"}
              </p>
            </div>
          ) : (
            enquiries.map((e) => (
              <div key={e._id} className="flex items-start gap-3">
                {/* Checkbox */}
                {!isStaffOnly && (
                  <button
                    onClick={() => toggleSelect(e._id)}
                    className="mt-4 shrink-0 text-slate-400 hover:text-cyan-600"
                  >
                    {selected.has(e._id)
                      ? <CheckSquare size={16} className="text-cyan-600" />
                      : <Square size={16} />
                    }
                  </button>
                )}

                {/* Card — click to navigate to detail */}
                <Link
                  href={`/enquiries/${e._id}`}
                  className="flex-1 bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-md hover:border-slate-300 block"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{e.firstName} {e.lastName || ""}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${PRIORITY_COLORS[e.priority] || ""}`}>
                          {e.priority}
                        </span>
                        {/* DNP badge */}
                        {e.dnpCount > 0 && (
                          <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            e.dnpCount >= 6 ? "bg-red-100 text-red-700" :
                            e.dnpCount >= 3 ? "bg-orange-100 text-orange-700" :
                            "bg-orange-50 text-orange-600"
                          }`}>
                            <Phone size={9} /> DNP {e.dnpCount}
                          </span>
                        )}
                        {e.channel && (
                          <span className="text-[10px] text-slate-400">{CHANNEL_ICONS[e.channel] || "📋"} {e.channel}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{e.email} · {e.phone}</p>
                      {e.packageName && <p className="text-xs text-cyan-600 mt-1 font-medium">📦 {e.packageName}</p>}
                      {e.destination && <p className="text-xs text-slate-400">📍 {e.destination}</p>}
                      {e.travelDate && <p className="text-xs text-slate-400">📅 Travel: {formatDate(e.travelDate)}</p>}
                      {e.followUpDate && (
                        <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                          <Calendar size={10} /> Follow-up: {formatDate(e.followUpDate)}
                          {e.followUpNotes && <span className="text-slate-400">— {e.followUpNotes}</span>}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${STATUS_COLORS[e.status] || ""}`}>
                        {e.status.replace("-", " ")}
                      </span>
                      {e.assignedTo && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <User size={10} /> {e.assignedTo.firstName} {e.assignedTo.lastName}
                        </span>
                      )}
                      {/* Unassigned badge + quick-assign for managers */}
                      {!e.assignedTo && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <User size={9} /> Unassigned
                          </span>
                          {isManager && staffList.length > 0 && (
                            <div onClick={(ev) => ev.preventDefault()}>
                              <select
                                defaultValue=""
                                onChange={(ev) => {
                                  ev.stopPropagation();
                                  const staffId = ev.target.value;
                                  if (staffId) quickAssign(e._id, staffId);
                                }}
                                className="text-[10px] border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-600 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[130px]"
                              >
                                <option value="">Assign to...</option>
                                {staffList.map((s) => (
                                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-[10px] text-slate-300 flex items-center gap-1">
                        <Clock size={10} /> {formatDate(e.createdAt)}
                      </span>
                      {e.conversionValue && (
                        <span className="text-[10px] text-emerald-600 font-bold">
                          ₹{e.conversionValue.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message preview */}
                  {e.message && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-2 leading-relaxed line-clamp-2">
                      {e.message}
                    </p>
                  )}

                  {/* Footer row */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="capitalize">{e.type?.replace("-", " ")}</span>
                    {e.notes?.length > 0 && <span>💬 {e.notes.length} note{e.notes.length > 1 ? "s" : ""}</span>}
                    {e.callLog?.length > 0 && <span>📞 {e.callLog.length} call{e.callLog.length > 1 ? "s" : ""}</span>}
                    {e.budget && <span>💰 Budget: ₹{e.budget.toLocaleString("en-IN")}</span>}
                    {e.travellerCount && <span>👥 {e.travellerCount} pax</span>}
                    <span className="ml-auto text-cyan-600 font-medium text-[11px]">View details →</span>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
