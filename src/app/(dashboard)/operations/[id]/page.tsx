"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, Home, Compass, CreditCard, FileText, TrendingUp, Plus, Trash2, Check, Save, Download, Copy, Link as LinkIcon, Bell, Wand2 } from "lucide-react";
import Link from "next/link";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

interface Transport {
  _id: string;
  vendorName: string;
  vendorContact: string;
  vendorEmail: string;
  vendorCost: number;
  sellingPrice: number;
  paymentStatus: string;
  paymentDueDate: string;
  isUrgent: boolean;
  remarks: string;
  legs: { _id?: string; from: string; to: string; date: string; tripDay: string; vehicleType: string; notes: string }[];
}
interface Accommodation { _id: string; type: string; name: string; area: string; roomCategory: string; rooms: number; mealPlan: string; checkIn: string; checkOut: string; nights: number; confirmationNumber: string; tripDay: string; vendorName: string; vendorCost: number; sellingPrice: number; paymentStatus: string; remarks: string; }
interface Activity { _id: string; title: string; description: string; date: string; duration: string; tripDay: string; vendorName: string; vendorCost: number; sellingPrice: number; paymentStatus: string; remarks: string; }
interface CPayment { _id: string; milestone: string; amount: number; paidAmount: number; dueDate: string; paidDate: string; status: string; financeStatus: string; paymentLinkEnabled: boolean; paymentLink: string; paymentMode: string; transactionId: string; }
interface OpData { _id: string; operationId: string; booking?: { _id: string; bookingId: string; paymentStatus: string; package?: { _id: string; name: string; slug: string; isCustom: boolean; description?: string; itinerary?: any[] } }; package?: { _id: string; name: string; slug: string; description?: string; itinerary?: any[] }; customer: { name: string; email: string; phone: string; pax: number; adults?: number; children?: number }; destination: string; travelDates: { start: string; end: string }; assignedTo?: { firstName: string; lastName: string }; sellingPrice: number; totalVendorCost: number; grossProfit: number; profitPercentage: number; status: string; }

function Inp({ value, onChange, type = "text", placeholder = "" }: { value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full" />;
}
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full">{options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>;
}
function VendorPick({ value, onChange, vendors, filterType }: { value: string; onChange: (v: string) => void; vendors: { _id: string; name: string; type: string }[]; filterType?: string }) {
  const filtered = filterType ? vendors.filter((v) => v.type === filterType || v.type === "mixed") : vendors;
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"><option value="">-- Select vendor --</option>{filtered.map((v) => <option key={v._id} value={v.name}>{v.name}</option>)}<option value="__custom">+ Enter manually</option></select>;
}

const ACCOMMODATION_TYPES = [
  { v: "hotel", l: "Hotel" }, { v: "resort", l: "Resort" }, { v: "villa", l: "Villa" }, { v: "hostel", l: "Hostel" },
  { v: "motel", l: "Motel" }, { v: "inn", l: "Inn" }, { v: "apartment", l: "Apartment" }, { v: "homestay", l: "Homestay" }, { v: "other", l: "Other" },
];
const PAY_OPTS = [{ v: "pending", l: "Pending" }, { v: "partial", l: "Partial" }, { v: "paid", l: "Paid" }];


