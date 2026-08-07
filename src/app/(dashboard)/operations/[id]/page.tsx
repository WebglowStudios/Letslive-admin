"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, Home, Compass, CreditCard, FileText, TrendingUp, Plus, Trash2, Check, Save, Download, Bell, Wand2 } from "lucide-react";
import Link from "next/link";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

interface Transport { _id: string; type: string; name: string; bookingRef: string; route: string; date: string; departureTime: string; arrivalTime: string; driverName: string; driverContact: string; vehicleNumber: string; duration: string; tripDay: string; vendorName: string; vendorCost: number; sellingPrice: number; paymentStatus: string; paymentDueDate: string; isUrgent: boolean; remarks: string; }
interface Accommodation { _id: string; type: string; name: string; area: string; roomCategory: string; mealPlan: string; checkIn: string; checkOut: string; nights: number; confirmationNumber: string; tripDay: string; vendorName: string; vendorCost: number; sellingPrice: number; paymentStatus: string; remarks: string; }
interface Activity { _id: string; title: string; description: string; date: string; duration: string; tripDay: string; vendorName: string; vendorCost: number; sellingPrice: number; paymentStatus: string; remarks: string; }
interface CPayment { _id: string; milestone: string; amount: number; paidAmount: number; dueDate: string; paidDate: string; status: string; paymentLinkEnabled: boolean; paymentLink: string; paymentMode: string; transactionId: string; }
interface OpData { _id: string; operationId: string; booking?: { paymentStatus: string }; package?: { _id: string; name: string; slug: string }; customer: { name: string; email: string; phone: string; pax: number }; destination: string; travelDates: { start: string; end: string }; assignedTo?: { firstName: string; lastName: string }; sellingPrice: number; totalVendorCost: number; grossProfit: number; profitPercentage: number; status: string; }

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

