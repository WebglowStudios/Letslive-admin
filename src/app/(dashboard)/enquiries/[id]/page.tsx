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
  Save, Plus, X, ExternalLink, RefreshCw, UserPlus, Send, Copy, Trash2, Edit2, Banknote, Search
} from "lucide-react";

import Link from "next/link";
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
function OfflineBookingModal({
  enquiry,
  prefilledPackage,
  onClose,
  onSuccess,
}: {
  enquiry: Enquiry;
  prefilledPackage: { _id: string; name: string; isInternational?: boolean } | null;
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

  // Package info
  const [isInternational, setIsInternational] = useState(prefilledPackage?.isInternational || false);

  // Form state
  const [form, setForm] = useState({
    packageId: prefilledPackage?._id || '',
    travelDate: enquiry.travelDate ? String(enquiry.travelDate).slice(0, 10) : '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    totalAmount: enquiry.budget || 0,
    panCard: '',
    specialRequests: '',
    paymentMode: 'cash',
    paidAmount: 0,
    transactionId: '',
    paymentRemarks: '',
  });

  // Traveller details (for international)
  const totalPax = form.adults + form.children + form.infants;
  const [travellersDetails, setTravellersDetails] = useState<{ name: string; age: string; type: string; passportNumber: string; passportExpiry: string; issuingCountry: string }[]>([]);

  useEffect(() => {
    const newDetails = Array.from({ length: totalPax }, (_, i) => travellersDetails[i] || {
      name: '', age: '', type: i < form.adults ? 'adult' : i < form.adults + form.children ? 'child' : 'infant',
      passportNumber: '', passportExpiry: '', issuingCountry: '',
    });
    setTravellersDetails(newDetails);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPax]);

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
        travellers: { adults: form.adults, children: form.children, infants: form.infants },
        travellersDetails: isInternational ? travellersDetails : undefined,
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
              <div className="mt-2 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {foundUser.firstName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{foundUser.firstName} {foundUser.lastName}</p>
                  <p className="text-xs text-slate-500">{foundUser.email} {foundUser.phone ? `· ${foundUser.phone}` : ''}</p>
                </div>
                <CheckCircle size={16} className="text-emerald-600 ml-auto shrink-0" />
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Travel Date *</label>
                <input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Return Date</label>
                <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Adults *</label>
                <input type="number" min={1} value={form.adults} onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Children</label>
                <input type="number" min={0} value={form.children} onChange={(e) => setForm({ ...form, children: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Infants</label>
                <input type="number" min={0} value={form.infants} onChange={(e) => setForm({ ...form, infants: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Total Amount (₹) *</label>
                <input type="number" min={1} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Special Requests</label>
              <textarea rows={2} value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} className={inputCls} placeholder="Window seat, vegetarian meals, etc." />
            </div>
          </div>

          {/* ── Section 3: PAN Card (international only) ── */}
          {isInternational && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">3. PAN Card (International)</p>
              <div>
                <label className={labelCls}>Primary Traveller PAN Card *</label>
                <input type="text" value={form.panCard} onChange={(e) => setForm({ ...form, panCard: e.target.value })} className={inputCls} placeholder="ABCDE1234F" />
              </div>
            </div>
          )}

          {/* ── Section 4: Passport Details (international only) ── */}
          {isInternational && totalPax > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">4. Passport Details — {totalPax} Traveller{totalPax > 1 ? 's' : ''}</p>
              <div className="space-y-4">
                {travellersDetails.map((t, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Traveller {i + 1} ({t.type})</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Full Name *</label>
                        <input value={t.name} onChange={(e) => { const d = [...travellersDetails]; d[i].name = e.target.value; setTravellersDetails(d); }} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Age</label>
                        <input type="number" value={t.age} onChange={(e) => { const d = [...travellersDetails]; d[i].age = e.target.value; setTravellersDetails(d); }} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Passport No. *</label>
                        <input value={t.passportNumber} onChange={(e) => { const d = [...travellersDetails]; d[i].passportNumber = e.target.value; setTravellersDetails(d); }} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Passport Expiry *</label>
                        <input type="date" value={t.passportExpiry} onChange={(e) => { const d = [...travellersDetails]; d[i].passportExpiry = e.target.value; setTravellersDetails(d); }} className={inputCls} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Issuing Country *</label>
                        <input value={t.issuingCountry} onChange={(e) => { const d = [...travellersDetails]; d[i].issuingCountry = e.target.value; setTravellersDetails(d); }} className={inputCls} placeholder="India" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section 5: Offline Payment ── */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{isInternational ? '5' : '3'}. Offline Payment</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Amount Paid (₹)</label>
                <input type="number" min={0} value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} className={inputCls} placeholder="0 if nothing paid yet" />
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
            {form.paidAmount > 0 && form.totalAmount > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-medium">
                Payment Status: {form.paidAmount >= form.totalAmount ? '✅ Fully Paid' : `🟡 Partial — ₹${(form.totalAmount - form.paidAmount).toLocaleString('en-IN')} balance remaining`}
              </div>
            )}
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
  const [offlinePrefilledPackage, setOfflinePrefilledPackage] = useState<{ _id: string; name: string; isInternational?: boolean } | null>(null);
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

  // ── Inline customer detail editing ──
  const [editingDetails, setEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    destination: "",
    travelDate: "",
    travellerCount: "",
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
      travellerCount: enquiry.travellerCount != null ? String(enquiry.travellerCount) : "",
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
    try {
      await api.put(`/enquiries/${id}`, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim() || undefined,
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        destination: editForm.destination.trim() || undefined,
        travelDate: editForm.travelDate || undefined,
        travellerCount: editForm.travellerCount ? Number(editForm.travellerCount) : undefined,
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

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Travel Date</label>
                    <input
                      type="date"
                      value={editForm.travelDate}
                      onChange={(e) => setEditForm({ ...editForm, travelDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Travellers</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.travellerCount}
                        onChange={(e) => setEditForm({ ...editForm, travellerCount: e.target.value })}
                        placeholder="2"
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
                            <div key={pkg._id} className="flex flex-col gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                              <p className="flex items-center gap-2 text-sm text-cyan-700 font-medium leading-tight">
                                <Package size={14} className="shrink-0 text-cyan-600" /> {pkg.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Link
                                  href={`/itineraries/${pkg._id}/edit`}
                                  className="flex-1 text-center text-xs bg-white border border-slate-200 text-slate-600 py-1.5 rounded-md hover:bg-slate-100 transition-colors font-medium"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDelink(pkg._id)}
                                  className="flex-1 text-center text-xs bg-white border border-rose-200 text-rose-600 py-1.5 rounded-md hover:bg-rose-50 transition-colors font-medium"
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
                            <Link
                              href={`/itineraries/${(enquiry.package as any)._id}/edit`}
                              className="text-[10px] bg-cyan-50 text-cyan-700 px-2 py-1 rounded-md hover:bg-cyan-100 transition-colors font-semibold"
                            >
                              Edit
                            </Link>
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
                  setOfflinePrefilledPackage(
                    enquiry.package && typeof enquiry.package === 'object'
                      ? { _id: (enquiry.package as any)._id, name: (enquiry.package as any).name || enquiry.packageName || 'Package', isInternational: (enquiry.package as any).isInternational }
                      : null
                  );
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
