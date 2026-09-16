"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { Enquiry } from "@/types";
import {
  Phone, Mail, MapPin, Package, Calendar, Users, DollarSign,
  Tag, User, ArrowLeft, MessageSquare, PhoneCall, PhoneOff,
  MessageCircle, Clock, CheckCircle, AlertTriangle, ChevronDown,
  Save, Plus, X, ExternalLink, RefreshCw, UserPlus, Send, Copy, Trash2, Edit2, Banknote, Search,
  Download, Loader2
} from "lucide-react";

import Link from "next/link";
import { generatePackagePdf } from "@/lib/generatePackagePdf";
import { useAuthStore } from "@/stores/authStore";
import { usePermission } from "@/hooks/usePermission";
import RoleGuard from "@/components/guards/RoleGuard";
import PhoneInput from "@/components/ui/PhoneInput";

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

// ─── Call Dots ────────────────────────────────────────────────────────────────
function CallDots({ callLog, dnpCount }: { callLog: { outcome: string }[]; dnpCount: number }) {
  const max = 6;
  const total = callLog.length;

  function dotColor(outcome: string): string {
    switch (outcome) {
      case 'answered': return 'bg-emerald-500 border-emerald-500';
      case 'dnp': return 'bg-red-500 border-red-500';
      case 'busy': return 'bg-amber-400 border-amber-400';
      case 'whatsapp-sent': return 'bg-green-500 border-green-500';
      case 'email-sent': return 'bg-blue-500 border-blue-500';
      case 'callback-scheduled': return 'bg-purple-500 border-purple-500';
      default: return 'bg-slate-400 border-slate-400';
    }
  }

  function dotTitle(entry: any): string {
    if (!entry) return 'Not called';
    if (entry.outcome === 'callback-scheduled') {
      if (entry.callbackDate) {
        return `Callback: ${new Date(entry.callbackDate).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`;
      }
      return 'Callback Scheduled';
    }
    const map: Record<string, string> = {
      answered: 'Answered', dnp: 'DNP', busy: 'Busy',
      'whatsapp-sent': 'WhatsApp', 'email-sent': 'Email',
    };
    return map[entry.outcome] || entry.outcome;
  }

  const lastOutcome = callLog.length > 0 ? callLog[callLog.length - 1].outcome : null;
  const labelColor = dnpCount >= 6 ? 'text-red-600' : dnpCount >= 3 ? 'text-orange-600' : total > 0 ? 'text-emerald-600' : 'text-slate-400';

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: max }).map((_, i) => {
          const entry = callLog[i];
          return (
            <div
              key={i}
              title={entry ? dotTitle(entry) : 'Not called'}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                entry ? dotColor(entry.outcome) : 'border-slate-200 bg-white'
              }`}
            />
          );
        })}
        {total > max && (
          <span className="text-[10px] text-slate-500 font-semibold ml-1">+{total - max}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {total === 0 ? (
          <span className={`text-xs font-semibold ${labelColor}`}>Not called yet</span>
        ) : (
          <>
            <span className={`text-xs font-semibold ${labelColor}`}>{total} call{total !== 1 ? 's' : ''} logged</span>
            {dnpCount > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">{dnpCount} DNP</span>}
            {lastOutcome === 'answered' && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Last: Answered ✓</span>}
          </>
        )}
      </div>
      {/* Legend */}
      {total > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {['answered','dnp','busy','whatsapp-sent','email-sent','callback-scheduled'].map(o => {
            const count = callLog.filter(c => c.outcome === o).length;
            if (!count) return null;
            return (
              <span key={o} className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-full border font-medium ${
                o === 'answered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                o === 'dnp' ? 'bg-red-50 text-red-700 border-red-200' :
                o === 'busy' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                o === 'whatsapp-sent' ? 'bg-green-50 text-green-700 border-green-200' :
                o === 'email-sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{background: 'currentColor'}} />
                {dotTitle(o)} {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Mark Lost Modal ───────────────────────────────────────────────────────────
function MarkLostModal({ id, onClose, onSave }: { id: string; onClose: () => void; onSave: () => void }) {
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [saving, setSaving] = useState(false);

  const reasons = [
    { value: "no-budget", label: "No Budget" },
    { value: "went-elsewhere", label: "Went Elsewhere / Booked Another" },
    { value: "not-responding", label: "Not Responding (DNP)" },
    { value: "not-interested", label: "Not Interested Anymore" },
    { value: "timing", label: "Bad Timing / Postponed" },
    { value: "other", label: "Other" },
  ];

  async function handleSave() {
    if (!reason) return;
    if (reason === "other" && !otherText.trim()) return;
    setSaving(true);
    try {
      await api.put(`/enquiries/${id}`, { 
        status: "closed", 
        lostReason: reason,
        lostReasonOtherText: reason === "other" ? otherText.trim() : undefined 
      });
      onSave();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to mark as lost");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-red-600 flex items-center gap-2"><AlertTriangle size={18} /> Mark as Lost</h3>
            <p className="text-xs text-slate-500">Why are we closing this lead?</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-2">
          {reasons.map((r) => (
            <div key={r.value}>
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                reason === r.value ? "border-red-500 bg-red-50" : "border-slate-200 hover:border-slate-300"
              }`}>
                <input type="radio" name="lostReason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="text-red-600 focus:ring-red-500" />
                <span className="text-sm font-semibold text-slate-700">{r.label}</span>
              </label>
              {reason === "other" && r.value === "other" && (
                <textarea
                  placeholder="Please specify the reason (Required)"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  className="w-full mt-2 p-3 text-sm border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-24"
                  required
                />
              )}
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!reason || (reason === "other" && !otherText.trim()) || saving} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />} Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Log Call Modal ───────────────────────────────────────────────────────────
function LogCallModal({ enquiryId, onClose, onSave }: { enquiryId: string; onClose: () => void; onSave: () => void }) {
  const [outcome, setOutcome] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("");

  const outcomes = [
    { value: "answered", label: "Answered", icon: "✅", desc: "Customer picked up and we spoke" },
    { value: "dnp", label: "DNP", icon: "📵", desc: "Did not pick up" },
    { value: "busy", label: "Busy", icon: "📶", desc: "Line was busy" },
    { value: "whatsapp-sent", label: "WhatsApp Sent", icon: "💬", desc: "Sent a WhatsApp message" },
    { value: "email-sent", label: "Email Sent", icon: "📧", desc: "Sent a follow-up email" },
    { value: "callback-scheduled", label: "Callback Scheduled", icon: "📅", desc: "Customer asked for callback" },
  ];

  function handleSelectOutcome(val: string) {
    setOutcome(val);
    if (val === "callback-scheduled" && !callbackDate) {
      // Default to tomorrow 11:00 AM or today +2h if early
      const now = new Date();
      if (now.getHours() < 16) {
        now.setHours(now.getHours() + 2, 0, 0, 0);
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        setCallbackDate(`${yyyy}-${mm}-${dd}`);
        setCallbackTime(`${hh}:00`);
      } else {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const yyyy = tom.getFullYear();
        const mm = String(tom.getMonth() + 1).padStart(2, "0");
        const dd = String(tom.getDate()).padStart(2, "0");
        setCallbackDate(`${yyyy}-${mm}-${dd}`);
        setCallbackTime("11:00");
      }
    }
  }

  function applyPreset(type: "today-2h" | "tomorrow-10" | "tomorrow-15" | "in-2-days") {
    const now = new Date();
    if (type === "today-2h") {
      now.setHours(now.getHours() + 2, 0, 0, 0);
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      setCallbackDate(`${yyyy}-${mm}-${dd}`);
      setCallbackTime(`${hh}:00`);
    } else if (type === "tomorrow-10") {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      const yyyy = tom.getFullYear();
      const mm = String(tom.getMonth() + 1).padStart(2, "0");
      const dd = String(tom.getDate()).padStart(2, "0");
      setCallbackDate(`${yyyy}-${mm}-${dd}`);
      setCallbackTime("10:00");
    } else if (type === "tomorrow-15") {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      const yyyy = tom.getFullYear();
      const mm = String(tom.getMonth() + 1).padStart(2, "0");
      const dd = String(tom.getDate()).padStart(2, "0");
      setCallbackDate(`${yyyy}-${mm}-${dd}`);
      setCallbackTime("15:00");
    } else if (type === "in-2-days") {
      const d2 = new Date();
      d2.setDate(d2.getDate() + 2);
      const yyyy = d2.getFullYear();
      const mm = String(d2.getMonth() + 1).padStart(2, "0");
      const dd = String(d2.getDate()).padStart(2, "0");
      setCallbackDate(`${yyyy}-${mm}-${dd}`);
      setCallbackTime("11:00");
    }
  }

  const isCallback = outcome === "callback-scheduled";
  const canSave = Boolean(outcome && (!isCallback || (callbackDate && callbackTime)) && !saving);

  async function handleSave() {
    if (!outcome) return;
    if (isCallback && (!callbackDate || !callbackTime)) {
      alert("Please choose both date and time for the callback.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { outcome, notes: notes || undefined };
      if (isCallback) {
        const [hours, minutes] = callbackTime.split(":");
        const d = new Date(callbackDate);
        d.setHours(parseInt(hours, 10), parseInt(minutes || "0", 10), 0, 0);
        payload.callbackDate = d.toISOString();
      }
      await api.post(`/enquiries/${enquiryId}/call`, payload);
      onSave();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to log call");
    } finally {
      setSaving(false);
    }
  }

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800">Log a Call</h3>
            <p className="text-xs text-slate-400">Record what happened in this interaction</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Call Outcome</p>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelectOutcome(o.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    outcome === o.value
                      ? o.value === "callback-scheduled"
                        ? "border-purple-500 bg-purple-50"
                        : "border-cyan-500 bg-cyan-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">{o.icon}</span>
                  <p className="text-xs font-semibold text-slate-700 mt-1">{o.label}</p>
                  <p className="text-[10px] text-slate-400">{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ─── CALLBACK SCHEDULE PICKER ─── */}
          {isCallback && (
            <div className="bg-purple-50/70 border-2 border-purple-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-200 text-purple-800 flex items-center justify-center font-bold shrink-0">
                  <Calendar size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                    Set Callback Date & Time <span className="text-rose-500">*</span>
                  </h4>
                  <p className="text-[11px] text-purple-700">When should we call the customer back?</p>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1.5">Quick Presets</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset("today-2h")}
                    className="px-2 py-1 bg-white hover:bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-semibold rounded-md transition-colors text-center"
                  >
                    Today +2 hrs
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("tomorrow-10")}
                    className="px-2 py-1 bg-white hover:bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-semibold rounded-md transition-colors text-center"
                  >
                    Tmrw 10:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("tomorrow-15")}
                    className="px-2 py-1 bg-white hover:bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-semibold rounded-md transition-colors text-center"
                  >
                    Tmrw 3:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("in-2-days")}
                    className="px-2 py-1 bg-white hover:bg-purple-100 border border-purple-200 text-purple-800 text-[10px] font-semibold rounded-md transition-colors text-center"
                  >
                    In 2 Days
                  </button>
                </div>
              </div>

              {/* Date and Time Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar size={11} className="text-purple-600" /> Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={callbackDate}
                    onChange={(e) => setCallbackDate(e.target.value)}
                    className="w-full border border-purple-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock size={11} className="text-purple-600" /> Time
                  </label>
                  <input
                    type="time"
                    value={callbackTime}
                    onChange={(e) => setCallbackTime(e.target.value)}
                    className="w-full border border-purple-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                    required
                  />
                </div>
              </div>

              {/* Selection summary preview */}
              {callbackDate && callbackTime ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs text-purple-800">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                  <span>
                    Scheduled:{" "}
                    <strong className="text-purple-900 font-bold">
                      {new Date(`${callbackDate}T${callbackTime}`).toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </strong>
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                  ⚠️ Please select both date and time above
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {isCallback ? "Callback Notes / Discussion (optional)" : "Notes (optional)"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={
                isCallback
                  ? "e.g. Customer in meeting, call back to discuss Maldives pricing..."
                  : "What was discussed, any commitments made..."
              }
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 shadow-sm ${
              isCallback ? "bg-purple-600 hover:bg-purple-700" : "bg-cyan-600 hover:bg-cyan-700"
            }`}
          >
            {saving ? "Saving..." : isCallback ? "Schedule Callback & Log" : "Log Call"}
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
              <PhoneInput value={form.phone} onChange={(val) => setForm({...form, phone: val})} />
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

// ─── Duplicate Itinerary Modal ───────────────────────────────────────────────
function DuplicateItineraryModal({ enquiryId, onClose }: { enquiryId: string; onClose: () => void }) {
  const router = useRouter();
  const [standardPackages, setStandardPackages] = useState<{ _id: string; name: string }[]>([]);
  const [customPackages, setCustomPackages] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [activeTab, setActiveTab] = useState<"custom" | "standard">("custom");

  useEffect(() => {
    Promise.all([
      api.get("/packages?admin=true&limit=100"),
      api.get("/packages/custom")
    ])
      .then(([stdRes, custRes]) => {
        const stdData = stdRes?.data?.data || stdRes?.data || [];
        const custData = custRes?.data?.data || custRes?.data || [];
        setStandardPackages(Array.isArray(stdData) ? stdData : []);
        setCustomPackages(Array.isArray(custData) ? custData : []);
      })
      .catch(() => alert("Failed to fetch packages"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDuplicate() {
    if (!selectedPackage) return;
    setDuplicating(true);
    try {
      const res = await api.post(`/packages/${selectedPackage}/duplicate`, { enquiryId });
      const newPackage = res?.data?.data || res?.data;
      if (newPackage?._id) {
        router.push(`/itineraries/${newPackage._id}/edit`);
      } else {
        onClose();
        window.location.reload();
      }
    } catch {
      alert("Failed to duplicate itinerary");
      setDuplicating(false);
    }
  }

  const currentList = activeTab === "custom" ? customPackages : standardPackages;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Duplicate & Link Itinerary</h3>
            <p className="text-xs text-slate-400">Clone an existing itinerary and link it to this enquiry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 mt-2">
          <button
            onClick={() => { setActiveTab("custom"); setSelectedPackage(""); }}
            className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "custom" ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Custom Itineraries
          </button>
          <button
            onClick={() => { setActiveTab("standard"); setSelectedPackage(""); }}
            className={`pb-2 px-2 ml-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "standard" ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Standard Packages
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : currentList.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No {activeTab} itineraries found.</p>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Select to Duplicate</label>
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Select --</option>
                {currentList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleDuplicate}
            disabled={!selectedPackage || duplicating}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40"
          >
            {duplicating ? "Duplicating..." : "Duplicate Itinerary"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Offline Booking Modal ────────────────────────────────────────────────────
interface ItineraryOption {
  _id: string;
  name: string;
  price?: number;
  isInternational?: boolean;
  slug?: string;
}

function OfflineBookingModal({
  enquiry,
  prefilledPackage,
  onClose,
  onSuccess,
}: {
  enquiry: Enquiry;
  prefilledPackage: { _id: string; name: string; isInternational?: boolean; price?: number } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Customer search
  const [emailSearch, setEmailSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<{ _id: string; firstName: string; lastName: string; email: string; phone?: string } | null>(null);
  const [userNotFound, setUserNotFound] = useState(false);

  // Collect all available itineraries (linked custom itineraries + primary enquiry package)
  const availableItineraries: ItineraryOption[] = useMemo(() => {
    const list: ItineraryOption[] = [];
    const seenIds = new Set<string>();

    if (enquiry.linkedItineraries && enquiry.linkedItineraries.length > 0) {
      for (const it of enquiry.linkedItineraries) {
        if (it._id && !seenIds.has(it._id)) {
          seenIds.add(it._id);
          list.push({
            _id: it._id,
            name: it.name,
            price: it.price,
            isInternational: (it as any).isInternational,
            slug: it.slug,
          });
        }
      }
    }

    if (enquiry.package && typeof enquiry.package === 'object' && (enquiry.package as any)._id) {
      const pkg = enquiry.package as any;
      if (!seenIds.has(pkg._id)) {
        seenIds.add(pkg._id);
        list.push({
          _id: pkg._id,
          name: pkg.name || enquiry.packageName || 'Primary Package',
          price: pkg.price,
          isInternational: pkg.isInternational,
          slug: pkg.slug,
        });
      }
    } else if (prefilledPackage?._id && !seenIds.has(prefilledPackage._id)) {
      seenIds.add(prefilledPackage._id);
      list.push({
        _id: prefilledPackage._id,
        name: prefilledPackage.name,
        price: (prefilledPackage as any).price,
        isInternational: prefilledPackage.isInternational,
      });
    }

    return list;
  }, [enquiry.linkedItineraries, enquiry.package, enquiry.packageName, prefilledPackage]);

  // Determine initial selected itinerary
  const initialItinerary = prefilledPackage?._id
    ? (availableItineraries.find((it) => it._id === prefilledPackage._id) || prefilledPackage)
    : (availableItineraries[0] || null);

  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryOption | null>(initialItinerary);
  const [isInternational, setIsInternational] = useState<boolean>(!!initialItinerary?.isInternational);

  // Form state
  const [form, setForm] = useState({
    packageId: initialItinerary?._id || '',
    travelDate: enquiry.travelDate ? String(enquiry.travelDate).slice(0, 10) : '',
    returnDate: '',
    totalAmount: (initialItinerary && (initialItinerary as any).price && (initialItinerary as any).price > 0)
      ? (initialItinerary as any).price
      : (enquiry.budget || 0),
    panCard: '',
    specialRequests: '',
    paymentMode: 'cash',
    paidAmount: 0,
    transactionId: '',
    paymentRemarks: '',
  });

  const handleItineraryChange = (packageId: string) => {
    const found = availableItineraries.find((it) => it._id === packageId) || null;
    setSelectedItinerary(found);
    if (found) {
      setIsInternational(!!found.isInternational);
      setForm((prev) => ({
        ...prev,
        packageId: found._id,
        totalAmount: (found.price && found.price > 0) ? found.price : prev.totalAmount,
      }));
      // If isInternational or price is undefined, fetch package details
      if (found.isInternational === undefined || !found.price) {
        api.get(`/packages/${found._id}`).then((res) => {
          const pkg = res?.data?.data || res?.data;
          if (pkg) {
            setIsInternational(!!pkg.isInternational);
            if (pkg.price && (!found.price || found.price === 0)) {
              setForm((prev) => ({ ...prev, totalAmount: pkg.price }));
            }
          }
        }).catch(() => {});
      }
    } else {
      setForm((prev) => ({ ...prev, packageId }));
    }
  };

  useEffect(() => {
    // If selected itinerary isInternational is undefined, fetch it
    if (selectedItinerary?._id && selectedItinerary.isInternational === undefined) {
      api.get(`/packages/${selectedItinerary._id}`).then((res) => {
        const pkg = res?.data?.data || res?.data;
        if (pkg) {
          setIsInternational(!!pkg.isInternational);
          if (pkg.price && (!selectedItinerary.price || selectedItinerary.price === 0)) {
            setForm((prev) => ({ ...prev, totalAmount: pkg.price }));
          }
        }
      }).catch(() => {});
    }
  }, [selectedItinerary]);

  // Primary traveller passport & details
  const [primaryPassport, setPrimaryPassport] = useState('');
  const [primaryPassportExpiry, setPrimaryPassportExpiry] = useState('');
  const [primaryIssuingCountry, setPrimaryIssuingCountry] = useState('');
  const [primaryAge, setPrimaryAge] = useState('');

  // Additional travellers
  const [travellers, setTravellers] = useState<{ name: string; age: string; type: 'adult'|'child'|'infant'; passportNumber: string; passportExpiry: string; issuingCountry: string }[]>([]);

  const addTraveller = (type: 'adult' | 'child' | 'infant') => setTravellers([...travellers, { name: '', age: '', type, passportNumber: '', passportExpiry: '', issuingCountry: '' }]);
  const removeTraveller = (i: number) => setTravellers(travellers.filter((_, idx) => idx !== i));
  const updateTraveller = (i: number, field: string, value: string) => {
    const newT = [...travellers];
    newT[i] = { ...newT[i], [field]: value };
    setTravellers(newT);
  };

  const adultsCount = 1 + travellers.filter(t => t.type === 'adult').length;
  const childrenCount = travellers.filter(t => t.type === 'child').length;
  const infantsCount = travellers.filter(t => t.type === 'infant').length;

  async function handleSearchUser() {
    if (!emailSearch.trim()) return;
    setSearchLoading(true);
    setFoundUser(null);
    setUserNotFound(false);
    try {
      const res = await api.get(`/users/search?email=${encodeURIComponent(emailSearch.trim())}`);
      setFoundUser(res.data);
    } catch {
      setUserNotFound(true);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSubmit() {
    if (!foundUser) { setError('Please search and select a customer account first.'); return; }
    if (!form.packageId) { setError('Package is required.'); return; }
    if (!form.travelDate) { setError('Travel date is required.'); return; }
    if (!form.totalAmount) { setError('Total amount is required.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await api.post('/bookings/manual', {
        enquiryId: enquiry._id,
        packageId: form.packageId,
        userId: foundUser._id,
        travelDate: form.travelDate,
        returnDate: form.returnDate || undefined,
        travellers: { adults: adultsCount, children: childrenCount, infants: infantsCount },
        travellersDetails: isInternational 
          ? [
              {
                name: `${foundUser.firstName} ${foundUser.lastName}`.trim(),
                age: (primaryAge && !isNaN(parseInt(primaryAge, 10))) ? parseInt(primaryAge, 10) : undefined,
                type: "adult" as const,
                passportNumber: primaryPassport,
                passportExpiry: primaryPassportExpiry,
                issuingCountry: primaryIssuingCountry,
              },
              ...travellers.map((t) => ({
                name: t.name,
                age: (t.age && !isNaN(parseInt(t.age, 10))) ? parseInt(t.age, 10) : undefined,
                type: t.type,
                passportNumber: t.passportNumber,
                passportExpiry: t.passportExpiry,
                issuingCountry: t.issuingCountry,
              }))
            ]
          : [
              {
                name: `${foundUser.firstName} ${foundUser.lastName}`.trim(),
                age: (primaryAge && !isNaN(parseInt(primaryAge, 10))) ? parseInt(primaryAge, 10) : undefined,
                type: "adult" as const,
              },
              ...travellers.map((t) => ({
                name: t.name,
                age: (t.age && !isNaN(parseInt(t.age, 10))) ? parseInt(t.age, 10) : undefined,
                type: t.type,
              })),
            ],
        primaryTraveller: {
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          email: foundUser.email,
          phone: foundUser.phone || '',
          ...(isInternational ? { panCard: form.panCard } : {}),
        },
        totalAmount: Number(form.totalAmount),
        offlinePayment: {
          paidAmount: Number(form.paidAmount),
          mode: form.paymentMode,
          transactionId: form.transactionId,
          remarks: form.paymentRemarks,
        },
        specialRequests: form.specialRequests,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Banknote size={18} className="text-emerald-600" /> Manual / Offline Booking</h3>
            <p className="text-xs text-slate-400">Create a booking and post-sales operation for {enquiry.firstName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── Section 1: Customer Account ── */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">1. Customer Account</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailSearch}
                onChange={(e) => { setEmailSearch(e.target.value); setFoundUser(null); setUserNotFound(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                placeholder="Search by customer email..."
                className={inputCls}
              />
              <button
                onClick={handleSearchUser}
                disabled={searchLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 shrink-0"
              >
                <Search size={14} /> {searchLoading ? '...' : 'Search'}
              </button>
            </div>
            {foundUser && (
              <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {foundUser.firstName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{foundUser.firstName} {foundUser.lastName}</p>
                    <p className="text-xs text-slate-500">{foundUser.email} {foundUser.phone ? `· ${foundUser.phone}` : ''}</p>
                  </div>
                  <CheckCircle size={16} className="text-emerald-600 ml-auto shrink-0" />
                </div>
                <div className="pt-2.5 border-t border-emerald-200/60 flex items-center gap-3">
                  <div className="w-36">
                    <label className={labelCls}>Primary Age (yrs)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={primaryAge}
                      onChange={(e) => setPrimaryAge(e.target.value)}
                      placeholder="e.g. 28"
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    Primary traveller is counted as Adult 1.
                  </p>
                </div>
              </div>
            )}
            {userNotFound && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-semibold">No account found with this email.</p>
                <p className="text-xs text-amber-600 mt-0.5">Please create a customer account first using the &quot;Create Customer Account&quot; button in the sidebar, then come back here.</p>
              </div>
            )}
          </div>

          {/* ── Section 2: Trip Details ── */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">2. Trip Details</p>

            {/* Itinerary Dropdown / Selector */}
            <div className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={14} className="text-cyan-600" />
                  Select Itinerary for this Booking *
                </label>
                {selectedItinerary && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isInternational ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isInternational ? 'International' : 'Domestic'}
                  </span>
                )}
              </div>

              {availableItineraries.length === 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
                  ⚠️ No itinerary linked to this enquiry yet. Please link or create an itinerary first.
                </div>
              ) : availableItineraries.length === 1 ? (
                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{availableItineraries[0].name}</p>
                    {availableItineraries[0].price ? (
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        Itinerary Price: ₹{availableItineraries[0].price.toLocaleString('en-IN')}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">1 Linked Itinerary</span>
                </div>
              ) : (
                <div>
                  <select
                    value={form.packageId}
                    onChange={(e) => handleItineraryChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                  >
                    <option value="">-- Choose Itinerary ({availableItineraries.length} Options Linked) --</option>
                    {availableItineraries.map((it) => (
                      <option key={it._id} value={it._id}>
                        {it.name} {it.price ? `— ₹${it.price.toLocaleString('en-IN')}` : ''} {it.isInternational ? '(International)' : '(Domestic)'}
                      </option>
                    ))}
                  </select>
                  {selectedItinerary && selectedItinerary.price ? (
                    <div className="flex items-center justify-between mt-2 px-1 text-xs">
                      <span className="text-slate-500">Selected Itinerary Base Price:</span>
                      <span className="font-bold text-emerald-700">₹{selectedItinerary.price.toLocaleString('en-IN')}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Travel Date *</label>
                <input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Return Date</label>
                <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} className={inputCls} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Total Agreed Amount (₹) *</label>
                <input type="number" min={1} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1">Total package cost agreed with client</p>
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Special Requests</label>
              <textarea rows={2} value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} className={inputCls} placeholder="Window seat, vegetarian meals, etc." />
            </div>
          </div>

          {/* ── Additional Travellers ── */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">Additional Travellers</p>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => addTraveller('adult')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100">+ Adult</button>
              <button type="button" onClick={() => addTraveller('child')} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100">+ Child (2-11)</button>
              <button type="button" onClick={() => addTraveller('infant')} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-semibold hover:bg-cyan-100">+ Infant (0-2)</button>
            </div>
            {travellers.length === 0 ? (
              <p className="text-xs text-slate-400">No additional travellers. Primary traveller is already counted as 1 Adult.</p>
            ) : (
              <div className="space-y-3">
                {travellers.map((t, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.type === 'adult' ? 'bg-emerald-100 text-emerald-700' : t.type === 'child' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'}`}>{t.type}</span>
                      <button type="button" onClick={() => removeTraveller(i)} className="ml-auto text-rose-500 hover:bg-rose-50 p-1 rounded"><X size={14} /></button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className={labelCls}>Full Name *</label>
                        <input value={t.name} onChange={(e) => updateTraveller(i, 'name', e.target.value)} className={inputCls} placeholder="Traveller Name" />
                      </div>
                      <div>
                        <label className={labelCls}>Age</label>
                        <input type="number" value={t.age} onChange={(e) => updateTraveller(i, 'age', e.target.value)} className={inputCls} placeholder="Age" />
                      </div>
                      {isInternational && (
                        <>
                          <div>
                            <label className={labelCls}>Passport No. *</label>
                            <input value={t.passportNumber} onChange={(e) => updateTraveller(i, 'passportNumber', e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Passport Expiry *</label>
                            <input type="date" value={t.passportExpiry} onChange={(e) => updateTraveller(i, 'passportExpiry', e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className={labelCls}>Country *</label>
                            <input value={t.issuingCountry} onChange={(e) => updateTraveller(i, 'issuingCountry', e.target.value)} className={inputCls} placeholder="India" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 3: Primary Traveller Passport (international only) ── */}
          {isInternational && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">International</span>
                Primary Traveller — Passport & PAN Details
              </p>
              <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="col-span-2">
                  <label className={labelCls}>PAN Card Number *</label>
                  <input type="text" value={form.panCard} onChange={(e) => setForm({ ...form, panCard: e.target.value.toUpperCase() })} className={inputCls} placeholder="ABCDE1234F" />
                  <p className="text-[10px] text-slate-400 mt-1">Required for international bookings (TCS compliance)</p>
                </div>
                <div>
                  <label className={labelCls}>Passport Number *</label>
                  <input type="text" value={primaryPassport} onChange={(e) => setPrimaryPassport(e.target.value)} className={inputCls} placeholder="Z1234567" />
                </div>
                <div>
                  <label className={labelCls}>Passport Expiry *</label>
                  <input type="date" value={primaryPassportExpiry} onChange={(e) => setPrimaryPassportExpiry(e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Issuing Country *</label>
                  <input type="text" value={primaryIssuingCountry} onChange={(e) => setPrimaryIssuingCountry(e.target.value)} className={inputCls} placeholder="India" />
                </div>
              </div>
            </div>
          )}

          {/* ── Offline Payment ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isInternational ? '5' : '3'}. Offline Payment</p>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                Routes to Finance Approval
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Amount Paid by Client (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="0 if nothing paid yet"
                />
              </div>
              <div>
                <label className={labelCls}>Payment Mode</label>
                <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className={inputCls}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="neft">NEFT</option>
                  <option value="rtgs">RTGS</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Reference / Transaction ID</label>
                <input value={form.transactionId} onChange={(e) => setForm({ ...form, transactionId: e.target.value })} className={inputCls} placeholder="Optional for cash" />
              </div>
              <div>
                <label className={labelCls}>Remarks</label>
                <input value={form.paymentRemarks} onChange={(e) => setForm({ ...form, paymentRemarks: e.target.value })} className={inputCls} placeholder="e.g. Collected at office" />
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Total Booking Amount:</span>
                <span className="font-bold text-slate-800">₹{Number(form.totalAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Amount Paid Now (To Approve):</span>
                <span className="font-bold text-emerald-700">₹{Number(form.paidAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Remaining Balance:</span>
                <span className="font-bold text-slate-800">
                  ₹{Math.max(0, (Number(form.totalAmount || 0) - Number(form.paidAmount || 0))).toLocaleString('en-IN')}
                </span>
              </div>
              {form.paidAmount > 0 && (
                <div className="mt-2 text-[11px] bg-blue-50 border border-blue-200 text-blue-700 p-2 rounded-lg leading-relaxed">
                  ℹ️ <strong>Financial Approval:</strong> An approval request for <strong>₹{Number(form.paidAmount).toLocaleString('en-IN')}</strong> will appear in Finance Approvals. The remaining balance of ₹{Math.max(0, (Number(form.totalAmount || 0) - Number(form.paidAmount))).toLocaleString('en-IN')} will be scheduled under Operations installments.
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-semibold">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !foundUser}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : <><CheckCircle size={16} /> Confirm & Create Booking</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Booking Link Modal ─────────────────────────────────────────────────
function SendBookingLinkModal({ enquiry, onClose }: { enquiry: Enquiry; onClose: () => void }) {
  const [sendingLinkFor, setSendingLinkFor] = useState<string | null>(null);
  const [linkSentFor, setLinkSentFor] = useState<string | null>(null);

  // Collect packages: linked itineraries + fallback to primary package if no linked itineraries
  let packagesToList: { _id: string; name: string; slug: string }[] = [];
  
  if (enquiry.linkedItineraries && enquiry.linkedItineraries.length > 0) {
    packagesToList = enquiry.linkedItineraries;
  } else if (enquiry.package && typeof enquiry.package === 'object' && '_id' in enquiry.package) {
    const pkg = enquiry.package as any;
    if (pkg.slug) {
      packagesToList = [{ _id: pkg._id, name: pkg.name || enquiry.packageName || 'Package', slug: pkg.slug }];
    }
  }

  async function handleSendEmail(pkg: { slug: string; name: string; _id: string }) {
    setSendingLinkFor(pkg._id);
    setLinkSentFor(null);
    try {
      await api.post(`/enquiries/${enquiry._id}/send-booking-link`, { 
        packageSlug: pkg.slug,
        packageName: pkg.name
      });
      setLinkSentFor(pkg._id);
      setTimeout(() => setLinkSentFor(null), 3000);
    } catch {
      alert("Failed to send booking link.");
    } finally {
      setSendingLinkFor(null);
    }
  }

  function handleCopyLink(slug: string) {
    let url = `https://letslivetours.com/book/${slug}`;
    const params = new URLSearchParams();
    if (enquiry.departureId) params.append("departureId", enquiry.departureId.toString());
    if (enquiry.travelDate) params.append("travelDate", new Date(enquiry.travelDate).toISOString().split('T')[0]);
    params.append("enquiryId", enquiry._id);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    navigator.clipboard.writeText(url);
    alert("Booking link copied to clipboard!");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Send Booking Link</h3>
            <p className="text-xs text-slate-400">Choose an itinerary to share with {enquiry.firstName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {packagesToList.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No linked itineraries found. Please link an itinerary first.</p>
          ) : (
            <div className="space-y-3">
              {packagesToList.map((pkg) => (
                <div key={pkg._id} className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-sm text-slate-800 font-semibold">{pkg.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(pkg.slug)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                    >
                      <Copy size={14} /> Copy Link
                    </button>
                    <button
                      onClick={() => handleSendEmail(pkg)}
                      disabled={sendingLinkFor === pkg._id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
                    >
                      <Send size={14} />
                      {sendingLinkFor === pkg._id ? "Sending..." : linkSentFor === pkg._id ? "✓ Sent!" : "Send via Email"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showSendLinkModal, setShowSendLinkModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlinePrefilledPackage, setOfflinePrefilledPackage] = useState<{ _id: string; name: string; isInternational?: boolean; price?: number } | null>(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [copiedItineraryId, setCopiedItineraryId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  // ── Inline customer detail editing ──
  const [editingDetails, setEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    destination: "",
    travelDate: "",
    adultCount: "",
    childCount: "",
    infantCount: "",
    budget: "",
    packageName: "",
    source: "",
    channel: "",
  });
  const [savingDetails, setSavingDetails] = useState(false);

  function startEditingDetails() {
    if (!enquiry) return;
    setEditForm({
      firstName: enquiry.firstName || "",
      lastName: enquiry.lastName || "",
      email: enquiry.email || "",
      phone: enquiry.phone || "",
      destination: enquiry.destination || "",
      travelDate: enquiry.travelDate ? String(enquiry.travelDate).slice(0, 10) : "",
      adultCount: enquiry.adultCount != null
        ? String(enquiry.adultCount)
        : (enquiry.travellerCount != null ? String(enquiry.travellerCount) : "1"),
      childCount: enquiry.childCount != null ? String(enquiry.childCount) : "0",
      infantCount: enquiry.infantCount != null ? String(enquiry.infantCount) : "0",
      budget: enquiry.budget != null ? String(enquiry.budget) : "",
      packageName: enquiry.packageName || "",
      source: enquiry.source || "",
      channel: enquiry.channel || "",
    });
    setEditingDetails(true);
  }

  async function saveEditingDetails() {
    if (!editForm.firstName.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      alert("First name, email, and phone are required.");
      return;
    }
    setSavingDetails(true);
    const adults = editForm.adultCount !== "" ? Math.max(0, parseInt(editForm.adultCount, 10) || 0) : 0;
    const children = editForm.childCount !== "" ? Math.max(0, parseInt(editForm.childCount, 10) || 0) : 0;
    const infants = editForm.infantCount !== "" ? Math.max(0, parseInt(editForm.infantCount, 10) || 0) : 0;
    const totalTravellers = adults + children + infants;

    try {
      await api.put(`/enquiries/${id}`, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim() || undefined,
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        destination: editForm.destination.trim() || undefined,
        travelDate: editForm.travelDate || undefined,
        adultCount: adults,
        childCount: children,
        infantCount: infants,
        travellerCount: totalTravellers > 0 ? totalTravellers : undefined,
        budget: editForm.budget ? Number(editForm.budget) : undefined,
        packageName: editForm.packageName.trim() || undefined,
        source: editForm.source || undefined,
        channel: editForm.channel || undefined,
      });
      setEditingDetails(false);
      fetchEnquiry();
    } catch {
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  }

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
        const d = new Date(data.followUpDate);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setFollowUpDate(`${yyyy}-${mm}-${dd}`);
          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          setFollowUpTime(`${hh}:${min}`);
        }
        setFollowUpNotes(data.followUpNotes || "");
      } else {
        setFollowUpDate("");
        setFollowUpTime("");
        setFollowUpNotes("");
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
    api.get("/users/staff?department=sales").then((res) => {
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
    if (!followUpDate) return;
    setSavingFollowUp(true);
    setFollowUpSaved(false);
    try {
      let isoDate: string;
      if (followUpTime) {
        const [hours, minutes] = followUpTime.split(":");
        const d = new Date(followUpDate);
        d.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
        isoDate = d.toISOString();
      } else {
        const d = new Date(followUpDate);
        d.setHours(10, 0, 0, 0); // Default to 10:00 AM if no time specified
        isoDate = d.toISOString();
      }
      await api.put(`/enquiries/${id}`, { followUpDate: isoDate, followUpNotes });
      fetchEnquiry();
      setFollowUpSaved(true);
      setTimeout(() => setFollowUpSaved(false), 3000);
    } catch { alert("Failed to save follow-up"); }
    finally { setSavingFollowUp(false); }
  }

  async function clearFollowUp() {
    if (!window.confirm("Clear this scheduled follow-up?")) return;
    setSavingFollowUp(true);
    try {
      await api.put(`/enquiries/${id}`, { followUpDate: null, followUpNotes: "" });
      setFollowUpDate("");
      setFollowUpTime("");
      setFollowUpNotes("");
      fetchEnquiry();
    } catch {
      alert("Failed to clear follow-up");
    } finally {
      setSavingFollowUp(false);
    }
  }

  const [timelineFilter, setTimelineFilter] = useState<"all" | "lifecycle" | "calls" | "notes" | "proposals">("all");

  // Build comprehensive timeline: merges DB timeline, notes, calls, customer inquiry, trip preferences, proposals, bookings
  function buildTimeline() {
    if (!enquiry) return [];
    const items: Array<{
      id: string;
      type: string;
      category: "all" | "lifecycle" | "calls" | "notes" | "proposals";
      badgeText: string;
      badgeClass: string;
      title: string;
      description?: string;
      date: string;
      by?: string;
      meta?: Record<string, unknown>;
      icon: string;
    }> = [];

    const getAuthor = (val: any, fallbackName?: string) => {
      if (!val) return fallbackName || undefined;
      if (typeof val === "object") {
        const name = `${val.firstName || ""} ${val.lastName || ""}`.trim();
        return name || fallbackName;
      }
      return typeof val === "string" ? val : fallbackName;
    };

    // 1. Stored DB timeline events
    if (Array.isArray(enquiry.timeline)) {
      for (const ev of enquiry.timeline) {
        let category: "all" | "lifecycle" | "calls" | "notes" | "proposals" = "lifecycle";
        let badgeText = "ACTIVITY";
        let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
        let icon = "⚡";

        switch (ev.type) {
          case "acquisition":
          case "created":
            category = "lifecycle";
            badgeText = "ACQUISITION";
            badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
            icon = "📥";
            break;
          case "requirements":
            category = "lifecycle";
            badgeText = "PREFERENCES";
            badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
            icon = "📋";
            break;
          case "message":
            category = "lifecycle";
            badgeText = "INBOUND QUERY";
            badgeClass = "bg-cyan-50 text-cyan-700 border-cyan-200";
            icon = "💬";
            break;
          case "status_change":
            category = "lifecycle";
            badgeText = "STATUS UPDATE";
            badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
            icon = "🔄";
            break;
          case "priority_change":
            category = "lifecycle";
            badgeText = "PRIORITY";
            badgeClass = "bg-orange-50 text-orange-700 border-orange-200";
            icon = "🔥";
            break;
          case "assignment":
            category = "lifecycle";
            badgeText = "ASSIGNMENT";
            badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
            icon = "👤";
            break;
          case "follow_up":
            category = "lifecycle";
            badgeText = "FOLLOW-UP";
            badgeClass = "bg-teal-50 text-teal-700 border-teal-200";
            icon = "📅";
            break;
          case "call":
            category = "calls";
            badgeText = `CALL • ${(ev.meta?.outcome as string || "ATTEMPT").toUpperCase()}`;
            badgeClass = CALL_OUTCOME_COLORS[(ev.meta?.outcome as string) || ""] || "bg-emerald-50 text-emerald-700 border-emerald-200";
            icon = CALL_OUTCOME_ICONS[(ev.meta?.outcome as string) || ""] || "📞";
            break;
          case "note":
            category = "notes";
            badgeText = "INTERNAL NOTE";
            badgeClass = "bg-sky-50 text-sky-700 border-sky-200";
            icon = "📝";
            break;
          case "itinerary_linked":
            category = "proposals";
            badgeText = "PROPOSAL ATTACHED";
            badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
            icon = "🗺️";
            break;
          case "itinerary_delinked":
            category = "proposals";
            badgeText = "PROPOSAL DELINKED";
            badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
            icon = "✂️";
            break;
          case "booking_link_sent":
            category = "proposals";
            badgeText = "BOOKING LINK SENT";
            badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
            icon = "✉️";
            break;
          case "account_created":
            category = "lifecycle";
            badgeText = "ACCOUNT CREATED";
            badgeClass = "bg-violet-50 text-violet-700 border-violet-200";
            icon = "🔑";
            break;
          case "converted":
            category = "proposals";
            badgeText = "CONVERTED";
            badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
            icon = "🏆";
            break;
          case "closed":
            category = "lifecycle";
            badgeText = "CLOSED / LOST";
            badgeClass = "bg-red-50 text-red-700 border-red-200";
            icon = "🛑";
            break;
          case "feedback":
            category = "lifecycle";
            badgeText = "FEEDBACK";
            badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
            icon = "⭐";
            break;
          default:
            category = "lifecycle";
            badgeText = (ev.type || "ACTIVITY").toUpperCase();
            badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
            icon = "⚡";
        }

        items.push({
          id: ev._id || `${ev.type}-${ev.date}-${Math.random()}`,
          type: ev.type,
          category,
          badgeText,
          badgeClass,
          title: ev.title,
          description: ev.description,
          date: ev.date,
          by: getAuthor(ev.by, ev.byName),
          meta: ev.meta,
          icon,
        });
      }
    }

    // 2. Synthesize baseline Acquisition event if missing
    const hasAcq = items.some((it) => it.type === "acquisition" || it.type === "created");
    if (!hasAcq) {
      items.push({
        id: `synth-acq-${enquiry._id}`,
        type: "acquisition",
        category: "lifecycle",
        badgeText: "ACQUISITION",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        title: `Enquiry received via ${(enquiry.source || "website").toUpperCase()}${enquiry.channel ? ` (Channel: ${enquiry.channel.toUpperCase()})` : ""}`,
        description: `Inbound ${enquiry.type?.toUpperCase() || "GENERAL"} lead received from ${enquiry.firstName}${enquiry.lastName ? ` ${enquiry.lastName}` : ""} (${enquiry.email})`,
        date: enquiry.createdAt,
        icon: "📥",
      });
    }

    // Synthesize Customer Trip Requirements if missing
    const hasReq = items.some((it) => it.type === "requirements");
    const totalPax = enquiry.travellerCount ?? ((Number(enquiry.adultCount) || 0) + (Number(enquiry.childCount) || 0) + (Number(enquiry.infantCount) || 0) || undefined);
    if (!hasReq && (enquiry.destination || totalPax || enquiry.budget || enquiry.travelDate)) {
      const parts: string[] = [];
      if (enquiry.destination) parts.push(`Destination: ${enquiry.destination}`);
      if (totalPax) {
        const paxParts: string[] = [];
        if (enquiry.adultCount != null) paxParts.push(`${enquiry.adultCount} Adult${enquiry.adultCount === 1 ? '' : 's'}`);
        if (enquiry.childCount != null && enquiry.childCount > 0) paxParts.push(`${enquiry.childCount} Child${enquiry.childCount === 1 ? '' : 'ren'}`);
        if (enquiry.infantCount != null && enquiry.infantCount > 0) paxParts.push(`${enquiry.infantCount} Infant${enquiry.infantCount === 1 ? '' : 's'}`);
        const paxBreakdown = paxParts.length > 0 ? ` (${paxParts.join(', ')})` : '';
        parts.push(`Travellers: ${totalPax} pax${paxBreakdown}`);
      }
      if (enquiry.budget) parts.push(`Budget: ₹${enquiry.budget.toLocaleString("en-IN")}`);
      if (enquiry.travelDate) parts.push(`Travel Date: ${formatDate(enquiry.travelDate)}`);

      items.push({
        id: `synth-req-${enquiry._id}`,
        type: "requirements",
        category: "lifecycle",
        badgeText: "PREFERENCES",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        title: "Initial trip requirements recorded",
        description: parts.join(" • "),
        date: new Date(new Date(enquiry.createdAt).getTime() + 100).toISOString(),
        icon: "📋",
      });
    }

    // Synthesize Initial Customer Message if missing
    const hasMsg = items.some((it) => it.type === "message");
    if (!hasMsg && enquiry.message) {
      items.push({
        id: `synth-msg-${enquiry._id}`,
        type: "message",
        category: "lifecycle",
        badgeText: "INBOUND QUERY",
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
        title: "Customer inquiry message",
        description: `"${enquiry.message}"`,
        date: new Date(new Date(enquiry.createdAt).getTime() + 200).toISOString(),
        icon: "💬",
      });
    }

    // Synthesize Staff Assignment if missing
    const hasAssign = items.some((it) => it.type === "assignment");
    if (!hasAssign && enquiry.assignedTo) {
      items.push({
        id: `synth-assign-${enquiry._id}`,
        type: "assignment",
        category: "lifecycle",
        badgeText: "ASSIGNMENT",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        title: `Lead assigned to ${enquiry.assignedTo.firstName} ${enquiry.assignedTo.lastName}`,
        description: "Assigned staff member handling customer correspondence",
        date: new Date(new Date(enquiry.createdAt).getTime() + 300).toISOString(),
        by: "System / Admin",
        icon: "👤",
      });
    }

    // Synthesize Call Logs
    for (const call of enquiry.callLog || []) {
      const alreadyIn = items.some(
        (it) => it.type === "call" && Math.abs(new Date(it.date).getTime() - new Date(call.attemptedAt).getTime()) < 3000
      );
      if (!alreadyIn) {
        items.push({
          id: `synth-call-${call.attemptedAt}`,
          type: "call",
          category: "calls",
          badgeText: `CALL • ${(call.outcome || "").toUpperCase()}`,
          badgeClass: CALL_OUTCOME_COLORS[call.outcome] || "bg-slate-50 border-slate-200 text-slate-700",
          title: `Call: ${(call.outcome || "").replace("-", " ").toUpperCase()}${call.duration ? ` (${call.duration}s)` : ""}`,
          description: call.notes ? `"${call.notes}"` : undefined,
          date: call.attemptedAt,
          by: getAuthor(call.by),
          meta: { outcome: call.outcome, duration: call.duration },
          icon: CALL_OUTCOME_ICONS[call.outcome] || "📞",
        });
      }
    }

    // Synthesize Notes
    for (const note of enquiry.notes || []) {
      const alreadyIn = items.some(
        (it) => it.type === "note" && (it.description === note.text || it.title === note.text) && Math.abs(new Date(it.date).getTime() - new Date(note.date).getTime()) < 3000
      );
      if (!alreadyIn) {
        items.push({
          id: note._id || `synth-note-${note.date}`,
          type: "note",
          category: "notes",
          badgeText: "INTERNAL NOTE",
          badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
          title: "Internal note added",
          description: note.text,
          date: note.date,
          by: getAuthor(note.by),
          icon: "📝",
        });
      }
    }

    // Synthesize Linked Custom Itineraries
    if (enquiry.linkedItineraries && enquiry.linkedItineraries.length > 0) {
      for (const pkg of enquiry.linkedItineraries) {
        const alreadyIn = items.some(
          (it) => it.type === "itinerary_linked" && it.title.includes(pkg.name)
        );
        if (!alreadyIn) {
          items.push({
            id: `synth-itinerary-${pkg._id}`,
            type: "itinerary_linked",
            category: "proposals",
            badgeText: "PROPOSAL ATTACHED",
            badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
            title: `Custom itinerary proposal: ${pkg.name}`,
            description: `Package slug: /packages/${pkg.slug}${pkg.price ? ` • Price: ₹${pkg.price.toLocaleString("en-IN")}` : ""}`,
            date: enquiry.updatedAt,
            icon: "🗺️",
            meta: { slug: pkg.slug, price: pkg.price },
          });
        }
      }
    }

    // Synthesize Converted Booking
    const hasConverted = items.some((it) => it.type === "converted");
    if (!hasConverted && enquiry.status === "converted") {
      const refCode = typeof enquiry.bookingRef === "object" ? enquiry.bookingRef.bookingId : enquiry.bookingRef;
      const val = enquiry.conversionValue || (typeof enquiry.bookingRef === "object" ? enquiry.bookingRef.totalAmount : undefined);
      items.push({
        id: `synth-converted-${enquiry._id}`,
        type: "converted",
        category: "proposals",
        badgeText: "CONVERTED",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold",
        title: `Lead Converted to Booking!${refCode ? ` #${refCode}` : ""}`,
        description: val ? `Confirmed booking value: ₹${val.toLocaleString("en-IN")}` : "Customer booking confirmed",
        date: enquiry.updatedAt,
        icon: "🏆",
      });
    }

    // Synthesize Closed / Lost
    const hasClosed = items.some((it) => it.type === "closed");
    if (!hasClosed && enquiry.status === "closed") {
      items.push({
        id: `synth-closed-${enquiry._id}`,
        type: "closed",
        category: "lifecycle",
        badgeText: "CLOSED / LOST",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        title: "Lead marked as lost",
        description: `Reason: ${enquiry.lostReason || "Closed"}${enquiry.lostReasonOtherText ? ` (${enquiry.lostReasonOtherText})` : ""}`,
        date: enquiry.updatedAt,
        icon: "🛑",
      });
    }

    // Synthesize Feedback
    const hasFeedback = items.some((it) => it.type === "feedback");
    if (!hasFeedback && enquiry.feedback) {
      items.push({
        id: `synth-feedback-${enquiry._id}`,
        type: "feedback",
        category: "lifecycle",
        badgeText: "FEEDBACK",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        title: `Customer rating: ${enquiry.feedback.rating} / 5 ⭐`,
        description: enquiry.feedback.comments ? `"${enquiry.feedback.comments}"` : "No written comments",
        date: enquiry.feedback.submittedAt || enquiry.updatedAt,
        icon: "⭐",
      });
    }

    // Synthesize backend activity logs
    if (Array.isArray(enquiry.activityLogs)) {
      for (const log of enquiry.activityLogs) {
        if (log.action === "status_change") {
          const alreadyIn = items.some(
            (it) => it.type === "status_change" && Math.abs(new Date(it.date).getTime() - new Date(log.createdAt).getTime()) < 5000
          );
          if (!alreadyIn) {
            items.push({
              id: log._id || `synth-act-${log.createdAt}`,
              type: "status_change",
              category: "lifecycle",
              badgeText: "STATUS UPDATE",
              badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
              title: log.description,
              date: log.createdAt,
              by: log.userName,
              icon: "🔄",
            });
          }
        }
      }
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
  const filteredTimeline = timeline.filter((item) => {
    if (timelineFilter === "all") return true;
    if (timelineFilter === "lifecycle") return ["lifecycle", "acquisition", "requirements", "status", "assignment"].includes(item.category);
    if (timelineFilter === "calls") return item.category === "calls";
    if (timelineFilter === "notes") return item.category === "notes";
    if (timelineFilter === "proposals") return item.category === "proposals";
    return true;
  });
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

  async function handleDelink(packageId: string) {
    if (window.confirm("Are you sure you want to delink this itinerary from the enquiry?")) {
      try {
        await api.post(`/packages/${packageId}/delink`, {});
        fetchEnquiry(); // Refresh the list
      } catch (error) {
        console.error("Failed to delink package:", error);
        alert("Failed to delink itinerary.");
      }
    }
  }

  function handleCopyItineraryLink(packageId: string) {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://letslivetours.com";
    const url = `${frontendUrl.replace(/\/$/, "")}/itinerary/${packageId}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    setCopiedItineraryId(packageId);
    setTimeout(() => setCopiedItineraryId(null), 2000);
  }

  async function handleDownloadItineraryPdf(packageId: string) {
    setDownloadingPdfId(packageId);
    try {
      const res = await api.get(`/packages/${packageId}`);
      const pkgData = res?.data || res;
      if (pkgData) {
        // Resolve assigned handler name from enquiry or package
        const assignedName = enquiry?.assignedTo
          ? (typeof enquiry.assignedTo === 'object'
              ? `${(enquiry.assignedTo as any).firstName || ''} ${(enquiry.assignedTo as any).lastName || ''}`.trim() || (enquiry.assignedTo as any).name
              : undefined)
          : undefined;
        await generatePackagePdf({
          ...pkgData,
          preparedBy: assignedName || pkgData.preparedBy,
        });
      } else {
        alert("Failed to fetch itinerary details for PDF");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setDownloadingPdfId(null);
    }
  }

  return (
    <RoleGuard permission="enquiries.view">
      {showLogCall && (
        <LogCallModal enquiryId={id} onClose={() => setShowLogCall(false)} onSave={fetchEnquiry} />
      )}

      {showCreateAccount && enquiry && (
        <CreateAccountModal
          enquiry={enquiry}
          onClose={() => setShowCreateAccount(false)}
          onCreated={() => setShowCreateAccount(false)}
        />
      )}

      {showMarkLost && (
        <MarkLostModal
          id={id}
          onClose={() => setShowMarkLost(false)}
          onSave={fetchEnquiry}
        />
      )}

      {showDuplicateModal && (
        <DuplicateItineraryModal enquiryId={id} onClose={() => setShowDuplicateModal(false)} />
      )}
      {showSendLinkModal && enquiry && (
        <SendBookingLinkModal enquiry={enquiry} onClose={() => setShowSendLinkModal(false)} />
      )}

      {showOfflineModal && enquiry && (
        <OfflineBookingModal
          enquiry={enquiry}
          prefilledPackage={offlinePrefilledPackage}
          onClose={() => setShowOfflineModal(false)}
          onSuccess={() => { setShowOfflineModal(false); fetchEnquiry(); }}
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

        {/* Lead Lost Reason Banner */}
        {enquiry.status === "closed" && enquiry.lostReason && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="shrink-0 mt-0.5 text-red-600" size={18} />
            <div>
              <p className="font-semibold text-sm">Lead Marked as Lost</p>
              <p className="text-sm mt-0.5 capitalize">
                <span className="font-medium">Reason:</span> {enquiry.lostReason.replace(/-/g, " ")} 
                {enquiry.lostReason === "other" && enquiry.lostReasonOtherText && ` — ${enquiry.lostReasonOtherText}`}
              </p>
            </div>
          </div>
        )}

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-5">

          {/* ─── LEFT: Lead Info Panel ──────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Identity card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">

              {editingDetails ? (
                /* ── EDIT MODE ── */
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Edit Customer Details</p>
                    <button onClick={() => setEditingDetails(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                      <X size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">First Name *</label>
                      <input
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Last Name</label>
                      <input
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Email *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Phone *</label>
                    <PhoneInput
                      value={editForm.phone}
                      onChange={(val) => setEditForm({ ...editForm, phone: val })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Destination</label>
                    <input
                      value={editForm.destination}
                      onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                      placeholder="e.g. Maldives"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Package Interest</label>
                    <input
                      value={editForm.packageName}
                      onChange={(e) => setEditForm({ ...editForm, packageName: e.target.value })}
                      placeholder="Package name or interest"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Travel Date</label>
                      <input
                        type="date"
                        value={editForm.travelDate}
                        onChange={(e) => setEditForm({ ...editForm, travelDate: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Budget (₹)</label>
                      <input
                        type="number"
                        value={editForm.budget}
                        onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                        placeholder="50000"
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Travellers: Adults, Child, Infant */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Travellers
                      </label>
                      <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                        Total: {(parseInt(editForm.adultCount, 10) || 0) + (parseInt(editForm.childCount, 10) || 0) + (parseInt(editForm.infantCount, 10) || 0)} pax
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 mb-1">Adults</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.adultCount}
                          onChange={(e) => setEditForm({ ...editForm, adultCount: e.target.value })}
                          placeholder="1"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 mb-1">Child</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.childCount}
                          onChange={(e) => setEditForm({ ...editForm, childCount: e.target.value })}
                          placeholder="0"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-600 mb-1">Infant</label>
                        <input
                          type="number"
                          min="0"
                          value={editForm.infantCount}
                          onChange={(e) => setEditForm({ ...editForm, infantCount: e.target.value })}
                          placeholder="0"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Source</label>
                      <select
                        value={editForm.source}
                        onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                      >
                        <option value="">—</option>
                        {["website","whatsapp","phone","walk-in","instagram","google","referral","other"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Channel</label>
                      <select
                        value={editForm.channel}
                        onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                      >
                        <option value="">—</option>
                        {["instagram","google","referral","repeat","walk-in","website","whatsapp","phone","other"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setEditingDetails(false)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditingDetails}
                      disabled={savingDetails}
                      className="flex-1 px-3 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Save size={13} /> {savingDetails ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── READ MODE ── */
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{fullName}</h2>
                      <p className="text-xs text-slate-400 capitalize">{enquiry.type?.replace("-", " ")} · {enquiry.source}</p>
                    </div>
                    <button
                      onClick={startEditingDetails}
                      title="Edit customer details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors shrink-0 mt-0.5"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <a href={`mailto:${enquiry.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-600 transition-colors group">
                      <Mail size={14} className="text-slate-400 group-hover:text-cyan-500 shrink-0" />
                      <span className="truncate">{enquiry.email}</span>
                    </a>
                    <div className="flex items-center justify-between gap-2">
                      <a href={`tel:${enquiry.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors group truncate">
                        <Phone size={14} className="text-slate-400 group-hover:text-emerald-500 shrink-0" />
                        <span className="truncate">{enquiry.phone}</span>
                      </a>
                      {enquiry.phone && (
                        <a 
                          href={`https://wa.me/${enquiry.phone.replace(/[^\d]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Message on WhatsApp"
                          className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold uppercase tracking-wide transition-colors shrink-0"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </a>
                      )}
                    </div>
                    {enquiry.channel && (
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <ExternalLink size={12} className="text-slate-400 shrink-0" />
                        Via {enquiry.channel}
                      </p>
                    )}
                  </div>

                  {/* Travel interest */}
                  {(enquiry.destination || enquiry.packageName || (enquiry.linkedItineraries && enquiry.linkedItineraries.length > 0)) && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {enquiry.destination && (
                        <p className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={13} className="text-slate-400 shrink-0" /> {enquiry.destination}
                        </p>
                      )}
                      
                      {/* Linked Custom Itineraries */}
                      {enquiry.linkedItineraries && enquiry.linkedItineraries.length > 0 ? (
                        <div className="space-y-2 mt-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Linked Itineraries</p>
                          {enquiry.linkedItineraries.map((pkg) => (
                            <div key={pkg._id} className="flex flex-col gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <p className="flex items-center gap-2 text-sm text-cyan-800 font-semibold leading-tight">
                                  <Package size={14} className="shrink-0 text-cyan-600" /> {pkg.name}
                                </p>
                                {pkg.price ? (
                                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                    ₹{pkg.price.toLocaleString('en-IN')}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOfflinePrefilledPackage({
                                      _id: pkg._id,
                                      name: pkg.name,
                                      price: pkg.price,
                                      isInternational: (pkg as any).isInternational,
                                    });
                                    setShowOfflineModal(true);
                                  }}
                                  className="flex-1 text-center text-xs bg-emerald-50 border border-emerald-300 text-emerald-700 py-1.5 rounded-md hover:bg-emerald-100 transition-colors font-bold shadow-sm"
                                  title="Proceed to manual booking for this itinerary"
                                >
                                  Book Offline
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyItineraryLink(pkg._id)}
                                  className="flex-1 flex items-center justify-center gap-1 text-center text-xs bg-white border border-slate-200 text-slate-700 py-1.5 rounded-md hover:bg-slate-50 transition-colors font-medium shadow-sm"
                                  title="Copy customer itinerary link"
                                >
                                  <Copy size={12} className={copiedItineraryId === pkg._id ? "text-emerald-600" : "text-slate-500"} />
                                  {copiedItineraryId === pkg._id ? "Copied!" : "Copy"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadItineraryPdf(pkg._id)}
                                  disabled={downloadingPdfId === pkg._id}
                                  className="flex-1 flex items-center justify-center gap-1 text-center text-xs bg-white border border-cyan-200 text-cyan-700 py-1.5 rounded-md hover:bg-cyan-50 transition-colors font-medium shadow-sm disabled:opacity-50"
                                  title="Download itinerary PDF"
                                >
                                  {downloadingPdfId === pkg._id ? (
                                    <Loader2 size={12} className="animate-spin text-cyan-600" />
                                  ) : (
                                    <Download size={12} className="text-cyan-600" />
                                  )}
                                  {downloadingPdfId === pkg._id ? "PDF..." : "PDF"}
                                </button>
                                <Link
                                  href={`/itineraries/${pkg._id}/edit`}
                                  className="flex-1 text-center text-xs bg-white border border-slate-200 text-slate-600 py-1.5 rounded-md hover:bg-slate-100 transition-colors font-medium shadow-sm"
                                >
                                  Edit
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDelink(pkg._id)}
                                  className="flex-1 text-center text-xs bg-white border border-rose-200 text-rose-600 py-1.5 rounded-md hover:bg-rose-50 transition-colors font-medium shadow-sm"
                                >
                                  Delink
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : enquiry.packageName && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
                            <Package size={13} className="shrink-0" /> {enquiry.packageName}
                          </p>
                          {enquiry.package && typeof enquiry.package === 'object' && '_id' in enquiry.package && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyItineraryLink((enquiry.package as any)._id)}
                                className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors font-semibold flex items-center gap-1 border border-emerald-200"
                                title="Copy customer itinerary link"
                              >
                                <Copy size={11} /> {copiedItineraryId === (enquiry.package as any)._id ? "Copied!" : "Copy Link"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadItineraryPdf((enquiry.package as any)._id)}
                                disabled={downloadingPdfId === (enquiry.package as any)._id}
                                className="text-[11px] bg-cyan-50 text-cyan-700 px-2 py-1 rounded-md hover:bg-cyan-100 transition-colors font-semibold flex items-center gap-1 border border-cyan-200 disabled:opacity-50"
                                title="Download itinerary PDF"
                              >
                                {downloadingPdfId === (enquiry.package as any)._id ? (
                                  <Loader2 size={11} className="animate-spin text-cyan-600" />
                                ) : (
                                  <Download size={11} className="text-cyan-600" />
                                )}
                                PDF
                              </button>
                              <Link
                                href={`/itineraries/${(enquiry.package as any)._id}/edit`}
                                className="text-[11px] bg-cyan-50 text-cyan-700 px-2 py-1 rounded-md hover:bg-cyan-100 transition-colors font-semibold border border-cyan-100"
                              >
                                Edit
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trip details — read mode */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {enquiry.travelDate && (
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={12} className="shrink-0 text-slate-400" /> {formatDate(enquiry.travelDate)}
                      </p>
                    )}
                    {((enquiry.travellerCount && enquiry.travellerCount > 0) || (enquiry.adultCount != null && enquiry.adultCount > 0) || (enquiry.childCount != null && enquiry.childCount > 0) || (enquiry.infantCount != null && enquiry.infantCount > 0)) && (
                      <div className="flex items-start gap-2 text-xs text-slate-500">
                        <Users size={12} className="shrink-0 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-700">
                            {(enquiry.adultCount != null || enquiry.childCount != null || enquiry.infantCount != null)
                              ? `${(enquiry.adultCount || 0) + (enquiry.childCount || 0) + (enquiry.infantCount || 0)} traveller${((enquiry.adultCount || 0) + (enquiry.childCount || 0) + (enquiry.infantCount || 0)) === 1 ? "" : "s"}`
                              : `${enquiry.travellerCount} traveller${(enquiry.travellerCount || 0) > 1 ? "s" : ""}`
                            }
                          </p>
                          {(enquiry.adultCount != null || enquiry.childCount != null || enquiry.infantCount != null) && (
                            <p className="text-[11px] text-slate-400">
                              {[
                                `${enquiry.adultCount ?? 0} Adult${(enquiry.adultCount ?? 0) === 1 ? "" : "s"}`,
                                (enquiry.childCount ?? 0) > 0 ? `${enquiry.childCount} Child${(enquiry.childCount ?? 0) === 1 ? "" : "ren"}` : null,
                                (enquiry.infantCount ?? 0) > 0 ? `${enquiry.infantCount} Infant${(enquiry.infantCount ?? 0) === 1 ? "" : "s"}` : null,
                              ].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
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
                </>
              )}

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

            {/* Call Attempts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Call Attempts</p>
              <CallDots callLog={enquiry.callLog || []} dnpCount={enquiry.dnpCount || 0} />
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
              <div className={`rounded-2xl border p-4 ${
                enquiry.bookingRef.paymentFinanceStatus === 'pending_approval'
                  ? 'bg-amber-50 border-amber-200'
                  : enquiry.bookingRef.paymentFinanceStatus === 'rejected'
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs font-semibold ${
                    enquiry.bookingRef.paymentFinanceStatus === 'pending_approval'
                      ? 'text-amber-800'
                      : enquiry.bookingRef.paymentFinanceStatus === 'rejected'
                      ? 'text-rose-700'
                      : 'text-emerald-700'
                  }`}>
                    {enquiry.bookingRef.paymentFinanceStatus === 'pending_approval'
                      ? 'Booking Pending Finance Approval'
                      : enquiry.bookingRef.paymentFinanceStatus === 'rejected'
                      ? 'Booking Payment Disapproved'
                      : 'Converted Booking'}
                  </p>
                  {enquiry.bookingRef.paymentFinanceStatus === 'pending_approval' && (
                    <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      Pending
                    </span>
                  )}
                </div>
                <Link href={`/bookings/${enquiry.bookingRef._id || enquiry.bookingRef.bookingId}`} className="text-sm font-bold text-slate-800 hover:text-cyan-600 hover:underline block">
                  {enquiry.bookingRef.bookingId}
                </Link>
                <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(enquiry.bookingRef.totalAmount)}</p>
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

            {/* Timeline & Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Timeline & Activity Feed
                  </p>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600">
                    {timeline.length} updates
                  </span>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
                  <button
                    onClick={() => setTimelineFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      timelineFilter === "all"
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    All ({timeline.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter("lifecycle")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      timelineFilter === "lifecycle"
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Lifecycle
                  </button>
                  <button
                    onClick={() => setTimelineFilter("calls")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      timelineFilter === "calls"
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Calls ({enquiry.callLog?.length || 0})
                  </button>
                  <button
                    onClick={() => setTimelineFilter("notes")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      timelineFilter === "notes"
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Notes ({enquiry.notes?.length || 0})
                  </button>
                  <button
                    onClick={() => setTimelineFilter("proposals")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      timelineFilter === "proposals"
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    Proposals & Booking
                  </button>
                </div>
              </div>

              {filteredTimeline.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No activity matching filter</p>
              ) : (
                <div className="space-y-0 pt-1">
                  {filteredTimeline.map((item, i) => (
                    <div key={item.id || i} className="flex gap-3 group">
                      {/* Left Icon & Connecting Line */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-sm border-2 ${
                            item.type === "call"
                              ? CALL_OUTCOME_COLORS[(item.meta?.outcome as string) || ""] || "bg-emerald-50 border-emerald-200"
                              : item.type === "note"
                              ? "bg-sky-50 border-sky-200 text-sky-700"
                              : item.type === "converted"
                              ? "bg-emerald-100 border-emerald-400 text-emerald-800"
                              : item.type === "closed"
                              ? "bg-red-50 border-red-200 text-red-700"
                              : item.type === "requirements"
                              ? "bg-purple-50 border-purple-200 text-purple-700"
                              : item.type === "acquisition"
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : item.type === "itinerary_linked"
                              ? "bg-rose-50 border-rose-200 text-rose-700"
                              : item.type === "booking_link_sent"
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          {item.icon}
                        </div>
                        {i < filteredTimeline.length - 1 && (
                          <div className="w-px flex-1 my-1 bg-slate-200 min-h-[28px]" />
                        )}
                      </div>

                      {/* Content Card */}
                      <div className="pb-5 flex-1 min-w-0">
                        <div className="bg-slate-50/70 hover:bg-slate-50 transition-colors rounded-xl p-3 border border-slate-200/70">
                          {/* Top Row: Badge & Timestamp */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wider ${item.badgeClass}`}
                            >
                              {item.badgeText}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              {formatDateTime(item.date)}
                            </span>
                          </div>

                          {/* Title */}
                          <p className="text-sm font-semibold text-slate-800 leading-snug">
                            {item.title}
                          </p>

                          {/* Description / Content Body */}
                          {item.description && (
                            <div className="mt-1.5 text-xs text-slate-600 leading-relaxed break-words bg-white rounded-lg p-2.5 border border-slate-200/80 shadow-xs">
                              {item.description}
                            </div>
                          )}

                          {/* Requirements Pills */}
                          {item.type === "requirements" && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {enquiry.destination && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium border border-purple-100">
                                  <MapPin size={10} /> {enquiry.destination}
                                </span>
                              )}
                              {((enquiry.travellerCount && enquiry.travellerCount > 0) || (enquiry.adultCount != null && enquiry.adultCount > 0) || (enquiry.childCount != null && enquiry.childCount > 0) || (enquiry.infantCount != null && enquiry.infantCount > 0)) && (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium border border-purple-100"
                                  title={[
                                    enquiry.adultCount != null ? `${enquiry.adultCount} Adult${enquiry.adultCount === 1 ? '' : 's'}` : null,
                                    enquiry.childCount != null && enquiry.childCount > 0 ? `${enquiry.childCount} Child${enquiry.childCount === 1 ? '' : 'ren'}` : null,
                                    enquiry.infantCount != null && enquiry.infantCount > 0 ? `${enquiry.infantCount} Infant${enquiry.infantCount === 1 ? '' : 's'}` : null,
                                  ].filter(Boolean).join(', ')}
                                >
                                  <Users size={10} />
                                  {(enquiry.adultCount != null || enquiry.childCount != null || enquiry.infantCount != null)
                                    ? `${(enquiry.adultCount || 0) + (enquiry.childCount || 0) + (enquiry.infantCount || 0)} Pax`
                                    : `${enquiry.travellerCount} Pax`}
                                </span>
                              )}
                              {enquiry.budget && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium border border-purple-100">
                                  <DollarSign size={10} /> ₹{enquiry.budget.toLocaleString("en-IN")}
                                </span>
                              )}
                              {enquiry.travelDate && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium border border-purple-100">
                                  <Calendar size={10} /> {formatDate(enquiry.travelDate)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Footer: Actor */}
                          {item.by && (
                            <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-400">
                              <User size={10} />
                              <span>Recorded by <strong className="font-semibold text-slate-600">{item.by}</strong></span>
                            </div>
                          )}
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

              <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={13} className="text-purple-600" /> Schedule Follow-up
                  </p>
                  {enquiry.followUpDate && (
                    <button
                      type="button"
                      onClick={clearFollowUp}
                      className="text-[11px] font-medium text-rose-500 hover:text-rose-700 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {enquiry.followUpDate && (
                  <div className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Clock size={12} className="shrink-0 text-purple-600" />
                    <span>
                      Scheduled: <strong>{new Date(enquiry.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                      {(() => {
                        const d = new Date(enquiry.followUpDate);
                        return (
                          <> at <strong>{d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</strong></>
                        );
                      })()}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">Date</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-1">Time</label>
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Follow-up note (e.g. Call regarding quotation)..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400"
                />

                <button
                  onClick={saveFollowUp}
                  disabled={!followUpDate || savingFollowUp}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 ${
                    followUpSaved 
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" 
                      : "bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                  }`}
                >
                  <Calendar size={13} /> {savingFollowUp ? "Saving..." : followUpSaved ? "✓ Scheduled!" : "Schedule Follow-up"}
                </button>
              </div>

              <Link
                href={`/itineraries/new?enquiryId=${id}`}
                className="w-full flex items-center gap-3 px-4 py-3 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Package size={16} /> Create Itinerary
              </Link>
              
              <button
                onClick={() => setShowDuplicateModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
              >
                <Copy size={16} /> Duplicate & Link Itinerary
              </button>

              {/* Create Customer Account */}
              <button
                onClick={() => setShowCreateAccount(true)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
              >
                <UserPlus size={16} /> Create Customer Account
              </button>

              {/* Send Booking Link */}
              <button
                onClick={() => setShowSendLinkModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
              >
                <Send size={16} /> Send Booking Link
              </button>

              {/* Manual / Offline Booking */}
              <button
                onClick={() => {
                  let selectedPackage: { _id: string; name: string; isInternational?: boolean; price?: number } | null = null;
                  if (enquiry.linkedItineraries && enquiry.linkedItineraries.length > 0) {
                    const firstLinked = enquiry.linkedItineraries[0];
                    selectedPackage = { 
                      _id: firstLinked._id, 
                      name: firstLinked.name, 
                      price: firstLinked.price,
                      isInternational: (firstLinked as any).isInternational 
                    };
                  } else if (enquiry.package && typeof enquiry.package === 'object') {
                    selectedPackage = { 
                      _id: (enquiry.package as any)._id, 
                      name: (enquiry.package as any).name || enquiry.packageName || 'Package', 
                      price: (enquiry.package as any).price,
                      isInternational: (enquiry.package as any).isInternational 
                    };
                  }
                  setOfflinePrefilledPackage(selectedPackage);
                  setShowOfflineModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <Banknote size={16} /> Proceed as Manual Booking
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
