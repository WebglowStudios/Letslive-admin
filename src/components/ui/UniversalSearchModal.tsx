"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Package as PackageIcon,
  Phone,
  Search,
  Sparkles,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

interface LifecycleBundle {
  unifiedId: string;
  brand: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    pax: number;
  };
  destination: string;
  packageName: string;
  travelDates?: {
    start?: string;
    end?: string;
  };
  currentStage: "enquiry" | "booking" | "operations" | "completed" | "cancelled";
  enquiry?: {
    _id: string;
    enquiryId?: string;
    unifiedBookingId?: string;
    status: string;
    source: string;
    assignedTo?: { _id: string; name: string; email: string };
    message?: string;
    notesCount: number;
    callLogCount: number;
    createdAt: string;
  };
  booking?: {
    _id: string;
    bookingId: string;
    status: string;
    bookingStatus: string;
    paymentStatus: string;
    paymentFinanceStatus: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    travellersCount: number;
    travellersDetails?: any[];
    createdAt: string;
  };
  operation?: {
    _id: string;
    operationId: string;
    status: string;
    voucherGenerated: boolean;
    assignedTo?: { _id: string; name: string; email: string };
    sellingPrice: number;
    totalVendorCost: number;
    grossProfit: number;
    notes?: string;
    createdAt: string;
  };
  payments: {
    _id: string;
    milestone: string;
    amount: number;
    paidAmount: number;
    status: string;
    dueDate?: string;
    paidDate?: string;
    paymentMode?: string;
    transactionId?: string;
    financeStatus?: string;
  }[];
  financeSummary: {
    totalAmount: number;
    paidAmount: number;
    balance: number;
    status: "paid" | "partial" | "pending";
  };
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function UniversalSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
}: UniversalSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LifecycleBundle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "enquiry" | "booking" | "operation" | "payments">("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen, initialQuery]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/universal-search?q=${encodeURIComponent(trimmed)}`);
        setResults(res.data || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Universal search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Copy ID to clipboard
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  const currentTrip = results[selectedIndex] || null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-3 bg-white sticky top-0 z-20">
          <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
            <Search size={20} />
          </div>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Unified Trip ID (e.g. LLT-2026-00045, ENQ-...), customer name, phone, email, or transaction ID..."
              className="w-full text-sm sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 bg-transparent outline-none pr-8"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {loading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent shrink-0"></div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {query.trim() === "" ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
                <Sparkles size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Universal Customer & Trip Search
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Type any <strong>Unified Booking ID</strong> (LLT-...), <strong>Enquiry ID</strong> (ENQ-...), <strong>Phone Number</strong>, <strong>Customer Email</strong>, or <strong>Payment Transaction ID</strong> to view the entire customer lifecycle in one place.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 font-medium">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">e.g. LLT-2026-00001</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">e.g. ENQ-2026-00001</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">Phone: 9876543210</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">Transaction ID</span>
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No matching records found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No bookings, enquiries, post-sales operations, or payment transactions matched "{query}".
              </p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Left Column: Match List (if multiple results match) */}
              {results.length > 1 && (
                <div className="w-full md:w-72 bg-slate-50/70 p-3 space-y-2 shrink-0 border-r border-slate-100 overflow-y-auto max-h-[35vh] md:max-h-none">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Matching Trips ({results.length})
                  </p>
                  {results.map((trip, idx) => (
                    <button
                      key={trip.unifiedId}
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        selectedIndex === idx
                          ? "bg-white border-cyan-400 shadow-sm ring-1 ring-cyan-400"
                          : "bg-white/80 border-slate-200/80 hover:bg-white text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-700">
                          {trip.unifiedId}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            trip.currentStage === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : trip.currentStage === "operations"
                              ? "bg-cyan-100 text-cyan-700"
                              : trip.currentStage === "booking"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {trip.currentStage}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 truncate">
                        {trip.customer.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {trip.destination} • {trip.packageName}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Right Column: Full 360° Customer & Trip Lifecycle Visualizer */}
              {currentTrip && (
                <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto">
                  {/* Master Trip Header Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white relative overflow-hidden shadow-lg">
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800">
                            Unified Master Trip ID
                          </span>
                          <span className="text-xs font-medium text-slate-400 capitalize">
                            {currentTrip.brand.replace("-", " ")}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5">
                          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                            {currentTrip.unifiedId}
                          </h2>
                          <button
                            onClick={() => handleCopyId(currentTrip.unifiedId)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
                            title="Copy Master ID"
                          >
                            {copiedId === currentTrip.unifiedId ? (
                              <Check size={16} className="text-emerald-400" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-3 text-xs text-slate-300">
                          <span className="flex items-center gap-1.5 font-medium">
                            <User size={13} className="text-cyan-400" />
                            {currentTrip.customer.name}
                          </span>
                          {currentTrip.customer.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={13} className="text-cyan-400" />
                              {currentTrip.customer.phone}
                            </span>
                          )}
                          {currentTrip.customer.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail size={13} className="text-cyan-400" />
                              {currentTrip.customer.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-cyan-400" />
                            {currentTrip.destination}
                          </span>
                        </div>
                      </div>

                      {/* Current Status Badge */}
                      <div className="sm:text-right shrink-0">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            currentTrip.currentStage === "completed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : currentTrip.currentStage === "operations"
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : currentTrip.currentStage === "booking"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          Stage: {currentTrip.currentStage}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {currentTrip.travelDates?.start
                            ? `Travel: ${new Date(currentTrip.travelDates.start).toLocaleDateString("en-IN")}`
                            : "Travel date pending"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4-Stage Visual Lifecycle Stepper */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      End-to-End Customer Lifecycle Journey
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Stage 1: Enquiry */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          currentTrip.enquiry
                            ? "bg-blue-50/50 border-blue-200"
                            : "bg-slate-50 border-slate-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                            1. Enquiry / Lead
                          </span>
                          {currentTrip.enquiry && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold uppercase px-1.5 py-0.5 rounded">
                              {currentTrip.enquiry.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                          {currentTrip.enquiry?.enquiryId || "Direct Booking"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentTrip.enquiry?.assignedTo
                            ? `Agent: ${currentTrip.enquiry.assignedTo.name}`
                            : "No agent assigned"}
                        </p>
                        {currentTrip.enquiry && (
                          <Link
                            href={`/enquiries/${currentTrip.enquiry._id}`}
                            onClick={onClose}
                            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View Enquiry <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>

                      {/* Stage 2: Booking */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          currentTrip.booking
                            ? "bg-purple-50/50 border-purple-200"
                            : "bg-slate-50 border-slate-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                            2. Confirmed Booking
                          </span>
                          {currentTrip.booking && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold uppercase px-1.5 py-0.5 rounded">
                              {currentTrip.booking.bookingStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                          {currentTrip.booking ? currentTrip.booking.bookingId : "Not converted yet"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentTrip.booking
                            ? `${formatCurrency(currentTrip.booking.totalAmount)} • ${currentTrip.booking.travellersCount} Pax`
                            : "Pending customer conversion"}
                        </p>
                        {currentTrip.booking && (
                          <Link
                            href={`/bookings`}
                            onClick={onClose}
                            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            View Booking <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>

                      {/* Stage 3: Post-Sales Operations */}
                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          currentTrip.operation
                            ? "bg-cyan-50/50 border-cyan-200"
                            : "bg-slate-50 border-slate-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                            3. Post-Sales Ops
                          </span>
                          {currentTrip.operation && (
                            <span className="text-[9px] bg-cyan-100 text-cyan-800 font-extrabold uppercase px-1.5 py-0.5 rounded">
                              {currentTrip.operation.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                          {currentTrip.operation
                            ? currentTrip.operation.operationId
                            : "Pending operations handoff"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentTrip.operation?.assignedTo
                            ? `Ops: ${currentTrip.operation.assignedTo.name}`
                            : currentTrip.operation?.voucherGenerated
                            ? "Voucher Issued ✓"
                            : "Voucher Pending"}
                        </p>
                        {currentTrip.operation && (
                          <Link
                            href={`/operations/${currentTrip.operation._id}`}
                            onClick={onClose}
                            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:text-cyan-800 hover:underline"
                          >
                            View Operation <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>

                      {/* Stage 4: Payments & Finance */}
                      <div className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            4. Payment & Finance
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              currentTrip.financeSummary.status === "paid"
                                ? "bg-emerald-100 text-emerald-800"
                                : currentTrip.financeSummary.status === "partial"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {currentTrip.financeSummary.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          {formatCurrency(currentTrip.financeSummary.paidAmount)} /{" "}
                          {formatCurrency(currentTrip.financeSummary.totalAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {currentTrip.financeSummary.balance > 0
                            ? `Due: ${formatCurrency(currentTrip.financeSummary.balance)}`
                            : "Fully Settled ✓"}
                        </p>
                        <Link
                          href={`/finance`}
                          onClick={onClose}
                          className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                        >
                          Finance Hub <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Payment Milestones & Transactions Table */}
                  {currentTrip.payments && currentTrip.payments.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard size={14} className="text-emerald-600" />
                          Payment Milestones & Transactions ({currentTrip.payments.length})
                        </h4>
                        <span className="text-xs font-bold text-slate-700">
                          Total Paid: {formatCurrency(currentTrip.financeSummary.paidAmount)}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-white/80 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 rounded-l-lg">Milestone</th>
                              <th className="py-2.5 px-3">Amount</th>
                              <th className="py-2.5 px-3">Paid Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Mode</th>
                              <th className="py-2.5 px-3 rounded-r-lg">Transaction ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {currentTrip.payments.map((p) => (
                              <tr key={p._id} className="hover:bg-slate-50/60">
                                <td className="py-2 px-3 font-medium text-slate-800">
                                  {p.milestone}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-800">
                                  {formatCurrency(p.amount)}
                                </td>
                                <td className="py-2 px-3 font-semibold text-emerald-600">
                                  {formatCurrency(p.paidAmount)}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      p.status === "paid"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 uppercase text-slate-500 text-[11px]">
                                  {p.paymentMode || "—"}
                                </td>
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[150px]">
                                  {p.transactionId || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
