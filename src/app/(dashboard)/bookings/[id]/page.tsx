"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft, User, Package, MapPin, Calendar, Users, CreditCard,
  CheckCircle, Clock, XCircle, AlertCircle, Phone, Mail,
  RefreshCw, MessageSquare, ExternalLink, ChevronRight
} from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

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

  const canUpdate = usePermission("bookings.update");

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
      const mode = window.prompt("Enter Payment Mode (e.g., UPI, Cash, NEFT):", "");
      if (mode === null) return;
      const txId = window.prompt("Enter Transaction ID (optional):", "");
      if (txId === null) return;
      const remarks = window.prompt("Enter Remarks (optional):", "");
      if (remarks === null) return;
      payload.financeDetails = { mode, transactionId: txId, remarks };
    }
    
    setUpdatingPayment(true);
    try {
      await api.put(`/bookings/${id}/status`, payload);
      fetchBooking();
    } catch { alert("Failed to update payment status"); }
    finally { setUpdatingPayment(false); }
  }

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
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <p className="text-sm text-slate-600">
                    {formatDate(booking.travelDate)}
                    {booking.returnDate && ` → ${formatDate(booking.returnDate)}`}
                  </p>
                </div>
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
                <div className="pt-2 border-t border-slate-100">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize ${PAYMENT_STATUS_COLORS[booking.paymentStatus] || ""}`}>
                    <CreditCard size={12} />
                    {booking.paymentStatus}
                  </span>
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
    </RoleGuard>
  );
}
