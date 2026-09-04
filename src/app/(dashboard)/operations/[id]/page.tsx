"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, Home, Compass, CreditCard, FileText, TrendingUp, Plus, Trash2, Check, Save, Download, Copy, Link as LinkIcon, Bell, Wand2, X, User } from "lucide-react";
import Link from "next/link";
import { useRole } from "@/hooks/usePermission";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

interface Transport {
  _id: string;
  type: string;
  vendorName: string;
  vendorContact: string;
  vendorEmail: string;
  vendorCost: number;
  sellingPrice: number;
  paymentStatus: string;
  paymentDueDate: string;
  isUrgent: boolean;
  remarks: string;
  legs: { _id?: string; from: string; to: string; date: string; tripDay: string; vehicleType: string; notes: string; pnr?: string; departureTime?: string; arrivalTime?: string; driverName?: string; driverContact?: string; vehicleNumber?: string; duration?: string }[];
  isGroupMaster?: boolean;
  groupId?: string;
  linkedBooking?: string;
}
interface Accommodation { _id: string; type: string; name: string; area: string; roomCategory: string; rooms: number; mealPlan: string; checkIn: string; checkOut: string; nights: number; confirmationNumber: string; tripDay: string; vendorName: string; vendorCost: number; sellingPrice: number; paymentStatus: string; remarks: string; isGroupMaster?: boolean; groupId?: string; linkedBooking?: string; }
interface Activity { _id: string; title: string; description: string; date: string; duration: string; tripDay: string; vendorName: string; vendorCost: number; sellingPrice: number; paymentStatus: string; remarks: string; isGroupMaster?: boolean; groupId?: string; linkedBooking?: string; }
interface CPayment { _id: string; milestone: string; amount: number; paidAmount: number; dueDate: string; paidDate: string; status: string; financeStatus: string; paymentLinkEnabled: boolean; paymentLink: string; paymentMode: string; transactionId: string; remarks?: string; _isManual?: boolean; booking?: any; }
interface OpData { _id: string; operationId: string; departureId?: string; booking?: { _id: string; bookingId: string; paymentStatus: string; totalAmount?: number; paidAmount?: number; dateChangeHistory?: { oldDate: string; newDate: string; reason: string; changedAt: string }[]; package?: { _id: string; name: string; slug: string; isCustom: boolean; description?: string; itinerary?: any[]; adultCount?: number; childCount?: number; isInternational?: boolean; visaIncluded?: boolean; flightsIncluded?: boolean; }; travellersDetails?: any[] }; bookings?: any[]; package?: { _id: string; name: string; slug: string; description?: string; itinerary?: any[]; isInternational?: boolean; visaIncluded?: boolean; flightsIncluded?: boolean; }; customer: { name: string; email: string; phone: string; pax: number; adults?: number; children?: number }; customers: { name: string; email: string; phone: string; pax: number; adults?: number; children?: number }[]; destination: string; travelDates: { start: string; end: string }; assignedTo?: { _id?: string; firstName: string; lastName: string }; sellingPrice: number; totalVendorCost: number; grossProfit: number; profitPercentage: number; incentiveAmount?: number; status: string; }

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
const TRANSPORT_TYPES = [
  { v: "flight", l: "Flight" }, { v: "train", l: "Train" }, { v: "road", l: "Road" },
  { v: "ferry", l: "Ferry" }, { v: "cruise", l: "Cruise" }, { v: "other", l: "Other" },
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
  const [selectedTransports, setSelectedTransports] = useState<Set<string>>(new Set());
  const [selectedAccommodations, setSelectedAccommodations] = useState<Set<string>>(new Set());
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [downloadingVoucher, setDownloadingVoucher] = useState(false);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState<string | null>(null);
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitData, setSplitData] = useState({ primaryPaymentId: "", amount: "" });
  const [staffList, setStaffList] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);

  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [newPassenger, setNewPassenger] = useState({ name: "", age: "", type: "adult", passportNumber: "", passportExpiry: "", issuingCountry: "", panCard: "" });
  const [addPassengerMode, setAddPassengerMode] = useState<"existing" | "new">("existing");
  const [linkedBookingId, setLinkedBookingId] = useState("");
  const [newPassengerEmail, setNewPassengerEmail] = useState("");
  const [newPassengerPhone, setNewPassengerPhone] = useState("");
  const [addingPassenger, setAddingPassenger] = useState(false);
  
  const currentRole = useRole();
  const isAdmin = currentRole === "admin";
  const isManager = currentRole ? ["admin", "manager", "ops-manager"].includes(currentRole) : false;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, vRes] = await Promise.all([api.get(`/operations/${id}`), api.get("/vendors")]);
      if (res?.data) { setOp(res.data.operation); setTransports(res.data.transports || []); setAccommodations(res.data.accommodations || []); setActivities(res.data.activities || []); setCustomerPayments(res.data.customerPayments || []); }
      setVendorList(vRes?.data || []);
    } catch {} finally { setLoading(false); }
  }, [id]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch ops staff list for assignment
  useEffect(() => {
    if (!isManager) return;
    api.get("/users/staff?department=ops").then((res) => {
      const list = res?.data || res || [];
      setStaffList(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [isManager]);

  async function assignOperation(staffId: string) {
    if (!op) return;
    try {
      await api.put(`/operations/${op._id}`, { assignedTo: staffId || null });
      fetchAll();
    } catch (err) {
      alert("Failed to assign operation");
    }
  }


  async function saveItem(endpoint: string, itemId: string, data: any) { 
    setSaving(itemId); 
    try { 
      // If it's a manual payment with a paid amount, trigger the Finance Approval flow
      if (endpoint === "customer-payments" && data._isManual && data.paidAmount > 0) {
        const payload = {
          ...data,
          financeDetails: {
            mode: data.paymentMode || "Offline",
            transactionId: data.transactionId || "N/A",
            paidAmount: data.paidAmount
          }
        };
        await api.put(`/operations/${id}/${endpoint}/${itemId}`, payload); 
      } else {
        await api.put(`/operations/${id}/${endpoint}/${itemId}`, data); 
      }
      fetchAll();
      
      const existing = document.getElementById('save-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'save-toast';
      toast.className = 'fixed bottom-4 right-4 z-50 bg-emerald-600 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-all duration-300';
      toast.innerHTML = `✓ Saved successfully!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch { 
      alert("Failed to save item.");
    } finally {
      setSaving(null);
    }
  }
  async function delItem(endpoint: string, itemId: string) { if (!confirm("Delete?")) return; await api.del(`/operations/${id}/${endpoint}/${itemId}`); fetchAll(); }
  async function recalculate() { await api.put(`/operations/${id}/recalculate`); fetchAll(); }
  async function updateStatus(s: string) { await api.put(`/operations/${id}`, { status: s }); fetchAll(); }
  async function sendReminder(paymentId: string) { if (!confirm("Send a payment reminder email to the customer?")) return; try { await api.post(`/operations/${id}/customer-payments/${paymentId}/notify`); alert("Reminder sent successfully!"); } catch { alert("Failed to send reminder."); } }

  async function handleGroupItems(type: string, itemIds: string[]) {
    if (itemIds.length < 2) return alert("Select at least 2 items to group");
    try {
      await api.post(`/operations/${id}/group`, { type, itemIds });
      if (type === 'transports') setSelectedTransports(new Set());
      if (type === 'accommodations') setSelectedAccommodations(new Set());
      if (type === 'activities') setSelectedActivities(new Set());
      fetchAll();
    } catch (err) { alert("Failed to group items"); }
  }

  async function handleUngroup(type: string, groupId: string) {
    if (!confirm("Are you sure you want to ungroup these items?")) return;
    try {
      await api.post(`/operations/${id}/ungroup`, { type, groupId });
      fetchAll();
    } catch (err) { alert("Failed to ungroup items"); }
  }

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

      const pdfFlights = transports
        .filter(t => t.type === 'flight')
        .flatMap(t => t.legs.map(leg => ({
          airline: t.vendorName,
          date: leg.date,
          from: leg.from,
          to: leg.to,
          departure: leg.departureTime,
          arrival: leg.arrivalTime,
        })));

      const pdfTransports = transports.filter(t => t.type !== 'flight');

      await generateVoucherPdf({
        operationId: op?.operationId || "",
        destination: op?.destination || "",
        customerName: op?.customer?.name || "",
        pax: op?.customer?.pax || 1,
        adults: op?.customer?.adults,
        children: op?.customer?.children,
        paymentStatus: op?.booking?.paymentStatus || "pending",
        totalAmount: op?.booking?.totalAmount,
        paidAmount: op?.booking?.paidAmount,
        isInternational: op?.package?.isInternational !== undefined ? op?.package?.isInternational : op?.booking?.package?.isInternational,
        visaIncluded: op?.package?.visaIncluded !== undefined ? op?.package?.visaIncluded : op?.booking?.package?.visaIncluded,
        flightsIncluded: op?.package?.flightsIncluded !== undefined ? op?.package?.flightsIncluded : op?.booking?.package?.flightsIncluded,
        flights: pdfFlights,
        accommodations: accommodations,
        transports: pdfTransports,
        itinerary,
        transferSummary,
        packageSlug: op?.package?.slug || "",
        hasPolicies,
        dateChangeHistory: op?.booking?.dateChangeHistory,
      });

    } catch (err) {
      alert("Failed to generate voucher");
      console.error(err);
    } finally {
      setDownloadingVoucher(false);
    }
  }

  const handleGeneratePaymentLink = async (cp: any, idx: number) => {
    if (!cp.amount || cp.amount <= 0) {
      alert("Please enter a valid Amount on the card first.");
      return;
    }
    if (!cp.milestone || cp.milestone.trim() === "") {
      alert("Please enter a Milestone on the card first.");
      return;
    }

    const amountDue = cp.amount - (cp.paidAmount || 0);
    if (amountDue <= 0) {
      alert("This installment is already fully paid.");
      return;
    }

    setPaymentLinkLoading(cp._id);
    try {
      // Generate the link to our custom website payment page
      const baseUrl = window.location.hostname.includes("localhost") 
        ? "http://localhost:3000" 
        : "https://letslivetours.com";
      const customLink = `${baseUrl}/pay-installment/${cp._id}`;
      
      const u = [...customerPayments];
      // Instantly save everything (amount, milestone, and new link)
      const updatedPayment = { 
        ...u[idx], 
        paymentLink: customLink, 
        paymentLinkEnabled: true 
      };
      u[idx] = updatedPayment;
      setCustomerPayments(u);
      
      // Auto-save the whole card to DB
      try {
        await api.put(`/operations/${op?._id}/customer-payments/${cp._id}`, updatedPayment);
      } catch(err) {
        console.error("Auto-save failed", err);
      }

      navigator.clipboard.writeText(customLink).catch(() => {});
      const existing = document.getElementById('payment-link-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'payment-link-toast';
      toast.className = 'fixed bottom-4 right-4 z-50 bg-indigo-700 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-all duration-300 transform translate-y-0 opacity-100';
      toast.innerHTML = `✓ Payment link generated, saved, & copied!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    } catch (error: any) {
      alert("Failed to generate link");
    } finally {
      setPaymentLinkLoading(null);
    }
  };

  const handleSplitSubmit = async () => {
    if (!splitData.amount) {
      alert("Please enter amount");
      return;
    }
    setSaving("split");
    try {
      await api.post(`/operations/${id}/customer-payments/split`, {
        amount: Number(splitData.amount)
      });
      setSplitModalOpen(false);
      setSplitData({ primaryPaymentId: "", amount: "" });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to split");
    } finally {
      setSaving(null);
    }
  };

  const handleAddPassenger = async () => {
    if (!newPassenger.name) return alert("Please enter passenger name");
    
    const isGroupTour = op?.departureId || (op?.bookings && op.bookings.length > 1);
    const modeToUse = isGroupTour ? addPassengerMode : "existing";
    const targetBookingId = isGroupTour ? linkedBookingId : (op?.booking?._id || (op?.bookings && op.bookings[0]?._id));

    if (modeToUse === "existing" && !targetBookingId) return alert("Please select a booking to add this passenger to");
    if (modeToUse === "new" && !newPassengerEmail) return alert("Email is required for new bookings");

    setAddingPassenger(true);
    try {
      await api.post(`/operations/${id}/passengers`, {
        mode: modeToUse,
        passengerData: newPassenger,
        bookingId: modeToUse === "existing" ? targetBookingId : undefined,
        email: modeToUse === "new" ? newPassengerEmail : undefined,
        phone: modeToUse === "new" ? newPassengerPhone : undefined
      });
      setPassengerModalOpen(false);
      setNewPassenger({ name: "", age: "", type: "adult", passportNumber: "", passportExpiry: "", issuingCountry: "", panCard: "" });
      setNewPassengerEmail("");
      setNewPassengerPhone("");
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add passenger");
    } finally {
      setAddingPassenger(false);
    }
  };

  const handleRemovePassenger = async (bookingId: string, index: number) => {
    if (!confirm("Remove this passenger?")) return;
    try {
      const targetBooking = op?.bookings?.find((b: any) => b._id === bookingId) || op?.booking;
      if (!targetBooking) return;
      const updatedTravellers = [...(targetBooking.travellersDetails || [])];
      updatedTravellers.splice(index, 1);
      await api.put(`/bookings/${targetBooking._id}/passengers`, {
        travellersDetails: updatedTravellers
      });
      fetchAll();
    } catch (err: any) {
      alert("Failed to remove passenger");
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

  const displayCustomerName = op.customers && op.customers.length > 1 ? `Group Tour (${op.customers.length} bookings)` : (op.customers?.[0]?.name || op.customer?.name || "Unknown");
  const displayCustomerEmail = op.customers?.[0]?.email || op.customer?.email || "";
  const displayCustomerPhone = op.customers?.[0]?.phone || op.customer?.phone || "";
  const displayPax = op.customers ? op.customers.reduce((sum, c) => sum + (c.pax || 0), 0) : (op.customer?.pax || 0);

  return (
    <>
      <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/operations" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-lg font-bold text-slate-800">{op.operationId}</h1><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${op.status === "completed" ? "bg-emerald-100 text-emerald-700" : op.status === "planning" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{op.status}</span></div>
          <p className="text-xs text-slate-400">{displayCustomerName} | {op.destination} | {displayPax} pax</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Customer</p><p className="text-sm font-semibold text-slate-800">{displayCustomerName}</p><p className="text-xs text-slate-500">{displayCustomerEmail} | {displayCustomerPhone}</p><p className="text-xs text-slate-400 mt-1">{displayPax} pax</p></div>
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
            
            {/* Assignment Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <User size={12} /> Assigned To
              </p>
              {isManager && staffList.length > 0 ? (
                <select
                  value={op.assignedTo?._id || ""}
                  onChange={(e) => assignOperation(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Unassigned</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-700 font-medium">
                  {op.assignedTo
                    ? `${op.assignedTo.firstName} ${op.assignedTo.lastName}`
                    : <span className="text-slate-400 italic font-medium bg-slate-100 px-2 py-0.5 rounded-full text-xs">Unassigned</span>
                  }
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Financials</p>
                <div className="flex justify-between">
                  <div><p className="text-xs text-slate-500">Selling</p><p className="text-lg font-bold text-slate-800">{formatCurrency(op.sellingPrice)}</p></div>
                  <div className="text-right"><p className="text-xs text-slate-500">Profit</p><p className={`text-lg font-bold ${op.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(op.grossProfit)}</p></div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Staff Incentive</p>
                  {isAdmin ? (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-slate-500">₹</span>
                      <input 
                        type="number" 
                        value={op.incentiveAmount === undefined || op.incentiveAmount === null ? "" : op.incentiveAmount} 
                        onChange={(e) => setOp({...op, incentiveAmount: e.target.value ? Number(e.target.value) : undefined})} 
                        onBlur={async () => {
                          try {
                            await api.put(`/operations/${op._id}`, { incentiveAmount: op.incentiveAmount === undefined ? null : op.incentiveAmount });
                            const t = document.createElement('div');
                            t.className = 'fixed bottom-4 right-4 z-50 bg-emerald-600 text-white text-sm px-4 py-3 rounded-xl shadow-xl';
                            t.innerText = '✓ Incentive saved';
                            document.body.appendChild(t);
                            setTimeout(() => t.remove(), 2000);
                          } catch {
                            alert("Failed to save incentive");
                          }
                        }}
                        placeholder="Pending"
                        className="w-20 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500" 
                      />
                    </div>
                  ) : (
                    <p className={`text-sm font-bold mt-1 ${op.incentiveAmount === undefined || op.incentiveAmount === null ? "text-amber-500" : "text-emerald-600"}`}>
                      {op.incentiveAmount === undefined || op.incentiveAmount === null ? "Pending" : formatCurrency(op.incentiveAmount)}
                    </p>
                  )}
                </div>
                <button onClick={recalculate} className="text-[10px] text-cyan-600 font-semibold hover:underline mt-auto mb-1">Recalculate</button>
              </div>
            </div>
          </div>
          
          {(op.booking || (op.bookings && op.bookings.length > 0)) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Passenger Details</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(() => {
                      const totalAdults = op.customers && op.customers.length > 0 
                        ? op.customers.reduce((sum, c) => sum + (c.adults || c.pax || 1), 0) 
                        : (op.customer?.adults || op.customer?.pax || op.booking?.package?.adultCount || 1);
                      const totalChildren = op.customers && op.customers.length > 0 
                        ? op.customers.reduce((sum, c) => sum + (c.children || 0), 0) 
                        : (op.customer?.children || op.booking?.package?.childCount || 0);
                      
                      return `Total Pax: ${totalAdults} Adult(s)${totalChildren > 0 ? `, ${totalChildren} Child(ren)` : ''}`;
                    })()}
                  </p>
                </div>
                <button onClick={() => setPassengerModalOpen(true)} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                  <Plus size={14} /> Add Passenger
                </button>
              </div>
              
              {(() => {
                if (op.bookings && op.bookings.length > 0) {
                  return (
                    <div className="space-y-4">
                      {op.bookings.map((b: any, bIdx: number) => (
                        <div key={b._id} className="border border-slate-200 rounded-lg overflow-hidden">
                          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">{op.customers?.[bIdx]?.name || 'Customer'} Booking (ID: {b.bookingId || b._id})</span>
                            <span className="text-[10px] text-slate-500">{b.travellersDetails?.length || 0} Pax</span>
                          </div>
                          <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(b.travellersDetails || []).length === 0 && <p className="text-xs text-slate-400 p-2">No passengers added to this booking yet.</p>}
                            {(b.travellersDetails || []).map((t: any, idx: number) => (
                              <div key={idx} className="p-3 border border-slate-100 bg-white shadow-sm rounded-lg relative group">
                                <button onClick={() => handleRemovePassenger(b._id, idx)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all" title="Remove">
                                  <Trash2 size={14} />
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.type === 'adult' ? 'bg-indigo-100 text-indigo-700' : t.type === 'child' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {t.type || 'Adult'}
                                  </span>
                                  <p className="text-sm font-bold text-slate-800">{t.name}</p>
                                  {t.age && <p className="text-xs text-slate-500">({t.age} yrs)</p>}
                                </div>
                                {(t.passportNumber || t.issuingCountry) && (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] text-slate-500 font-medium">Passport: <span className="text-slate-700">{t.passportNumber}</span></p>
                                    <div className="flex gap-3 mt-0.5">
                                      <p className="text-[10px] text-slate-500">Exp: {t.passportExpiry ? formatDate(t.passportExpiry) : '—'}</p>
                                      <p className="text-[10px] text-slate-500">Country: {t.issuingCountry}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } else if (op.booking) {
                  const allTravellers = op.booking.travellersDetails || [];
                  if (allTravellers.length === 0) {
                    return (
                      <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">No passenger details added yet.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allTravellers.map((t: any, idx: number) => (
                        <div key={idx} className="p-3 border border-slate-100 bg-slate-50 rounded-lg relative group">
                          <button onClick={() => handleRemovePassenger(op.booking!._id, idx)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all" title="Remove">
                            <Trash2 size={14} />
                          </button>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.type === 'adult' ? 'bg-indigo-100 text-indigo-700' : t.type === 'child' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {t.type || 'Adult'}
                            </span>
                            <p className="text-sm font-bold text-slate-800">{t.name}</p>
                            {t.age && <p className="text-xs text-slate-500">({t.age} yrs)</p>}
                          </div>
                          {(t.passportNumber || t.issuingCountry) && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <p className="text-[10px] text-slate-500 font-medium">Passport: <span className="text-slate-700">{t.passportNumber}</span></p>
                              <div className="flex gap-3 mt-0.5">
                                <p className="text-[10px] text-slate-500">Exp: {t.passportExpiry ? formatDate(t.passportExpiry) : '—'}</p>
                                <p className="text-[10px] text-slate-500">Country: {t.issuingCountry}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {(op.booking?.package?.description || op.package?.description || op.bookings?.[0]?.package?.description) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Package Description</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{op.booking?.package?.description || op.package?.description || op.bookings?.[0]?.package?.description}</p>
            </div>
          )}

          {(() => {
            let changes: any[] = [];
            if (op.bookings && op.bookings.length > 0) changes = op.bookings.flatMap((b: any) => b.dateChangeHistory || []);
            else if (op.booking) changes = op.booking.dateChangeHistory || [];
            
            if (changes.length === 0) return null;
            return (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mt-4">
                <p className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-2 mb-2">
                  <Wand2 size={14} /> Date Change History
                </p>
                <div className="space-y-2">
                  {changes.map((h: any, i: number) => (
                    <div key={i} className="text-xs text-amber-900 border-l-2 border-amber-300 pl-2">
                      <p>Travel dates changed from <span className="font-bold">{formatDate(h.oldDate)}</span> to <span className="font-bold">{formatDate(h.newDate)}</span></p>
                      <p className="italic opacity-80 mt-1">"{h.reason}"</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          
          {(() => {
            const it = op.booking?.package?.itinerary || op.package?.itinerary || op.bookings?.[0]?.package?.itinerary;
            if (!it || it.length === 0) return null;
            return (
              <div className="bg-white rounded-xl border border-slate-200 p-5 mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Package Itinerary ({it.length} Days)</p>
                <div className="space-y-4">
                  {it.map((day: any, i: number) => (
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
            );
          })()}
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
              <button onClick={async () => { await api.post(`/operations/${id}/transports`, { type: "other", vendorName: "", vendorContact: "", vendorEmail: "", vendorCost: 0, sellingPrice: 0, paymentStatus: "pending", remarks: "", legs: [{ from: "", to: "", date: "", tripDay: "", vehicleType: "", notes: "" }] }); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Transfer Group</button>
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

          {selectedTransports.size > 1 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm font-bold text-indigo-900">{selectedTransports.size} items selected</p>
              <button onClick={() => handleGroupItems('transports', Array.from(selectedTransports))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                Merge Selected Services
              </button>
            </div>
          )}

          {(() => {
            const grouped: any[] = [];
            const processed = new Set();
            transports.forEach((t, idx) => {
              if (processed.has(t._id)) return;
              if (t.groupId) {
                const groupItems = transports.map((item, i) => ({ item, i })).filter(x => x.item.groupId === t.groupId);
                groupItems.forEach(x => processed.add(x.item._id));
                const masterInfo = groupItems.find(x => x.item.isGroupMaster) || groupItems[0];
                grouped.push({ isGroup: true, groupId: t.groupId, items: groupItems, masterInfo });
              } else {
                processed.add(t._id);
                grouped.push({ isGroup: false, item: t, idx });
              }
            });

            const renderTransportCard = (t: any, idx: number, isGrouped: boolean) => (
              <div key={t._id} className={`bg-white rounded-xl border p-4 space-y-4 ${t.isUrgent ? "border-red-300 bg-red-50/20" : "border-slate-200"} ${isGrouped ? 'shadow-sm' : 'mb-4'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isGrouped && (
                      <input type="checkbox" checked={selectedTransports.has(t._id)} onChange={(e) => {
                        const s = new Set(selectedTransports);
                        if (e.target.checked) s.add(t._id); else s.delete(t._id);
                        setSelectedTransports(s);
                      }} className="w-3.5 h-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
                    )}
                    <span className="text-xs font-bold text-cyan-700">#{idx + 1}</span>
                    <select value={t.type || "other"} onChange={(e) => { const u = [...transports]; u[idx] = { ...u[idx], type: e.target.value }; setTransports(u); }} className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer p-0">
                      {TRANSPORT_TYPES.map(tt => <option key={tt.v} value={tt.v}>{tt.l} Group</option>)}
                    </select>
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

                {!isGrouped && (
                  <>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Operator</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Name / Company</label><Inp value={t.vendorName} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorName: v }; setTransports(u); }} placeholder="e.g. Ravi Travels, IndiGo..." /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Contact (Phone)</label><Inp value={t.vendorContact} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorContact: v }; setTransports(u); }} placeholder="+91 98765 43210" /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Email (optional)</label><Inp value={t.vendorEmail} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorEmail: v }; setTransports(u); }} placeholder="vendor@email.com" /></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label><Inp type="number" value={t.vendorCost} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorCost: Number(v) }; setTransports(u); }} placeholder="0" /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label><Inp type="number" value={t.sellingPrice} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], sellingPrice: Number(v) }; setTransports(u); }} placeholder="0" /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label><Inp type="date" value={t.paymentDueDate?.split("T")[0] || ""} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], paymentDueDate: v }; setTransports(u); }} /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label><Sel value={t.paymentStatus} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], paymentStatus: v }; setTransports(u); }} options={PAY_OPTS} /></div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks / Notes</label>
                      <Inp value={t.remarks || ""} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], remarks: v }; setTransports(u); }} placeholder="e.g. Night transfers included, toll charges extra..." />
                    </div>
                  </>
                )}

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
                    {(t.legs || []).map((leg: any, li: number) => (
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
                          {(t.type === "flight" || t.type === "train") && (
                            <>
                              <div><label className="text-[8px] text-slate-400 uppercase block mb-1">PNR / Ref</label><input type="text" value={leg.pnr || ""} onChange={(e) => { const u = [...transports]; u[idx].legs[li] = { ...u[idx].legs[li], pnr: e.target.value }; setTransports(u); }} placeholder="e.g. ABC123" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white" /></div>
                              <div><label className="text-[8px] text-slate-400 uppercase block mb-1">Departure</label><input type="time" value={leg.departureTime || ""} onChange={(e) => { const u = [...transports]; u[idx].legs[li] = { ...u[idx].legs[li], departureTime: e.target.value }; setTransports(u); }} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white" /></div>
                              <div><label className="text-[8px] text-slate-400 uppercase block mb-1">Arrival</label><input type="time" value={leg.arrivalTime || ""} onChange={(e) => { const u = [...transports]; u[idx].legs[li] = { ...u[idx].legs[li], arrivalTime: e.target.value }; setTransports(u); }} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white" /></div>
                            </>
                          )}
                          {(t.type === "road" || t.type === "other") && (
                            <>
                              <div><label className="text-[8px] text-slate-400 uppercase block mb-1">Driver Name</label><input type="text" value={leg.driverName || ""} onChange={(e) => { const u = [...transports]; u[idx].legs[li] = { ...u[idx].legs[li], driverName: e.target.value }; setTransports(u); }} placeholder="Driver Name" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white" /></div>
                              <div><label className="text-[8px] text-slate-400 uppercase block mb-1">Driver Contact</label><input type="text" value={leg.driverContact || ""} onChange={(e) => { const u = [...transports]; u[idx].legs[li] = { ...u[idx].legs[li], driverContact: e.target.value }; setTransports(u); }} placeholder="Phone" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white" /></div>
                              <div><label className="text-[8px] text-slate-400 uppercase block mb-1">Vehicle No.</label><input type="text" value={leg.vehicleNumber || ""} onChange={(e) => { const u = [...transports]; u[idx].legs[li] = { ...u[idx].legs[li], vehicleNumber: e.target.value }; setTransports(u); }} placeholder="MH12..." className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white" /></div>
                            </>
                          )}
                          {(t.type === "road" || t.type === "ferry" || t.type === "cruise" || t.type === "other") && (
                            <div><label className="text-[8px] text-slate-400 uppercase block mb-1">Duration</label><input type="text" value={leg.duration || ""} onChange={(e) => { const u = [...transports]; u[idx].legs[li] = { ...u[idx].legs[li], duration: e.target.value }; setTransports(u); }} placeholder="e.g. Full day" className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white" /></div>
                          )}
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
            );

            return grouped.map((g) => {
              if (!g.isGroup) {
                return renderTransportCard(g.item, g.idx, false);
              } else {
                return (
                  <div key={g.groupId} className="bg-indigo-50/20 rounded-xl border border-indigo-200 p-4 space-y-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">GROUP: {g.items.length} Transports</span>
                      <button onClick={() => handleUngroup('transports', g.groupId)} className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-bold hover:bg-orange-100 transition-colors">
                        Ungroup All
                      </button>
                    </div>
                    <div className="space-y-3 border-l-2 border-indigo-200 pl-4 ml-1">
                      {g.items.map(({ item: t, i: idx }: { item: any, i: number }) => renderTransportCard(t, idx, true))}
                    </div>
                    <div className="bg-white rounded-xl border border-indigo-100 p-4 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Group Vendor & Pricing</span>
                        <button onClick={() => saveItem("transports", g.masterInfo.item._id, transports[g.masterInfo.i])} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100">
                          <Check size={10} /> Save Group
                        </button>
                      </div>
                      
                      {(() => {
                        const t = g.masterInfo.item;
                        const idx = g.masterInfo.i;
                        return (
                          <>
                            <div className="mb-4">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Operator</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Name / Company</label><Inp value={t.vendorName} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorName: v }; setTransports(u); }} placeholder="e.g. Ravi Travels, IndiGo..." /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Contact (Phone)</label><Inp value={t.vendorContact} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorContact: v }; setTransports(u); }} placeholder="+91 98765 43210" /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Email (optional)</label><Inp value={t.vendorEmail} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorEmail: v }; setTransports(u); }} placeholder="vendor@email.com" /></div>
                              </div>
                            </div>
                            <div className="mb-4">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label><Inp type="number" value={t.vendorCost} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], vendorCost: Number(v) }; setTransports(u); }} placeholder="0" /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label><Inp type="number" value={t.sellingPrice} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], sellingPrice: Number(v) }; setTransports(u); }} placeholder="0" /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label><Inp type="date" value={t.paymentDueDate?.split("T")[0] || ""} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], paymentDueDate: v }; setTransports(u); }} /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label><Sel value={t.paymentStatus} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], paymentStatus: v }; setTransports(u); }} options={PAY_OPTS} /></div>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks / Notes</label>
                              <Inp value={t.remarks || ""} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], remarks: v }; setTransports(u); }} placeholder="e.g. Night transfers included, toll charges extra..." />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              }
            });
          })()}
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
          {selectedAccommodations.size > 1 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm font-bold text-indigo-900">{selectedAccommodations.size} items selected</p>
              <button onClick={() => handleGroupItems('accommodations', Array.from(selectedAccommodations))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                Merge Selected Services
              </button>
            </div>
          )}
          {(() => {
            const grouped: any[] = [];
            const processed = new Set();
            accommodations.forEach((a, idx) => {
              if (processed.has(a._id)) return;
              if (a.groupId) {
                const groupItems = accommodations.map((item, i) => ({ item, i })).filter(x => x.item.groupId === a.groupId);
                groupItems.forEach(x => processed.add(x.item._id));
                const masterInfo = groupItems.find(x => x.item.isGroupMaster) || groupItems[0];
                grouped.push({ isGroup: true, groupId: a.groupId, items: groupItems, masterInfo });
              } else {
                processed.add(a._id);
                grouped.push({ isGroup: false, item: a, idx });
              }
            });

            return grouped.map((g) => {
              if (!g.isGroup) {
                const a = g.item;
                const idx = g.idx;
                return (
                  <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-cyan-700">
                        <input type="checkbox" checked={selectedAccommodations.has(a._id)} onChange={(e) => {
                          const s = new Set(selectedAccommodations);
                          if (e.target.checked) s.add(a._id); else s.delete(a._id);
                          setSelectedAccommodations(s);
                        }} className="w-3.5 h-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
                        #{idx+1} <span className="capitalize text-slate-500">{a.type}</span>
                        {op?.bookings && op.bookings.length > 1 && (
                          <select value={a.linkedBooking || ""} onChange={(e) => { const u = [...accommodations]; u[idx] = { ...u[idx], linkedBooking: e.target.value }; setAccommodations(u); }} className="ml-2 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                            <option value="">Group Expense</option>
                            {op.bookings.map((b: any, i: number) => <option key={b._id} value={b._id}>{op.customers?.[i]?.name || 'Customer'}</option>)}
                          </select>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => saveItem("accommodations", a._id, accommodations[idx])} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold"><Check size={10}/> Save</button>
                        <button onClick={() => delItem("accommodations", a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
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
                );
              } else {
                return (
                  <div key={g.groupId} className="bg-indigo-50/20 rounded-xl border border-indigo-200 p-4 space-y-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">GROUP: {g.items.length} Accommodations</span>
                      <button onClick={() => handleUngroup('accommodations', g.groupId)} className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-bold hover:bg-orange-100 transition-colors">
                        Ungroup All
                      </button>
                    </div>
                    <div className="space-y-3 border-l-2 border-indigo-200 pl-4 ml-1">
                      {g.items.map(({ item: a, i: idx }: { item: any, i: number }) => (
                        <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 relative shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-cyan-700 flex items-center gap-2">#{idx+1} <span className="capitalize text-slate-500">{a.type}</span></span>
                            <button onClick={() => delItem("accommodations", a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
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
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-indigo-100 p-4 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Group Vendor & Pricing</span>
                        <button onClick={() => saveItem("accommodations", g.masterInfo.item._id, accommodations[g.masterInfo.i])} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100">
                          <Check size={10} /> Save Group
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(() => {
                          const a = g.masterInfo.item;
                          const idx = g.masterInfo.i;
                          return (
                            <>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>{vendorList.length>0&&!a.vendorName?<VendorPick value={a.vendorName} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],vendorName:v==="__custom"?"":v};setAccommodations(u);}} vendors={vendorList} filterType="hotel" />:<Inp value={a.vendorName} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],vendorName:v};setAccommodations(u);}} />}</div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={a.vendorCost} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],vendorCost:Number(v)};setAccommodations(u);}} /></div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price</label><Inp type="number" value={a.sellingPrice} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],sellingPrice:Number(v)};setAccommodations(u);}} /></div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment</label><Sel value={a.paymentStatus} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],paymentStatus:v};setAccommodations(u);}} options={PAY_OPTS} /></div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              }
            });
          })()}
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
          {selectedActivities.size > 1 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm font-bold text-indigo-900">{selectedActivities.size} items selected</p>
              <button onClick={() => handleGroupItems('activities', Array.from(selectedActivities))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                Merge Selected Services
              </button>
            </div>
          )}
          {(() => {
            const grouped: any[] = [];
            const processed = new Set();
            activities.forEach((a, idx) => {
              if (processed.has(a._id)) return;
              if (a.groupId) {
                const groupItems = activities.map((item, i) => ({ item, i })).filter(x => x.item.groupId === a.groupId);
                groupItems.forEach(x => processed.add(x.item._id));
                const masterInfo = groupItems.find(x => x.item.isGroupMaster) || groupItems[0];
                grouped.push({ isGroup: true, groupId: a.groupId, items: groupItems, masterInfo });
              } else {
                processed.add(a._id);
                grouped.push({ isGroup: false, item: a, idx });
              }
            });

            return grouped.map((g) => {
              if (!g.isGroup) {
                const a = g.item;
                const idx = g.idx;
                return (
                  <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-bold text-cyan-700">
                        <input type="checkbox" checked={selectedActivities.has(a._id)} onChange={(e) => {
                          const s = new Set(selectedActivities);
                          if (e.target.checked) s.add(a._id); else s.delete(a._id);
                          setSelectedActivities(s);
                        }} className="w-3.5 h-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer" />
                        Day #{idx+1} Expense
                        {op?.bookings && op.bookings.length > 1 && (
                          <select value={a.linkedBooking || ""} onChange={(e) => { const u = [...activities]; u[idx] = { ...u[idx], linkedBooking: e.target.value }; setActivities(u); }} className="ml-2 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500">
                            <option value="">Group Expense</option>
                            {op.bookings.map((b: any, i: number) => <option key={b._id} value={b._id}>{op.customers?.[i]?.name || 'Customer'}</option>)}
                          </select>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => saveItem("activities", a._id, activities[idx])} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold"><Check size={10}/> Save</button>
                        <button onClick={() => delItem("activities", a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
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
                );
              } else {
                return (
                  <div key={g.groupId} className="bg-indigo-50/20 rounded-xl border border-indigo-200 p-4 space-y-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">GROUP: {g.items.length} Itinerary Days</span>
                      <button onClick={() => handleUngroup('activities', g.groupId)} className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-bold hover:bg-orange-100 transition-colors">
                        Ungroup All
                      </button>
                    </div>
                    <div className="space-y-3 border-l-2 border-indigo-200 pl-4 ml-1">
                      {g.items.map(({ item: a, i: idx }: { item: any, i: number }) => (
                        <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 relative shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-cyan-700">Day #{idx+1} Expense</span>
                            <button onClick={() => delItem("activities", a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="col-span-2"><label className="text-[9px] text-slate-400 uppercase block mb-1">Day Title</label><Inp value={a.title} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],title:v};setActivities(u);}} placeholder="Arrival & City Tour" /></div>
                            <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Date</label><Inp type="date" value={a.date?.split("T")[0]||""} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],date:v};setActivities(u);}} /></div>
                            <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Duration</label><Inp value={a.duration} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],duration:v};setActivities(u);}} placeholder="Full day" /></div>
                            <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Trip Day</label><Inp value={a.tripDay} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],tripDay:v};setActivities(u);}} placeholder="Day 1" /></div>
                            <div className="col-span-2"><label className="text-[9px] text-slate-400 uppercase block mb-1">Activities / Description</label><Inp value={a.description} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],description:v};setActivities(u);}} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-indigo-100 p-4 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Group Vendor & Pricing</span>
                        <button onClick={() => saveItem("activities", g.masterInfo.item._id, activities[g.masterInfo.i])} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100">
                          <Check size={10} /> Save Group
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(() => {
                          const a = g.masterInfo.item;
                          const idx = g.masterInfo.i;
                          return (
                            <>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>{vendorList.length>0&&!a.vendorName?<VendorPick value={a.vendorName} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorName:v==="__custom"?"":v};setActivities(u);}} vendors={vendorList} filterType="activity" />:<Inp value={a.vendorName} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorName:v};setActivities(u);}} />}</div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={a.vendorCost} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorCost:Number(v)};setActivities(u);}} /></div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling</label><Inp type="number" value={a.sellingPrice} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],sellingPrice:Number(v)};setActivities(u);}} /></div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment</label><Sel value={a.paymentStatus} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],paymentStatus:v};setActivities(u);}} options={PAY_OPTS} /></div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              }
            });
          })()}
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
              {customerPayments.length > 0 && <button onClick={() => generateInvoicePdf({ mode: "summary", operationId: op.operationId, customer: op.customers?.[0] || op.customer || {name: 'Unknown', email: '', phone: '', pax: 0}, destination: op.destination, milestone: "Full Statement", amount: customerPayments.reduce((s,p)=>s+p.amount,0), dueDate: undefined, paidAmount: customerPayments.reduce((s,p)=>s+p.paidAmount,0), status: "statement", sellingPrice: op.sellingPrice, allPayments: customerPayments.map(cp=>({milestone:cp.milestone,amount:cp.amount,paidAmount:cp.paidAmount,status:cp.status})) })} className="flex items-center gap-1 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"><Download size={14} /> Statement</button>}
              <button onClick={() => setSplitModalOpen(true)} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Installment</button>
            </div>
          </div>
          {customerPayments.length>0&&<div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between"><div className="text-center"><p className="text-[9px] text-slate-400 uppercase">Total</p><p className="text-sm font-bold text-slate-800">{formatCurrency(customerPayments.reduce((s,p)=>s+p.amount,0))}</p></div><div className="text-center"><p className="text-[9px] text-slate-400 uppercase">Received</p><p className="text-sm font-bold text-emerald-600">{formatCurrency(customerPayments.reduce((s,p)=>s+p.paidAmount,0))}</p></div><div className="text-center"><p className="text-[9px] text-slate-400 uppercase">Pending</p><p className="text-sm font-bold text-amber-600">{formatCurrency(customerPayments.reduce((s,p)=>s+(p.amount-p.paidAmount),0))}</p></div></div>}
          
          {(() => {
            const groupedPayments: Record<string, any[]> = {};
            const unassigned: any[] = [];
            customerPayments.forEach((p, idx) => {
              const pWithGlobalIdx = { ...p, _globalIdx: idx };
              if (p.booking?._id) {
                if (!groupedPayments[p.booking._id]) groupedPayments[p.booking._id] = [];
                groupedPayments[p.booking._id].push(pWithGlobalIdx);
              } else {
                unassigned.push(pWithGlobalIdx);
              }
            });

            const renderPaymentCard = (p: any, idx: number) => (
              <div key={p._id} className={`bg-white border rounded-xl p-4 space-y-3 ${p.status==="overdue"?"border-red-300 bg-red-50/30":"border-slate-200"}`}>
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">#{idx+1} {p.status==="paid"&&<span className="ml-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px]">PAID</span>}{p.status==="partial"&&<span className="ml-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px]">PARTIAL</span>}{p.status==="overdue"&&<span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px]">OVERDUE</span>}{p.paymentMode==="razorpay"&&p.status==="paid"&&<span className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px]">VIA LINK</span>}</span><div className="flex gap-2"><button onClick={() => sendReminder(p._id)} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold hover:bg-amber-100 transition-colors"><Bell size={10}/> Remind</button><button onClick={() => generateInvoicePdf({ mode: "single", operationId: op.operationId, customer: op.customers?.[0] || op.customer || {name: 'Unknown', email: '', phone: '', pax: 0}, destination: op.destination, milestone: p.milestone, amount: p.amount, dueDate: p.dueDate, paidAmount: p.paidAmount, status: p.status, paymentLink: p.paymentLinkEnabled ? p.paymentLink : undefined, sellingPrice: op.sellingPrice, allPayments: customerPayments.map(cp => ({ milestone: cp.milestone, amount: cp.amount, paidAmount: cp.paidAmount, status: cp.status })) })} className="flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-[10px] font-bold"><Download size={10}/> Invoice</button><button onClick={() => saveItem("customer-payments", p._id, customerPayments[idx])} disabled={saving === p._id} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold disabled:opacity-50"><Check size={10}/> {saving === p._id ? "Saving..." : "Save"}</button><button onClick={() => delItem("customer-payments", p._id)} className="text-red-400"><Trash2 size={14} /></button></div></div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-max mb-4">
                  <button onClick={() => {const u=[...customerPayments]; u[idx]={...u[idx], _isManual: false}; setCustomerPayments(u);}} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!p._isManual ? "bg-white shadow text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Razorpay Link</button>
                  <button onClick={() => {const u=[...customerPayments]; u[idx]={...u[idx], _isManual: true}; setCustomerPayments(u);}} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${p._isManual ? "bg-white shadow text-cyan-700" : "text-slate-500 hover:text-slate-700"}`}>Manual / Offline</button>
                </div>
  
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Milestone</label><Inp value={p.milestone} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],milestone:v};setCustomerPayments(u);}} placeholder="Advance, Final..." /></div>
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Total Amount</label><Inp type="number" value={p.amount} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],amount:Number(v)};setCustomerPayments(u);}} /></div>
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Due Date</label><Inp type="date" value={p.dueDate?.split("T")[0]||""} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],dueDate:v};setCustomerPayments(u);}} /></div>
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label><Sel value={p.status} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],status:v};setCustomerPayments(u);}} options={[{v:"upcoming",l:"Pending"},{v:"paid",l:"Paid"}]} /></div>
                  
                  {p._isManual && (
                    <>
                      <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Paid Received</label><Inp type="number" value={p.paidAmount} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],paidAmount:Number(v)};setCustomerPayments(u);}} /></div>
                      <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Mode (Manual)</label><Inp value={p.paymentMode} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],paymentMode:v};setCustomerPayments(u);}} placeholder="UPI/NEFT/Cash" /></div>
                      <div><label className="text-[9px] text-slate-400 uppercase block mb-1">TXN ID</label><Inp value={p.transactionId} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],transactionId:v};setCustomerPayments(u);}} /></div>
                      <div className="col-span-2 md:col-span-4"><label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks</label><textarea value={p.remarks || ""} onChange={(e)=>{const u=[...customerPayments];u[idx]={...u[idx],remarks:e.target.value};setCustomerPayments(u);}} placeholder="e.g. Received via bank transfer, partial advance..." rows={2} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none" /></div>
                    </>
                  )}
                </div>
                
                {!p._isManual && (
                  p.status === "paid" && p.paymentLink ? (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-xs font-semibold">
                        <Check size={14} /> Paid via Link: <a href={p.paymentLink} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-sm">{p.paymentLink}</a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-2">
                      <div className="flex items-end gap-3">
                        <div className="flex-1"><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Link URL</label><Inp value={p.paymentLink||""} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],paymentLink:v};setCustomerPayments(u);}} placeholder="https://razorpay.me/..." /></div>
                        {p.status !== "paid" && <button onClick={() => handleGeneratePaymentLink(p, idx)} disabled={paymentLinkLoading === p._id} className="flex items-center gap-1.5 px-4 py-2 h-9 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap disabled:opacity-50"><LinkIcon size={14}/> {paymentLinkLoading === p._id ? "Generating..." : "Generate Link for ₹" + (p.amount - (p.paidAmount || 0))}</button>}
                      </div>
                      <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={p.paymentLinkEnabled} onChange={(e)=>{const u=[...customerPayments];u[idx]={...u[idx],paymentLinkEnabled:e.target.checked};setCustomerPayments(u);}} className="w-3.5 h-3.5 rounded" /><span className="text-slate-600">Include payment link in invoice</span></label></div>
                    </div>
                  )
                )}
              </div>
            );

            return (
              <div className="space-y-6 mt-4">
                {Object.entries(groupedPayments).map(([bookingId, payments]) => {
                  const bInfo = op.bookings?.find((b: any) => b._id === bookingId) || op.booking;
                  const cIndex = op.bookings?.findIndex((b: any) => b._id === bookingId) || 0;
                  const cName = op.customers?.[cIndex]?.name || 'Customer';
                  
                  return (
                    <div key={bookingId} className="border border-indigo-100 bg-indigo-50/20 rounded-xl overflow-hidden">
                      <div className="bg-indigo-100/50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-800">{cName}'s Payments <span className="font-normal text-[10px] ml-2 bg-white px-1.5 py-0.5 rounded text-indigo-600 border border-indigo-200 uppercase">ID: {bInfo?.bookingId || bookingId}</span></span>
                        <div className="text-[10px] text-indigo-600 font-bold bg-white px-2 py-1 rounded-md border border-indigo-100">
                          Total: {formatCurrency(payments.reduce((s,p)=>s+p.amount,0))} | Pending: <span className="text-amber-600">{formatCurrency(payments.reduce((s,p)=>s+(p.amount-p.paidAmount),0))}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                         {payments.map(p => renderPaymentCard(p, p._globalIdx))}
                      </div>
                    </div>
                  );
                })}
                {unassigned.length > 0 && (
                  <div className="border border-slate-200 bg-slate-50/50 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">General / Unassigned Payments</span>
                    </div>
                    <div className="p-4 space-y-3">
                       {unassigned.map(p => renderPaymentCard(p, p._globalIdx))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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

      {/* SPLIT MODAL */}
      {splitModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative">
            <button onClick={() => setSplitModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Add Installment</h3>
            <p className="text-xs text-slate-500 mb-5">How would you like to record this payment?</p>

            <div className="space-y-4">
              {((op?.bookings && op.bookings.length > 1) || op?.departureId) && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assign to Booking Group</label>
                  <select value={splitData.primaryPaymentId} onChange={e => setSplitData({...splitData, primaryPaymentId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500">
                    <option value="">General Operation / Unassigned</option>
                    {op.bookings?.map((b: any, i: number) => (
                      <option key={b._id} value={b._id}>{op.customers?.[i]?.name || 'Customer'} (ID: {b.bookingId || b._id})</option>
                    ))}
                  </select>
                </div>
              )}

              <button onClick={async () => { 
                setSplitModalOpen(false); 
                const bookingId = splitData.primaryPaymentId || (op?.bookings && op.bookings.length === 1 ? op.bookings[0]._id : op?.booking?._id);
                await api.post(`/operations/${id}/customer-payments`, { booking: bookingId || undefined }); 
                fetchAll(); 
              }} className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-colors group">
                <p className="text-sm font-bold text-slate-800 group-hover:text-cyan-700">Add Extra Charge (Increases Trip Cost)</p>
                <p className="text-xs text-slate-500 mt-1">Use this if the customer added a new activity or penalty.</p>
              </button>

              <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-4">
                <p className="text-sm font-bold text-indigo-900">Split into Smaller Installment</p>
                <p className="text-xs text-indigo-700 mt-1 mb-3">Use this to split a large payment into a smaller card so you can send a payment link to the customer for just this amount. This will automatically deduct from the existing unpaid balance.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount to Split (₹)</label>
                    <input type="number" value={splitData.amount} onChange={e => setSplitData({...splitData, amount: e.target.value})} placeholder="50000" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <button onClick={handleSplitSubmit} disabled={saving === "split"} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm disabled:opacity-50 transition-colors mt-2">
                    {saving === "split" ? "Processing..." : "Deduct & Create Card"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PASSENGER MODAL */}
      {passengerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPassengerModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Add Passenger</h2>
              <button onClick={() => setPassengerModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              {(() => {
                const isGroupTour = op?.departureId || (op?.bookings && op.bookings.length > 1);
                return (
                  <>
                    {isGroupTour && (
                      <>
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                          <button onClick={() => setAddPassengerMode("existing")} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${addPassengerMode === "existing" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>Add to Existing Booking</button>
                          <button onClick={() => setAddPassengerMode("new")} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${addPassengerMode === "new" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>Treat as New Booking</button>
                        </div>
                        
                        {addPassengerMode === "existing" && op?.bookings && op.bookings.length > 0 && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Booking Group</label>
                            <select value={linkedBookingId} onChange={e => setLinkedBookingId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                              <option value="">-- Choose Booking --</option>
                              {op.bookings.map((b: any, i: number) => {
                                 const c = op.customers?.[i];
                                 return <option key={b._id} value={b._id}>{c?.name || 'Customer'} (Booking ID: {b.bookingId || b._id})</option>
                              })}
                            </select>
                          </div>
                        )}

                        {addPassengerMode === "new" && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                            <div>
                              <label className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Email <span className="text-red-500">*</span></label>
                              <input type="email" value={newPassengerEmail} onChange={e => setNewPassengerEmail(e.target.value)} className="w-full px-3 py-1.5 border border-amber-200 rounded-md text-sm" placeholder="guest@email.com" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Phone</label>
                              <input type="text" value={newPassengerPhone} onChange={e => setNewPassengerPhone(e.target.value)} className="w-full px-3 py-1.5 border border-amber-200 rounded-md text-sm" placeholder="+123456789" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-amber-700 uppercase block mb-1">PAN Card</label>
                              <input type="text" value={newPassenger.panCard || ''} onChange={e => setNewPassenger({...newPassenger, panCard: e.target.value})} className="w-full px-3 py-1.5 border border-amber-200 rounded-md text-sm uppercase" placeholder="ABCDE1234F" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              })()}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={newPassenger.name} onChange={e => setNewPassenger({...newPassenger, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Type</label>
                  <select value={newPassenger.type} onChange={e => setNewPassenger({...newPassenger, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="adult">Adult</option>
                    <option value="child">Child</option>
                    <option value="infant">Infant</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Age</label>
                  <input type="number" value={newPassenger.age} onChange={e => setNewPassenger({...newPassenger, age: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g. 30" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Passport Details (Optional)</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Passport Number</label>
                    <input type="text" value={newPassenger.passportNumber} onChange={e => setNewPassenger({...newPassenger, passportNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expiry Date</label>
                      <input type="date" value={newPassenger.passportExpiry} onChange={e => setNewPassenger({...newPassenger, passportExpiry: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Issuing Country</label>
                      <input type="text" value={newPassenger.issuingCountry} onChange={e => setNewPassenger({...newPassenger, issuingCountry: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button onClick={handleAddPassenger} disabled={addingPassenger} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs disabled:opacity-50">
                {addingPassenger ? "Adding..." : "Add Passenger"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
