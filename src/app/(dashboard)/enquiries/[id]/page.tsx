"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Enquiry } from "@/types";
import {
  Phone, Mail, MapPin, Package, Calendar, Users, DollarSign,
  Tag, User, ArrowLeft, MessageSquare, PhoneCall, PhoneOff,
  MessageCircle, Clock, CheckCircle, AlertTriangle, ChevronDown,
  Save, Plus, X, ExternalLink, RefreshCw, UserPlus, Send, Copy, Trash2
} from "lucide-react";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { usePermission } from "@/hooks/usePermission";
import RoleGuard from "@/components/guards/RoleGuard";

// ─── Constants ────────────────────────────────────────────────────────────────
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
  low: "text-slate-500 bg-slate-100",
  medium: "text-blue-600 bg-blue-100",
  high: "text-amber-700 bg-amber-100",
  urgent: "text-red-700 bg-red-100",
};

const CALL_OUTCOME_ICONS: Record<string, string> = {
  answered: "✅",
  dnp: "📵",
  busy: "📶",
  "whatsapp-sent": "💬",
  "email-sent": "📧",
  "callback-scheduled": "📅",
};

const CALL_OUTCOME_COLORS: Record<string, string> = {
  answered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  dnp: "bg-orange-50 text-orange-700 border-orange-200",
  busy: "bg-amber-50 text-amber-700 border-amber-200",
  "whatsapp-sent": "bg-green-50 text-green-700 border-green-200",
  "email-sent": "bg-blue-50 text-blue-700 border-blue-200",
  "callback-scheduled": "bg-purple-50 text-purple-700 border-purple-200",
};

