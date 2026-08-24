"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft, User, Package, MapPin, Calendar, Users, CreditCard,
  CheckCircle, Clock, XCircle, AlertCircle, Phone, Mail,
  RefreshCw, MessageSquare, ExternalLink, ChevronRight, Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission, useRole } from "@/hooks/usePermission";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingDetail {
  _id: string;
  bookingId: string;
  user: { _id: string; firstName: string; lastName: string; email: string; phone?: string };
  package: { _id: string; name: string; slug: string; duration?: { nights: number; days: number }; price?: number };
  destination?: { _id: string; name: string };
  enquiry?: string | { _id: string; [key: string]: any };
  travelDate: string;
  returnDate?: string;
  travellers: { adults: number; children: number; infants: number };
  travellersDetails: { name: string; age?: number; type: string }[];
  primaryTraveller: { firstName: string; lastName: string; email: string; phone?: string };
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentFinanceStatus?: string;
  bookingStatus: string;
  specialRequests?: string;
  paymentHistory: { amount: number; method: string; transactionId?: string; date: string; status: string }[];
  cancellationReason?: string;
  cancelledAt?: string;
  dateChangeHistory?: { oldDate: string; newDate: string; reason: string; changedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-cyan-100 text-cyan-700",
  "staff-confirmed": "bg-indigo-100 text-indigo-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  refunded: "bg-purple-100 text-purple-700",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle size={14} className="text-emerald-500" />;
  if (status === "cancelled") return <XCircle size={14} className="text-red-500" />;
  if (status === "confirmed") return <CheckCircle size={14} className="text-cyan-500" />;
  if (status === "staff-confirmed") return <CheckCircle size={14} className="text-indigo-500" />;
  if (status === "in-progress") return <RefreshCw size={14} className="text-blue-500" />;
  return <Clock size={14} className="text-amber-500" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Payment Link Modal State
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [paymentLinkData, setPaymentLinkData] = useState<{ amount: string; description: string } | null>(null);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);

  const canUpdate = usePermission("bookings.update");
  const role = useRole();
  const canEditDates = role === 'admin' || role === 'manager';

  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editTravelDate, setEditTravelDate] = useState("");
  const [editReturnDate, setEditReturnDate] = useState("");
  const [updatingDates, setUpdatingDates] = useState(false);
  const [showDateReasonModal, setShowDateReasonModal] = useState(false);
  const [dateChangeReason, setDateChangeReason] = useState("");

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res?.data || res);
    } catch {
      router.push("/bookings");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  async function updateStatus(bookingStatus: string) {
    setUpdatingStatus(true);
    try {
      await api.put(`/bookings/${id}/status`, { bookingStatus });
      fetchBooking();
    } catch { alert("Failed to update status"); }
    finally { setUpdatingStatus(false); }
  }

  async function updatePayment(paymentStatus: string) {
    let payload: any = { paymentStatus };
    if (paymentStatus === 'paid' || paymentStatus === 'partial') {
      const amountStr = window.prompt("Enter Amount Paid (Numbers only):", "");
      if (amountStr === null) return;
      const amount = Number(amountStr);
      if (isNaN(amount) || amount <= 0) return alert("Invalid amount entered. Please enter a valid number.");
      
      const mode = window.prompt("Enter Payment Mode (e.g., UPI, Cash, NEFT):", "");
      if (mode === null) return;
      const txId = window.prompt("Enter Transaction ID (optional):", "");
      if (txId === null) return;
      const remarks = window.prompt("Enter Remarks (optional):", "");
      if (remarks === null) return;
      payload.financeDetails = { paidAmount: amount, mode, transactionId: txId, remarks };
    }
    
    setUpdatingPayment(true);
    try {
      await api.put(`/bookings/${id}/status`, payload);
      fetchBooking();
    } catch { alert("Failed to update payment status"); }
    finally { setUpdatingPayment(false); }
  }

  async function updateDates() {
    if (!editTravelDate) return alert("Start date is required");
    if (!dateChangeReason.trim()) return alert("Reason is required");
    setUpdatingDates(true);
    try {
      await api.put(`/bookings/${id}/dates`, { travelDate: editTravelDate, returnDate: editReturnDate, reason: dateChangeReason });
      setIsEditingDates(false);
      setShowDateReasonModal(false);
      setDateChangeReason("");
      fetchBooking();
    } catch {
      alert("Failed to update dates");
    } finally {
      setUpdatingDates(false);
    }
  }

  const handleGeneratePaymentLink = () => {
    if (!booking) return;
    const amountDue = booking.totalAmount - (booking.paidAmount || 0);
    setPaymentLinkData({
      amount: amountDue > 0 ? amountDue.toString() : "0",
      description: `Payment for Booking ${booking.bookingId}`
    });
    setShowPaymentLinkModal(true);
  };

  const submitPaymentLink = async () => {
    if (!paymentLinkData || !booking) return;
    const { amount, description } = paymentLinkData;
    
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Invalid amount");
      return;
    }

    setPaymentLinkLoading(true);
    try {
      const res = await api.post('/payments/create-link', {
        amount: amountNum,
        description,
        bookingId: booking._id,
        customerName: booking.user?.firstName || 'Customer',
        customerEmail: booking.user?.email,
        customerPhone: booking.user?.phone
      });
      if (res.data?.short_url) {
        setShowPaymentLinkModal(false);
        alert(`Payment link generated! Copied to clipboard.\n${res.data.short_url}`);
        navigator.clipboard.writeText(res.data.short_url).catch(() => {});
      } else {
        alert("Failed to get link");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to generate link");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) return null;

  const user = booking.user;
  const pkg = booking.package;
  const dest = booking.destination;
  const pax = booking.travellers;
  const totalPax = (pax?.adults || 0) + (pax?.children || 0) + (pax?.infants || 0);
  const amountDue = booking.totalAmount - (booking.paidAmount || 0);

  return (
    <RoleGuard permission="bookings.view">
      <div className="space-y-5 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/bookings")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={15} /> Bookings
          </button>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-sm font-semibold text-slate-800">{booking.bookingId}</span>
          <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${BOOKING_STATUS_COLORS[booking.bookingStatus] || ""}`}>
            {booking.bookingStatus === 'confirmed' ? 'Guest Confirmed' : booking.bookingStatus === 'staff-confirmed' ? 'Staff Confirmed' : booking.bookingStatus}
          </span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <StatusIcon status={booking.bookingStatus} />
                <h1 className="text-2xl font-bold text-slate-800">{booking.bookingId}</h1>
              </div>
              <p className="text-sm text-slate-400">Created {formatDateTime(booking.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {canUpdate && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-medium uppercase">Booking Status</label>
                    <select
                      value={booking.bookingStatus}
                      onChange={(e) => updateStatus(e.target.value)}
                      disabled={updatingStatus}
                      className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {["pending", "confirmed", "staff-confirmed", "in-progress", "completed", "cancelled"].map((s) => (
                        <option key={s} value={s}>{s === 'confirmed' ? 'Guest Confirmed' : s === 'staff-confirmed' ? 'Staff Confirmed' : s.replace("-", " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 font-medium uppercase">Payment</label>
                    <div className="flex items-center gap-2">
                      <select
                        value={booking.paymentStatus}
                        onChange={(e) => updatePayment(e.target.value)}
                        disabled={updatingPayment || booking.paymentFinanceStatus === 'pending_approval'}
                        className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {["pending", "partial", "paid", "refunded"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {booking.paymentFinanceStatus === 'pending_approval' && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full whitespace-nowrap">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ─── LEFT (2/3): main content ───────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Package + Destination */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Trip Details</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{pkg?.name}</p>
                    {pkg?.duration && (
                      <p className="text-xs text-slate-400">{pkg.duration.nights}N / {pkg.duration.days}D</p>
                    )}
                  </div>
                </div>
                {dest && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-400 shrink-0" />
                    <p className="text-sm text-slate-600">{dest.name}</p>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    {!isEditingDates ? (
                      <p className="text-sm text-slate-600">
                        {formatDate(booking.travelDate)}
                        {booking.returnDate && ` → ${formatDate(booking.returnDate)}`}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 w-12">Start:</label>
                          <input type="date" value={editTravelDate} onChange={e => setEditTravelDate(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 w-12">Return:</label>
                          <input type="date" value={editReturnDate} onChange={e => setEditReturnDate(e.target.value)} className="text-sm border border-slate-200 rounded px-2 py-1" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => setShowDateReasonModal(true)} disabled={updatingDates} className="text-xs bg-cyan-600 text-white px-3 py-1 rounded hover:bg-cyan-700">Next</button>
                          <button onClick={() => setIsEditingDates(false)} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {canEditDates && !isEditingDates && (
                    <button 
                      onClick={() => {
                        setEditTravelDate(booking.travelDate?.split('T')[0] || "");
                        setEditReturnDate(booking.returnDate?.split('T')[0] || "");
                        setIsEditingDates(true);
                      }}
                      className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 underline underline-offset-2 shrink-0"
                    >
                      Edit Dates
                    </button>
                  )}
                </div>
                
                {booking.dateChangeHistory && booking.dateChangeHistory.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Date Change History</p>
                    {booking.dateChangeHistory.map((h, i) => (
                      <div key={i} className="text-xs text-slate-600 border-l-2 border-slate-300 pl-2">
                        <p>Changed from <b>{formatDate(h.oldDate)}</b> to <b>{formatDate(h.newDate)}</b></p>
                        <p className="italic text-slate-400">"{h.reason}"</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-slate-400 shrink-0" />
                  <p className="text-sm text-slate-600">
                    {pax?.adults > 0 && `${pax.adults} Adult${pax.adults > 1 ? "s" : ""}`}
                    {pax?.children > 0 && ` · ${pax.children} Child${pax.children > 1 ? "ren" : ""}`}
                    {pax?.infants > 0 && ` · ${pax.infants} Infant${pax.infants > 1 ? "s" : ""}`}
                    <span className="text-slate-400 ml-1">({totalPax} total pax)</span>
                  </p>
                </div>
                {booking.specialRequests && (
                  <div className="flex items-start gap-3">
                    <MessageSquare size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-500 italic">"{booking.specialRequests}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Primary Traveller */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Primary Traveller</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center font-bold text-cyan-700 text-sm">
                  {booking.primaryTraveller?.firstName?.[0] || booking.user?.firstName?.[0] || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {booking.primaryTraveller?.firstName
                      ? `${booking.primaryTraveller.firstName} ${booking.primaryTraveller.lastName}`
                      : `${booking.user?.firstName} ${booking.user?.lastName}`}
                  </p>
                  <p className="text-xs text-slate-400">Primary Contact</p>
                </div>
              </div>
              <div className="space-y-2">
                <a
                  href={`mailto:${booking.primaryTraveller?.email || booking.user?.email}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-600 transition-colors"
                >
                  <Mail size={13} className="text-slate-400" />
                  {booking.primaryTraveller?.email || booking.user?.email}
                </a>
                {(booking.primaryTraveller?.phone || booking.user?.phone) && (
                  <a
                    href={`tel:${booking.primaryTraveller?.phone || booking.user?.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                  >
                    <Phone size={13} className="text-slate-400" />
                    {booking.primaryTraveller?.phone || booking.user?.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Traveller Details */}
            {booking.travellersDetails?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Added Travellers ({booking.travellersDetails.length})
                </p>
                <div className="space-y-2">
                  {booking.travellersDetails.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium text-slate-700">{t.name || "—"}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {t.age && <span>Age {t.age}</span>}
                        <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                          t.type === "adult" ? "bg-slate-100 text-slate-600" :
                          t.type === "child" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{t.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Payment History</p>
              {booking.paymentHistory?.length > 0 ? (
                <div className="space-y-2">
                  {booking.paymentHistory.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{formatCurrency(p.amount)}</p>
                        <p className="text-xs text-slate-400">{p.method} {p.transactionId && `· ${p.transactionId}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          p.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No payment records yet</p>
              )}
            </div>

            {/* Cancellation info */}
            {booking.bookingStatus === "cancelled" && booking.cancellationReason && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={16} className="text-red-500" />
                  <p className="text-sm font-semibold text-red-700">Cancellation Reason</p>
                </div>
                <p className="text-sm text-red-600">{booking.cancellationReason}</p>
                {booking.cancelledAt && (
                  <p className="text-xs text-red-400 mt-1">Cancelled on {formatDate(booking.cancelledAt)}</p>
                )}
              </div>
            )}
          </div>

          {/* ─── RIGHT (1/3): sidebar ───────────────────────────── */}
          <div className="space-y-4">

            {/* Payment summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Payment Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Amount</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Amount Paid</span>
                  <span className="text-sm font-semibold text-emerald-600">{formatCurrency(booking.paidAmount || 0)}</span>
                </div>
                {amountDue > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-sm font-semibold text-amber-600">Amount Due</span>
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(amountDue)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize ${PAYMENT_STATUS_COLORS[booking.paymentStatus] || ""}`}>
                    <CreditCard size={12} />
                    {booking.paymentStatus}
                  </span>
                  {amountDue > 0 && (
                    <button
                      onClick={handleGeneratePaymentLink}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                    >
                      <LinkIcon size={12} /> Generate Link
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Customer (account user) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                  {booking.user?.firstName?.[0] || "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{booking.user?.firstName} {booking.user?.lastName}</p>
                  <p className="text-xs text-slate-400">Customer</p>
                </div>
              </div>
              <a href={`mailto:${booking.user?.email}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-600 mb-1">
                <Mail size={11} /> {booking.user?.email}
              </a>
              {booking.user?.phone && (
                <a href={`tel:${booking.user?.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600">
                  <Phone size={11} /> {booking.user?.phone}
                </a>
              )}
            </div>

            {/* Links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Links</p>
              {pkg?._id && (
                <Link
                  href={`/packages/${pkg._id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600 hover:text-slate-800"
                >
                  <span className="flex items-center gap-2"><Package size={13} /> View Package</span>
                  <ExternalLink size={12} className="text-slate-300" />
                </Link>
              )}
              {booking.enquiry && (
                <Link
                  href={`/enquiries/${typeof booking.enquiry === 'object' ? booking.enquiry._id : booking.enquiry}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600 hover:text-slate-800"
                >
                  <span className="flex items-center gap-2"><MessageSquare size={13} /> View Enquiry</span>
                  <ExternalLink size={12} className="text-slate-300" />
                </Link>
              )}
            </div>

            {/* Meta */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-500 mb-2">Booking Info</p>
              <p>Created: {formatDateTime(booking.createdAt)}</p>
              <p>Updated: {formatDateTime(booking.updatedAt)}</p>
              <p className="font-mono text-[10px] break-all mt-2">{booking._id}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Link Modal */}
      {showPaymentLinkModal && paymentLinkData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Generate Payment Link</h3>
              <button onClick={() => setShowPaymentLinkModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  value={paymentLinkData.amount}
                  onChange={(e) => setPaymentLinkData({ ...paymentLinkData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <input 
                  type="text" 
                  value={paymentLinkData.description}
                  onChange={(e) => setPaymentLinkData({ ...paymentLinkData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowPaymentLinkModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={submitPaymentLink} disabled={paymentLinkLoading} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                {paymentLinkLoading ? "Generating..." : "Generate Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Change Reason Modal */}
      {showDateReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Reason for Date Change</h3>
              <button onClick={() => setShowDateReasonModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Please provide a reason</label>
              <textarea 
                value={dateChangeReason}
                onChange={(e) => setDateChangeReason(e.target.value)}
                placeholder="e.g. User requested via phone, Flight cancelled, Calamity..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[100px]"
              />
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowDateReasonModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={updateDates} disabled={updatingDates || !dateChangeReason.trim()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                {updatingDates ? "Saving..." : "Confirm Date Change"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