const TRANSPORT_TYPES = [
  { v: "flight", l: "Flight" }, { v: "train", l: "Train" }, { v: "bus", l: "Bus" }, { v: "car", l: "Car/Taxi" },
  { v: "ferry", l: "Ferry" }, { v: "cruise", l: "Cruise" }, { v: "buggy", l: "Buggy" }, { v: "other", l: "Other" },
];
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [res, vRes] = await Promise.all([api.get(`/operations/${id}`), api.get("/vendors")]);
      if (res?.data) { setOp(res.data.operation); setTransports(res.data.transports || []); setAccommodations(res.data.accommodations || []); setActivities(res.data.activities || []); setCustomerPayments(res.data.customerPayments || []); }
      setVendorList(vRes?.data || []);
    } catch {} finally { setLoading(false); }
  }, [id]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function saveItem(endpoint: string, itemId: string, data: unknown) { setSaving(itemId); try { await api.put(`/operations/${id}/${endpoint}/${itemId}`, data); } catch { alert("Save failed"); } finally { setSaving(null); } }
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
      if (op?.package?.slug) {
        try {
          const pkgRes = await api.get(`/packages/${op.package.slug}`);
          itinerary = pkgRes.data?.itinerary || [];
          transferSummary = pkgRes.data?.transferSummary || "";
        } catch (e) {
          console.warn("Could not fetch full package itinerary for voucher");
        }
      }

      await generateVoucherPdf({
        operationId: op?.operationId || "",
        destination: op?.destination || "",
        customerName: op?.customer?.name || "",
        pax: op?.customer?.pax || 1,
        paymentStatus: op?.booking?.paymentStatus || "pending",
        flights: transports.filter((t) => t.type === "flight"),
        accommodations: accommodations,
        transports: transports.filter((t) => t.type !== "flight"),
        itinerary,
        transferSummary,
      });

    } catch (err) {
      alert("Failed to generate voucher");
      console.error(err);
    } finally {
      setDownloadingVoucher(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!op) return <div className="text-center py-20 text-sm text-slate-400">Operation not found</div>;

  const tabs = [
    { id: "overview", label: "Overview", icon: <FileText size={14} /> },
    { id: "transport", label: `Transport (${transports.length})`, icon: <Truck size={14} /> },
    { id: "accommodation", label: `Stay (${accommodations.length})`, icon: <Home size={14} /> },
    { id: "activities", label: `Activities (${activities.length})`, icon: <Compass size={14} /> },
    { id: "payments", label: `Payments (${customerPayments.length})`, icon: <CreditCard size={14} /> },
    { id: "pnl", label: "P&L", icon: <TrendingUp size={14} /> },
  ];

  return (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Customer</p><p className="text-sm font-semibold text-slate-800">{op.customer.name}</p><p className="text-xs text-slate-500">{op.customer.email} | {op.customer.phone}</p><p className="text-xs text-slate-400 mt-1">{op.customer.pax} pax</p></div>
          <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Trip</p><p className="text-sm font-semibold text-slate-800">{op.destination}</p><p className="text-xs text-slate-500">{op.travelDates?.start ? formatDate(op.travelDates.start) : "—"} → {op.travelDates?.end ? formatDate(op.travelDates.end) : "—"}</p></div>
          <div className="bg-white rounded-xl border border-slate-200 p-5"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Financials</p><div className="flex justify-between"><div><p className="text-xs text-slate-500">Selling</p><p className="text-lg font-bold text-slate-800">{formatCurrency(op.sellingPrice)}</p></div><div className="text-right"><p className="text-xs text-slate-500">Profit</p><p className={`text-lg font-bold ${op.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(op.grossProfit)}</p></div></div><button onClick={recalculate} className="mt-3 text-[10px] text-cyan-600 font-semibold hover:underline">Recalculate</button></div>
        </div>
      )}

      {/* TRANSPORTATION */}
      {tab === "transport" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-700">{transports.length} transport(s)</p>
            <div className="flex gap-2">
              {op.package && transports.length > 0 && <button onClick={importFromItinerary} disabled={importing} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"><Wand2 size={14} /> {importing ? "..." : "Re-import"}</button>}
              <button onClick={async () => { await api.post(`/operations/${id}/transports`, { type: "flight" }); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Transport</button>
            </div>
          </div>
          {op.package && transports.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Wand2 size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Import from Itinerary</p>
                  <p className="text-xs text-blue-700 mt-0.5">This operation is linked to a package. Click to auto-fill transports.</p>
                </div>
              </div>
              <button onClick={importFromItinerary} disabled={importing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                {importing ? "Importing..." : "Auto-Fill"}
              </button>
            </div>
          )}
          {transports.map((t, idx) => (
            <div key={t._id} className={`bg-white rounded-xl border p-4 space-y-3 ${t.isUrgent ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}>
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">#{idx+1} <span className="capitalize text-slate-500">{t.type}</span> {t.isUrgent && <span className="text-red-600 ml-1">URGENT</span>}</span><div className="flex gap-2"><button onClick={() => saveItem("transports", t._id, transports[idx])} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">{saving===t._id?"...": <><Check size={10}/> Save</>}</button><button onClick={() => delItem("transports", t._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Type</label><Sel value={t.type} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],type:v};setTransports(u);}} options={TRANSPORT_TYPES} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Name/Airline</label><Inp value={t.name} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],name:v};setTransports(u);}} placeholder="IndiGo, Rajdhani..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">PNR / Booking Ref</label><Inp value={t.bookingRef} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],bookingRef:v};setTransports(u);}} placeholder="ABC123" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Route</label><Inp value={t.route} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],route:v};setTransports(u);}} placeholder="Mumbai → Dubai" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Date</label><Inp type="date" value={t.date?.split("T")[0]||""} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],date:v};setTransports(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Departure</label><Inp value={t.departureTime} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],departureTime:v};setTransports(u);}} placeholder="06:30" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Arrival</label><Inp value={t.arrivalTime} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],arrivalTime:v};setTransports(u);}} placeholder="10:45" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vehicle No.</label><Inp value={t.vehicleNumber} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],vehicleNumber:v};setTransports(u);}} placeholder="MH12XX1234" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Duration/Allotment</label><Inp value={t.duration} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],duration:v};setTransports(u);}} placeholder="Full day, 4 hrs..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Trip Day</label><Inp value={t.tripDay} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],tripDay:v};setTransports(u);}} placeholder="Day 1, Arrival..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Driver</label><Inp value={t.driverName} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],driverName:v};setTransports(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Driver Contact</label><Inp value={t.driverContact} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],driverContact:v};setTransports(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>{vendorList.length>0&&!t.vendorName?<VendorPick value={t.vendorName} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],vendorName:v==="__custom"?"":v};setTransports(u);}} vendors={vendorList} filterType="flight" />:<Inp value={t.vendorName} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],vendorName:v};setTransports(u);}} />}</div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={t.vendorCost} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],vendorCost:Number(v)};setTransports(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price</label><Inp type="number" value={t.sellingPrice} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],sellingPrice:Number(v)};setTransports(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label><Inp type="date" value={t.paymentDueDate?.split("T")[0]||""} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],paymentDueDate:v};setTransports(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label><Sel value={t.paymentStatus} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],paymentStatus:v};setTransports(u);}} options={PAY_OPTS} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks</label><Inp value={t.remarks||""} onChange={(v)=>{const u=[...transports];u[idx]={...u[idx],remarks:v};setTransports(u);}} /></div>
              </div>
            </div>
          ))}
          {transports.length===0&&<div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No transports yet.</div>}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Type</label><Sel value={a.type} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],type:v};setAccommodations(u);}} options={ACCOMMODATION_TYPES} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Property Name</label><Inp value={a.name} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],name:v};setAccommodations(u);}} placeholder="Marriott, Zostel..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Area</label><Inp value={a.area} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],area:v};setAccommodations(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Room</label><Inp value={a.roomCategory} onChange={(v)=>{const u=[...accommodations];u[idx]={...u[idx],roomCategory:v};setAccommodations(u);}} placeholder="Deluxe, Dorm..." /></div>
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
            <p className="text-sm font-semibold text-slate-700">{activities.length} activit{activities.length===1?"y":"ies"}</p>
            <div className="flex gap-2">
              {op.package && activities.length > 0 && <button onClick={importFromItinerary} disabled={importing} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"><Wand2 size={14} /> {importing ? "..." : "Re-import"}</button>}
              <button onClick={async () => { await api.post(`/operations/${id}/activities`, {}); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Activity</button>
            </div>
          </div>
          {op.package && activities.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Wand2 size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Import from Itinerary</p>
                  <p className="text-xs text-blue-700 mt-0.5">This operation is linked to a package. Click to auto-fill activities.</p>
                </div>
              </div>
              <button onClick={importFromItinerary} disabled={importing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors">
                {importing ? "Importing..." : "Auto-Fill"}
              </button>
            </div>
          )}
          {activities.map((a, idx) => (
            <div key={a._id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">Activity #{idx+1}</span><div className="flex gap-2"><button onClick={() => saveItem("activities", a._id, activities[idx])} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold"><Check size={10}/> Save</button><button onClick={() => delItem("activities", a._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2"><label className="text-[9px] text-slate-400 uppercase block mb-1">Title</label><Inp value={a.title} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],title:v};setActivities(u);}} placeholder="Desert Safari, City Tour..." /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Date</label><Inp type="date" value={a.date?.split("T")[0]||""} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],date:v};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Duration</label><Inp value={a.duration} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],duration:v};setActivities(u);}} placeholder="4 hours" /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Trip Day</label><Inp value={a.tripDay} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],tripDay:v};setActivities(u);}} placeholder="Day 2" /></div>
                <div className="col-span-2"><label className="text-[9px] text-slate-400 uppercase block mb-1">Description</label><Inp value={a.description} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],description:v};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>{vendorList.length>0&&!a.vendorName?<VendorPick value={a.vendorName} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorName:v==="__custom"?"":v};setActivities(u);}} vendors={vendorList} filterType="activity" />:<Inp value={a.vendorName} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorName:v};setActivities(u);}} />}</div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={a.vendorCost} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],vendorCost:Number(v)};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling</label><Inp type="number" value={a.sellingPrice} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],sellingPrice:Number(v)};setActivities(u);}} /></div>
                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment</label><Sel value={a.paymentStatus} onChange={(v)=>{const u=[...activities];u[idx]={...u[idx],paymentStatus:v};setActivities(u);}} options={PAY_OPTS} /></div>
              </div>
            </div>
          ))}
          {activities.length===0&&<div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No activities yet.</div>}
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
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">#{idx+1} {p.status==="paid"&&<span className="text-emerald-600">PAID</span>}{p.status==="overdue"&&<span className="text-red-600">OVERDUE</span>}</span><div className="flex gap-2"><button onClick={() => sendReminder(p._id)} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold hover:bg-amber-100 transition-colors"><Bell size={10}/> Remind</button><button onClick={() => generateInvoicePdf({ mode: "single", operationId: op.operationId, customer: op.customer, destination: op.destination, milestone: p.milestone, amount: p.amount, dueDate: p.dueDate, paidAmount: p.paidAmount, status: p.status, paymentLink: p.paymentLinkEnabled ? p.paymentLink : undefined, sellingPrice: op.sellingPrice, allPayments: customerPayments.map(cp => ({ milestone: cp.milestone, amount: cp.amount, paidAmount: cp.paidAmount, status: cp.status })) })} className="flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-[10px] font-bold"><Download size={10}/> Invoice</button><button onClick={() => saveItem("customer-payments", p._id, customerPayments[idx])} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold"><Check size={10}/> Save</button><button onClick={() => delItem("customer-payments", p._id)} className="text-red-400"><Trash2 size={14} /></button></div></div>
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
  );
}