// ─── DNP Dots ─────────────────────────────────────────────────────────────────
function DnpDots({ count }: { count: number }) {
  const max = 6;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 transition-all ${
              i < count
                ? count >= 6 ? "bg-red-500 border-red-500"
                  : count >= 3 ? "bg-orange-500 border-orange-500"
                  : "bg-amber-400 border-amber-400"
                : "border-slate-300 bg-white"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-bold ${
        count >= 6 ? "text-red-600" : count >= 3 ? "text-orange-600" : count > 0 ? "text-amber-600" : "text-slate-400"
      }`}>
        {count === 0 ? "Not called yet" : `DNP ${count}${count >= 6 ? "+" : ""} / 6`}
      </span>
    </div>
  );
}

// ─── Log Call Modal ───────────────────────────────────────────────────────────
function LogCallModal({ enquiryId, onClose, onSave }: { enquiryId: string; onClose: () => void; onSave: () => void }) {
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const outcomes = [
    { value: "answered", label: "Answered", icon: "✅", desc: "Customer picked up and we spoke" },
    { value: "dnp", label: "DNP", icon: "📵", desc: "Did not pick up" },
    { value: "busy", label: "Busy", icon: "📶", desc: "Line was busy" },
    { value: "whatsapp-sent", label: "WhatsApp Sent", icon: "💬", desc: "Sent a WhatsApp message" },
    { value: "email-sent", label: "Email Sent", icon: "📧", desc: "Sent a follow-up email" },
    { value: "callback-scheduled", label: "Callback Scheduled", icon: "📅", desc: "Customer asked for callback" },
  ];

  async function handleSave() {
    if (!outcome) return;
    setSaving(true);
    try {
      await api.post(`/enquiries/${enquiryId}/call`, { outcome, notes: notes || undefined });
      onSave();
      onClose();
    } catch {
      alert("Failed to log call");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Log a Call</h3>
            <p className="text-xs text-slate-400">Record what happened in this interaction</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Call Outcome</p>
          <div className="grid grid-cols-2 gap-2">
            {outcomes.map((o) => (
              <button
                key={o.value}
                onClick={() => setOutcome(o.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  outcome === o.value
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-xl">{o.icon}</span>
                <p className="text-xs font-semibold text-slate-700 mt-1">{o.label}</p>
                <p className="text-[10px] text-slate-400">{o.desc}</p>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What was discussed, any commitments made..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!outcome || saving}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Log Call"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mark Lost Modal ──────────────────────────────────────────────────────────
function MarkLostModal({ enquiryId, onClose, onSave }: { enquiryId: string; onClose: () => void; onSave: () => void }) {
  const [lostReason, setLostReason] = useState("not-responding");
  const [saving, setSaving] = useState(false);

  const reasons = [
    { value: "no-budget", label: "No Budget" },
    { value: "went-elsewhere", label: "Went Elsewhere" },
    { value: "not-responding", label: "Not Responding" },
    { value: "not-interested", label: "Not Interested" },
    { value: "timing", label: "Bad Timing" },
    { value: "other", label: "Other" },
  ];

  async function handleSave() {
    setSaving(true);
    try {
      await api.put(`/enquiries/${enquiryId}`, { status: "closed", lostReason });
      onSave();
      onClose();
    } catch {
      alert("Failed to close enquiry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Mark as Lost</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-slate-500">Why is this lead being closed?</p>
          <div className="space-y-2">
            {reasons.map((r) => (
              <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="lostReason"
                  value={r.value}
                  checked={lostReason === r.value}
                  onChange={() => setLostReason(r.value)}
                  className="accent-cyan-600"
                />
                <span className="text-sm text-slate-700">{r.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-40"
          >
            {saving ? "Closing..." : "Close Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Customer Account Modal ───────────────────────────────────────────
function CreateAccountModal({
  enquiry,
  onClose,
  onCreated,
}: {
  enquiry: Enquiry;
  onClose: () => void;
  onCreated: (email: string, password: string) => void;
}) {
  const [form, setForm] = useState({
    firstName: enquiry.firstName || "",
    lastName: enquiry.lastName || "",
    email: enquiry.email || "",
    phone: enquiry.phone || "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState("");

  function generatePassword() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
    let pwd = "";
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  async function handleCreate() {
    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email and password are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/staff", {
        ...form,
        role: "user",
        enquiryId: enquiry._id,
      });
      setCreated({ email: form.email, password: form.password });
      onCreated(form.email, form.password);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Create Customer Account</h3>
            <p className="text-xs text-slate-400">Pre-filled from enquiry — edit if needed</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        {created ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <UserPlus size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Account Created!</p>
                <p className="text-xs text-slate-400">Share these credentials with the customer</p>
              </div>
            </div>
            {[{ label: "Email", value: created.email, key: "email" }, { label: "Password", value: created.password, key: "pwd" }].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                  <p className="text-sm font-mono font-medium text-slate-700">{item.value}</p>
                </div>
                <button onClick={() => copyText(item.value, item.key)} className="p-2 hover:bg-slate-200 rounded-lg">
                  <Copy size={14} className={copied === item.key ? "text-emerald-600" : "text-slate-400"} />
                </button>
              </div>
            ))}
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-700">
              Login at: <strong>www.letslivetours.com/login</strong>
            </div>
            <button onClick={onClose} className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                <input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">Password *</label>
                <button type="button" onClick={() => setForm({...form, password: generatePassword()})} className="text-[10px] text-cyan-600 hover:text-cyan-700 font-semibold">Generate</button>
              </div>
              <input type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 disabled:opacity-40 flex items-center justify-center gap-2">
                <UserPlus size={14} /> {saving ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EnquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [staffList, setStaffList] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogCall, setShowLogCall] = useState(false);
  const [showMarkLost, setShowMarkLost] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [tagInput, setTagInput] = useState("");


  const user = useAuthStore((s) => s.user);
  const canRespond = usePermission("enquiries.respond");
  const isManager = user?.role === "admin" || user?.role === "manager";


  const fetchEnquiry = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/enquiries/${id}`);
      const data = res?.data || res;
      setEnquiry(data);
      if (data.followUpDate) {
        setFollowUpDate(data.followUpDate.slice(0, 10));
        setFollowUpNotes(data.followUpNotes || "");
      }
    } catch {
      router.push("/enquiries");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchEnquiry(); }, [fetchEnquiry]);

  // Fetch staff list for reassign dropdown (manager+ only)
  useEffect(() => {
    if (!isManager) return;
    api.get("/users/staff").then((res) => {
      const list = res?.data || res || [];
      setStaffList(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [isManager]);

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.put(`/enquiries/${id}`, { note: noteText.trim() });
      setNoteText("");
      fetchEnquiry();
    } catch { alert("Failed to add note"); }
    finally { setSavingNote(false); }
  }

  async function updateStatus(status: string) {
    if (status === "closed") { setShowMarkLost(true); return; }
    setSavingStatus(true);
    try {
      await api.put(`/enquiries/${id}`, { status });
      fetchEnquiry();
    } catch { alert("Failed to update status"); }
    finally { setSavingStatus(false); }
  }

  async function updatePriority(priority: string) {
    try {
      await api.put(`/enquiries/${id}`, { priority });
      fetchEnquiry();
    } catch { alert("Failed to update priority"); }
  }

  async function reassignTo(staffId: string) {
    if (!staffId) return;
    setReassigning(true);
    try {
      await api.put(`/enquiries/${id}`, { assignedTo: staffId });
      fetchEnquiry();
    } catch { alert("Failed to reassign"); }
    finally { setReassigning(false); }
  }

  async function addTag(tag: string) {
    const clean = tag.trim().toLowerCase();
    if (!clean || !enquiry) return;
    if (enquiry.tags?.includes(clean)) return;
    const newTags = [...(enquiry.tags || []), clean];
    try {
      await api.put(`/enquiries/${id}`, { tags: newTags });
      fetchEnquiry();
    } catch { /* silent */ }
  }

  async function removeTag(tag: string) {
    if (!enquiry) return;
    const newTags = (enquiry.tags || []).filter((t) => t !== tag);
    try {
      await api.put(`/enquiries/${id}`, { tags: newTags });
      fetchEnquiry();
    } catch { /* silent */ }
  }

  async function saveFollowUp() {
    setSavingFollowUp(true);
    setFollowUpSaved(false);
    try {
      await api.put(`/enquiries/${id}`, { followUpDate, followUpNotes });
      fetchEnquiry();
      setFollowUpSaved(true);
      setTimeout(() => setFollowUpSaved(false), 3000);
    } catch { alert("Failed to save follow-up"); }
    finally { setSavingFollowUp(false); }
  }

  // Build timeline: notes + call logs + creation event, sorted chronologically
  function buildTimeline() {
    if (!enquiry) return [];
    const items: { type: string; date: string; text: string; by?: string; meta?: Record<string, unknown> }[] = [];

    // Creation
    items.push({ type: "created", date: enquiry.createdAt, text: `Enquiry received via ${enquiry.source || "website"}` });

    // Notes
    for (const note of enquiry.notes || []) {
      items.push({
        type: "note",
        date: note.date,
        text: note.text,
        by: note.by ? `${note.by.firstName} ${note.by.lastName}` : undefined,
      });
    }

    // Call logs
    for (const call of enquiry.callLog || []) {
      items.push({
        type: "call",
        date: call.attemptedAt,
        text: `Call: ${call.outcome.replace("-", " ")}${call.notes ? ` — "${call.notes}"` : ""}`,
        by: call.by ? `${call.by.firstName} ${call.by.lastName}` : undefined,
        meta: { outcome: call.outcome },
      });
    }

    // Sort newest first
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!enquiry) return null;

  const timeline = buildTimeline();
  const fullName = `${enquiry.firstName} ${enquiry.lastName || ""}`.trim();

  async function handleDelete() {
    if (window.confirm("Are you sure you want to permanently delete this enquiry? This action cannot be undone and will permanently remove this lead from the CRM.")) {
      try {
        await api.del(`/enquiries/${id}`);
        router.push("/enquiries");
      } catch (error) {
        console.error("Failed to delete enquiry:", error);
        alert("Failed to delete enquiry. Please try again.");
      }
    }
  }

  return (
    <RoleGuard permission="enquiries.view">
      {showLogCall && (
        <LogCallModal enquiryId={id} onClose={() => setShowLogCall(false)} onSave={fetchEnquiry} />
      )}
      {showMarkLost && (
        <MarkLostModal enquiryId={id} onClose={() => setShowMarkLost(false)} onSave={fetchEnquiry} />
      )}
      {showCreateAccount && enquiry && (
        <CreateAccountModal
          enquiry={enquiry}
          onClose={() => setShowCreateAccount(false)}
          onCreated={() => setShowCreateAccount(false)}
        />
      )}

      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/enquiries")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft size={15} /> Enquiries
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-700 font-medium">{fullName}</span>
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_COLORS[enquiry.status] || ""}`}>
              {enquiry.status.replace("-", " ")}
            </span>
          </div>

          {isManager && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
              title="Permanently delete this enquiry"
            >
              <Trash2 size={14} /> Delete Enquiry
            </button>
          )}
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-5">

          {/* ─── LEFT: Lead Info Panel ──────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Identity card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{fullName}</h2>
                <p className="text-xs text-slate-400 capitalize">{enquiry.type?.replace("-", " ")} · {enquiry.source}</p>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <a href={`mailto:${enquiry.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-600 transition-colors group">
                  <Mail size={14} className="text-slate-400 group-hover:text-cyan-500 shrink-0" />
                  <span className="truncate">{enquiry.email}</span>
                </a>
                <a href={`tel:${enquiry.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors group">
                  <Phone size={14} className="text-slate-400 group-hover:text-emerald-500 shrink-0" />
                  {enquiry.phone}
                </a>
                {enquiry.channel && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <ExternalLink size={12} className="text-slate-400 shrink-0" />
                    Via {enquiry.channel}
                  </p>
                )}
              </div>

              {/* Travel interest */}
              {(enquiry.destination || enquiry.packageName) && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {enquiry.destination && (
                    <p className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={13} className="text-slate-400 shrink-0" /> {enquiry.destination}
                    </p>
                  )}
                  {enquiry.packageName && (
                    <p className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
                      <Package size={13} className="shrink-0" /> {enquiry.packageName}
                    </p>
                  )}
                </div>
              )}

              {/* Trip details */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {enquiry.travelDate && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={12} className="shrink-0 text-slate-400" /> {formatDate(enquiry.travelDate)}
                  </p>
                )}
                {enquiry.travellerCount && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Users size={12} className="shrink-0 text-slate-400" /> {enquiry.travellerCount} traveller{enquiry.travellerCount > 1 ? "s" : ""}
                  </p>
                )}
                {enquiry.budget && (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <DollarSign size={12} className="shrink-0 text-slate-400" /> Budget: {formatCurrency(enquiry.budget)}
                  </p>
                )}
                {enquiry.conversionValue && (
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <CheckCircle size={12} className="shrink-0" /> Converted: {formatCurrency(enquiry.conversionValue)}
                  </p>
                )}
              </div>

              {/* Tags — editable chip input */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1"><Tag size={11} /> Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(enquiry.tags || []).map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium group">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="opacity-40 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                      >
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addTag(tagInput);
                        setTagInput("");
                      }
                    }}
                    placeholder="Add tag, press Enter..."
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={() => { addTag(tagInput); setTagInput(""); }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] text-slate-600 font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Assigned */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1"><User size={11} /> Assigned To</p>
                {isManager && staffList.length > 0 ? (
                  <select
                    value={enquiry.assignedTo?._id || ""}
                    onChange={(e) => reassignTo(e.target.value)}
                    disabled={reassigning}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-700 font-medium">
                    {enquiry.assignedTo
                      ? `${enquiry.assignedTo.firstName} ${enquiry.assignedTo.lastName}`
                      : <span className="text-slate-400 italic">Unassigned</span>
                    }
                  </p>
                )}
              </div>
            </div>

            {/* DNP tracker */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Call Attempts</p>
              <DnpDots count={enquiry.dnpCount || 0} />
              {enquiry.lastContactedAt && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <CheckCircle size={11} className="text-emerald-500" />
                  Last contact: {formatDate(enquiry.lastContactedAt)}
                </p>
              )}
              {enquiry.dnpCount >= 6 && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={11} /> Consider closing this lead
                </p>
              )}
            </div>

            {/* Booking ref */}
            {enquiry.bookingRef && typeof enquiry.bookingRef === "object" && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                <p className="text-xs font-semibold text-emerald-600 mb-1">Converted Booking</p>
                <p className="text-sm font-bold text-emerald-800">{enquiry.bookingRef.bookingId}</p>
                <p className="text-xs text-emerald-600">{formatCurrency(enquiry.bookingRef.totalAmount)}</p>
              </div>
            )}
          </div>

          {/* ─── CENTER: Timeline / Activity Feed ─────────────────────────── */}
          <div className="space-y-4">
            {/* Original message */}
            {enquiry.message && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Original Message</p>
                <p className="text-sm text-slate-600 leading-relaxed">{enquiry.message}</p>
              </div>
            )}

            {/* Add note */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Add Note</p>
              <div className="flex gap-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
                  rows={2}
                  placeholder="Add an internal note... (Enter to save)"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
                <button
                  onClick={addNote}
                  disabled={!noteText.trim() || savingNote}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-semibold hover:bg-cyan-700 disabled:opacity-40 self-end"
                >
                  {savingNote ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Timeline</p>
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
              ) : (
                <div className="space-y-0">
                  {timeline.map((item, i) => (
                    <div key={i} className="flex gap-3 group">
                      {/* Icon */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${
                          item.type === "call"
                            ? CALL_OUTCOME_COLORS[(item.meta?.outcome as string) || ""] || "bg-slate-50 border-slate-200"
                            : item.type === "note"
                            ? "bg-blue-50 border-blue-200"
                            : "bg-slate-50 border-slate-200"
                        }`}>
                          {item.type === "call" ? CALL_OUTCOME_ICONS[(item.meta?.outcome as string) || ""] || "📞"
                            : item.type === "note" ? "💬"
                            : "🌟"}
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="w-px flex-1 my-1 bg-slate-100 min-h-[20px]" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-4 flex-1 min-w-0">
                        <p className="text-sm text-slate-700 leading-relaxed">{item.text}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.by && <span className="text-xs text-slate-400">by {item.by}</span>}
                          <span className="text-[10px] text-slate-300 flex items-center gap-0.5">
                            <Clock size={9} /> {formatDate(item.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Actions Panel ─────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Status + Priority */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</p>
                <select
                  value={enquiry.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={savingStatus}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {["new", "assigned", "in-progress", "follow-up", "converted", "resolved", "closed"].map((s) => (
                    <option key={s} value={s}>{s.replace("-", " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</p>
                <select
                  value={enquiry.priority}
                  onChange={(e) => updatePriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions</p>

              <button
                onClick={() => setShowLogCall(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition-colors"
              >
                <PhoneCall size={16} /> Log a Call
              </button>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 pt-1">Schedule Follow-up</p>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Follow-up note..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={saveFollowUp}
                  disabled={!followUpDate || savingFollowUp}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${
                    followUpSaved 
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                      : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  <Calendar size={14} /> {savingFollowUp ? "Saving..." : followUpSaved ? "✓ Scheduled!" : "Schedule"}
                </button>
              </div>

              <Link
                href={`/itineraries/new?enquiryId=${id}`}
                className="w-full flex items-center gap-3 px-4 py-3 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Package size={16} /> Create Itinerary
              </Link>

              {/* Create Customer Account */}
              <button
                onClick={() => setShowCreateAccount(true)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
              >
                <UserPlus size={16} /> Create Customer Account
              </button>

              {/* Send Booking Link */}
              <button
                onClick={async () => {
                  setSendingLink(true);
                  setLinkSent(false);
                  try {
                    await api.post(`/enquiries/${id}/send-booking-link`, {});
                    setLinkSent(true);
                    setTimeout(() => setLinkSent(false), 3000);
                  } catch {
                    alert("Failed to send link. Make sure a package/itinerary is linked to this enquiry first.");
                  } finally {
                    setSendingLink(false);
                  }
                }}
                disabled={sendingLink}
                className="w-full flex items-center gap-3 px-4 py-3 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
                {sendingLink ? "Sending..." : linkSent ? "✓ Link Sent!" : "Send Booking Link"}
              </button>

              {/* Convert to Booking */}
              {enquiry.status !== "converted" && enquiry.status !== "closed" && (
                enquiry.package && typeof enquiry.package === "object" && (enquiry.package as { slug?: string }).slug && (
                  <a
                    href={`https://letslivetours.com/book/${(enquiry.package as { slug?: string }).slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 px-4 py-3 border border-cyan-200 bg-cyan-50 text-cyan-700 rounded-xl text-sm font-semibold hover:bg-cyan-100 transition-colors"
                  >
                    <CheckCircle size={16} /> Open Booking Page ↗
                  </a>
                )
              )}

              {enquiry.status !== "closed" && enquiry.status !== "converted" && (
                <button
                  onClick={() => setShowMarkLost(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-red-200 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <PhoneOff size={16} /> Mark as Lost
                </button>
              )}
            </div>

            {/* Quick info */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs text-slate-500">
              <p className="font-semibold text-slate-600">Enquiry Info</p>
              <p>Created: {formatDate(enquiry.createdAt)}</p>
              {enquiry.updatedAt && <p>Updated: {formatDate(enquiry.updatedAt)}</p>}
              <p className="font-mono text-[10px] text-slate-400 break-all">{enquiry._id}</p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