export default function OperationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [op, setOp] = useState<OpData | null>(null);
  const [transports, setTransports] = useState<Transport[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CPayment[]>([]);
  const [vendorList, setVendorList] = useState<{ _id: string; name: string; type: string }[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);

  // Payment Link Modal State
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [paymentLinkData, setPaymentLinkData] = useState<{ amount: string; description: string; cp: any; idx: number } | null>(null);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, vRes] = await Promise.all([api.get(`/operations/${id}`), api.get("/vendors")]);
      if (res?.data) { setOp(res.data.operation); setTransports(res.data.transports || []); setAccommodations(res.data.accommodations || []); setActivities(res.data.activities || []); setCustomerPayments(res.data.customerPayments || []); }
      setVendorList(vRes?.data || []);
    } catch {} finally { setLoading(false); }
  }, [id]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function saveItem(endpoint: string, itemId: string, data: any) { 
    setSaving(itemId); 
    try { 
      let payload = { ...data };
      if (endpoint === "customer-payments" && (data.status === "paid" || data.status === "partial" || data.paidAmount > 0)) {
        const mode = window.prompt("Enter Payment Mode (e.g., UPI, Cash, NEFT):", data.paymentMode || "");
        if (mode === null) return; // user cancelled
        const txId = window.prompt("Enter Transaction ID (optional):", data.transactionId || "");
        if (txId === null) return;
        const remarks = window.prompt("Enter Remarks (optional):", data.remarks || "");
        if (remarks === null) return;
        
        payload.financeDetails = {
          mode,
          transactionId: txId,
          remarks
        };
      }
      await api.put(`/operations/${id}/${endpoint}/${itemId}`, payload); 
      fetchAll();
    } catch { 
      alert("Save failed"); 
    } finally { 
      setSaving(null); 
    } 
  }
  async function delItem(endpoint: string, itemId: string) { if (!confirm("Delete?")) return; await api.del(`/operations/${id}/${endpoint}/${itemId}`); fetchAll(); }
  async function recalculate() { await api.put(`/operations/${id}/recalculate`); fetchAll(); }
  async function updateStatus(s: string) { await api.put(`/operations/${id}`, { status: s }); fetchAll(); }
  async function sendReminder(paymentId: string) { if (!confirm("Send a payment reminder email to the customer?")) return; try { await api.post(`/operations/${id}/customer-payments/${paymentId}/notify`); alert("Reminder sent successfully!"); } catch { alert("Failed to send reminder."); } }

  async function importFromItinerary() {
    if (transports.length > 0 || accommodations.length > 0 || activities.length > 0) {
      if (!confirm("Some items already exist. The importer will skip tabs that already have data to prevent duplicates. Proceed?")) return;
    }
    setImporting(true);
    try {
      const res = await api.post(`/operations/${id}/import-itinerary`);
      alert(res.message || "Imported successfully!");
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function handleDownloadVoucher() {
    setDownloadingVoucher(true);
    try {
      const { generateVoucherPdf } = await import("@/lib/generateVoucherPdf");
      
      let itinerary = [];
      let transferSummary = "";
      let hasPolicies = false;
      if (op?.package?.slug) {
        try {
          const pkgRes = await api.get(`/packages/${op.package.slug}`);
          const pd = pkgRes.data;
          itinerary = pd?.itinerary || [];
          transferSummary = pd?.transferSummary || "";
          hasPolicies = (pd?.paymentPolicy?.length > 0) || (pd?.cancellationPolicy?.length > 0) || (pd?.flightCancellationPolicy?.length > 0);
        } catch (e) {
          console.warn("Could not fetch full package itinerary for voucher");
        }
      }

      await generateVoucherPdf({
        operationId: op?.operationId || "",
        destination: op?.destination || "",
        customerName: op?.customer?.name || "",
        pax: op?.customer?.pax || 1,
        adults: op?.customer?.adults,
        children: op?.customer?.children,
        paymentStatus: op?.booking?.paymentStatus || "pending",
        flights: [],
        accommodations: accommodations,
        transports: transports,
        itinerary,
        transferSummary,
        packageSlug: op?.package?.slug || "",
        hasPolicies,
      });

    } catch (err) {
      alert("Failed to generate voucher");
      console.error(err);
    } finally {
      setDownloadingVoucher(false);
    }
  }

  const handleGeneratePaymentLink = (cp: any, idx: number) => {
    const amountDue = cp.amount - (cp.paidAmount || 0);
    setPaymentLinkData({
      amount: amountDue > 0 ? amountDue.toString() : "0",
      description: `Payment for ${cp.milestone} - ${op?.destination || 'Operation'}`,
      cp,
      idx
    });
    setShowPaymentLinkModal(true);
  };

  const submitPaymentLink = async () => {
    if (!paymentLinkData || !op) return;
    const { amount, description, cp, idx } = paymentLinkData;
    
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
        bookingId: op.booking?._id || undefined,
        customerPaymentId: cp._id,
        customerName: op.customer?.name || 'Customer',
        customerEmail: op.customer?.email,
        customerPhone: op.customer?.phone
      });
      if (res.data?.short_url) {
        // Success
        const u = [...customerPayments];
        u[idx] = { ...u[idx], paymentLink: res.data.short_url, paymentLinkEnabled: true };
        setCustomerPayments(u);
        setShowPaymentLinkModal(false);
        alert(`Payment link generated! Copied to clipboard.\n${res.data.short_url}`);
        navigator.clipboard.writeText(res.data.short_url).catch(() => {});
      } else {
        alert("Failed to get link");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to generate link");
    } finally {
      setPaymentLinkLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!op) return <div className="text-center py-20 text-sm text-slate-400">Operation not found</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: <FileText size={14} /> },
    { id: "transport", label: `Transport (${transports.length})`, icon: <Truck size={14} /> },
    { id: "accommodation", label: `Stay (${accommodations.length})`, icon: <Home size={14} /> },
    { id: "activities", label: `Itinerary Days (${activities.length})`, icon: <Compass size={14} /> },
    { id: "payments", label: `Payments (${customerPayments.length})`, icon: <CreditCard size={14} /> },
    { id: "pnl", label: "P&L", icon: <TrendingUp size={14} /> },
  ];

  return (
    <>
      <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/operations" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-lg font-bold text-slate-800">{op.operationId}</h1><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${op.status === "completed" ? "bg-emerald-100 text-emerald-700" : op.status === "planning" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{op.status}</span></div>
          <p className="text-xs text-slate-400">{op.customer.name} | {op.destination} | {op.customer.pax} pax</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadVoucher} disabled={downloadingVoucher} className="flex items-center gap-2 text-xs border border-cyan-200 text-cyan-700 hover:bg-cyan-50 px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            <Download size={14} />
            {downloadingVoucher ? "Generating..." : "Download Voucher"}
          </button>
          <select value={op.status} onChange={(e) => updateStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"><option value="planning">Planning</option><option value="booked">Booked</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{t.icon}{t.label}</button>))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Customer</p><p className="text-sm font-semibold text-slate-800">{op.customer.name}</p><p className="text-xs text-slate-500">{op.customer.email} | {op.customer.phone}</p><p className="text-xs text-slate-400 mt-1">{op.customer.pax} pax</p></div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Trip</p>
              <p className="text-sm font-semibold text-slate-800">{op.destination}</p>
              <p className="text-xs text-slate-500">{op.travelDates?.start ? formatDate(op.travelDates.start) : "—"} → {op.travelDates?.end ? formatDate(op.travelDates.end) : "—"}</p>
              {op.booking && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-500">Booking: <Link href={`/bookings/${op.booking._id}`} className="font-semibold text-slate-700 hover:text-cyan-600">{op.booking.bookingId}</Link></p>
                  {op.booking.package && (
                    op.booking.package.isCustom ? (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]" title={op.booking.package.name}>Itinerary: {op.booking.package.name}</p>
                        <a href={`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/itinerary/${op.booking.package._id}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          Visit
                        </a>
                        <Link href={`/itineraries/${op.booking.package._id}/edit`} className="text-[10px] text-blue-600 hover:underline bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                          Edit
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]" title={op.booking.package.name}>Package: {op.booking.package.name}</p>
                        <a href={`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/packages/${op.booking.package.slug}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          Visit
                        </a>
                        <Link href={`/packages/${op.booking.package._id}/edit`} className="text-[10px] text-blue-600 hover:underline bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                          Edit
                        </Link>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Financials</p><div className="flex justify-between"><div><p className="text-xs text-slate-500">Selling</p><p className="text-lg font-bold text-slate-800">{formatCurrency(op.sellingPrice)}</p></div><div className="text-right"><p className="text-xs text-slate-500">Profit</p><p className={`text-lg font-bold ${op.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(op.grossProfit)}</p></div></div><button onClick={recalculate} className="mt-3 text-[10px] text-cyan-600 font-semibold hover:underline">Recalculate</button></div>
          </div>
          
          {op.booking?.package?.description && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Package Description</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{op.booking.package.description}</p>
            </div>
          )}
          
          {op.booking?.package?.itinerary && op.booking.package.itinerary.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Package Itinerary ({op.booking.package.itinerary.length} Days)</p>
              <div className="space-y-4">
                {op.booking.package.itinerary.map((day: any, i: number) => (
                  <div key={i} className="border-l-2 border-cyan-300 pl-4 py-1">
                    <p className="text-xs font-bold text-slate-800">Day {day.day}: {day.title}</p>
                    {day.description && <p className="text-xs text-slate-600 mt-1">{day.description}</p>}
                    {day.activities && day.activities.length > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1.5 font-medium bg-slate-50 px-2 py-1 rounded inline-block">Activities: {day.activities.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANSPORTATION */}
      {tab === "transport" && (
        <div className="space-y-3">
          <datalist id="vehicle-type-opts">
            <option value="Car" /><option value="SUV" /><option value="Innova" />
            <option value="Tempo Traveller" /><option value="Bus" /><option value="Mini Bus" />
            <option value="Van" /><option value="Auto Rickshaw" /><option value="Ferry" />
            <option value="Speed Boat" /><option value="Flight" /><option value="Train" />
            <option value="Buggy" /><option value="Bike" /><option value="Other" />
          </datalist>

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-700">{transports.length} transfer group(s)</p>
            <div className="flex gap-2">
              {op.package && transports.length > 0 && <button onClick={importFromItinerary} disabled={importing} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"><Wand2 size={14} /> {importing ? "..." : "Re-import"}</button>}
              <button onClick={async () => { await api.post(`/operations/${id}/transports`, { vendorName: "", vendorContact: "", vendorEmail: "", vendorCost: 0, sellingPrice: 0, paymentStatus: "pending", remarks: "", legs: [{ from: "", to: "", date: "", tripDay: "", vehicleType: "", notes: "" }] }); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Transfer Group</button>
            </div>
          </div>

          {op.package && transports.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Wand2 size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Import from Itinerary</p>
                  <p className="text-xs text-blue-700 mt-0.5">This operation is linked to a package. Click to auto-fill transfers from the itinerary.</p>
                </div>
              </div>
              <button onClick={importFromItinerary} disabled={importing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                {importing ? "Importing..." : "Auto-Fill"}
              </button>
            </div>
          )}

          {transports.map((t, idx) => (
            <div key={t._id} className={`bg-white rounded-xl border p-4 space-y-4 ${t.isUrgent ? "border-red-300 bg-red-50/20" : "border-slate-200"}`}>

              {/* Card header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-700">#{idx + 1}</span>
                  <span className="text-xs font-semibold text-slate-600">{t.vendorName || "Transfer Group"}</span>
                  {t.isUrgent && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">URGENT</span>}
                  {t.legs.length > 1 && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{t.legs.length} legs</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveItem("transports", t._id, transports[idx])} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors">
                    {saving === t._id ? "..." : <><Check size={10} /> Save</>}
                  </button>
                  <button onClick={() => delItem("transports", t._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Vendor info row */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Operator</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Name / Company</label>
                    <Inp value={t.vendorName} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorName: v }; setTransports(u); }} placeholder="e.g. Ravi Travels, IndiGo..." />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Contact (Phone)</label>
                    <Inp value={t.vendorContact} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorContact: v }; setTransports(u); }} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Email (optional)</label>
                    <Inp value={t.vendorEmail} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorEmail: v }; setTransports(u); }} placeholder="vendor@email.com" />
                  </div>
                </div>
              </div>

              {/* Financials row */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label>
                    <Inp type="number" value={t.vendorCost} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorCost: Number(v) }; setTransports(u); }} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label>
                    <Inp type="number" value={t.sellingPrice} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], sellingPrice: Number(v) }; setTransports(u); }} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label>
                    <Inp type="date" value={t.paymentDueDate?.split("T")[0] || ""} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], paymentDueDate: v }; setTransports(u); }} />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label>
                    <Sel value={t.paymentStatus} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], paymentStatus: v }; setTransports(u); }} options={PAY_OPTS} />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks / Notes</label>
                <Inp value={t.remarks || ""} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], remarks: v }; setTransports(u); }} placeholder="e.g. Night transfers included, toll charges extra..." />
              </div>

              {/* Transfer legs */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Transfer Legs {t.legs.length > 1 ? `(${t.legs.length} segments — group transfer)` : "(single transfer)"}</p>
                  <button
                    onClick={() => {
                      const u = [...transports];
                      u[idx] = { ...u[idx], legs: [...u[idx].legs, { from: "", to: "", date: "", tripDay: "", vehicleType: "", notes: "" }] };
                      setTransports(u);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <Plus size={10} /> Add Leg
                  </button>
                </div>
                <div className="space-y-2">
                  {(t.legs || []).map((leg, li) => (
                    <div key={li} className="bg-slate-50 rounded-lg p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 w-5 shrink-0">{li + 1}.</span>
                        <input
                          type="text"
                          value={leg.from}
                          onChange={(e) => { const u = [...transports]; const legs = [...u[idx].legs]; legs[li] = { ...legs[li], from: e.target.value }; u[idx] = { ...u[idx], legs }; setTransports(u); }}
                          placeholder="From (e.g. Pune Airport)"
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                        />
                        <span className="text-slate-300 text-xs shrink-0">→</span>
                        <input
                          type="text"
                          value={leg.to}
                          onChange={(e) => { const u = [...transports]; const legs = [...u[idx].legs]; legs[li] = { ...legs[li], to: e.target.value }; u[idx] = { ...u[idx], legs }; setTransports(u); }}
                          placeholder="To (e.g. Marriott Hotel)"
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                        />
                        {t.legs.length > 1 && (
                          <button
                            onClick={() => { const u = [...transports]; u[idx] = { ...u[idx], legs: u[idx].legs.filter((_, i) => i !== li) }; setTransports(u); }}
                            className="p-1 text-red-400 hover:text-red-600 shrink-0"
                          ><Trash2 size={12} /></button>
                        )}
                      </div>
                      <div className="pl-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[8px] text-slate-400 uppercase block mb-1">Vehicle Type</label>
                          <input
                            list="vehicle-type-opts"
                            type="text"
                            value={leg.vehicleType}
                            onChange={(e) => { const u = [...transports]; const legs = [...u[idx].legs]; legs[li] = { ...legs[li], vehicleType: e.target.value }; u[idx] = { ...u[idx], legs }; setTransports(u); }}
                            placeholder="Car, SUV, Bus..."
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-400 uppercase block mb-1">Trip Day</label>
                          <input
                            type="text"
                            value={leg.tripDay}
                            onChange={(e) => { const u = [...transports]; const legs = [...u[idx].legs]; legs[li] = { ...legs[li], tripDay: e.target.value }; u[idx] = { ...u[idx], legs }; setTransports(u); }}
                            placeholder="Day 1, Arrival..."
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-400 uppercase block mb-1">Date</label>
                          <input
                            type="date"
                            value={leg.date?.split("T")[0] || ""}
                            onChange={(e) => { const u = [...transports]; const legs = [...u[idx].legs]; legs[li] = { ...legs[li], date: e.target.value }; u[idx] = { ...u[idx], legs }; setTransports(u); }}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-400 uppercase block mb-1">Notes</label>
                          <input
                            type="text"
                            value={leg.notes}
                            onChange={(e) => { const u = [...transports]; const legs = [...u[idx].legs]; legs[li] = { ...legs[li], notes: e.target.value }; u[idx] = { ...u[idx], legs }; setTransports(u); }}
                            placeholder="e.g. Night transfer, toll included"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
          {transports.length === 0 && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No transfer groups yet. Add one above or import from itinerary.</div>}
        </div>
      )}

      {/* ACCOMMODATION */}
      {tab === "accommodation" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-700">{accommodations.length} accommodation(s)</p>
            <div className="flex gap-2">
              {op.package && accommodations.length > 0 && <button onClick={importFromItinerary} disabled={importing} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"><Wand2 size={14} /> {importing ? "..." : "Re-import"}</button>}
              <button onClick={async () => { await api.post(`/operations/${id}/accommodations`, { type: "hotel" }); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Stay</button>
            </div>
          </div>
          {op.package && accommodations.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Wand2 size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Import from Itinerary</p>
                  <p className="text-xs text-blue-700 mt-0.5">This operation is linked to a package. Click to auto-fill accommodations.</p>
                </div>
              </div>
              <button onClick={importFromItinerary} disabled={importing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                {importing ? "Importing..." : "Auto-Fill"}
              </button>
            </div>
          )}
          {accommodations.map((a, idx) => (
            <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">#{idx+1} <span className="capitalize text-slate-500">{a.type}</span></span><div className="flex gap-2"><button onClick={() => saveItem("accommodations", a._id, accommodations[idx])} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold"><Check size={10}/> Save</button><button onClick={() => delItem("accommodations", a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div></div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Type</label><Sel value={a.type} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],type:v};setAccommodations(u);}} options={ACCOMMODATION_TYPES} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Property Name</label><Inp value={a.name} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],name:v};setAccommodations(u);}} placeholder="Marriott, Zostel..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Area</label><Inp value={a.area} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],area:v};setAccommodations(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Room</label><Inp value={a.roomCategory} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],roomCategory:v};setAccommodations(u);}} placeholder="Deluxe, Dorm..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Rooms (Qty)</label><Inp type="number" value={a.rooms || ""} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],rooms:Number(v)};setAccommodations(u);}} placeholder="1" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Meal Plan</label><Sel value={a.mealPlan} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],mealPlan:v};setAccommodations(u);}} options={[{v:"EP",l:"EP (No meals)"},{v:"CP",l:"CP (Breakfast)"},{v:"MAP",l:"MAP (B+L/D)"},{v:"AP",l:"AP (All meals)"}]} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Check In</label><Inp type="date" value={a.checkIn?.split("T")[0]||""} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],checkIn:v};setAccommodations(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Check Out</label><Inp type="date" value={a.checkOut?.split("T")[0]||""} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],checkOut:v};setAccommodations(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Conf #</label><Inp value={a.confirmationNumber} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],confirmationNumber:v};setAccommodations(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Trip Day</label><Inp value={a.tripDay} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],tripDay:v};setAccommodations(u);}} placeholder="Day 1-3" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>{vendorList.length>0&&!a.vendorName?<VendorPick value={a.vendorName} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],vendorName:v==="__custom"?"":v};setAccommodations(u);}} vendors={vendorList} filterType="hotel" />:<Inp value={a.vendorName} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],vendorName:v};setAccommodations(u);}} />}</div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={a.vendorCost} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],vendorCost:Number(v)};setAccommodations(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price</label><Inp type="number" value={a.sellingPrice} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],sellingPrice:Number(v)};setAccommodations(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment</label><Sel value={a.paymentStatus} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],paymentStatus:v};setAccommodations(u);}} options={PAY_OPTS} /></div>
              </div>
            </div>
          ))}
          {accommodations.length===0&&<div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No accommodations yet.</div>}
        </div>
      )}

      {/* ACTIVITIES */}
      {tab === "activities" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-700">{activities.length} Itinerary Day(s)</p>
            <div className="flex gap-2">
              {op.package && activities.length > 0 && <button onClick={importFromItinerary} disabled={importing} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"><Wand2 size={14} /> {importing ? "..." : "Re-import"}</button>}
              <button onClick={async () => { await api.post(`/operations/${id}/activities`, {}); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Day Expense</button>
            </div>
          </div>
          {op.package && activities.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Wand2 size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Import from Itinerary</p>
                  <p className="text-xs text-blue-700 mt-0.5">This operation is linked to a package. Click to auto-fill itinerary days.</p>
                </div>
              </div>
              <button onClick={importFromItinerary} disabled={importing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                {importing ? "Importing..." : "Auto-Fill"}
              </button>
            </div>
          )}
          {activities.map((a, idx) => (
            <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">Day #{idx+1} Expense</span><div className="flex gap-2"><button onClick={() => saveItem("activities", a._id, activities[idx])} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold"><Check size={10}/> Save</button><button onClick={() => delItem("activities", a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2"><label className="text-[9px] text-slate-400 uppercase block mb-1">Day Title</label><Inp value={a.title} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],title:v};setActivities(u);}} placeholder="Arrival & City Tour" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Date</label><Inp type="date" value={a.date?.split("T")[0]||""} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],date:v};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Duration</label><Inp value={a.duration} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],duration:v};setActivities(u);}} placeholder="Full day" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Trip Day</label><Inp value={a.tripDay} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],tripDay:v};setActivities(u);}} placeholder="Day 1" /></div>
                <div className="col-span-2"><label className="text-[9px] text-slate-400 uppercase block mb-1">Activities / Description</label><Inp value={a.description} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],description:v};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>{vendorList.length>0&&!a.vendorName?<VendorPick value={a.vendorName} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorName:v==="__custom"?"":v};setActivities(u);}} vendors={vendorList} filterType="activity" />:<Inp value={a.vendorName} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorName:v};setActivities(u);}} />}</div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={a.vendorCost} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorCost:Number(v)};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling</label><Inp type="number" value={a.sellingPrice} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],sellingPrice:Number(v)};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment</label><Sel value={a.paymentStatus} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],paymentStatus:v};setActivities(u);}} options={PAY_OPTS} /></div>
              </div>
            </div>
          ))}
          {activities.length===0&&<div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No itinerary days yet.</div>}
        </div>
      )}

      {/* CUSTOMER PAYMENTS */}
      {tab === "payments" && (
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Customer Payment Schedule</h3>
              <p className="text-[10px] text-slate-400 mt-1">Track installments received from the customer</p>
            </div>
            <div className="flex gap-2">
              {customerPayments.length > 0 && <button onClick={() => generateInvoicePdf({ mode: "summary", operationId: op.operationId, customer: op.customer, destination: op.destination, milestone: "Full Statement", amount: customerPayments.reduce((s,p)=>s+p.amount,0), dueDate: undefined, paidAmount: customerPayments.reduce((s,p)=>s+p.paidAmount,0), status: "statement", sellingPrice: op.sellingPrice, allPayments: customerPayments.map(cp=>({milestone:cp.milestone,amount:cp.amount,paidAmount:cp.paidAmount,status:cp.status})) })} className="flex items-center gap-1 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"><Download size={14} /> Statement</button>}
              <button onClick={async () => { await api.post(`/operations/${id}/customer-payments`, {}); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Installment</button>
            </div>
          </div>
          {customerPayments.length>0&&<div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between"><div className="text-center"><p className="text-[9px] text-slate-400 uppercase">Total</p><p className="text-sm font-bold text-slate-800">{formatCurrency(customerPayments.reduce((s,p)=>s+p.amount,0))}</p></div><div className="text-center"><p className="text-[9px] text-slate-400 uppercase">Received</p><p className="text-sm font-bold text-emerald-600">{formatCurrency(customerPayments.reduce((s,p)=>s+p.paidAmount,0))}</p></div><div className="text-center"><p className="text-[9px] text-slate-400 uppercase">Pending</p><p className="text-sm font-bold text-amber-600">{formatCurrency(customerPayments.reduce((s,p)=>s+(p.amount-p.paidAmount),0))}</p></div></div>}
          {customerPayments.map((p, idx) => (
            <div key={p._id} className={`bg-white border rounded-xl p-4 space-y-3 ${p.status==="overdue"?"border-red-300 bg-red-50/30":"border-slate-200"}`}>
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">#{idx+1} {p.financeStatus==="pending_approval"?<span className="text-amber-600">PENDING APPROVAL</span>:p.status==="paid"&&<span className="text-emerald-600">PAID</span>}{p.status==="overdue"&&<span className="text-red-600">OVERDUE</span>}</span><div className="flex gap-2"><button onClick={() => handleGeneratePaymentLink(p, idx)} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold hover:bg-indigo-100 transition-colors"><LinkIcon size={10}/> Link</button><button onClick={() => sendReminder(p._id)} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold hover:bg-amber-100 transition-colors"><Bell size={10}/> Remind</button><button onClick={() => generateInvoicePdf({ mode: "single", operationId: op.operationId, customer: op.customer, destination: op.destination, milestone: p.milestone, amount: p.amount, dueDate: p.dueDate, paidAmount: p.paidAmount, status: p.status, paymentLink: p.paymentLinkEnabled ? p.paymentLink : undefined, sellingPrice: op.sellingPrice, allPayments: customerPayments.map(cp => ({ milestone: cp.milestone, amount: cp.amount, paidAmount: cp.paidAmount, status: cp.status })) })} className="flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-[10px] font-bold"><Download size={10}/> Invoice</button><button onClick={() => saveItem("customer-payments", p._id, customerPayments[idx])} disabled={p.financeStatus==="pending_approval"} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold disabled:opacity-50"><Check size={10}/> Save</button><button onClick={() => delItem("customer-payments", p._id)} className="text-red-400"><Trash2 size={14} /></button></div></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Milestone</label><Inp value={p.milestone} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],milestone:v};setCustomerPayments(u);}} placeholder="Advance, Final..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Amount</label><Inp type="number" value={p.amount} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],amount:Number(v)};setCustomerPayments(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Paid</label><Inp type="number" value={p.paidAmount} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],paidAmount:Number(v)};setCustomerPayments(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Due Date</label><Inp type="date" value={p.dueDate?.split("T")[0]||""} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],dueDate:v};setCustomerPayments(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Mode</label><Inp value={p.paymentMode} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],paymentMode:v};setCustomerPayments(u);}} placeholder="UPI/NEFT" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">TXN ID</label><Inp value={p.transactionId} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],transactionId:v};setCustomerPayments(u);}} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Link URL</label><Inp value={p.paymentLink||""} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],paymentLink:v};setCustomerPayments(u);}} placeholder="https://razorpay.me/..." /></div>
                <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={p.paymentLinkEnabled} onChange={(e)=>{const u=[...customerPayments];u[idx]={...u[idx],paymentLinkEnabled:e.target.checked};setCustomerPayments(u);}} className="w-3.5 h-3.5 rounded" /><span className="text-slate-600">Include payment link in invoice</span></label></div>
              </div>
            </div>
          ))}
          {customerPayments.length===0&&<div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No payments yet.</div>}
        </div>
      )}

      {/* P&L */}
      {tab === "pnl" && (() => {
        const tCost = transports.reduce((s,t)=>s+(t.vendorCost||0),0);
        const aCost = accommodations.reduce((s,a)=>s+(a.vendorCost||0),0);
        const actCost = activities.reduce((s,a)=>s+(a.vendorCost||0),0);
        const total = tCost+aCost+actCost;
        const profit = op.sellingPrice - total;
        const margin = op.sellingPrice>0?Math.round((profit/op.sellingPrice)*100):0;
        const custRcvd = customerPayments.reduce((s,p)=>s+(p.paidAmount||0),0);
        const tPaid = transports.filter(t=>t.paymentStatus==="paid").reduce((s,t)=>s+t.vendorCost,0);
        const aPaid = accommodations.filter(a=>a.paymentStatus==="paid").reduce((s,a)=>s+a.vendorCost,0);
        const actPaid = activities.filter(a=>a.paymentStatus==="paid").reduce((s,a)=>s+a.vendorCost,0);
        const vendorPaid = tPaid+aPaid+actPaid;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6"><h3 className="text-sm font-bold text-slate-800 mb-4">Profit & Loss</h3><div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Selling Price</span><span className="text-sm font-bold">{formatCurrency(op.sellingPrice)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Transport ({transports.length})</span><span className="text-sm text-red-600">-{formatCurrency(tCost)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Accommodation ({accommodations.length})</span><span className="text-sm text-red-600">-{formatCurrency(aCost)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Activities ({activities.length})</span><span className="text-sm text-red-600">-{formatCurrency(actCost)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-200"><span className="text-sm font-semibold">Total Cost</span><span className="text-sm font-bold text-red-600">-{formatCurrency(total)}</span></div>
              <div className="flex justify-between py-3 border-t-2 border-slate-300"><span className="font-bold">Profit</span><span className={`text-lg font-bold ${profit>=0?"text-emerald-600":"text-red-600"}`}>{formatCurrency(profit)}</span></div>
              <div className="flex justify-between"><span className="text-xs text-slate-500">Margin</span><span className="font-bold text-cyan-700">{margin}%</span></div>
            </div><button onClick={recalculate} className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2"><Save size={14}/> Sync</button></div>
            <div className="bg-white rounded-xl border border-slate-200 p-6"><h3 className="text-sm font-bold text-slate-800 mb-4">Cash Position</h3><div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Customer Paid</span><span className="text-sm font-bold text-emerald-600">{formatCurrency(custRcvd)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Vendor Paid</span><span className="text-sm font-bold text-red-600">{formatCurrency(vendorPaid)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Vendor Pending</span><span className="text-sm text-amber-600">{formatCurrency(total-vendorPaid)}</span></div>
              <div className="flex justify-between py-3 border-t-2 border-slate-300"><span className="font-bold">Net in Hand</span><span className={`text-lg font-bold ${(custRcvd-vendorPaid)>=0?"text-emerald-600":"text-red-600"}`}>{formatCurrency(custRcvd-vendorPaid)}</span></div>
            </div></div>
          </div>);
      })()}
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
    </>
  );
}
