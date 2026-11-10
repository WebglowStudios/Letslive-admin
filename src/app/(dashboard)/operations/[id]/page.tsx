"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Truck, Home, Compass, CreditCard, FileText, TrendingUp, Plus, Trash2, Check, Save, Download, Copy, Link as LinkIcon, Bell, Wand2, X, User, Edit2, RefreshCw, List } from "lucide-react";
import Link from "next/link";
import { useRole } from "@/hooks/usePermission";
import { generateInvoicePdf } from "@/lib/generateInvoicePdf";

interface Transport {
  _id: string;
  type: string;
  title: string;
  vendorName: string;
  vendorContact: string;
  vendorEmail: string;
  vendorCost: number;
  paidAmount?: number;
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
interface Accommodation { _id: string; type: string; name: string; area: string; roomCategory: string; rooms: number; mealPlan: string; checkIn: string; checkOut: string; nights: number; confirmationNumber: string; tripDay: string; vendorName: string; vendorCost: number; paidAmount?: number; sellingPrice: number; paymentStatus: string; remarks: string; isGroupMaster?: boolean; groupId?: string; linkedBooking?: string; }
interface ActivityTransfer {
  _id?: string;
  title?: string;
  from: string;
  to: string;
  vehicleType?: string;
  duration?: string;
  departureTime?: string;
  arrivalTime?: string;
  driverName?: string;
  driverContact?: string;
  vehicleNumber?: string;
  notes?: string;
  hasPricing?: boolean;
  vendorName?: string;
  vendorContact?: string;
  vendorCost?: number;
  paidAmount?: number;
  sellingPrice?: number;
  paymentStatus?: string;
}

interface Activity {
  _id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  tripDay: string;
  vendorName: string;
  vendorContact?: string;
  vendorEmail?: string;
  vendorCost: number;
  paidAmount?: number;
  sellingPrice: number;
  paymentStatus: string;
  paymentDueDate?: string;
  remarks: string;
  isGroupMaster?: boolean;
  groupId?: string;
  linkedBooking?: string;
  transfers?: ActivityTransfer[];
}
interface CPayment { _id: string; milestone: string; category?: 'all' | 'flight' | 'hotel' | 'land' | 'visa' | 'insurance' | 'misc'; amount: number; paidAmount: number; dueDate: string; paidDate: string; status: string; financeStatus: string; paymentLinkEnabled: boolean; paymentLink: string; paymentMode: string; transactionId: string; remarks?: string; _isManual?: boolean; booking?: any; }
interface OpData { _id: string; operationId: string; departureId?: string; priceUnit?: string; customPricing?: { flightPrice?: number; hotelPrice?: number; landPrice?: number; visaPrice?: number; insurancePrice?: number; }; booking?: { _id: string; bookingId: string; brand?: string; paymentStatus: string; totalAmount?: number; paidAmount?: number; dateChangeHistory?: { oldDate: string; newDate: string; reason: string; changedAt: string }[]; package?: { _id: string; name: string; slug: string; price?: number; isCustom: boolean; description?: string; itinerary?: any[]; adultCount?: number; childCount?: number; priceUnit?: string; isInternational?: boolean; visaIncluded?: boolean; flightsIncluded?: boolean; trainsIncluded?: boolean; hideTrainInfo?: boolean; flightPrice?: number; landCost?: number; hotelPrice?: number; activityPrice?: number; transferPrice?: number; activityAndTransportPrice?: number; mergeHotelAndActivity?: boolean; flights?: any[]; }; travellers?: { adults?: number; children?: number; infants?: number }; travellersDetails?: any[]; primaryTraveller?: { firstName: string; lastName: string; email: string; phone: string; panCard: string; passportNumber?: string; passportExpiry?: string; issuingCountry?: string; dob?: string; gender?: string; age?: number } }; bookings?: any[]; package?: { _id: string; name: string; slug: string; price?: number; isCustom?: boolean; description?: string; itinerary?: any[]; adultCount?: number; childCount?: number; priceUnit?: string; isInternational?: boolean; visaIncluded?: boolean; flightsIncluded?: boolean; trainsIncluded?: boolean; hideTrainInfo?: boolean; flightPrice?: number; landCost?: number; hotelPrice?: number; activityPrice?: number; transferPrice?: number; activityAndTransportPrice?: number; mergeHotelAndActivity?: boolean; flights?: any[]; }; customer: { name: string; email: string; phone: string; pax: number; adults?: number; children?: number }; customers: { name: string; email: string; phone: string; pax: number; adults?: number; children?: number }[]; destination: string; travelDates: { start: string; end: string }; assignedTo?: { _id?: string; firstName: string; lastName: string }; salesperson?: { _id?: string; firstName: string; lastName: string }; sellingPrice: number; totalVendorCost: number; visaCost?: number; insuranceCost?: number; miscCharges?: { label: string; amount: number; isVendorCost: boolean }[]; miscTotal?: number; grossProfit: number; profitPercentage: number; incentiveAmount?: number; status: string; }

export const getWebsiteBaseUrl = (_brand?: string, _bookingId?: string, _operationId?: string) => {
  const envUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/$/, "");
  }
  return "https://letslivetours.com";
};

function Inp({ value, onChange, type = "text", placeholder = "" }: { value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full" />;
}
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full">{options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>;
}
type VendorItem = {
  _id: string;
  name: string;
  type: string;
  phone?: string;
  contactPhone?: string;
  mobile?: string;
  email?: string;
  contactEmail?: string;
  contactPerson?: string;
};

function VendorPick({
  value,
  onChange,
  vendors = [],
  filterType,
  placeholder = "e.g. Vendor Name",
  onSelectVendor,
}: {
  value: string;
  onChange: (v: string, matchedVendor?: VendorItem) => void;
  vendors: VendorItem[];
  filterType?: string;
  placeholder?: string;
  onSelectVendor?: (vendor: VendorItem) => void;
}) {
  const primary = filterType ? vendors.filter((v) => v.type === filterType || v.type === "mixed") : vendors;
  const secondary = filterType ? vendors.filter((v) => v.type !== filterType && v.type !== "mixed") : [];
  const isRegistered = vendors.some((v) => (v.name || "").trim().toLowerCase() === (value || "").trim().toLowerCase());
  const [isManual, setIsManual] = useState<boolean>(Boolean(value && !isRegistered));

  useEffect(() => {
    if (isRegistered) {
      setIsManual(false);
    }
  }, [value, isRegistered]);

  const datalistId = `vendor-dl-${filterType || "all"}`;

  if (isManual || vendors.length === 0) {
    return (
      <div className="relative flex items-center w-full">
        <input
          type="text"
          value={value || ""}
          list={datalistId}
          onChange={(e) => {
            const val = e.target.value;
            const matched = vendors.find(
              (v) => (v.name || "").trim().toLowerCase() === val.trim().toLowerCase()
            );
            onChange(val, matched);
            if (onSelectVendor && matched) onSelectVendor(matched);
          }}
          placeholder={placeholder}
          autoFocus={isManual && !value}
          className="px-2 py-1.5 border border-cyan-400 bg-cyan-50/20 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full pr-7"
        />
        <datalist id={datalistId}>
          {vendors.map((v) => (
            <option key={v._id} value={v.name}>
              {[v.type, v.phone || v.contactPhone].filter(Boolean).join(" • ")}
            </option>
          ))}
        </datalist>
        {vendors.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsManual(false);
              onChange("");
            }}
            className="absolute right-1 text-slate-400 hover:text-cyan-600 p-1 rounded hover:bg-slate-100 transition-colors"
            title="Choose from registered vendors list"
          >
            <List size={13} />
          </button>
        )}
      </div>
    );
  }

  return (
    <select
      value={isRegistered ? value : ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "__custom") {
          setIsManual(true);
          onChange("");
        } else {
          const matched = vendors.find(
            (v) => (v.name || "").trim().toLowerCase() === (val || "").trim().toLowerCase()
          );
          onChange(val, matched);
          if (onSelectVendor && matched) onSelectVendor(matched);
        }
      }}
      className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full bg-white text-slate-800"
    >
      <option value="">-- Select vendor --</option>
      {secondary.length > 0 ? (
        <>
          <optgroup label={`${filterType ? filterType.toUpperCase() : "RECOMMENDED"} VENDORS`}>
            {primary.map((v) => (
              <option key={v._id} value={v.name}>
                {v.name} {v.phone || v.contactPhone ? `(${v.phone || v.contactPhone})` : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label="OTHER REGISTERED VENDORS">
            {secondary.map((v) => (
              <option key={v._id} value={v.name}>
                {v.name} ({v.type}) {v.phone || v.contactPhone ? `(${v.phone || v.contactPhone})` : ""}
              </option>
            ))}
          </optgroup>
        </>
      ) : (
        primary.map((v) => (
          <option key={v._id} value={v.name}>
            {v.name} {v.phone || v.contactPhone ? `(${v.phone || v.contactPhone})` : ""}
          </option>
        ))
      )}
      <option value="__custom">+ Enter manually</option>
    </select>
  );
}

const ACCOMMODATION_TYPES = [
  { v: "hotel", l: "Hotel" }, { v: "resort", l: "Resort" }, { v: "villa", l: "Villa" }, { v: "hostel", l: "Hostel" },
  { v: "motel", l: "Motel" }, { v: "inn", l: "Inn" }, { v: "apartment", l: "Apartment" }, { v: "homestay", l: "Homestay" }, { v: "other", l: "Other" },
];
const TRANSPORT_TYPES = [
  { v: "flight", l: "Flight" },
  { v: "train", l: "Train" },
];
const PAY_OPTS = [{ v: "pending", l: "Pending" }, { v: "partial", l: "Partial" }, { v: "paid", l: "Paid" }];

function PartialPaymentFields({
  vendorCost,
  paidAmount,
  onChangePaidAmount,
}: {
  vendorCost: number;
  paidAmount?: number;
  onChangePaidAmount: (val: number) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [addVal, setAddVal] = useState<number | "">("");

  const cost = Number(vendorCost) || 0;
  const paid = paidAmount !== undefined && paidAmount !== null ? Number(paidAmount) : 0;
  const remaining = Math.max(0, cost - paid);
  const percentage = cost > 0 ? Math.round((remaining / cost) * 100) : 0;

  const handleApplyAdd = () => {
    const num = Number(addVal) || 0;
    if (num > 0) {
      onChangePaidAmount(paid + num);
      setAddVal("");
      setShowAdd(false);
    }
  };

  return (
    <div className="mt-2.5 p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
      <div>
        <label className="text-[9px] font-bold text-amber-900 uppercase block mb-1 flex items-center justify-between">
          <span>Total Amount (₹)</span>
          <span className="text-[8px] font-medium text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">Vendor Cost</span>
        </label>
        <div className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 shadow-sm flex items-center h-[30px]">
          <span>₹{cost.toLocaleString("en-IN")}</span>
        </div>
      </div>
      <div>
        <label className="text-[9px] font-bold text-amber-900 uppercase block mb-1 flex items-center justify-between">
          <span>Paid Amount (₹)</span>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="text-[9px] font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-1.5 py-0.5 rounded transition cursor-pointer"
          >
            {showAdd ? "Close" : "+ Add Payment"}
          </button>
        </label>
        <Inp
          type="number"
          value={paidAmount !== undefined && paidAmount !== null ? paidAmount : ""}
          onChange={(v) => onChangePaidAmount(Number(v))}
          placeholder="e.g. 10000"
        />
        {showAdd && (
          <div className="mt-1.5 p-1.5 bg-white border border-cyan-300 rounded-lg shadow-sm flex items-center gap-1.5 animate-in fade-in">
            <span className="text-[10px] font-bold text-emerald-700 pl-1">+₹</span>
            <input
              type="number"
              value={addVal}
              onChange={(e) => setAddVal(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 100000"
              className="w-full text-xs px-2 py-1 border border-slate-200 rounded outline-none focus:border-cyan-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={handleApplyAdd}
              disabled={!addVal || Number(addVal) <= 0}
              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold disabled:opacity-50 transition shrink-0"
            >
              Add
            </button>
          </div>
        )}
      </div>
      <div>
        <label className="text-[9px] font-bold text-amber-900 uppercase block mb-1 flex items-center justify-between">
          <span>Remaining Amount (₹)</span>
          <span className="text-[8px] font-medium text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">Auto-calc</span>
        </label>
        <div className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950 flex items-center justify-between shadow-sm h-[30px]">
          <span>₹{remaining.toLocaleString("en-IN")}</span>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
            {cost > 0 ? `${percentage}% due` : "0%"}
          </span>
        </div>
      </div>
    </div>
  );
}


export default function OperationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [op, setOp] = useState<OpData | null>(null);
  
  // Modals
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [editCustomerModalOpen, setEditCustomerModalOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<{
    bookingId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    panCard: string;
    passportNumber?: string;
    passportExpiry?: string;
    issuingCountry?: string;
    dob?: string;
    gender?: string;
    age?: string;
  } | null>(null);
  const [editPassengerModalOpen, setEditPassengerModalOpen] = useState(false);
  const [editPassengerData, setEditPassengerData] = useState<{
    bookingId: string;
    detailsIndex: number;
    name: string;
    type: string;
    gender: string;
    dob: string;
    age: string;
    email: string;
    phone: string;
    passportNumber: string;
    passportExpiry: string;
    issuingCountry: string;
    panCard: string;
  } | null>(null);
  const [savingPassenger, setSavingPassenger] = useState(false);
  
  const [transports, setTransports] = useState<Transport[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CPayment[]>([]);
  const [vendorList, setVendorList] = useState<VendorItem[]>([]);
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
  const [allStaffList, setAllStaffList] = useState<{ _id: string; firstName: string; lastName: string }[]>([]);
  const [deleteSplitModal, setDeleteSplitModal] = useState<{ paymentId: string; amount: number; milestone: string } | null>(null);
  const [allotModalOpen, setAllotModalOpen] = useState(false);
  const [allotting, setAllotting] = useState(false);
  const [allotAmounts, setAllotAmounts] = useState<{
    flight: number;
    land: number;
    hotel: number;
    visa: number;
    insurance: number;
    misc: number;
  }>({ flight: 0, land: 0, hotel: 0, visa: 0, insurance: 0, misc: 0 });
  const [forceMergeHotelLand, setForceMergeHotelLand] = useState<boolean | null>(null);
  const calculateAgeFromDob = (dobStr?: string): number | undefined => {
    if (!dobStr) return undefined;
    const birthDate = new Date(dobStr);
    if (isNaN(birthDate.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : undefined;
  };

  const [newPassenger, setNewPassenger] = useState({ name: "", age: "", dob: "", gender: "", type: "adult", passportNumber: "", passportExpiry: "", issuingCountry: "", panCard: "" });
  const [addPassengerMode, setAddPassengerMode] = useState<"existing" | "new">("existing");
  const [linkedBookingId, setLinkedBookingId] = useState("");
  const [newPassengerEmail, setNewPassengerEmail] = useState("");
  const [newPassengerPhone, setNewPassengerPhone] = useState("");
  const [billExtra, setBillExtra] = useState(false);
  const [extraAmount, setExtraAmount] = useState("");
  const [passengerFlightEnabled, setPassengerFlightEnabled] = useState(false);
  const [passengerFlightPrice, setPassengerFlightPrice] = useState("");
  const [passengerLandEnabled, setPassengerLandEnabled] = useState(false);
  const [passengerLandPrice, setPassengerLandPrice] = useState("");
  const [passengerVisaEnabled, setPassengerVisaEnabled] = useState(false);
  const [passengerVisaPrice, setPassengerVisaPrice] = useState("");
  const [addingPassenger, setAddingPassenger] = useState(false);
  const [syncingPricing, setSyncingPricing] = useState(false);
  const [editingPriceComp, setEditingPriceComp] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");

  const handleSyncPricing = async (payload: {
    priceUnit?: string;
    adults?: number;
    children?: number;
    pax?: number;
    component?: string;
    price?: number;
    customPricing?: any;
  }) => {
    setSyncingPricing(true);
    try {
      await api.post(`/operations/${id}/sync-pricing`, payload);
      setEditingPriceComp(null);
      setEditPriceValue("");
      fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update pricing");
    } finally {
      setSyncingPricing(false);
    }
  };
  
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
    // Fetch ops staff for Ops Person dropdown
    api.get("/users/staff?department=ops").then((res) => {
      const list = res?.data || res || [];
      setStaffList(Array.isArray(list) ? list : []);
    }).catch(() => {});
    // Fetch all staff for Salesperson dropdown
    api.get("/users/staff").then((res) => {
      const list = res?.data || res || [];
      setAllStaffList(Array.isArray(list) ? list : []);
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

  async function assignSalesperson(staffId: string) {
    if (!op) return;
    try {
      await api.put(`/operations/${op._id}`, { salesperson: staffId || null });
      fetchAll();
    } catch (err) {
      alert("Failed to assign salesperson");
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
      if (['accommodations', 'transports', 'activities'].includes(endpoint)) {
        try { await api.put(`/operations/${id}/recalculate`); } catch {}
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

  async function deleteSplitPayment(paymentId: string, restoreToParent: boolean) {
    try {
      await api.del(`/operations/${id}/customer-payments/${paymentId}?restoreToParent=${restoreToParent}`);
      setDeleteSplitModal(null);
      fetchAll();
    } catch {
      alert("Failed to delete installment.");
    }
  }
  async function updateStatus(s: string) { await api.put(`/operations/${id}`, { status: s }); fetchAll(); }
  async function recalculate() {
    try {
      await api.put(`/operations/${id}/recalculate`);
      await fetchAll();
      const existing = document.getElementById('save-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.id = 'save-toast';
      toast.className = 'fixed bottom-4 right-4 z-50 bg-cyan-600 text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-all duration-300';
      toast.innerHTML = `✓ Pricing, vendor costs & payments recalculated successfully!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to recalculate operation pricing.");
    }
  }

  function openEditCustomerModal(bookingId: string, currentPrimary: any, currentPassenger?: any) {
    const dobVal = (currentPrimary?.dob || currentPassenger?.dob)
      ? new Date(currentPrimary?.dob || currentPassenger?.dob).toISOString().split("T")[0]
      : "";
    const expiryVal = (currentPrimary?.passportExpiry || currentPassenger?.passportExpiry)
      ? new Date(currentPrimary?.passportExpiry || currentPassenger?.passportExpiry).toISOString().split("T")[0]
      : "";

    setEditCustomerData({
      bookingId,
      firstName: currentPrimary?.firstName || "",
      lastName: currentPrimary?.lastName || "",
      email: currentPrimary?.email || currentPassenger?.email || "",
      phone: currentPrimary?.phone || currentPassenger?.phone || "",
      panCard: currentPrimary?.panCard || currentPassenger?.panCard || "",
      passportNumber: currentPrimary?.passportNumber || currentPassenger?.passportNumber || "",
      passportExpiry: expiryVal,
      issuingCountry: currentPrimary?.issuingCountry || currentPassenger?.issuingCountry || "",
      dob: dobVal,
      gender: currentPrimary?.gender || currentPassenger?.gender || "",
      age: (currentPrimary?.age !== undefined && currentPrimary?.age !== null && currentPrimary?.age !== "")
        ? String(currentPrimary.age)
        : (currentPassenger?.age !== undefined && currentPassenger?.age !== null && currentPassenger?.age !== "")
          ? String(currentPassenger.age)
          : (dobVal ? String(calculateAgeFromDob(dobVal) || "") : ""),
    });
    setEditCustomerModalOpen(true);
  }

  async function saveCustomerDetails() {
    if (!editCustomerData) return;
    try {
      await api.put(`/bookings/${editCustomerData.bookingId}/primary-traveller`, editCustomerData);
      setEditCustomerModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update customer details");
    }
  }

  function openEditPassengerModal(bookingId: string, detailsIndex: number, currentPassenger: any) {
    const dobVal = currentPassenger.dob
      ? new Date(currentPassenger.dob).toISOString().split("T")[0]
      : "";
    const expiryVal = currentPassenger.passportExpiry
      ? new Date(currentPassenger.passportExpiry).toISOString().split("T")[0]
      : "";

    setEditPassengerData({
      bookingId,
      detailsIndex,
      name: currentPassenger.name || "",
      type: currentPassenger.type || "adult",
      gender: currentPassenger.gender || "",
      dob: dobVal,
      age: (currentPassenger.age !== undefined && currentPassenger.age !== null && currentPassenger.age !== "")
        ? String(currentPassenger.age)
        : (dobVal ? String(calculateAgeFromDob(dobVal) || "") : ""),
      email: currentPassenger.email || "",
      phone: currentPassenger.phone || "",
      passportNumber: currentPassenger.passportNumber || "",
      passportExpiry: expiryVal,
      issuingCountry: currentPassenger.issuingCountry || "",
      panCard: currentPassenger.panCard || "",
    });
    setEditPassengerModalOpen(true);
  }

  async function savePassengerDetails() {
    if (!editPassengerData || !editPassengerData.name?.trim()) {
      alert("Passenger name is required");
      return;
    }
    setSavingPassenger(true);
    try {
      const targetBooking =
        op?.bookings?.find((b: any) => b._id === editPassengerData.bookingId) || op?.booking;
      if (!targetBooking) {
        alert("Target booking not found");
        return;
      }
      const updatedTravellers = [...(targetBooking.travellersDetails || [])];
      const idx = editPassengerData.detailsIndex;
      if (idx < 0 || idx >= updatedTravellers.length) {
        alert("Passenger index not found");
        return;
      }

      const calculatedAge =
        editPassengerData.age !== "" && !isNaN(Number(editPassengerData.age))
          ? Number(editPassengerData.age)
          : calculateAgeFromDob(editPassengerData.dob);

      updatedTravellers[idx] = {
        ...updatedTravellers[idx],
        name: editPassengerData.name.trim(),
        type: editPassengerData.type || "adult",
        gender: editPassengerData.gender || undefined,
        dob: editPassengerData.dob ? new Date(editPassengerData.dob) : undefined,
        age: calculatedAge !== undefined ? calculatedAge : undefined,
        email: editPassengerData.email || undefined,
        phone: editPassengerData.phone || undefined,
        passportNumber: editPassengerData.passportNumber || undefined,
        passportExpiry: editPassengerData.passportExpiry ? new Date(editPassengerData.passportExpiry) : undefined,
        issuingCountry: editPassengerData.issuingCountry || undefined,
        panCard: editPassengerData.panCard || undefined,
      };

      await api.put(`/bookings/${targetBooking._id}/passengers`, {
        travellersDetails: updatedTravellers,
      });
      setEditPassengerModalOpen(false);
      setEditPassengerData(null);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update passenger details");
    } finally {
      setSavingPassenger(false);
    }
  }

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

      // If package has no itinerary or operation was manually created/customized,
      // fallback to activities — mapping each day independently as normal days!
      if ((!itinerary || itinerary.length === 0) && activities.length > 0) {
        itinerary = activities.map((a, i) => {
          const dayMatch = (a.tripDay || "").match(/\d+/);
          const dayNum = dayMatch ? parseInt(dayMatch[0], 10) : (i + 1);
          return {
            day: dayNum,
            title: a.title || `Day ${dayNum}`,
            description: a.description || "",
            meals: [],
          };
        }).sort((a, b) => a.day - b.day);
      }

      let pdfFlights: any[] = transports
        .filter(t => t.type === 'flight')
        .flatMap(t => t.legs.map(leg => ({
          airline: t.vendorName || t.title,
          date: leg.date,
          from: leg.from,
          to: leg.to,
          departure: leg.departureTime,
          arrival: leg.arrivalTime,
        })));

      let pdfTrains: any[] = transports
        .filter(t => t.type === 'train')
        .flatMap(t => t.legs.map(leg => ({
          airline: t.vendorName || t.title,
          date: leg.date,
          from: leg.from,
          to: leg.to,
          departure: leg.departureTime,
          arrival: leg.arrivalTime,
        })));

      // Fallback: If no flights/trains imported into transports yet, use package flights from custom itinerary
      if (pdfFlights.length === 0 && pdfTrains.length === 0) {
        const pkgFlights = (op?.package?.flights || op?.booking?.package?.flights || []);
        pkgFlights.filter((f: any) => f && (f.airline || f.from || f.to)).forEach((f: any) => {
          const entry = {
            airline: f.airline || (f.type === "train" ? "Railway" : "Flight"),
            date: f.day ? `Day ${f.day}` : undefined,
            from: f.from,
            to: f.to,
            departure: f.departure,
            arrival: f.arrival,
          };
          if (f.type === "train") {
            pdfTrains.push(entry);
          } else {
            pdfFlights.push(entry);
          }
        });
      }

      // Road-only transports (exclude flights and trains)
      const pdfTransports = transports.filter(t => t.type !== 'flight' && t.type !== 'train');

      // Multi-layer fallback for Lead Guest Name & Travellers
      const leadCust = (op?.customer?.name && op.customer.name.trim()) 
        ? op.customer 
        : (op?.customers && op.customers.length > 0 && op.customers[0]?.name ? op.customers[0] : null);

      const bkg = op?.booking || (op?.bookings && op.bookings[0]) || null;
      const bkgPrimary = bkg?.primaryTraveller;
      const primaryName = bkgPrimary?.firstName ? `${bkgPrimary.firstName} ${bkgPrimary.lastName || ""}`.trim() : "";
      const firstTravellerName = (bkg?.travellersDetails && bkg.travellersDetails[0]?.name) || "";

      const voucherCustomerName = leadCust?.name || primaryName || firstTravellerName || "Valued Guest";

      const bkgTravellers = bkg?.travellers;
      const bkgDetails = bkg?.travellersDetails || [];
      const adultsFromDetails = bkgDetails.filter((t: any) => t.type === 'adult').length;
      const childrenFromDetails = bkgDetails.filter((t: any) => t.type === 'child').length;

      const voucherAdults = leadCust?.adults 
        ?? bkgTravellers?.adults 
        ?? (adultsFromDetails > 0 ? adultsFromDetails : undefined) 
        ?? op?.package?.adultCount 
        ?? bkg?.package?.adultCount;

      const voucherChildren = leadCust?.children 
        ?? bkgTravellers?.children 
        ?? (childrenFromDetails > 0 ? childrenFromDetails : undefined) 
        ?? op?.package?.childCount 
        ?? bkg?.package?.childCount;

      const voucherPax = leadCust?.pax 
        ?? ((voucherAdults !== undefined || voucherChildren !== undefined) ? ((voucherAdults || 0) + (voucherChildren || 0)) : undefined)
        ?? (bkgTravellers ? (bkgTravellers.adults || 0) + (bkgTravellers.children || 0) : undefined)
        ?? (bkgDetails.length > 0 ? bkgDetails.length : undefined)
        ?? 1;

      await generateVoucherPdf({
        operationId: op?.operationId || "",
        destination: op?.destination || "",
        customerName: voucherCustomerName,
        pax: voucherPax,
        adults: voucherAdults,
        children: voucherChildren,
        paymentStatus: op?.booking?.paymentStatus || "pending",
        totalAmount: op?.booking?.totalAmount,
        paidAmount: op?.booking?.paidAmount,
        isInternational: op?.package?.isInternational !== undefined ? op?.package?.isInternational : op?.booking?.package?.isInternational,
        visaIncluded: op?.package?.visaIncluded !== undefined ? op?.package?.visaIncluded : op?.booking?.package?.visaIncluded,
        flightsIncluded: op?.package?.flightsIncluded !== undefined ? op?.package?.flightsIncluded : op?.booking?.package?.flightsIncluded,
        trainsIncluded: op?.package?.trainsIncluded !== undefined ? op?.package?.trainsIncluded : op?.booking?.package?.trainsIncluded,
        hideTrainInfo: op?.package?.hideTrainInfo !== undefined ? op?.package?.hideTrainInfo : op?.booking?.package?.hideTrainInfo,
        flights: pdfFlights,
        trains: pdfTrains,
        accommodations: accommodations,
        transports: pdfTransports,
        itinerary,
        activities: activities,
        transferSummary,
        packageSlug: op?.package?.slug || "",
        hasPolicies,
        dateChangeHistory: op?.booking?.dateChangeHistory,
        travellersDetails: bkgDetails,
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
      const baseUrl = getWebsiteBaseUrl(op?.booking?.brand, op?.booking?.bookingId, op?.operationId);
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

    const flightExtra = passengerFlightEnabled ? (Number(passengerFlightPrice) || 0) : 0;
    const landExtra = passengerLandEnabled ? (Number(passengerLandPrice) || 0) : 0;
    const visaExtra = passengerVisaEnabled ? (Number(passengerVisaPrice) || 0) : 0;
    const totalComponentExtra = flightExtra + landExtra + visaExtra;
    const finalExtraAmount = totalComponentExtra > 0 ? totalComponentExtra : (Number(extraAmount) || 0);

    if (billExtra && finalExtraAmount <= 0) {
      return alert("Please enter a valid extra amount or select components to charge for this passenger");
    }
    
    const isGroupTour = !!(op?.departureId || (op?.bookings && op.bookings.length > 1));
    const modeToUse = isGroupTour ? addPassengerMode : "existing";

    // Resolve target booking:
    // - Group tour: user must pick from dropdown (linkedBookingId)
    // - New ops (bookings array): use first booking in bookings[]
    // - Legacy ops (booking singular): use op.booking._id
    const targetBookingId = isGroupTour
      ? linkedBookingId
      : (
          (op?.bookings && op.bookings.length > 0 ? op.bookings[0]._id : null) ||
          (op?.booking && typeof op.booking === 'object' ? (op.booking as any)._id : op?.booking) ||
          null
        );

    if (modeToUse === "existing" && !targetBookingId) return alert("No booking linked to this operation. Cannot add passenger.");
    if (isGroupTour && modeToUse === "existing" && !linkedBookingId) return alert("Please select which booking group to add this passenger to.");
    if (modeToUse === "new" && !newPassengerEmail) return alert("Email is required for new bookings.");

    setAddingPassenger(true);
    try {
      await api.post(`/operations/${id}/passengers`, {
        mode: modeToUse,
        passengerData: {
          ...newPassenger,
          age: newPassenger.age ? Number(newPassenger.age) : undefined,
          dob: newPassenger.dob ? new Date(newPassenger.dob) : undefined,
        },
        bookingId: modeToUse === "existing" ? targetBookingId : undefined,
        email: modeToUse === "new" ? newPassengerEmail : undefined,
        phone: modeToUse === "new" ? newPassengerPhone : undefined,
        billExtra: billExtra || totalComponentExtra > 0,
        extraAmount: finalExtraAmount,
        flightPrice: flightExtra,
        landPrice: landExtra,
        visaPrice: visaExtra,
      });
      setPassengerModalOpen(false);
      setNewPassenger({ name: "", age: "", dob: "", gender: "", type: "adult", passportNumber: "", passportExpiry: "", issuingCountry: "", panCard: "" });
      setNewPassengerEmail("");
      setNewPassengerPhone("");
      setBillExtra(false);
      setExtraAmount("");
      setPassengerFlightEnabled(false);
      setPassengerFlightPrice("");
      setPassengerLandEnabled(false);
      setPassengerLandPrice("");
      setPassengerVisaEnabled(false);
      setPassengerVisaPrice("");
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
      await api.put(`/operations/${id}/recalculate`);
      fetchAll();
    } catch (err: any) {
      alert("Failed to remove passenger");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!op) return <div className="text-center py-20 text-sm text-slate-400">Operation not found</div>;

  // ── PAYMENT SEPARATION & COMPONENT BREAKDOWN ──
  const currentAdults = op.customers?.[0]?.adults ?? (op as any).customer?.adults ?? 1;
  const currentChildren = op.customers?.[0]?.children ?? (op as any).customer?.children ?? 0;
  const paxCount = op.customers && op.customers.length > 0 ? op.customers.reduce((sum: number, c: any) => sum + (c.pax || 0), 0) : (op.customer?.pax || (currentAdults + currentChildren));
  const pkgData = op.booking?.package || op.package || op.bookings?.[0]?.package;

  const priceUnit = (op.priceUnit || pkgData?.priceUnit || 'person').toLowerCase();
  const opSelling = op.sellingPrice || 0;

  let unitMultiplier = 1;
  if (priceUnit === 'couple') {
    // For couple packages, entered prices are already for a couple (2 pax)
    unitMultiplier = Math.max(1, Math.ceil(paxCount / 2));
  } else if (priceUnit === 'group' || priceUnit === 'family') {
    // Total price is for the entire booking/group
    unitMultiplier = 1;
  } else {
    // Per person
    unitMultiplier = Math.max(1, paxCount);
  }

  // Helper to safely extract paid amount (handles manual paid amount or marked as 'paid')
  const getPaidVal = (p: any) => (p.paidAmount !== undefined && p.paidAmount !== null && p.paidAmount > 0) ? p.paidAmount : (p.status === 'paid' ? (p.amount || 0) : 0);

  // Categorized payments filter helpers
  const isFlightPayment = (p: any) => p.category === 'flight' || ((!p.category || p.category === 'all') && (p.milestone || '').toLowerCase().includes('flight'));
  const isHotelPayment = (p: any) => p.category === 'hotel' || ((!p.category || p.category === 'all') && (p.milestone || '').toLowerCase().includes('hotel'));
  const isLandPayment = (p: any) => p.category === 'land' || ((!p.category || p.category === 'all') && (p.milestone || '').toLowerCase().includes('land'));
  const isVisaPayment = (p: any) => p.category === 'visa' || ((!p.category || p.category === 'all') && (p.milestone || '').toLowerCase().includes('visa'));
  const isInsurancePayment = (p: any) => p.category === 'insurance' || ((!p.category || p.category === 'all') && (p.milestone || '').toLowerCase().includes('insurance'));
  const isMiscPayment = (p: any) => p.category === 'misc' || ((!p.category || p.category === 'all') && (p.milestone || '').toLowerCase().includes('misc'));

  const flightPaid = customerPayments.filter(isFlightPayment).reduce((s, p) => s + getPaidVal(p), 0);
  const hotelPaid = customerPayments.filter(isHotelPayment).reduce((s, p) => s + getPaidVal(p), 0);
  const landPaid = customerPayments.filter(isLandPayment).reduce((s, p) => s + getPaidVal(p), 0);
  const visaPaid = customerPayments.filter(isVisaPayment).reduce((s, p) => s + getPaidVal(p), 0);
  const insurancePaid = customerPayments.filter(isInsurancePayment).reduce((s, p) => s + getPaidVal(p), 0);
  const miscPaid = customerPayments.filter(isMiscPayment).reduce((s, p) => s + getPaidVal(p), 0);
  const generalPaid = customerPayments.filter(p => !isFlightPayment(p) && !isHotelPayment(p) && !isLandPayment(p) && !isVisaPayment(p) && !isInsurancePayment(p) && !isMiscPayment(p)).reduce((s, p) => s + getPaidVal(p), 0);

  // 1. Flights Billed
  const flightSellingFromItems = transports.reduce((s, t) => s + (t.sellingPrice || 0), 0);
  const rawFlight = op.customPricing?.flightPrice !== undefined
    ? op.customPricing.flightPrice
    : (pkgData?.flightPrice || 0);
  const pkgFlightPrice = rawFlight * (priceUnit === 'group' ? 1 : unitMultiplier);
  const flightMilestoneAmount = customerPayments.filter(isFlightPayment).reduce((s, p) => s + (p.amount || 0), 0);
  const flightBilled = Math.max(flightSellingFromItems > 0 ? flightSellingFromItems : pkgFlightPrice, flightMilestoneAmount);

  // 2. Visa Billed
  const rawVisa = op.customPricing?.visaPrice !== undefined
    ? op.customPricing.visaPrice
    : (pkgData?.visaPrice || 0);
  const pkgVisaPrice = rawVisa * (priceUnit === 'group' ? 1 : unitMultiplier);
  const visaMilestoneAmount = customerPayments.filter(isVisaPayment).reduce((s, p) => s + (p.amount || 0), 0);
  let visaBilled = Math.max(
    pkgVisaPrice > 0 ? pkgVisaPrice : ((op.visaCost && op.visaCost > 0 && op.visaCost <= opSelling) ? op.visaCost : 0),
    visaMilestoneAmount
  );

  // 3. Insurance Billed
  const insuranceBilled = op.customPricing?.insurancePrice !== undefined
    ? op.customPricing.insurancePrice
    : (op.insuranceCost || 0);

  // 4. Misc Billed
  const miscBilled = op.miscTotal || (op.miscCharges || []).reduce((s, c) => s + (c.amount || 0), 0);

  // 5. Hotels & Land Billed
  const hotelSellingFromItems = accommodations.reduce((s, a) => s + (a.sellingPrice || 0), 0);
  const rawHotel = op.customPricing?.hotelPrice !== undefined
    ? op.customPricing.hotelPrice
    : (pkgData?.hotelPrice || 0);
  let hotelBilled = hotelSellingFromItems > 0 ? hotelSellingFromItems : (rawHotel * (priceUnit === 'group' ? 1 : unitMultiplier));

  const actSellingFromItems = activities.reduce((s, a) => {
    const base = a.sellingPrice || 0;
    const transferSelling = (a.transfers || []).reduce((ts: number, tr: any) => ts + (tr.hasPricing ? (tr.sellingPrice || 0) : 0), 0);
    return s + base + transferSelling;
  }, 0);
  const rawLand = op.customPricing?.landPrice !== undefined
    ? op.customPricing.landPrice
    : ((pkgData?.landCost || 0) + (pkgData?.activityAndTransportPrice || 0));
  let landBilled = actSellingFromItems > 0 ? actSellingFromItems : (rawLand * (priceUnit === 'group' ? 1 : unitMultiplier));

  // Fixed external costs (Flights, Visa, Insurance, Misc)
  const fixedExternal = flightBilled + visaBilled + insuranceBilled + miscBilled;
  const availableForHotelAndLand = Math.max(0, opSelling - fixedExternal);

  // Check if Hotel and Land Package are merged (combined into one line)
  const isMergedHotelLand = forceMergeHotelLand !== null 
    ? forceMergeHotelLand 
    : Boolean(
        pkgData?.mergeHotelAndActivity || 
        (hotelSellingFromItems === 0 && actSellingFromItems === 0 && (
          (hotelBilled > 0 && landBilled > 0 && (flightBilled + hotelBilled + landBilled + visaBilled + insuranceBilled + miscBilled > opSelling)) ||
          (rawLand > 0 && rawHotel > 0 && (rawFlight + rawHotel + rawLand > (opSelling / (priceUnit === 'group' ? 1 : unitMultiplier)))) ||
          (rawHotel > 0 && rawLand === 0 && hotelBilled === availableForHotelAndLand)
        ))
      );

  const combinedLandHotelBilled = (hotelSellingFromItems > 0 || actSellingFromItems > 0)
    ? (hotelSellingFromItems + actSellingFromItems)
    : availableForHotelAndLand;
  const combinedLandHotelPaid = hotelPaid + landPaid;

  // Reconcile separate hotel & land against availableForHotelAndLand
  if (!isMergedHotelLand && hotelSellingFromItems === 0 && actSellingFromItems === 0 && opSelling > 0) {
    if (hotelBilled + landBilled > availableForHotelAndLand) {
      if (landBilled === 0 && hotelBilled > 0) {
        hotelBilled = availableForHotelAndLand;
      } else if (hotelBilled === 0 && landBilled > 0) {
        landBilled = availableForHotelAndLand;
      } else if (hotelBilled > 0 && landBilled > 0) {
        if (hotelBilled <= availableForHotelAndLand) {
          landBilled = availableForHotelAndLand - hotelBilled;
        } else {
          hotelBilled = availableForHotelAndLand;
          landBilled = 0;
        }
      }
    } else if (landBilled === 0 && hotelBilled === 0 && availableForHotelAndLand > 0) {
      landBilled = availableForHotelAndLand;
    } else if (hotelBilled > 0 && landBilled === 0) {
      landBilled = Math.max(0, availableForHotelAndLand - hotelBilled);
    }
  }

  // Smart Virtual Pool distribution across components (Priority: Flight -> Visa -> Insurance -> Hotel/Land -> Misc)
  let remainingPoolCalc = generalPaid;
  const flightPoolCovered = Math.min(remainingPoolCalc, Math.max(0, flightBilled - flightPaid));
  remainingPoolCalc = Math.max(0, remainingPoolCalc - flightPoolCovered);

  const visaPoolCovered = Math.min(remainingPoolCalc, Math.max(0, visaBilled - visaPaid));
  remainingPoolCalc = Math.max(0, remainingPoolCalc - visaPoolCovered);

  const insPoolCovered = Math.min(remainingPoolCalc, Math.max(0, insuranceBilled - insurancePaid));
  remainingPoolCalc = Math.max(0, remainingPoolCalc - insPoolCovered);

  let hotelPoolCovered = 0;
  let landPoolCovered = 0;
  let combinedLandHotelPoolCovered = 0;

  if (isMergedHotelLand) {
    combinedLandHotelPoolCovered = Math.min(remainingPoolCalc, Math.max(0, combinedLandHotelBilled - combinedLandHotelPaid));
    remainingPoolCalc = Math.max(0, remainingPoolCalc - combinedLandHotelPoolCovered);
  } else {
    hotelPoolCovered = Math.min(remainingPoolCalc, Math.max(0, hotelBilled - hotelPaid));
    remainingPoolCalc = Math.max(0, remainingPoolCalc - hotelPoolCovered);

    landPoolCovered = Math.min(remainingPoolCalc, Math.max(0, landBilled - landPaid));
    remainingPoolCalc = Math.max(0, remainingPoolCalc - landPoolCovered);
  }

  const miscPoolCovered = Math.min(remainingPoolCalc, Math.max(0, miscBilled - miscPaid));
  remainingPoolCalc = Math.max(0, remainingPoolCalc - miscPoolCovered);

  const netFlightPending = Math.max(0, flightBilled - flightPaid - flightPoolCovered);
  const netHotelPending = Math.max(0, hotelBilled - hotelPaid - hotelPoolCovered);
  const netLandPending = Math.max(0, landBilled - landPaid - landPoolCovered);
  const netCombinedLandHotelPending = Math.max(0, combinedLandHotelBilled - combinedLandHotelPaid - combinedLandHotelPoolCovered);
  const netVisaPending = Math.max(0, visaBilled - visaPaid - visaPoolCovered);
  const netInsPending = Math.max(0, insuranceBilled - insurancePaid - insPoolCovered);
  const netMiscPending = Math.max(0, miscBilled - miscPaid - miscPoolCovered);

  const openAllotModal = () => {
    let pool = generalPaid;
    const f = Math.min(pool, Math.max(0, flightBilled - flightPaid));
    pool = Math.max(0, pool - f);

    const v = Math.min(pool, Math.max(0, visaBilled - visaPaid));
    pool = Math.max(0, pool - v);

    const ins = Math.min(pool, Math.max(0, insuranceBilled - insurancePaid));
    pool = Math.max(0, pool - ins);

    let h = 0;
    let l = 0;
    if (isMergedHotelLand) {
      l = Math.min(pool, Math.max(0, combinedLandHotelBilled - combinedLandHotelPaid));
      pool = Math.max(0, pool - l);
    } else {
      h = Math.min(pool, Math.max(0, hotelBilled - hotelPaid));
      pool = Math.max(0, pool - h);

      l = Math.min(pool, Math.max(0, landBilled - landPaid));
      pool = Math.max(0, pool - l);
    }

    const m = Math.min(pool, Math.max(0, miscBilled - miscPaid));
    pool = Math.max(0, pool - m);

    setAllotAmounts({ flight: f, land: l, hotel: h, visa: v, insurance: ins, misc: m });
    setAllotModalOpen(true);
  };

  const handleDirectAutoAllot = async () => {
    let pool = generalPaid;
    const f = Math.min(pool, Math.max(0, flightBilled - flightPaid));
    pool = Math.max(0, pool - f);

    const v = Math.min(pool, Math.max(0, visaBilled - visaPaid));
    pool = Math.max(0, pool - v);

    const ins = Math.min(pool, Math.max(0, insuranceBilled - insurancePaid));
    pool = Math.max(0, pool - ins);

    let h = 0;
    let l = 0;
    if (isMergedHotelLand) {
      l = Math.min(pool, Math.max(0, combinedLandHotelBilled - combinedLandHotelPaid));
      pool = Math.max(0, pool - l);
    } else {
      h = Math.min(pool, Math.max(0, hotelBilled - hotelPaid));
      pool = Math.max(0, pool - h);

      l = Math.min(pool, Math.max(0, landBilled - landPaid));
      pool = Math.max(0, pool - l);
    }

    const m = Math.min(pool, Math.max(0, miscBilled - miscPaid));

    const allocations = [
      { category: 'flight', amount: f, milestone: 'Flights & Trains Payment (Advance Allotment)' },
      { category: 'visa', amount: v, milestone: 'Visa Fees Payment (Advance Allotment)' },
      { category: 'insurance', amount: ins, milestone: 'Insurance Payment (Advance Allotment)' },
      ...(isMergedHotelLand ? [{ category: 'land', amount: l, milestone: 'Land & Stay (Advance Allotment)' }] : [
        { category: 'hotel', amount: h, milestone: 'Hotel Stay (Advance Allotment)' },
        { category: 'land', amount: l, milestone: 'Land Package (Advance Allotment)' },
      ]),
      { category: 'misc', amount: m, milestone: 'Misc Charges (Advance Allotment)' },
    ].filter(a => a.amount > 0);

    if (allocations.length === 0) {
      alert("All service components are already covered.");
      return;
    }

    setAllotting(true);
    try {
      await api.post(`/operations/${id}/customer-payments/allot`, { allocations });
      fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to allot advances");
    } finally {
      setAllotting(false);
    }
  };

  const handleConfirmAllot = async () => {
    setAllotting(true);
    try {
      const allocations = [
        { category: 'flight', amount: allotAmounts.flight, milestone: 'Flights & Trains (Allotted from Advance)' },
        { category: 'land', amount: allotAmounts.land, milestone: 'Land Package & Activities (Allotted from Advance)' },
        { category: 'hotel', amount: allotAmounts.hotel, milestone: 'Hotel Stay (Allotted from Advance)' },
        { category: 'visa', amount: allotAmounts.visa, milestone: 'Visa Fees (Allotted from Advance)' },
        { category: 'insurance', amount: allotAmounts.insurance, milestone: 'Travel Insurance (Allotted from Advance)' },
        { category: 'misc', amount: allotAmounts.misc, milestone: 'Misc Charges (Allotted from Advance)' },
      ].filter(a => a.amount > 0);

      if (allocations.length === 0) {
        alert("Please allocate an amount greater than 0 to at least one component.");
        setAllotting(false);
        return;
      }

      await api.post(`/operations/${id}/customer-payments/allot`, { allocations });
      setAllotModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to allot advances");
    } finally {
      setAllotting(false);
    }
  };

  const handleResetToPool = async () => {
    if (!confirm("Are you sure you want to merge all categorized payments back into the general advance pool?")) return;
    setAllotting(true);
    try {
      await api.post(`/operations/${id}/customer-payments/allot`, { resetToPool: true });
      setAllotModalOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reset payments to pool");
    } finally {
      setAllotting(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <FileText size={14} /> },
    { id: "transport", label: `Flights & Trains (${transports.length})`, icon: <Truck size={14} /> },
    { id: "accommodation", label: `Stay (${accommodations.length})`, icon: <Home size={14} /> },
    { id: "activities", label: `Itinerary Days (${activities.length})`, icon: <Compass size={14} /> },
    { id: "payments", label: `Payments (${customerPayments.length})`, icon: <CreditCard size={14} /> },
    { id: "pnl", label: "P&L", icon: <TrendingUp size={14} /> },
  ];

  const hasCustomers = op.customers && op.customers.length > 0;
  const displayCustomerName = op.customers && op.customers.length > 1 ? `Group Tour (${op.customers.length} bookings)` : (op.customers?.[0]?.name || op.customer?.name || "Unknown");
  const displayCustomerEmail = op.customers?.[0]?.email || op.customer?.email || "";
  const displayCustomerPhone = op.customers?.[0]?.phone || op.customer?.phone || "";
  const displayPax = hasCustomers ? op.customers.reduce((sum: number, c: any) => sum + (c.pax || 0), 0) : (op.customer?.pax || 0);

  return (
    <>
      <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/operations" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-lg font-bold text-slate-800">{op.operationId}</h1><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${op.status === "completed" ? "bg-emerald-100 text-emerald-700" : op.status === "planning" ? "bg-blue-100 text-blue-700" : op.status === "vendor-confirmed" ? "bg-teal-100 text-teal-700" : op.status === "booked" ? "bg-cyan-100 text-cyan-700" : op.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{op.status.replace("-", " ")}</span></div>
          <p className="text-xs text-slate-400">{displayCustomerName} | {op.destination} | {displayPax} pax</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadVoucher} disabled={downloadingVoucher} className="flex items-center gap-2 text-xs border border-cyan-200 text-cyan-700 hover:bg-cyan-50 px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            <Download size={14} />
            {downloadingVoucher ? "Generating..." : "Download Voucher"}
          </button>
          


          <select value={op.status} onChange={(e) => updateStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"><option value="planning">Planning</option><option value="booked">Booked</option><option value="vendor-confirmed">Vendor Confirmed</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{t.icon}{t.label}</button>))}
      </div>

    {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 relative group">
              {(op.booking || (op.bookings && op.bookings.length > 0)) && (() => {
                const singleB = op.bookings && op.bookings.length > 0 ? op.bookings[0] : op.booking as any;
                if (!singleB || (op.bookings && op.bookings.length > 1)) return null;
                const prefill = (singleB as any).primaryTraveller || {
                  firstName: op.customer?.name?.split(' ')[0] || op.customers?.[0]?.name?.split(' ')[0] || '',
                  lastName: op.customer?.name?.split(' ').slice(1).join(' ') || op.customers?.[0]?.name?.split(' ').slice(1).join(' ') || '',
                  email: op.customer?.email || op.customers?.[0]?.email || '',
                  phone: op.customer?.phone || op.customers?.[0]?.phone || '',
                  panCard: '',
                };
                return (
                  <button onClick={() => openEditCustomerModal(singleB._id, prefill)} className="absolute top-4 right-4 text-slate-400 hover:text-cyan-600 transition-colors bg-white p-1 rounded border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100" title="Edit Customer Details">
                    <Edit2 size={12} />
                  </button>
                );
              })()}
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Customer</p>
              <p className="text-sm font-semibold text-slate-800">{displayCustomerName}</p>
              <p className="text-xs text-slate-500">{displayCustomerEmail} | {displayCustomerPhone}</p>
              <p className="text-xs text-slate-400 mt-1">{displayPax} pax</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Trip</p>
              <p className="text-sm font-semibold text-slate-800">{op.destination}</p>
              <p className="text-xs text-slate-500">{op.travelDates?.start ? formatDate(op.travelDates.start) : "—"} → {op.travelDates?.end ? formatDate(op.travelDates.end) : "—"}</p>
              {(() => {
                const websiteBaseUrl = getWebsiteBaseUrl(op.booking?.brand, op.booking?.bookingId, op.operationId);
                const pkg = op.booking?.package || op.package;
                if (!op.booking && !pkg) return null;

                return (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    {op.booking && (
                      <p className="text-xs text-slate-500">
                        Booking: <Link href={`/bookings/${op.booking._id}`} className="font-semibold text-slate-700 hover:text-cyan-600">{op.booking.bookingId}</Link>
                      </p>
                    )}
                    {pkg && (
                      pkg.isCustom ? (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]" title={pkg.name}>Itinerary: {pkg.name}</p>
                          <a
                            href={`${websiteBaseUrl}/itinerary/${pkg._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-emerald-600 hover:underline bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 font-medium"
                          >
                            Visit
                          </a>
                          <Link
                            href={`/itineraries/${pkg._id}/edit`}
                            className="text-[10px] text-blue-600 hover:underline bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1 font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-medium text-slate-700 truncate max-w-[200px]" title={pkg.name}>Package: {pkg.name}</p>
                          <a
                            href={`${websiteBaseUrl}/packages/${pkg.slug || pkg._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-emerald-600 hover:underline bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 font-medium"
                          >
                            Visit
                          </a>
                          <Link
                            href={`/packages/${pkg._id}/edit`}
                            className="text-[10px] text-blue-600 hover:underline bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1 font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                );
              })()}
            </div>
            
            {/* Assignment Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <User size={12} /> Assignment
              </p>

              {/* Salesperson */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <span>💼</span> Salesperson
                </p>
                {isManager && allStaffList.length > 0 ? (
                  <select
                    value={(op.salesperson as any)?._id || ""}
                    onChange={(e) => assignSalesperson(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Unassigned</option>
                    {allStaffList.map((s) => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-slate-700 font-medium">
                    {(op.salesperson as any)
                      ? `${(op.salesperson as any).firstName} ${(op.salesperson as any).lastName}`
                      : <span className="text-slate-400 italic font-medium bg-slate-100 px-2 py-0.5 rounded-full text-xs">Unassigned</span>
                    }
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-3" />

              {/* Ops Person */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                  <span>🔧</span> Ops Person
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
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Financials</p>
                <div className="flex justify-between mb-3">
                  <div><p className="text-xs text-slate-500">Total Billed</p><p className="text-lg font-bold text-slate-800">{formatCurrency((op as any).effectiveSelling ?? op.sellingPrice)}</p></div>
                  <div className="text-right"><p className="text-xs text-slate-500">Profit</p><p className={`text-lg font-bold ${op.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(op.grossProfit)}</p></div>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-2">
                  <div><p className="text-slate-400">Received</p><p className="font-bold text-emerald-600">{formatCurrency((op as any).totalReceived ?? 0)}</p></div>
                  <div className="text-right"><p className="text-slate-400">Pending</p><p className="font-bold text-amber-600">{formatCurrency((op as any).pendingPayment ?? 0)}</p></div>
                </div>
                {/* PAYMENT SEPARATION MINI BREAKDOWN */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Separation</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium"><span>✈️</span> Flight Charge</p>
                      <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(flightBilled)}</p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${flightPaid >= flightBilled && flightBilled > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                        Paid: {formatCurrency(flightPaid)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium"><span>🏨</span> Hotel Charge</p>
                      <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(hotelBilled)}</p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${hotelPaid >= hotelBilled && hotelBilled > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                        Paid: {formatCurrency(hotelPaid)}
                      </p>
                    </div>
                  </div>
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
                      const totalAdults = hasCustomers
                        ? op.customers.reduce((sum: number, c: any) => sum + (c.adults || c.pax || 1), 0)
                        : (op.customer?.adults || op.customer?.pax || op.booking?.package?.adultCount || 1);
                      const totalChildren = hasCustomers
                        ? op.customers.reduce((sum: number, c: any) => sum + (c.children || 0), 0)
                        : (op.customer?.children || op.booking?.package?.childCount || 0);
                      
                      return `Total Pax: ${totalAdults} Adult(s)${totalChildren > 0 ? `, ${totalChildren} Child(ren)` : ''}`;
                    })()}
                  </p>
                </div>
                <button onClick={() => {
                  const defaultFlight = priceUnit === 'person' && paxCount > 0 ? Math.round(flightBilled / paxCount) : (rawFlight || 0);
                  const defaultLand = priceUnit === 'person' && paxCount > 0 ? Math.round(landBilled / paxCount) : (rawLand || 0);
                  const defaultVisa = priceUnit === 'person' && paxCount > 0 && visaBilled > 0 ? Math.round(visaBilled / paxCount) : (rawVisa || 0);
                  setPassengerFlightEnabled(defaultFlight > 0);
                  setPassengerFlightPrice(defaultFlight > 0 ? String(defaultFlight) : "");
                  setPassengerLandEnabled(defaultLand > 0);
                  setPassengerLandPrice(defaultLand > 0 ? String(defaultLand) : "");
                  setPassengerVisaEnabled(defaultVisa > 0);
                  setPassengerVisaPrice(defaultVisa > 0 ? String(defaultVisa) : "");
                  setBillExtra(defaultFlight > 0 || defaultLand > 0 || defaultVisa > 0);
                  setExtraAmount("");
                  setPassengerModalOpen(true);
                }} className="px-3 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                  <Plus size={14} /> Add Passenger
                </button>
              </div>
              
              {(() => {
                // Shared passenger card renderer
                const PassengerCard = ({ t, onRemove, onEdit }: { t: any; onRemove?: () => void, onEdit?: () => void }) => (
                  <div className="p-3 border border-slate-100 bg-white shadow-sm rounded-lg relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                      {onEdit && (
                        <button onClick={onEdit} className="text-slate-400 hover:text-cyan-600 p-1 rounded hover:bg-slate-100 transition" title="Edit Passenger Details">
                          <Edit2 size={12} />
                        </button>
                      )}
                      {onRemove && (
                        <button onClick={onRemove} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.type === 'child' ? 'bg-emerald-100 text-emerald-700' : t.type === 'infant' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {t.type || 'Adult'}
                      </span>
                      {t.gender && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {t.gender}
                        </span>
                      )}
                      <p
                        onClick={onEdit}
                        className={`text-sm font-bold text-slate-800 ${onEdit ? "cursor-pointer hover:text-cyan-700 transition" : ""}`}
                        title={onEdit ? "Click to edit passenger" : undefined}
                      >
                        {t.name}
                      </p>
                      {t._isPrimary && <span className="text-[9px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded-full uppercase">Lead</span>}
                    </div>
                    {/* Both DOB and Age clearly displayed together */}
                    {(() => {
                      const displayAge = (t.age !== undefined && t.age !== null && t.age !== '') ? t.age : calculateAgeFromDob(t.dob);
                      if (!t.dob && (displayAge === undefined || displayAge === null || displayAge === '')) return null;
                      return (
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          {t.dob && (
                            <span className="text-[10.5px] text-slate-600 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                              DOB: {formatDate(t.dob)}
                            </span>
                          )}
                          {displayAge !== undefined && displayAge !== null && displayAge !== '' && (
                            <span className="text-[10.5px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              Age: {displayAge} yrs
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {(t.email || t.phone) && <p className="text-[10px] text-slate-400 mt-0.5">{[t.email, t.phone].filter(Boolean).join(' · ')}</p>}
                    {(t.passportNumber || t.issuingCountry) && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-[10px] text-slate-500">Passport: <span className="text-slate-700 font-medium">{t.passportNumber || '—'}</span></p>
                        <div className="flex gap-3 mt-0.5">
                          <p className="text-[10px] text-slate-500">Exp: {t.passportExpiry ? formatDate(t.passportExpiry) : '—'}</p>
                          <p className="text-[10px] text-slate-500">Country: {t.issuingCountry || '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );

                // Build passenger list for a single booking object
                const buildPassengerList = (b: any) => {
                  const primary = b.primaryTraveller;
                  const details: any[] = b.travellersDetails || [];
                  const list: any[] = [];
                  // Always include primaryTraveller as the lead card
                  if (primary?.firstName) {
                    const matchedDetail = details.find(d => d.name?.toLowerCase() === `${primary.firstName} ${primary.lastName || ''}`.trim().toLowerCase());
                    list.push({
                      name: `${primary.firstName} ${primary.lastName || ''}`.trim(),
                      email: primary.email,
                      phone: primary.phone,
                      type: 'adult',
                      gender: (primary as any).gender || matchedDetail?.gender,
                      dob: (primary as any).dob || matchedDetail?.dob,
                      age: (primary as any).age !== undefined ? (primary as any).age : matchedDetail?.age,
                      passportNumber: (primary as any).passportNumber || matchedDetail?.passportNumber,
                      passportExpiry: (primary as any).passportExpiry || matchedDetail?.passportExpiry,
                      issuingCountry: (primary as any).issuingCountry || matchedDetail?.issuingCountry,
                      panCard: primary.panCard || matchedDetail?.panCard,
                      _isPrimary: true,
                    });
                  }
                  // Add travellersDetails, skipping if name matches primary (dedup)
                  details.forEach((d, dIdx) => {
                    const isDuplicate = primary?.firstName && d.name?.toLowerCase() === `${primary.firstName} ${primary.lastName || ''}`.trim().toLowerCase();
                    if (!isDuplicate) list.push({ ...d, _detailsIndex: dIdx });
                  });
                  return { list, details };
                };

                // GROUP TOUR: 2+ bookings — one section per booking/family
                if (op.bookings && op.bookings.length > 1) {
                  return (
                    <div className="space-y-4">
                      {op.bookings.map((b: any, bIdx: number) => {
                        const { list, details } = buildPassengerList(b);
                        const primaryName = b.primaryTraveller?.firstName
                          ? `${b.primaryTraveller.firstName} ${b.primaryTraveller.lastName || ''}`.trim()
                          : (op.customers?.[bIdx]?.name || `Customer ${bIdx + 1}`);
                        return (
                          <div key={b._id} className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-indigo-50/60 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-900">{primaryName}</span>
                                <span className="text-[10px] text-slate-400 font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded">{b.bookingId || b._id}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">{list.length} Pax</span>
                            </div>
                            <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {list.length === 0 && <p className="text-xs text-slate-400 p-2 col-span-2">No passenger details on this booking yet.</p>}
                              {list.map((t: any, idx: number) => {
                                const detailsIdx = t._detailsIndex !== undefined ? t._detailsIndex : (idx - (b.primaryTraveller?.firstName ? 1 : 0));
                                return (
                                  <PassengerCard
                                    key={idx}
                                    t={t}
                                    onEdit={
                                      t._isPrimary
                                        ? () => openEditCustomerModal(b._id, b.primaryTraveller, t)
                                        : () => openEditPassengerModal(b._id, detailsIdx, t)
                                    }
                                    onRemove={
                                      t._isPrimary
                                        ? undefined
                                        : () => handleRemovePassenger(b._id, detailsIdx)
                                    }
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // PRIVATE TOUR: single booking
                const singleBooking = (op.bookings && op.bookings.length === 1 ? op.bookings[0] : op.booking) as any;
                if (singleBooking) {
                  const { list } = buildPassengerList(singleBooking);
                  
                  // Fallback: if booking has no primaryTraveller, use op.customer snapshot
                  const fallbackList = list.length === 0 && op.customer?.name ? [{
                    name: op.customer.name,
                    email: op.customer.email,
                    phone: op.customer.phone,
                    type: 'adult',
                    _isPrimary: true,
                  }] : list;

                  if (fallbackList.length === 0) {
                    return (
                      <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">No passenger details added yet.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {fallbackList.map((t: any, idx: number) => {
                        const detailsIdx = t._detailsIndex !== undefined ? t._detailsIndex : (idx - (singleBooking.primaryTraveller?.firstName ? 1 : 0));
                        return (
                          <PassengerCard
                            key={idx}
                            t={t}
                            onEdit={
                              t._isPrimary
                                ? () => openEditCustomerModal(singleBooking._id, singleBooking.primaryTraveller || { firstName: op.customer?.name?.split(' ')?.[0] || '', lastName: op.customer?.name?.split(' ').slice(1).join(' ') || '', email: op.customer?.email || '', phone: op.customer?.phone || '', panCard: '' }, t)
                                : () => openEditPassengerModal(singleBooking._id, detailsIdx, t)
                            }
                            onRemove={
                              t._isPrimary
                                ? undefined
                                : () => handleRemovePassenger(singleBooking._id, detailsIdx)
                            }
                          />
                        );
                      })}
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
                        <p className="text-[10px] text-slate-500 mt-1.5 font-medium bg-slate-50 px-2 py-1 rounded inline-block">
                          Activities: {day.activities.map((a: any) => typeof a === 'string' ? a : (a.title || a.name || '')).filter(Boolean).join(', ')}
                        </p>
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
          {/* FLIGHT PAYMENT STATUS BANNER */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            flightBilled === 0
              ? "bg-slate-50 border-slate-200"
              : flightPaid >= flightBilled
              ? "bg-emerald-50 border-emerald-200"
              : flightPaid > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✈️</span>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Flight Charges & Payment Status (Customer)
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Customer Flight Charge: <strong className="text-slate-900 font-semibold">{formatCurrency(flightBilled)}</strong>
                  {" · "}
                  Customer Paid: <strong className={flightPaid >= flightBilled && flightBilled > 0 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>{formatCurrency(flightPaid)}</strong>
                  {" · "}
                  Pending: <strong className={flightBilled - flightPaid > 0 ? "text-red-700 font-bold" : "text-slate-700 font-medium"}>{formatCurrency(Math.max(0, flightBilled - flightPaid))}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const val = prompt("Update Quoted Flight Price (₹):", String(flightBilled));
                  if (val !== null && val.trim() !== "" && !isNaN(Number(val))) {
                    handleSyncPricing({ component: "flight", price: Number(val) });
                  }
                }}
                className="px-2.5 py-1 bg-white border border-sky-300 hover:bg-sky-50 text-sky-800 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                title="Edit Quoted Flight Price"
              >
                <Edit2 size={12} />
                <span>✏️ Quoted Flight: {formatCurrency(flightBilled)}</span>
              </button>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                flightBilled === 0
                  ? "bg-slate-200 text-slate-700"
                  : flightPaid >= flightBilled
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : flightPaid > 0
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}>
                {flightBilled === 0
                  ? "No Flight Charge"
                  : flightPaid >= flightBilled
                  ? "✓ Flight Fully Paid (Ready to Ticket)"
                  : flightPaid > 0
                  ? "⚠️ Partially Paid"
                  : "⚠️ Flight Payment Pending — Do Not Ticket Yet"}
              </span>
            </div>
          </div>

          <datalist id="vehicle-type-opts">
            <option value="Car" /><option value="SUV" /><option value="Innova" />
            <option value="Tempo Traveller" /><option value="Bus" /><option value="Mini Bus" />
            <option value="Van" /><option value="Auto Rickshaw" /><option value="Ferry" />
            <option value="Speed Boat" /><option value="Flight" /><option value="Train" />
            <option value="Buggy" /><option value="Bike" /><option value="Other" />
          </datalist>

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-slate-700">{transports.length} Flight & Train Service(s)</p>
            <div className="flex gap-2">
              {op.package && transports.length > 0 && <button onClick={importFromItinerary} disabled={importing} className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"><Wand2 size={14} /> {importing ? "..." : "Re-import"}</button>}
              <button onClick={async () => { await api.post(`/operations/${id}/transports`, { type: "flight", title: "", vendorName: "", vendorContact: "", vendorEmail: "", vendorCost: 0, sellingPrice: 0, paymentStatus: "pending", remarks: "", legs: [{ from: "", to: "", date: "", tripDay: "", vehicleType: "Flight", notes: "" }] }); fetchAll(); }} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Flight / Train</button>
            </div>
          </div>

          {op.package && transports.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Wand2 size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Import from Itinerary</p>
                  <p className="text-xs text-blue-700 mt-0.5">This operation is linked to a package. Click to auto-fill flights and trains from the itinerary.</p>
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
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transfer Title</p>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">
                            Title
                            <span className="ml-1 text-[8px] text-blue-500 normal-case font-normal">(auto-filled from itinerary — do not change)</span>
                          </label>
                          <Inp value={t.title || ""} onChange={(v) => { const u = [...transports]; u[idx] = { ...u[idx], title: v }; setTransports(u); }} placeholder="e.g. Airport Transfer — Day 1" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Operator</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Company / Operator Name</label>
                          <VendorPick
                            value={t.vendorName || ""}
                            onChange={(val, matched) => {
                              setTransports((prev) => {
                                const u = [...prev];
                                if (!u[idx]) return prev;
                                const vContact = matched ? (matched.phone || matched.contactPhone || matched.mobile || "") : u[idx].vendorContact;
                                const vEmail = matched ? (matched.email || matched.contactEmail || "") : u[idx].vendorEmail;
                                u[idx] = {
                                  ...u[idx],
                                  vendorName: val,
                                  vendorContact: vContact !== undefined ? vContact : (u[idx].vendorContact || ""),
                                  vendorEmail: vEmail !== undefined ? vEmail : (u[idx].vendorEmail || ""),
                                };
                                return u;
                              });
                            }}
                            onSelectVendor={(v) => {
                              setTransports((prev) => {
                                const u = [...prev];
                                if (!u[idx]) return prev;
                                u[idx] = {
                                  ...u[idx],
                                  vendorName: v.name,
                                  vendorContact: v.phone || v.contactPhone || v.mobile || u[idx].vendorContact || "",
                                  vendorEmail: v.email || v.contactEmail || u[idx].vendorEmail || "",
                                };
                                return u;
                              });
                            }}
                            vendors={vendorList}
                            filterType="flight"
                            placeholder="e.g. IndiGo, Ravi Travels..."
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Contact (Phone)</label>
                          <Inp
                            value={t.vendorContact || ""}
                            onChange={(v) => {
                              setTransports((prev) => {
                                const u = [...prev];
                                if (u[idx]) u[idx] = { ...u[idx], vendorContact: v };
                                return u;
                              });
                            }}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Email (optional)</label>
                          <Inp
                            value={t.vendorEmail || ""}
                            onChange={(v) => {
                              setTransports((prev) => {
                                const u = [...prev];
                                if (u[idx]) u[idx] = { ...u[idx], vendorEmail: v };
                                return u;
                              });
                            }}
                            placeholder="vendor@email.com"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label><Inp type="number" value={t.vendorCost} onChange={(v) => { setTransports((prev) => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], vendorCost: Number(v) }; return u; }); }} placeholder="0" /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label><Inp type="number" value={t.sellingPrice} onChange={(v) => { setTransports((prev) => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], sellingPrice: Number(v) }; return u; }); }} placeholder="0" /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label><Inp type="date" value={t.paymentDueDate?.split("T")[0] || ""} onChange={(v) => { setTransports((prev) => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], paymentDueDate: v }; return u; }); }} /></div>
                        <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label><Sel value={t.paymentStatus || "pending"} onChange={(v) => { setTransports((prev) => { const u = [...prev]; if (u[idx]) u[idx] = { ...u[idx], paymentStatus: v }; return u; }); }} options={PAY_OPTS} /></div>
                      </div>
                      {(t.paymentStatus?.toLowerCase() === "partial") && (
                        <PartialPaymentFields
                          vendorCost={t.vendorCost}
                          paidAmount={t.paidAmount}
                          onChangePaidAmount={(val) => {
                            setTransports((prev) => {
                              const u = [...prev];
                              if (u[idx]) u[idx] = { ...u[idx], paidAmount: val };
                              return u;
                            });
                          }}
                        />
                      )}
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
                        <button onClick={() => {
                          const masterId = g.masterInfo.item._id;
                          const currentItem = transports.find(item => item._id === masterId) || transports[g.masterInfo.i] || g.masterInfo.item;
                          saveItem("transports", masterId, currentItem);
                        }} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100">
                          <Check size={10} /> Save Group
                        </button>
                      </div>
                      
                      {(() => {
                        const masterId = g.masterInfo.item?._id;
                        const actualIdx = transports.findIndex((item: any) => item._id === masterId);
                        const t = actualIdx !== -1 ? transports[actualIdx] : (transports[g.masterInfo.i] || g.masterInfo.item);
                        const idx = actualIdx !== -1 ? actualIdx : g.masterInfo.i;
                        return (
                          <>
                            <div className="mb-4">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Operator</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Name / Company</label>
                                  <VendorPick
                                    value={t.vendorName || ""}
                                    onChange={(val, matched) => {
                                      setTransports((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        const vContact = matched ? (matched.phone || matched.contactPhone || matched.mobile || "") : u[targetIdx].vendorContact;
                                        const vEmail = matched ? (matched.email || matched.contactEmail || "") : u[targetIdx].vendorEmail;
                                        u[targetIdx] = {
                                          ...u[targetIdx],
                                          vendorName: val,
                                          vendorContact: vContact !== undefined ? vContact : (u[targetIdx].vendorContact || ""),
                                          vendorEmail: vEmail !== undefined ? vEmail : (u[targetIdx].vendorEmail || ""),
                                        };
                                        return u;
                                      });
                                    }}
                                    onSelectVendor={(v) => {
                                      setTransports((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = {
                                          ...u[targetIdx],
                                          vendorName: v.name,
                                          vendorContact: v.phone || v.contactPhone || v.mobile || u[targetIdx].vendorContact || "",
                                          vendorEmail: v.email || v.contactEmail || u[targetIdx].vendorEmail || "",
                                        };
                                        return u;
                                      });
                                    }}
                                    vendors={vendorList}
                                    filterType="flight"
                                    placeholder="e.g. Ravi Travels, IndiGo..."
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Contact (Phone)</label>
                                  <Inp
                                    value={t.vendorContact || ""}
                                    onChange={(v) => {
                                      setTransports((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], vendorContact: v };
                                        return u;
                                      });
                                    }}
                                    placeholder="+91 98765 43210"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Email (optional)</label>
                                  <Inp
                                    value={t.vendorEmail || ""}
                                    onChange={(v) => {
                                      setTransports((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], vendorEmail: v };
                                        return u;
                                      });
                                    }}
                                    placeholder="vendor@email.com"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="mb-4">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label><Inp type="number" value={t.vendorCost} onChange={(v) => { setTransports((prev) => { const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if (targetIdx === -1) return prev; const u = [...prev]; u[targetIdx] = { ...u[targetIdx], vendorCost: Number(v) }; return u; }); }} placeholder="0" /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label><Inp type="number" value={t.sellingPrice} onChange={(v) => { setTransports((prev) => { const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if (targetIdx === -1) return prev; const u = [...prev]; u[targetIdx] = { ...u[targetIdx], sellingPrice: Number(v) }; return u; }); }} placeholder="0" /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label><Inp type="date" value={t.paymentDueDate?.split("T")[0] || ""} onChange={(v) => { setTransports((prev) => { const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if (targetIdx === -1) return prev; const u = [...prev]; u[targetIdx] = { ...u[targetIdx], paymentDueDate: v }; return u; }); }} /></div>
                                <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label><Sel value={t.paymentStatus || "pending"} onChange={(v) => { setTransports((prev) => { const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if (targetIdx === -1) return prev; const u = [...prev]; u[targetIdx] = { ...u[targetIdx], paymentStatus: v }; return u; }); }} options={PAY_OPTS} /></div>
                              </div>
                              {(t.paymentStatus?.toLowerCase() === "partial") && (
                                <PartialPaymentFields
                                  vendorCost={t.vendorCost}
                                  paidAmount={t.paidAmount}
                                  onChangePaidAmount={(val) => {
                                    setTransports((prev) => {
                                      const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                      if (targetIdx === -1) return prev;
                                      const u = [...prev];
                                      u[targetIdx] = { ...u[targetIdx], paidAmount: val };
                                      return u;
                                    });
                                  }}
                                />
                              )}
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks / Notes</label>
                              <Inp value={t.remarks || ""} onChange={(v) => { setTransports((prev) => { const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if (targetIdx === -1) return prev; const u = [...prev]; u[targetIdx] = { ...u[targetIdx], remarks: v }; return u; }); }} placeholder="e.g. Night transfers included, toll charges extra..." />
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
          {transports.length === 0 && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No flights or trains added yet. Add one above or import from itinerary. Road transfers are managed under Itinerary Days.</div>}
        </div>
      )}

      {/* ACCOMMODATION */}
      {tab === "accommodation" && (
        <div className="space-y-3">
          {/* HOTEL PAYMENT STATUS BANNER */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            hotelBilled === 0
              ? "bg-slate-50 border-slate-200"
              : hotelPaid >= hotelBilled
              ? "bg-emerald-50 border-emerald-200"
              : hotelPaid > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-red-200 border-red-300"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏨</span>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Hotel Charges & Payment Status (Customer)
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Customer Hotel Charge: <strong className="text-slate-900 font-semibold">{formatCurrency(hotelBilled)}</strong>
                  {" · "}
                  Customer Paid: <strong className={hotelPaid >= hotelBilled && hotelBilled > 0 ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>{formatCurrency(hotelPaid)}</strong>
                  {" · "}
                  Pending: <strong className={hotelBilled - hotelPaid > 0 ? "text-red-700 font-bold" : "text-slate-700 font-medium"}>{formatCurrency(Math.max(0, hotelBilled - hotelPaid))}</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const val = prompt("Update Quoted Hotel Price (₹):", String(hotelBilled));
                  if (val !== null && val.trim() !== "" && !isNaN(Number(val))) {
                    handleSyncPricing({ component: "hotel", price: Number(val) });
                  }
                }}
                className="px-2.5 py-1 bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                title="Edit Quoted Hotel Price"
              >
                <Edit2 size={12} />
                <span>✏️ Quoted Hotel: {formatCurrency(hotelBilled)}</span>
              </button>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                hotelBilled === 0
                  ? "bg-slate-200 text-slate-700"
                  : hotelPaid >= hotelBilled
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : hotelPaid > 0
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}>
                {hotelBilled === 0
                  ? "No Hotel Charge"
                  : hotelPaid >= hotelBilled
                  ? "✓ Hotel Fully Paid (Ready to Confirm)"
                  : hotelPaid > 0
                  ? "⚠️ Partially Paid"
                  : "⚠️ Hotel Payment Pending"}
              </span>
            </div>
          </div>

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
                      
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>
                        <VendorPick
                          value={a.vendorName || ""}
                          onChange={(v) => {
                            setAccommodations((prev) => {
                              const u = [...prev];
                              if (u[idx]) u[idx] = { ...u[idx], vendorName: v };
                              return u;
                            });
                          }}
                          vendors={vendorList}
                          filterType="hotel"
                          placeholder="e.g. Hotel / Vendor Name"
                        />
                      </div>
                      <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={a.vendorCost} onChange={(v)=>{setAccommodations((prev)=>{const u=[...prev];if(u[idx]) u[idx]={...u[idx],vendorCost:Number(v)};return u;});}} /></div>
                      <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price</label><Inp type="number" value={a.sellingPrice} onChange={(v)=>{setAccommodations((prev)=>{const u=[...prev];if(u[idx]) u[idx]={...u[idx],sellingPrice:Number(v)};return u;});}} /></div>
                      <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment</label><Sel value={a.paymentStatus || "pending"} onChange={(v)=>{setAccommodations((prev)=>{const u=[...prev];if(u[idx]) u[idx]={...u[idx],paymentStatus:v};return u;});}} options={PAY_OPTS} /></div>
                      {(a.paymentStatus?.toLowerCase() === "partial") && (
                        <div className="col-span-2 md:col-span-5">
                          <PartialPaymentFields
                            vendorCost={a.vendorCost}
                            paidAmount={a.paidAmount}
                            onChangePaidAmount={(val) => {
                              setAccommodations((prev) => {
                                const u = [...prev];
                                if (u[idx]) u[idx] = { ...u[idx], paidAmount: val };
                                return u;
                              });
                            }}
                          />
                        </div>
                      )}
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
                        <button onClick={() => {
                          const masterId = g.masterInfo.item._id;
                          const currentItem = accommodations.find(item => item._id === masterId) || accommodations[g.masterInfo.i] || g.masterInfo.item;
                          saveItem("accommodations", masterId, currentItem);
                        }} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100">
                          <Check size={10} /> Save Group
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(() => {
                          const masterId = g.masterInfo.item?._id;
                          const actualIdx = accommodations.findIndex((item: any) => item._id === masterId);
                          const a = actualIdx !== -1 ? accommodations[actualIdx] : (accommodations[g.masterInfo.i] || g.masterInfo.item);
                          const idx = actualIdx !== -1 ? actualIdx : g.masterInfo.i;
                          return (
                            <>
                              <div>
                                <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor</label>
                                <VendorPick
                                  value={a.vendorName || ""}
                                  onChange={(v) => {
                                    setAccommodations((prev) => {
                                      const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                      if (targetIdx === -1) return prev;
                                      const u = [...prev];
                                      u[targetIdx] = { ...u[targetIdx], vendorName: v };
                                      return u;
                                    });
                                  }}
                                  vendors={vendorList}
                                  filterType="hotel"
                                  placeholder="e.g. Hotel / Vendor Name"
                                />
                              </div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost</label><Inp type="number" value={a.vendorCost} onChange={(v)=>{setAccommodations((prev)=>{const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if(targetIdx === -1) return prev; const u=[...prev]; u[targetIdx]={...u[targetIdx],vendorCost:Number(v)}; return u;});}} /></div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price</label><Inp type="number" value={a.sellingPrice} onChange={(v)=>{setAccommodations((prev)=>{const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if(targetIdx === -1) return prev; const u=[...prev]; u[targetIdx]={...u[targetIdx],sellingPrice:Number(v)}; return u;});}} /></div>
                              <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Payment</label><Sel value={a.paymentStatus || "pending"} onChange={(v)=>{setAccommodations((prev)=>{const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx; if(targetIdx === -1) return prev; const u=[...prev]; u[targetIdx]={...u[targetIdx],paymentStatus:v}; return u;});}} options={PAY_OPTS} /></div>
                            </>
                          );
                        })()}
                      </div>
                      {(() => {
                        const masterId = g.masterInfo.item?._id;
                        const actualIdx = accommodations.findIndex((item: any) => item._id === masterId);
                        const a = actualIdx !== -1 ? accommodations[actualIdx] : (accommodations[g.masterInfo.i] || g.masterInfo.item);
                        const idx = actualIdx !== -1 ? actualIdx : g.masterInfo.i;
                        if (a.paymentStatus?.toLowerCase() !== "partial") return null;
                        return (
                          <PartialPaymentFields
                            vendorCost={a.vendorCost}
                            paidAmount={a.paidAmount}
                            onChangePaidAmount={(val) => {
                              setAccommodations((prev) => {
                                const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                if (targetIdx === -1) return prev;
                                const u = [...prev];
                                u[targetIdx] = { ...u[targetIdx], paidAmount: val };
                                return u;
                              });
                            }}
                          />
                        );
                      })()}
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
              <p className="text-sm font-bold text-indigo-900">{selectedActivities.size} days selected</p>
              <button onClick={() => handleGroupItems('activities', Array.from(selectedActivities))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
                Group Selected Days (Aggregate Expense)
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

            const renderActivityCard = (a: any, idx: number, isGrouped: boolean) => (
              <div key={a._id} className={`bg-white rounded-xl border p-4 space-y-3 ${isGrouped ? 'shadow-sm' : 'border-slate-200 mb-4'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!isGrouped && (
                      <input
                        type="checkbox"
                        checked={selectedActivities.has(a._id)}
                        onChange={(e) => {
                          const s = new Set(selectedActivities);
                          if (e.target.checked) s.add(a._id); else s.delete(a._id);
                          setSelectedActivities(s);
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                    )}
                    <span className="text-xs font-bold text-cyan-700">
                      Day #{idx + 1} {a.tripDay ? `(${a.tripDay})` : ''}
                    </span>
                    {op?.bookings && op.bookings.length > 1 && (
                      <select
                        value={a.linkedBooking || ""}
                        onChange={(e) => {
                          const u = [...activities];
                          u[idx] = { ...u[idx], linkedBooking: e.target.value };
                          setActivities(u);
                        }}
                        className="ml-2 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="">Group Expense</option>
                        {op.bookings.map((b: any, i: number) => (
                          <option key={b._id} value={b._id}>{op.customers?.[i]?.name || 'Customer'}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveItem("activities", a._id, activities[idx])}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                    >
                      {saving === a._id ? "..." : <><Check size={10} /> Save</>}
                    </button>
                    <button
                      onClick={() => delItem("activities", a._id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Day Title</label>
                    <Inp
                      value={a.title || ""}
                      onChange={(v) => {
                        const u = [...activities];
                        u[idx] = { ...u[idx], title: v };
                        setActivities(u);
                      }}
                      placeholder="e.g. Arrival & City Tour"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Date</label>
                    <Inp
                      type="date"
                      value={a.date?.split("T")[0] || ""}
                      onChange={(v) => {
                        const u = [...activities];
                        u[idx] = { ...u[idx], date: v };
                        setActivities(u);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Duration</label>
                    <Inp
                      value={a.duration || ""}
                      onChange={(v) => {
                        const u = [...activities];
                        u[idx] = { ...u[idx], duration: v };
                        setActivities(u);
                      }}
                      placeholder="e.g. Full day, 4 hours"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Trip Day</label>
                    <Inp
                      value={a.tripDay || ""}
                      onChange={(v) => {
                        const u = [...activities];
                        u[idx] = { ...u[idx], tripDay: v };
                        setActivities(u);
                      }}
                      placeholder="Day 1"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] text-slate-400 uppercase block mb-1">Activities / Description</label>
                    <Inp
                      value={a.description || ""}
                      onChange={(v) => {
                        const u = [...activities];
                        u[idx] = { ...u[idx], description: v };
                        setActivities(u);
                      }}
                      placeholder="e.g. Visit Mughal Gardens, Shikara ride on Dal Lake..."
                    />
                  </div>
                </div>

                {/* DAY TRANSFERS & ROAD TRANSPORT */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck size={13} className="text-cyan-600" />
                        Day Transfers & Road Transport
                        {(a.transfers && a.transfers.length > 0) && (
                          <span className="text-[9px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full normal-case">
                            {a.transfers.length} {a.transfers.length === 1 ? "transfer leg" : "transfer legs"}
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        Cabs, private cars, sightseeing vehicles, airport/station pickups for this day
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const u = [...activities];
                        const currentTransfers = [...(u[idx].transfers || [])];
                        currentTransfers.push({
                          from: "",
                          to: "",
                          vehicleType: "Car",
                          duration: "",
                          departureTime: "",
                          arrivalTime: "",
                          driverName: "",
                          driverContact: "",
                          vehicleNumber: "",
                          notes: "",
                          hasPricing: false,
                          vendorName: "",
                          vendorContact: "",
                          vendorCost: 0,
                          sellingPrice: 0,
                          paymentStatus: "pending",
                        });
                        u[idx] = { ...u[idx], transfers: currentTransfers };
                        setActivities(u);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-[10px] font-bold hover:bg-cyan-100 transition-colors"
                    >
                      <Plus size={11} /> Add Transfer Leg
                    </button>
                  </div>

                  {(!a.transfers || a.transfers.length === 0) ? (
                    <div className="text-[11px] text-slate-400 italic bg-slate-50/60 border border-dashed border-slate-200 rounded-lg p-3 text-center">
                      No road transfers configured for this day. Click "+ Add Transfer Leg" if road transit is required.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {a.transfers.map((tr: ActivityTransfer, li: number) => (
                        <div key={li} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                Leg #{li + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">
                                {tr.from && tr.to ? `${tr.from} → ${tr.to}` : tr.from || tr.to || tr.title || "New Transfer Leg"}
                              </span>
                              {tr.vehicleType && (
                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                                  {tr.vehicleType}
                                </span>
                              )}
                              {tr.hasPricing ? (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                  ₹{tr.vendorCost || 0} Cost ({tr.paymentStatus || 'pending'})
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                                  ✓ Included in package (₹0)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const u = [...activities];
                                const currentTransfers = [...(u[idx].transfers || [])];
                                currentTransfers.splice(li, 1);
                                u[idx] = { ...u[idx], transfers: currentTransfers };
                                setActivities(u);
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove transfer leg"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Leg Route & Vehicle */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">From (Pickup)</label>
                              <Inp
                                value={tr.from || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], from: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="e.g. Srinagar Airport"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">To (Drop-off)</label>
                              <Inp
                                value={tr.to || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], to: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="e.g. Dal Lake Houseboat"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Vehicle Type</label>
                              <Inp
                                value={tr.vehicleType || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], vehicleType: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="e.g. Innova / Sedan / Tempo"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Duration</label>
                              <Inp
                                value={tr.duration || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], duration: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="e.g. 1.5 hrs"
                              />
                            </div>
                          </div>

                          {/* Timings & Driver Details */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Departure Time</label>
                              <Inp
                                value={tr.departureTime || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], departureTime: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="e.g. 10:00 AM"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Arrival Time</label>
                              <Inp
                                value={tr.arrivalTime || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], arrivalTime: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="e.g. 11:30 AM"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Driver Name</label>
                              <Inp
                                value={tr.driverName || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], driverName: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="Driver name"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Driver Phone</label>
                              <Inp
                                value={tr.driverContact || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], driverContact: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="+91 98765..."
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Vehicle Reg No.</label>
                              <Inp
                                value={tr.vehicleNumber || ""}
                                onChange={(v) => {
                                  const u = [...activities];
                                  const currentTransfers = [...(u[idx].transfers || [])];
                                  currentTransfers[li] = { ...currentTransfers[li], vehicleNumber: v };
                                  u[idx] = { ...u[idx], transfers: currentTransfers };
                                  setActivities(u);
                                }}
                                placeholder="JK 01 AB 1234"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 uppercase block mb-1">Leg Notes / Instructions</label>
                            <Inp
                              value={tr.notes || ""}
                              onChange={(v) => {
                                const u = [...activities];
                                const currentTransfers = [...(u[idx].transfers || [])];
                                currentTransfers[li] = { ...currentTransfers[li], notes: v };
                                u[idx] = { ...u[idx], transfers: currentTransfers };
                                setActivities(u);
                              }}
                              placeholder="e.g. Driver will hold LetsLive greeting card at arrival exit"
                            />
                          </div>

                          {/* Pricing Toggle Section */}
                          <div className="pt-2 border-t border-slate-200/60">
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!tr.hasPricing}
                                  onChange={(e) => {
                                    const u = [...activities];
                                    const currentTransfers = [...(u[idx].transfers || [])];
                                    currentTransfers[li] = {
                                      ...currentTransfers[li],
                                      hasPricing: e.target.checked,
                                      vendorCost: e.target.checked ? (currentTransfers[li].vendorCost || 0) : 0,
                                    };
                                    u[idx] = { ...u[idx], transfers: currentTransfers };
                                    setActivities(u);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <span className="text-[10px] font-bold text-slate-600">
                                  Separate Vendor Pricing for this Transfer
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  (Leave unchecked if already included in package / day tour)
                                </span>
                              </label>
                              {!tr.hasPricing && (
                                <span className="text-[9px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                                  Included in package (₹0)
                                </span>
                              )}
                            </div>

                            {tr.hasPricing && (
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">
                                <div className="col-span-1 md:col-span-2">
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor / Transporter Name</label>
                                  <VendorPick
                                    value={tr.vendorName || ""}
                                    onChange={(val) => {
                                      setActivities((prev) => {
                                        const u = [...prev];
                                        if (!u[idx]) return prev;
                                        const currentTransfers = [...(u[idx].transfers || [])];
                                        if (!currentTransfers[li]) return prev;
                                        currentTransfers[li] = { ...currentTransfers[li], vendorName: val };
                                        u[idx] = { ...u[idx], transfers: currentTransfers };
                                        return u;
                                      });
                                    }}
                                    vendors={vendorList}
                                    filterType="vehicle"
                                    placeholder="e.g. Kashmir Cab Association"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label>
                                  <Inp
                                    type="number"
                                    value={tr.vendorCost || 0}
                                    onChange={(v) => {
                                      const u = [...activities];
                                      const currentTransfers = [...(u[idx].transfers || [])];
                                      currentTransfers[li] = { ...currentTransfers[li], vendorCost: Number(v) };
                                      u[idx] = { ...u[idx], transfers: currentTransfers };
                                      setActivities(u);
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label>
                                  <Inp
                                    type="number"
                                    value={tr.sellingPrice || 0}
                                    onChange={(v) => {
                                      const u = [...activities];
                                      const currentTransfers = [...(u[idx].transfers || [])];
                                      currentTransfers[li] = { ...currentTransfers[li], sellingPrice: Number(v) };
                                      u[idx] = { ...u[idx], transfers: currentTransfers };
                                      setActivities(u);
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Status</label>
                                  <Sel
                                    value={tr.paymentStatus || "pending"}
                                    onChange={(v) => {
                                      setActivities((prev) => {
                                        const u = [...prev];
                                        if (!u[idx]) return prev;
                                        const currentTransfers = [...(u[idx].transfers || [])];
                                        currentTransfers[li] = { ...currentTransfers[li], paymentStatus: v as any };
                                        u[idx] = { ...u[idx], transfers: currentTransfers };
                                        return u;
                                      });
                                    }}
                                    options={PAY_OPTS}
                                  />
                                </div>
                                {tr.hasPricing && (tr.paymentStatus?.toLowerCase() === "partial") && (
                                  <div className="col-span-2 md:col-span-5">
                                    <PartialPaymentFields
                                      vendorCost={tr.vendorCost || 0}
                                      paidAmount={tr.paidAmount}
                                      onChangePaidAmount={(val) => {
                                        setActivities((prev) => {
                                          const u = [...prev];
                                          if (!u[idx]) return prev;
                                          const currentTransfers = [...(u[idx].transfers || [])];
                                          currentTransfers[li] = { ...currentTransfers[li], paidAmount: val };
                                          u[idx] = { ...u[idx], transfers: currentTransfers };
                                          return u;
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!isGrouped && (
                  <>
                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Service Provider</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Name</label>
                          <VendorPick
                            value={a.vendorName || ""}
                            onChange={(val, matched) => {
                              setActivities((prev) => {
                                const u = [...prev];
                                if (!u[idx]) return prev;
                                const vContact = matched ? (matched.phone || matched.contactPhone || matched.mobile || "") : u[idx].vendorContact;
                                const vEmail = matched ? (matched.email || matched.contactEmail || "") : u[idx].vendorEmail;
                                u[idx] = {
                                  ...u[idx],
                                  vendorName: val,
                                  vendorContact: vContact !== undefined ? vContact : (u[idx].vendorContact || ""),
                                  vendorEmail: vEmail !== undefined ? vEmail : (u[idx].vendorEmail || ""),
                                };
                                return u;
                              });
                            }}
                            onSelectVendor={(v) => {
                              setActivities((prev) => {
                                const u = [...prev];
                                if (!u[idx]) return prev;
                                u[idx] = {
                                  ...u[idx],
                                  vendorName: v.name,
                                  vendorContact: v.phone || v.contactPhone || v.mobile || u[idx].vendorContact || "",
                                  vendorEmail: v.email || v.contactEmail || u[idx].vendorEmail || "",
                                };
                                return u;
                              });
                            }}
                            vendors={vendorList}
                            filterType="activity"
                            placeholder="e.g. Local Guide Co."
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Contact (Phone)</label>
                          <Inp
                            value={a.vendorContact || ""}
                            onChange={(v) => {
                              setActivities((prev) => {
                                const u = [...prev];
                                if (u[idx]) u[idx] = { ...u[idx], vendorContact: v };
                                return u;
                              });
                            }}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Email (optional)</label>
                          <Inp
                            value={a.vendorEmail || ""}
                            onChange={(v) => {
                              setActivities((prev) => {
                                const u = [...prev];
                                if (u[idx]) u[idx] = { ...u[idx], vendorEmail: v };
                                return u;
                              });
                            }}
                            placeholder="vendor@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment & Pricing</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label>
                          <Inp
                            type="number"
                            value={a.vendorCost}
                            onChange={(v) => {
                              const u = [...activities];
                              u[idx] = { ...u[idx], vendorCost: Number(v) };
                              setActivities(u);
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label>
                          <Inp
                            type="number"
                            value={a.sellingPrice}
                            onChange={(v) => {
                              const u = [...activities];
                              u[idx] = { ...u[idx], sellingPrice: Number(v) };
                              setActivities(u);
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label>
                          <Inp
                            type="date"
                            value={a.paymentDueDate?.split("T")[0] || ""}
                            onChange={(v) => {
                              const u = [...activities];
                              u[idx] = { ...u[idx], paymentDueDate: v };
                              setActivities(u);
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label>
                          <Sel
                            value={a.paymentStatus || "pending"}
                            onChange={(v) => {
                              setActivities((prev) => {
                                const u = [...prev];
                                if (u[idx]) u[idx] = { ...u[idx], paymentStatus: v };
                                return u;
                              });
                            }}
                            options={PAY_OPTS}
                          />
                        </div>
                      </div>
                      {(a.paymentStatus?.toLowerCase() === "partial") && (
                        <PartialPaymentFields
                          vendorCost={a.vendorCost}
                          paidAmount={a.paidAmount}
                          onChangePaidAmount={(val) => {
                            setActivities((prev) => {
                              const u = [...prev];
                              if (u[idx]) u[idx] = { ...u[idx], paidAmount: val };
                              return u;
                            });
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks / Notes</label>
                      <Inp
                        value={a.remarks || ""}
                        onChange={(v) => {
                          const u = [...activities];
                          u[idx] = { ...u[idx], remarks: v };
                          setActivities(u);
                        }}
                        placeholder="e.g. Entry tickets, guide allowance included..."
                      />
                    </div>
                  </>
                )}
              </div>
            );

            return grouped.map((g) => {
              if (!g.isGroup) {
                return renderActivityCard(g.item, g.idx, false);
              } else {
                const dayLabels = g.items.map((x: any) => x.item.tripDay || `Day ${x.i + 1}`).join(", ");
                return (
                  <div key={g.groupId} className="bg-indigo-50/20 rounded-xl border border-indigo-200 p-4 space-y-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md">
                        GROUP: {g.items.length} Itinerary Days ({dayLabels})
                      </span>
                      <button
                        onClick={() => handleUngroup('activities', g.groupId)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-[10px] font-bold hover:bg-orange-100 transition-colors"
                      >
                        Ungroup All
                      </button>
                    </div>

                    <div className="space-y-3 border-l-2 border-indigo-200 pl-4 ml-1">
                      {g.items.map(({ item: a, i: idx }: { item: any; i: number }) =>
                        renderActivityCard(a, idx, true)
                      )}
                    </div>

                    <div className="bg-white rounded-xl border border-indigo-100 p-4 mt-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Group Vendor & Aggregate Pricing</span>
                          <p className="text-[9px] text-slate-400">Common / aggregate expense for these {g.items.length} days</p>
                        </div>
                        <button
                          onClick={() => {
                            const masterId = g.masterInfo.item._id;
                            const currentItem = activities.find(item => item._id === masterId) || activities[g.masterInfo.i] || g.masterInfo.item;
                            saveItem("activities", masterId, currentItem);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                        >
                          {saving === g.masterInfo.item._id ? "..." : <><Check size={10} /> Save Group Pricing</>}
                        </button>
                      </div>

                      {(() => {
                        const masterId = g.masterInfo.item?._id;
                        const actualIdx = activities.findIndex((item: any) => item._id === masterId);
                        const a = actualIdx !== -1 ? activities[actualIdx] : (activities[g.masterInfo.i] || g.masterInfo.item);
                        const idx = actualIdx !== -1 ? actualIdx : g.masterInfo.i;
                        return (
                          <>
                            <div className="mb-4">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vendor / Service Provider</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Company / Guide Name</label>
                                  <VendorPick
                                    value={a.vendorName || ""}
                                    onChange={(val, matched) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        const vContact = matched ? (matched.phone || matched.contactPhone || matched.mobile || "") : u[targetIdx].vendorContact;
                                        const vEmail = matched ? (matched.email || matched.contactEmail || "") : u[targetIdx].vendorEmail;
                                        u[targetIdx] = {
                                          ...u[targetIdx],
                                          vendorName: val,
                                          vendorContact: vContact !== undefined ? vContact : (u[targetIdx].vendorContact || ""),
                                          vendorEmail: vEmail !== undefined ? vEmail : (u[targetIdx].vendorEmail || ""),
                                        };
                                        return u;
                                      });
                                    }}
                                    onSelectVendor={(v) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = {
                                          ...u[targetIdx],
                                          vendorName: v.name,
                                          vendorContact: v.phone || v.contactPhone || v.mobile || u[targetIdx].vendorContact || "",
                                          vendorEmail: v.email || v.contactEmail || u[targetIdx].vendorEmail || "",
                                        };
                                        return u;
                                      });
                                    }}
                                    vendors={vendorList}
                                    filterType="activity"
                                    placeholder="e.g. Kashmir Tours & Guide Services"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Contact (Phone)</label>
                                  <Inp
                                    value={a.vendorContact || ""}
                                    onChange={(v) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], vendorContact: v };
                                        return u;
                                      });
                                    }}
                                    placeholder="+91 98765 43210"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Email (optional)</label>
                                  <Inp
                                    value={a.vendorEmail || ""}
                                    onChange={(v) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], vendorEmail: v };
                                        return u;
                                      });
                                    }}
                                    placeholder="vendor@email.com"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Aggregate Expense & Pricing</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Vendor Cost (₹)</label>
                                  <Inp
                                    type="number"
                                    value={a.vendorCost}
                                    onChange={(v) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], vendorCost: Number(v) };
                                        return u;
                                      });
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Selling Price (₹)</label>
                                  <Inp
                                    type="number"
                                    value={a.sellingPrice}
                                    onChange={(v) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], sellingPrice: Number(v) };
                                        return u;
                                      });
                                    }}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Payment Due</label>
                                  <Inp
                                    type="date"
                                    value={a.paymentDueDate?.split("T")[0] || ""}
                                    onChange={(v) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], paymentDueDate: v };
                                        return u;
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] text-slate-400 uppercase block mb-1">Status</label>
                                  <Sel
                                    value={a.paymentStatus || "pending"}
                                    onChange={(v) => {
                                      setActivities((prev) => {
                                        const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                        if (targetIdx === -1) return prev;
                                        const u = [...prev];
                                        u[targetIdx] = { ...u[targetIdx], paymentStatus: v };
                                        return u;
                                      });
                                    }}
                                    options={PAY_OPTS}
                                  />
                                </div>
                              </div>
                              {(a.paymentStatus?.toLowerCase() === "partial") && (
                                <PartialPaymentFields
                                  vendorCost={a.vendorCost}
                                  paidAmount={a.paidAmount}
                                  onChangePaidAmount={(val) => {
                                    setActivities((prev) => {
                                      const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                      if (targetIdx === -1) return prev;
                                      const u = [...prev];
                                      u[targetIdx] = { ...u[targetIdx], paidAmount: val };
                                      return u;
                                    });
                                  }}
                                />
                              )}
                            </div>

                            <div>
                              <label className="text-[9px] text-slate-400 uppercase block mb-1">Remarks / Notes</label>
                              <Inp
                                value={a.remarks || ""}
                                onChange={(v) => {
                                  setActivities((prev) => {
                                    const targetIdx = masterId ? prev.findIndex((item: any) => item._id === masterId) : idx;
                                    if (targetIdx === -1) return prev;
                                    const u = [...prev];
                                    u[targetIdx] = { ...u[targetIdx], remarks: v };
                                    return u;
                                  });
                                }}
                                placeholder="e.g. Combined expense covering guide and entrance passes for all grouped days..."
                              />
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
          {activities.length === 0 && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">No itinerary days yet. Add one above or import from itinerary.</div>}
        </div>
      )}

      {/* CUSTOMER PAYMENTS */}
      {tab === "payments" && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Customer Payment Schedule</h3>
              <p className="text-[10px] text-slate-400 mt-1">Track installments received from the customer</p>
            </div>
            <div className="flex gap-2">
              <button onClick={recalculate} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100 transition-colors" title="Recalculate pricing and sync customer payments with operation totals">
                <RefreshCw size={13} /> Recalculate
              </button>
              {customerPayments.length > 0 && <button onClick={() => generateInvoicePdf({ mode: "summary", operationId: op.operationId, customer: op.customers?.[0] || op.customer || {name: 'Unknown', email: '', phone: '', pax: 0}, destination: op.destination, milestone: "Full Statement", amount: customerPayments.reduce((s,p)=>s+p.amount,0), dueDate: undefined, paidAmount: customerPayments.reduce((s,p)=>s+p.paidAmount,0), status: "statement", sellingPrice: op.sellingPrice, allPayments: customerPayments.map(cp=>({milestone:cp.milestone,amount:cp.amount,paidAmount:cp.paidAmount,status:cp.status})) })} className="flex items-center gap-1 px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"><Download size={14} /> Statement</button>}
              <button onClick={() => setSplitModalOpen(true)} className="flex items-center gap-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold"><Plus size={14} /> Add Installment</button>
            </div>
          </div>
          {customerPayments.length > 0 && (() => {
            const totalBilled = customerPayments.reduce((s, p) => s + p.amount, 0);
            const totalPaid = customerPayments.reduce((s, p) => s + p.paidAmount, 0);
            const isOutOfSync = op && (op as any).effectiveSelling !== totalBilled && totalBilled > 0;

            return (
              <div className="space-y-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase">Total Billed</p>
                    <p className="text-sm font-bold text-slate-800">{formatCurrency(totalBilled)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase">Received</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-400 uppercase">Pending</p>
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(customerPayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0))}</p>
                  </div>
                </div>

          {/* PRICING & PERSON QUANTITY CONFIGURATION BAR */}
          <div className="bg-gradient-to-r from-slate-50 via-sky-50/40 to-indigo-50/30 border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚙️</span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Pricing Configuration & Person Quantity
                  </h4>
                  {syncingPricing && (
                    <span className="text-[10px] text-cyan-600 animate-pulse font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      Recalculating & Updating Billing...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Changing price unit or person quantity automatically scales rates and updates the customer pending balance.
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Price Unit Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase px-1">Unit:</span>
                  <button
                    type="button"
                    disabled={syncingPricing}
                    onClick={() => handleSyncPricing({ priceUnit: "person" })}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                      priceUnit === "person"
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Scale prices per person"
                  >
                    <span>👤 Per Person</span>
                  </button>
                  <button
                    type="button"
                    disabled={syncingPricing}
                    onClick={() => handleSyncPricing({ priceUnit: "couple" })}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                      priceUnit === "couple"
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Base flight/rates are for a couple (2 pax)"
                  >
                    <span>👥 Couple</span>
                  </button>
                  <button
                    type="button"
                    disabled={syncingPricing}
                    onClick={() => handleSyncPricing({ priceUnit: "group" })}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                      priceUnit === "group" || priceUnit === "family"
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Flat price for the whole group"
                  >
                    <span>👨‍👩‍👧‍👦 Group (Flat)</span>
                  </button>
                </div>

                {/* Pax Quantity Inputs */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Adults:</span>
                    <input
                      type="number"
                      min={1}
                      disabled={syncingPricing}
                      defaultValue={currentAdults}
                      key={`adults-${currentAdults}`}
                      onBlur={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        if (val !== currentAdults) {
                          handleSyncPricing({ adults: val, children: currentChildren });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = Math.max(1, Number((e.target as any).value));
                          handleSyncPricing({ adults: val, children: currentChildren });
                        }
                      }}
                      className="w-10 px-1 py-0.5 border border-slate-200 rounded text-xs font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Kids:</span>
                    <input
                      type="number"
                      min={0}
                      disabled={syncingPricing}
                      defaultValue={currentChildren}
                      key={`children-${currentChildren}`}
                      onBlur={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        if (val !== currentChildren) {
                          handleSyncPricing({ adults: currentAdults, children: val });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = Math.max(0, Number((e.target as any).value));
                          handleSyncPricing({ adults: currentAdults, children: val });
                        }
                      }}
                      className="w-10 px-1 py-0.5 border border-slate-200 rounded text-xs font-bold text-center text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                    {paxCount} Pax
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT SEPARATION & COMPONENT BREAKDOWN TABLE */}
          {(() => {
            const renderQuotedCell = (compKey: string, currentVal: number, compName: string) => {
              const isEditing = editingPriceComp === compKey;

              if (isEditing) {
                return (
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold">₹</span>
                      <input
                        type="number"
                        min={0}
                        autoFocus
                        value={editPriceValue}
                        onChange={(e) => setEditPriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSyncPricing({ component: compKey, price: Number(editPriceValue) });
                          } else if (e.key === "Escape") {
                            setEditingPriceComp(null);
                          }
                        }}
                        className="w-24 px-1.5 py-0.5 border border-cyan-400 rounded text-xs font-bold text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        type="button"
                        disabled={syncingPricing}
                        onClick={() => handleSyncPricing({ component: compKey, price: Number(editPriceValue) })}
                        className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition"
                        title="Save Quoted Price"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPriceComp(null)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition"
                        title="Cancel"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </td>
                );
              }

              return (
                <td className="py-2.5 text-right font-semibold text-slate-700 group">
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{formatCurrency(currentVal)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPriceComp(compKey);
                        setEditPriceValue(currentVal.toString());
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 rounded transition"
                      title={`Edit ${compName} Quoted Price`}
                    >
                      <Edit2 size={11} />
                    </button>
                  </div>
                </td>
              );
            };

            return (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📊</span> Payment Separation (Component Breakdown)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  What the customer was quoted vs what has been paid for each component
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setForceMergeHotelLand(!isMergedHotelLand)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition flex items-center gap-1 ${
                    isMergedHotelLand 
                      ? "bg-sky-50 border-sky-300 text-sky-800" 
                      : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Toggle between combined Stay + Land row vs separate rows"
                >
                  <span>{isMergedHotelLand ? "🔗 Merged (Stay + Land)" : "➦ Separate (Stay & Land)"}</span>
                </button>
                {generalPaid > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={allotting}
                      onClick={handleDirectAutoAllot}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded text-[11px] font-bold shadow-xs transition flex items-center gap-1"
                      title="Automatically allot unassigned advance pool to pending services"
                    >
                      <span>⚡ 1-Click Auto-Allot ({formatCurrency(generalPaid)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={openAllotModal}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-bold transition flex items-center gap-1"
                      title="Custom manual advance allocation"
                    >
                      <span>Manual Allot</span>
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await api.post(`/operations/${id}/customer-payments`, {
                      milestone: "Flight Ticket Payment",
                      category: "flight",
                      amount: Math.max(0, netFlightPending),
                    });
                    fetchAll();
                  }}
                  className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 rounded text-[11px] font-bold transition flex items-center gap-1"
                  title="Add payment installment specifically for flights"
                >
                  <span>+ ✈️ Flight</span>
                </button>
                {isMergedHotelLand ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await api.post(`/operations/${id}/customer-payments`, {
                        milestone: "Land Package & Hotel Payment",
                        category: "land",
                        amount: Math.max(0, netCombinedLandHotelPending),
                      });
                      fetchAll();
                    }}
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-bold transition flex items-center gap-1"
                    title="Add payment installment specifically for Land Package & Stay"
                  >
                    <span>+ 🏨🚗 Land & Stay</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await api.post(`/operations/${id}/customer-payments`, {
                        milestone: "Hotel Booking Payment",
                        category: "hotel",
                        amount: Math.max(0, netHotelPending),
                      });
                      fetchAll();
                    }}
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-bold transition flex items-center gap-1"
                    title="Add payment installment specifically for hotels"
                  >
                    <span>+ 🏨 Hotel</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-100">
                    <th className="py-2">Component</th>
                    <th className="py-2 text-right">Customer Quoted</th>
                    <th className="py-2 text-right">Customer Paid</th>
                    <th className="py-2 text-right">Pending</th>
                    <th className="py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Flights */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                      <span>✈️</span> Flights & Trains
                    </td>
                    {renderQuotedCell("flight", flightBilled, "Flights & Trains")}
                    <td className="py-2.5 text-right font-bold text-emerald-600">
                      {flightPaid > 0 ? (
                        <span>{formatCurrency(flightPaid)}</span>
                      ) : flightPoolCovered > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-700">{formatCurrency(flightPoolCovered)}</span>
                          <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">via Advance Pool</span>
                        </div>
                      ) : (
                        <span>₹0</span>
                      )}
                    </td>
                    <td className={`py-2.5 text-right font-bold ${netFlightPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {formatCurrency(netFlightPending)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        flightBilled === 0 ? "bg-slate-100 text-slate-500" :
                        flightPaid >= flightBilled ? "bg-emerald-100 text-emerald-800" :
                        flightPaid + flightPoolCovered >= flightBilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                        flightPaid + flightPoolCovered > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                      }`}>
                        {flightBilled === 0 ? "N/A" : flightPaid >= flightBilled ? "PAID" : flightPaid + flightPoolCovered >= flightBilled ? "PAID (POOL)" : flightPaid + flightPoolCovered > 0 ? "PARTIAL" : "PENDING"}
                      </span>
                    </td>
                  </tr>

                  {/* Stay & Land: Either Merged or Separate */}
                  {isMergedHotelLand ? (
                    /* Combined Land Package & Stay Row */
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                        <span>🏨🚗</span>
                        <div>
                          <span className="font-semibold">Land Package & Accommodations</span>
                          <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-semibold border border-sky-100 ml-2">
                            Combined
                          </span>
                        </div>
                      </td>
                      {renderQuotedCell("land", combinedLandHotelBilled, "Land Package & Accommodations")}
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {combinedLandHotelPaid > 0 ? (
                          <span>{formatCurrency(combinedLandHotelPaid)}</span>
                        ) : combinedLandHotelPoolCovered > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-700">{formatCurrency(combinedLandHotelPoolCovered)}</span>
                            <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">via Advance Pool</span>
                          </div>
                        ) : (
                          <span>₹0</span>
                        )}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${netCombinedLandHotelPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {formatCurrency(netCombinedLandHotelPending)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          combinedLandHotelBilled === 0 ? "bg-slate-100 text-slate-500" :
                          combinedLandHotelPaid >= combinedLandHotelBilled ? "bg-emerald-100 text-emerald-800" :
                          combinedLandHotelPaid + combinedLandHotelPoolCovered >= combinedLandHotelBilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          combinedLandHotelPaid + combinedLandHotelPoolCovered > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>
                          {combinedLandHotelBilled === 0 ? "N/A" : combinedLandHotelPaid >= combinedLandHotelBilled ? "PAID" : combinedLandHotelPaid + combinedLandHotelPoolCovered >= combinedLandHotelBilled ? "PAID (POOL)" : combinedLandHotelPaid + combinedLandHotelPoolCovered > 0 ? "PARTIAL" : "PENDING"}
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Separate Hotels Row */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                          <span>🏨</span> Hotel & Accommodation
                        </td>
                        {renderQuotedCell("hotel", hotelBilled, "Hotel & Accommodation")}
                        <td className="py-2.5 text-right font-bold text-emerald-600">
                          {hotelPaid > 0 ? (
                            <span>{formatCurrency(hotelPaid)}</span>
                          ) : hotelPoolCovered > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-emerald-700">{formatCurrency(hotelPoolCovered)}</span>
                              <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">via Advance Pool</span>
                            </div>
                          ) : (
                            <span>₹0</span>
                          )}
                        </td>
                        <td className={`py-2.5 text-right font-bold ${netHotelPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                          {formatCurrency(netHotelPending)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            hotelBilled === 0 ? "bg-slate-100 text-slate-500" :
                            hotelPaid >= hotelBilled ? "bg-emerald-100 text-emerald-800" :
                            hotelPaid + hotelPoolCovered >= hotelBilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                            hotelPaid + hotelPoolCovered > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {hotelBilled === 0 ? "N/A" : hotelPaid >= hotelBilled ? "PAID" : hotelPaid + hotelPoolCovered >= hotelBilled ? "PAID (POOL)" : hotelPaid + hotelPoolCovered > 0 ? "PARTIAL" : "PENDING"}
                          </span>
                        </td>
                      </tr>

                      {/* Separate Land Package / Activities Row */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                          <span>🚗</span> Land Package & Activities
                        </td>
                        {renderQuotedCell("land", landBilled, "Land Package & Activities")}
                        <td className="py-2.5 text-right font-bold text-emerald-600">
                          {landPaid > 0 ? (
                            <span>{formatCurrency(landPaid)}</span>
                          ) : landPoolCovered > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-emerald-700">{formatCurrency(landPoolCovered)}</span>
                              <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">via Advance Pool</span>
                            </div>
                          ) : (
                            <span>₹0</span>
                          )}
                        </td>
                        <td className={`py-2.5 text-right font-bold ${netLandPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                          {formatCurrency(netLandPending)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            landBilled === 0 ? "bg-slate-100 text-slate-500" :
                            landPaid >= landBilled ? "bg-emerald-100 text-emerald-800" :
                            landPaid + landPoolCovered >= landBilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                            landPaid + landPoolCovered > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {landBilled === 0 ? "N/A" : landPaid >= landBilled ? "PAID" : landPaid + landPoolCovered >= landBilled ? "PAID (POOL)" : landPaid + landPoolCovered > 0 ? "PARTIAL" : "PENDING"}
                          </span>
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Visa */}
                  {visaBilled > 0 && (
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                        <span>🛂</span> Visa Fees
                      </td>
                      {renderQuotedCell("visa", visaBilled, "Visa Fees")}
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {visaPaid > 0 ? (
                          <span>{formatCurrency(visaPaid)}</span>
                        ) : visaPoolCovered > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-700">{formatCurrency(visaPoolCovered)}</span>
                            <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">via Advance Pool</span>
                          </div>
                        ) : (
                          <span>₹0</span>
                        )}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${netVisaPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {formatCurrency(netVisaPending)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          visaPaid >= visaBilled ? "bg-emerald-100 text-emerald-800" :
                          visaPaid + visaPoolCovered >= visaBilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          visaPaid + visaPoolCovered > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>
                          {visaPaid >= visaBilled ? "PAID" : visaPaid + visaPoolCovered >= visaBilled ? "PAID (POOL)" : visaPaid + visaPoolCovered > 0 ? "PARTIAL" : "PENDING"}
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* Insurance */}
                  {insuranceBilled > 0 && (
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                        <span>🛡️</span> Travel Insurance
                      </td>
                      {renderQuotedCell("insurance", insuranceBilled, "Travel Insurance")}
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {insurancePaid > 0 ? (
                          <span>{formatCurrency(insurancePaid)}</span>
                        ) : insPoolCovered > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-700">{formatCurrency(insPoolCovered)}</span>
                            <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">via Advance Pool</span>
                          </div>
                        ) : (
                          <span>₹0</span>
                        )}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${netInsPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {formatCurrency(netInsPending)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          insurancePaid >= insuranceBilled ? "bg-emerald-100 text-emerald-800" :
                          insurancePaid + insPoolCovered >= insuranceBilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          insurancePaid + insPoolCovered > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>
                          {insurancePaid >= insuranceBilled ? "PAID" : insurancePaid + insPoolCovered >= insuranceBilled ? "PAID (POOL)" : insurancePaid + insPoolCovered > 0 ? "PARTIAL" : "PENDING"}
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* Misc */}
                  {miscBilled > 0 && (
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-medium text-slate-800 flex items-center gap-2">
                        <span>🏷️</span> Misc Charges
                      </td>
                      {renderQuotedCell("misc", miscBilled, "Misc Charges")}
                      <td className="py-2.5 text-right font-bold text-emerald-600">
                        {miscPaid > 0 ? (
                          <span>{formatCurrency(miscPaid)}</span>
                        ) : miscPoolCovered > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-700">{formatCurrency(miscPoolCovered)}</span>
                            <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">via Advance Pool</span>
                          </div>
                        ) : (
                          <span>₹0</span>
                        )}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${netMiscPending > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {formatCurrency(netMiscPending)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          miscPaid >= miscBilled ? "bg-emerald-100 text-emerald-800" :
                          miscPaid + miscPoolCovered >= miscBilled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          miscPaid + miscPoolCovered > 0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>
                          {miscPaid >= miscBilled ? "PAID" : miscPaid + miscPoolCovered >= miscBilled ? "PAID (POOL)" : miscPaid + miscPoolCovered > 0 ? "PARTIAL" : "PENDING"}
                        </span>
                      </td>
                    </tr>
                  )}

                  {/* General Advance pool if any */}
                  {generalPaid > 0 && (
                    <tr className="bg-amber-50/40">
                      <td className="py-2.5 font-medium text-slate-700 flex items-center gap-2">
                        <span>📦</span>
                        <div>
                          <div className="font-semibold text-slate-800">General / Unassigned Advance (POOL)</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Customer paid advance without component tag
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-slate-400">—</td>
                      <td className="py-2.5 text-right">
                        <div className="font-bold text-emerald-600">{formatCurrency(generalPaid)}</div>
                        {generalPaid - remainingPoolCalc > 0 && (
                          <div className="text-[9px] text-slate-500 font-medium">
                            {formatCurrency(generalPaid - remainingPoolCalc)} covered to components
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            disabled={allotting}
                            onClick={handleDirectAutoAllot}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition flex items-center gap-1 shadow-2xs"
                            title="Automatically allot pool across pending Flights, Visa, Hotel, and Land"
                          >
                            <span>⚡ 1-Click Auto-Allot</span>
                          </button>
                          <button
                            type="button"
                            onClick={openAllotModal}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <span>Manual Allot</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 border border-amber-300 rounded text-[9px] font-bold">
                          {remainingPoolCalc === 0 ? "POOL FULLY COVERED" : "POOL (AVAILABLE)"}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot>
                  {(() => {
                    const totalSepQuoted = isMergedHotelLand
                      ? (flightBilled + combinedLandHotelBilled + visaBilled + insuranceBilled + miscBilled)
                      : (flightBilled + hotelBilled + landBilled + visaBilled + insuranceBilled + miscBilled);
                    const totalSepPaid = flightPaid + hotelPaid + landPaid + visaPaid + insurancePaid + miscPaid + generalPaid;
                    const effectiveTotalQuoted = (op.sellingPrice && op.sellingPrice > 0)
                      ? op.sellingPrice
                      : (totalSepQuoted > 0 ? totalSepQuoted : (op.sellingPrice || 0));
                    const pendingTotal = Math.max(0, effectiveTotalQuoted - totalSepPaid);
                    return (
                      <tr className="border-t-2 border-slate-200 font-bold bg-slate-50/80">
                        <td className="py-2.5 text-slate-800">Total Billed / Received</td>
                        <td className="py-2.5 text-right text-slate-800">{formatCurrency(effectiveTotalQuoted)}</td>
                        <td className="py-2.5 text-right text-emerald-600">{formatCurrency(totalSepPaid)}</td>
                        <td className={`py-2.5 text-right ${pendingTotal > 0 ? "text-amber-600" : "text-slate-400"}`}>
                          {formatCurrency(pendingTotal)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            totalSepPaid >= effectiveTotalQuoted && effectiveTotalQuoted > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : totalSepPaid > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {totalSepPaid >= effectiveTotalQuoted && effectiveTotalQuoted > 0 ? "100% PAID" : totalSepPaid > 0 ? "PARTIAL" : "PENDING"}
                          </span>
                        </td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>

          {isOutOfSync && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <p className="text-xs text-amber-800">
                Payment schedule total ({formatCurrency(totalBilled)}) differs from current billed amount ({formatCurrency((op as any).effectiveSelling ?? op.sellingPrice)}).
              </p>
              <button onClick={recalculate} className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1 rounded-lg flex items-center gap-1 transition-colors">
                <RefreshCw size={12} /> Sync Now
              </button>
            </div>
          )}
        </>
      );
    })()}
  </div>
);
})()}
          
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
                <div className="flex items-center justify-between"><span className="text-xs font-bold text-cyan-700">#{idx+1} {p.status==="paid"&&<span className="ml-1 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px]">PAID</span>}{p.category === "flight" && <span className="ml-1 bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded text-[9px] font-bold">✈️ FLIGHT</span>}{p.category === "hotel" && <span className="ml-1 bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded text-[9px] font-bold">🏨 HOTEL</span>}{p.category === "land" && <span className="ml-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-bold">🚗 LAND</span>}{p.category === "visa" && <span className="ml-1 bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[9px] font-bold">🛂 VISA</span>}{p.category === "insurance" && <span className="ml-1 bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded text-[9px] font-bold">🛡️ INSURANCE</span>}{p.category === "misc" && <span className="ml-1 bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-bold">🏷️ MISC</span>}{p.status==="partial"&&<span className="ml-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px]">PARTIAL</span>}{p.status==="overdue"&&<span className="ml-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px]">OVERDUE</span>}{p.paymentMode==="razorpay"&&p.status==="paid"&&<span className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px]">VIA LINK</span>}{(p as any).splitFrom&&<span className="ml-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px]">SPLIT</span>}</span><div className="flex gap-2"><button onClick={() => sendReminder(p._id)} className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-bold hover:bg-amber-100 transition-colors"><Bell size={10}/> Remind</button><button onClick={() => generateInvoicePdf({ mode: "single", operationId: op.operationId, customer: op.customers?.[0] || op.customer || {name: 'Unknown', email: '', phone: '', pax: 0}, destination: op.destination, milestone: p.milestone, amount: p.amount, dueDate: p.dueDate, paidAmount: p.paidAmount, status: p.status, paymentLink: p.paymentLinkEnabled ? p.paymentLink : undefined, sellingPrice: op.sellingPrice, allPayments: customerPayments.map(cp => ({ milestone: cp.milestone, amount: cp.amount, paidAmount: cp.paidAmount, status: cp.status })) })} className="flex items-center gap-1 px-2 py-1 bg-cyan-50 text-cyan-700 rounded text-[10px] font-bold"><Download size={10}/> Invoice</button><button onClick={() => saveItem("customer-payments", p._id, customerPayments[idx])} disabled={saving === p._id} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold disabled:opacity-50"><Check size={10}/> {saving === p._id ? "Saving..." : "Save"}</button><button onClick={() => {
                  // If it's a split child and unpaid, show the special modal
                  if ((p as any).splitFrom && (p.paidAmount || 0) === 0) {
                    setDeleteSplitModal({ paymentId: p._id, amount: p.amount, milestone: p.milestone });
                  } else {
                    delItem("customer-payments", p._id);
                  }
                }} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div></div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-max mb-4">
                  <button onClick={() => {const u=[...customerPayments]; u[idx]={...u[idx], _isManual: false}; setCustomerPayments(u);}} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!p._isManual ? "bg-white shadow text-indigo-700" : "text-slate-500 hover:text-slate-700"}`}>Razorpay Link</button>
                  <button onClick={() => {const u=[...customerPayments]; u[idx]={...u[idx], _isManual: true}; setCustomerPayments(u);}} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${p._isManual ? "bg-white shadow text-cyan-700" : "text-slate-500 hover:text-slate-700"}`}>Manual / Offline</button>
                </div>
  
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className="text-[9px] text-slate-400 uppercase block mb-1">Category / Service</label><Sel value={p.category || "all"} onChange={(v)=>{const u=[...customerPayments];u[idx]={...u[idx],category:v as any};setCustomerPayments(u);}} options={[{v:"all",l:"General / Package"},{v:"flight",l:"✈️ Flight & Train"},{v:"hotel",l:"🏨 Hotel & Stay"},{v:"land",l:"🚗 Land & Activities"},{v:"visa",l:"🛂 Visa"},{v:"insurance",l:"🛡️ Insurance"},{v:"misc",l:"🏷️ Misc"}]} /></div>
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
        const actCost = activities.reduce((s, a) => {
          const base = a.vendorCost || 0;
          const transferCost = (a.transfers || []).reduce((ts, tr) => ts + (tr.hasPricing ? (tr.vendorCost || 0) : 0), 0);
          return s + base + transferCost;
        }, 0);
        const visaCost = op.visaCost || 0;
        const insuranceCost = op.insuranceCost || 0;
        const miscList = op.miscCharges || [];
        const miscTotal = miscList.reduce((s, c) => s + (c.amount || 0), 0);
        const total = tCost+aCost+actCost+visaCost+insuranceCost+miscTotal;
        const profit = op.sellingPrice - total;
        const margin = op.sellingPrice>0?Math.round((profit/op.sellingPrice)*100):0;
        const custRcvd = customerPayments.reduce((s,p)=>s+(p.paidAmount||0),0);
        const tPaid = transports.reduce((s, t) => s + (t.paymentStatus?.toLowerCase() === "paid" ? (t.vendorCost || 0) : t.paymentStatus?.toLowerCase() === "partial" ? (t.paidAmount || 0) : 0), 0);
        const aPaid = accommodations.reduce((s, a) => s + (a.paymentStatus?.toLowerCase() === "paid" ? (a.vendorCost || 0) : a.paymentStatus?.toLowerCase() === "partial" ? (a.paidAmount || 0) : 0), 0);
        const actPaid = activities.reduce((s, a) => {
          const basePaid = a.paymentStatus?.toLowerCase() === "paid" ? (a.vendorCost || 0) : a.paymentStatus?.toLowerCase() === "partial" ? (a.paidAmount || 0) : 0;
          const transferPaid = (a.transfers || []).reduce((ts, tr) => ts + (tr.hasPricing ? (tr.paymentStatus?.toLowerCase() === "paid" ? (tr.vendorCost || 0) : tr.paymentStatus?.toLowerCase() === "partial" ? (tr.paidAmount || 0) : 0) : 0), 0);
          return s + basePaid + transferPaid;
        }, 0);
        const vendorPaid = tPaid+aPaid+actPaid;
        return (
          <div className="space-y-4">
            {/* VISA + MISC CHARGES EDITOR */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Additional Costs</h3>
              <div className="space-y-4">
                {/* Visa & Insurance Costs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <label className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0">Visa Cost (₹)</label>
                    <input type="number" min="0" value={op.visaCost || 0} onChange={async (e) => { await api.put(`/operations/${id}`, { visaCost: Number(e.target.value) }); fetchAll(); }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-40" placeholder="0" />
                    <span className="text-xs text-slate-400">Total visa/immigration fees</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <label className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0">Insurance Cost (₹)</label>
                    <input type="number" min="0" value={op.insuranceCost || 0} onChange={async (e) => { await api.put(`/operations/${id}`, { insuranceCost: Number(e.target.value) }); fetchAll(); }} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-40" placeholder="0" />
                    <span className="text-xs text-slate-400">Travel insurance charges</span>
                  </div>
                </div>
                {/* Misc Charges */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-600">Miscellaneous Charges</label>
                    <button onClick={async () => { const updated = [...(op.miscCharges || []), { label: "", amount: 0, isVendorCost: false }]; await api.put(`/operations/${id}`, { miscCharges: updated }); fetchAll(); }} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold hover:bg-slate-200"><Plus size={11} /> Add Charge</button>
                  </div>
                  {(op.miscCharges || []).length === 0 && <p className="text-xs text-slate-400 italic">No misc charges yet. Click "+ Add Charge" to add.</p>}
                  <div className="space-y-2">
                    {(op.miscCharges || []).map((mc, mci) => (
                      <div key={mci} className="flex items-center gap-2">
                        <input type="text" value={mc.label} onChange={async (e) => { const updated = [...(op.miscCharges || [])]; updated[mci] = { ...updated[mci], label: e.target.value }; await api.put(`/operations/${id}`, { miscCharges: updated }); fetchAll(); }} placeholder="Label (e.g. Tipping, Gratuity)" className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 flex-1" />
                        <input type="number" min="0" value={mc.amount} onChange={async (e) => { const updated = [...(op.miscCharges || [])]; updated[mci] = { ...updated[mci], amount: Number(e.target.value) }; await api.put(`/operations/${id}`, { miscCharges: updated }); fetchAll(); }} placeholder="Amount" className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-28" />
                        <label className="flex items-center gap-1 text-[11px] text-slate-500 whitespace-nowrap"><input type="checkbox" checked={mc.isVendorCost} onChange={async (e) => { const updated = [...(op.miscCharges || [])]; updated[mci] = { ...updated[mci], isVendorCost: e.target.checked }; await api.put(`/operations/${id}`, { miscCharges: updated }); fetchAll(); }} className="rounded" /> Vendor Cost</label>
                        <button onClick={async () => { const updated = (op.miscCharges || []).filter((_, fi) => fi !== mci); await api.put(`/operations/${id}`, { miscCharges: updated }); fetchAll(); }} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6"><h3 className="text-sm font-bold text-slate-800 mb-4">Profit & Loss</h3><div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Selling Price</span><span className="text-sm font-bold">{formatCurrency(op.sellingPrice)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Flights & Trains ({transports.length})</span><span className="text-sm text-red-600">-{formatCurrency(tCost)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Accommodation ({accommodations.length})</span><span className="text-sm text-red-600">-{formatCurrency(aCost)}</span></div>
              <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Itinerary Days & Transfers ({activities.length})</span><span className="text-sm text-red-600">-{formatCurrency(actCost)}</span></div>
              {visaCost > 0 && <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Visa Cost</span><span className="text-sm text-red-600">-{formatCurrency(visaCost)}</span></div>}
              {insuranceCost > 0 && <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">Insurance Cost</span><span className="text-sm text-red-600">-{formatCurrency(insuranceCost)}</span></div>}
              {miscList.map((c, ci) => (<div key={ci} className="flex justify-between py-2 border-b border-slate-100"><span className="text-sm text-slate-600">{c.label || "Misc Charge"}</span><span className="text-sm text-red-600">-{formatCurrency(c.amount)}</span></div>))}
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
            </div>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gender</label>
                  <select value={newPassenger.gender || ""} onChange={e => setNewPassenger({...newPassenger, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="">-- Select Gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Birth</label>
                  {newPassenger.age !== "" && (
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                      {newPassenger.age} yrs
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={newPassenger.dob || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const calculatedAge = calculateAgeFromDob(val);
                    let autoType = newPassenger.type;
                    if (calculatedAge !== undefined) {
                      if (calculatedAge < 2) autoType = "infant";
                      else if (calculatedAge < 12) autoType = "child";
                      else autoType = "adult";
                    }
                    setNewPassenger({
                      ...newPassenger,
                      dob: val,
                      age: calculatedAge !== undefined ? String(calculatedAge) : "",
                      type: autoType,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <p className="text-[9px] text-slate-400 mt-0.5">Optional · Age is calculated automatically</p>
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

              {/* Extra Billing / Group Booking Setting */}
              <div className="pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 px-5 py-3 rounded-b-none space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={billExtra}
                    onChange={(e) => setBillExtra(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">Charge extra for this passenger</span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Add flight tickets, land package, or visa cost. This will increase the quoted amount and be added as an upcoming payment.
                    </p>
                  </div>
                </label>

                {billExtra && (
                  <div className="mt-2 pl-6 space-y-3">
                    {/* Flight component */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={passengerFlightEnabled}
                            onChange={(e) => setPassengerFlightEnabled(e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                          />
                          <span className="text-xs font-bold text-slate-800">✈️ Flight Cost for this Passenger</span>
                        </div>
                        {passengerFlightEnabled && (
                          <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-bold">
                            Adds to Quoted Flights
                          </span>
                        )}
                      </label>
                      {passengerFlightEnabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={passengerFlightPrice}
                            onChange={(e) => setPassengerFlightPrice(e.target.value)}
                            placeholder="e.g. 150000"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Land / Stay component */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={passengerLandEnabled}
                            onChange={(e) => setPassengerLandEnabled(e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                          />
                          <span className="text-xs font-bold text-slate-800">🚗 Land Package & Stay for this Passenger</span>
                        </div>
                        {passengerLandEnabled && (
                          <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-bold">
                            Adds to Quoted Land
                          </span>
                        )}
                      </label>
                      {passengerLandEnabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={passengerLandPrice}
                            onChange={(e) => setPassengerLandPrice(e.target.value)}
                            placeholder="e.g. 80000"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Visa component */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <label className="flex items-center justify-between cursor-pointer select-none">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={passengerVisaEnabled}
                            onChange={(e) => setPassengerVisaEnabled(e.target.checked)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
                          />
                          <span className="text-xs font-bold text-slate-800">🛂 Visa Fee for this Passenger</span>
                        </div>
                        {passengerVisaEnabled && (
                          <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-bold">
                            Adds to Quoted Visa
                          </span>
                        )}
                      </label>
                      {passengerVisaEnabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">₹</span>
                          <input
                            type="number"
                            min={0}
                            value={passengerVisaPrice}
                            onChange={(e) => setPassengerVisaPrice(e.target.value)}
                            placeholder="e.g. 10000"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Lump-Sum if components not selected */}
                    {!passengerFlightEnabled && !passengerLandEnabled && !passengerVisaEnabled && (
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                          Lump-Sum Extra Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={extraAmount}
                          onChange={(e) => setExtraAmount(e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    )}

                    {/* Total Summary */}
                    {(() => {
                      const totalPaxCharge = (passengerFlightEnabled ? Number(passengerFlightPrice) || 0 : 0) +
                        (passengerLandEnabled ? Number(passengerLandPrice) || 0 : 0) +
                        (passengerVisaEnabled ? Number(passengerVisaPrice) || 0 : 0) +
                        (!passengerFlightEnabled && !passengerLandEnabled && !passengerVisaEnabled ? Number(extraAmount) || 0 : 0);
                      return (
                        <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-700 font-bold block">Total Billed for Passenger:</span>
                            <span className="text-[10px] text-sky-800 font-medium">Increases Quoted & Pending Balance</span>
                          </div>
                          <span className="text-base font-black text-sky-950">{formatCurrency(totalPaxCharge)}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
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
      {/* Edit Customer Details Modal */}
      {editCustomerModalOpen && editCustomerData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Edit Customer Details</h3>
                <p className="text-xs text-slate-500 mt-1">Update the primary traveller info for this booking.</p>
              </div>
              <button onClick={() => setEditCustomerModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <Inp value={editCustomerData.firstName} onChange={(v) => setEditCustomerData({ ...editCustomerData, firstName: v })} placeholder="First Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <Inp value={editCustomerData.lastName} onChange={(v) => setEditCustomerData({ ...editCustomerData, lastName: v })} placeholder="Last Name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <Inp value={editCustomerData.email} onChange={(v) => setEditCustomerData({ ...editCustomerData, email: v })} placeholder="Email Address" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <Inp value={editCustomerData.phone} onChange={(v) => setEditCustomerData({ ...editCustomerData, phone: v })} placeholder="Phone Number" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editCustomerData.gender || ""}
                    onChange={(e) => setEditCustomerData({ ...editCustomerData, gender: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={editCustomerData.dob || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const calculatedAge = calculateAgeFromDob(val);
                      setEditCustomerData({
                        ...editCustomerData,
                        dob: val,
                        age: calculatedAge !== undefined ? String(calculatedAge) : editCustomerData.age,
                      });
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card (Optional)</label>
                <Inp value={editCustomerData.panCard || ""} onChange={(v) => setEditCustomerData({ ...editCustomerData, panCard: v.toUpperCase() })} placeholder="PAN Number" />
              </div>

              {/* Passport Details (Important for International Trips) */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Passport Details {op?.package?.isInternational ? <span className="text-amber-600 font-semibold">(International Trip)</span> : "(Optional)"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Passport Number</label>
                    <Inp
                      value={editCustomerData.passportNumber || ""}
                      onChange={(v) => setEditCustomerData({ ...editCustomerData, passportNumber: v.toUpperCase() })}
                      placeholder="e.g. Z1234567"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={editCustomerData.passportExpiry || ""}
                        onChange={(e) => setEditCustomerData({ ...editCustomerData, passportExpiry: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Country</label>
                      <Inp
                        value={editCustomerData.issuingCountry || ""}
                        onChange={(v) => setEditCustomerData({ ...editCustomerData, issuingCountry: v })}
                        placeholder="e.g. India"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
              <button onClick={() => setEditCustomerModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={saveCustomerDetails} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 text-white transition-colors flex items-center gap-2">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Passenger Details Modal */}
      {editPassengerModalOpen && editPassengerData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Edit Passenger Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Update passenger name, demographic, and document details.</p>
              </div>
              <button
                onClick={() => setEditPassengerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Inp
                  value={editPassengerData.name}
                  onChange={(v) => setEditPassengerData({ ...editPassengerData, name: v })}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={editPassengerData.type}
                    onChange={(e) => setEditPassengerData({ ...editPassengerData, type: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="adult">Adult</option>
                    <option value="child">Child</option>
                    <option value="infant">Infant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={editPassengerData.gender}
                    onChange={(e) => setEditPassengerData({ ...editPassengerData, gender: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={editPassengerData.dob}
                    onChange={(e) => {
                      const val = e.target.value;
                      const calculatedAge = calculateAgeFromDob(val);
                      let autoType = editPassengerData.type;
                      if (calculatedAge !== undefined) {
                        if (calculatedAge < 2) autoType = "infant";
                        else if (calculatedAge < 12) autoType = "child";
                        else autoType = "adult";
                      }
                      setEditPassengerData({
                        ...editPassengerData,
                        dob: val,
                        age: calculatedAge !== undefined ? String(calculatedAge) : editPassengerData.age,
                        type: autoType,
                      });
                    }}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <Inp
                    type="number"
                    value={editPassengerData.age}
                    onChange={(v) => setEditPassengerData({ ...editPassengerData, age: v })}
                    placeholder="e.g. 35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <Inp
                    type="email"
                    value={editPassengerData.email || ""}
                    onChange={(v) => setEditPassengerData({ ...editPassengerData, email: v })}
                    placeholder="passenger@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                  <Inp
                    value={editPassengerData.phone || ""}
                    onChange={(v) => setEditPassengerData({ ...editPassengerData, phone: v })}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Passport Details (Optional)</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Passport Number</label>
                    <Inp
                      value={editPassengerData.passportNumber || ""}
                      onChange={(v) => setEditPassengerData({ ...editPassengerData, passportNumber: v })}
                      placeholder="e.g. Z1234567"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={editPassengerData.passportExpiry || ""}
                        onChange={(e) => setEditPassengerData({ ...editPassengerData, passportExpiry: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Issuing Country</label>
                      <Inp
                        value={editPassengerData.issuingCountry || ""}
                        onChange={(v) => setEditPassengerData({ ...editPassengerData, issuingCountry: v })}
                        placeholder="e.g. India"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Card (Optional)</label>
                <Inp
                  value={editPassengerData.panCard || ""}
                  onChange={(v) => setEditPassengerData({ ...editPassengerData, panCard: v.toUpperCase() })}
                  placeholder="e.g. ABCDE1234F"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => setEditPassengerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePassengerDetails}
                disabled={savingPassenger}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <Save size={14} />
                {savingPassenger ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Split Installment Modal */}
      {deleteSplitModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Delete Split Installment</h3>
              <p className="text-xs text-slate-500 mt-1">
                You're deleting <span className="font-semibold text-slate-700">"{deleteSplitModal.milestone}"</span> (₹{deleteSplitModal.amount.toLocaleString('en-IN')}). 
                This was split from a parent installment. What should happen to this amount?
              </p>
            </div>

            <div className="p-5 space-y-3">
              {/* Option 1: Add Back */}
              <button
                onClick={() => deleteSplitPayment(deleteSplitModal.paymentId, true)}
                className="w-full text-left p-4 border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 flex-shrink-0 mt-0.5">↩</div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Add Back to Parent</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Delete this installment and <strong>restore ₹{deleteSplitModal.amount.toLocaleString('en-IN')} back</strong> to the original installment it was split from. Customer's total stays the same.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Eliminate */}
              <button
                onClick={() => deleteSplitPayment(deleteSplitModal.paymentId, false)}
                className="w-full text-left p-4 border-2 border-red-200 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-700 flex-shrink-0 mt-0.5">✕</div>
                  <div>
                    <p className="text-sm font-bold text-red-800">Eliminate (Reduce Total)</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Delete this installment and <strong>reduce the customer's total by ₹{deleteSplitModal.amount.toLocaleString('en-IN')}</strong>. Use this if you're giving a discount or adjusting the booking amount.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDeleteSplitModal(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allot Advance to Components Modal */}
      {allotModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>⚡</span> Allot Advance Payments to Components
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transfer unassigned general advances to Flights, Land Package, Hotels, etc.
                </p>
              </div>
              <button
                onClick={() => setAllotModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Pool Status Box */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 block">Total Unassigned Advance Pool</span>
                  <span className="text-lg font-black text-amber-900">{formatCurrency(generalPaid)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      let pool = generalPaid;
                      const f = Math.min(pool, Math.max(0, flightBilled - flightPaid));
                      pool = Math.max(0, pool - f);
                      const v = Math.min(pool, Math.max(0, visaBilled - visaPaid));
                      pool = Math.max(0, pool - v);
                      const ins = Math.min(pool, Math.max(0, insuranceBilled - insurancePaid));
                      pool = Math.max(0, pool - ins);
                      const h = Math.min(pool, Math.max(0, hotelBilled - hotelPaid));
                      pool = Math.max(0, pool - h);
                      const l = Math.min(pool, Math.max(0, landBilled - landPaid));
                      pool = Math.max(0, pool - l);
                      const m = Math.min(pool, Math.max(0, miscBilled - miscPaid));
                      setAllotAmounts({ flight: f, land: l, hotel: h, visa: v, insurance: ins, misc: m });
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  >
                    <span>⚡ 1-Click Auto-Allot</span>
                  </button>
                </div>
              </div>

              {/* Component Rows */}
              <div className="space-y-3">
                {/* Flight */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">✈️</span>
                      <span className="text-xs font-bold text-slate-800">Flights & Trains</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Quoted: {formatCurrency(flightBilled)} | Paid: {formatCurrency(flightPaid)}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                      Pending needed: {formatCurrency(Math.max(0, flightBilled - flightPaid))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:w-48">
                    <span className="text-xs font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={allotAmounts.flight || ""}
                      onChange={(e) => setAllotAmounts({ ...allotAmounts, flight: Math.max(0, Number(e.target.value)) })}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Land & Hotel Rows: Either Merged or Separate */}
                {isMergedHotelLand ? (
                  /* Combined Land Package & Stay */
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏨🚗</span>
                        <span className="text-xs font-bold text-slate-800">Land Package & Accommodations</span>
                        <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-semibold border border-sky-100">Combined</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        Quoted: {formatCurrency(combinedLandHotelBilled)} | Paid: {formatCurrency(combinedLandHotelPaid)}
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium block">
                        Pending needed: {formatCurrency(Math.max(0, combinedLandHotelBilled - combinedLandHotelPaid))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:w-48">
                      <span className="text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={allotAmounts.land || ""}
                        onChange={(e) => setAllotAmounts({ ...allotAmounts, land: Math.max(0, Number(e.target.value)), hotel: 0 })}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Separate Land Package */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🚗</span>
                          <span className="text-xs font-bold text-slate-800">Land Package & Activities</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Quoted: {formatCurrency(landBilled)} | Paid: {formatCurrency(landPaid)}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                          Pending needed: {formatCurrency(Math.max(0, landBilled - landPaid))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:w-48">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={allotAmounts.land || ""}
                          onChange={(e) => setAllotAmounts({ ...allotAmounts, land: Math.max(0, Number(e.target.value)) })}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Separate Hotel */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🏨</span>
                          <span className="text-xs font-bold text-slate-800">Hotel & Stay</span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Quoted: {formatCurrency(hotelBilled)} | Paid: {formatCurrency(hotelPaid)}
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                          Pending needed: {formatCurrency(Math.max(0, hotelBilled - hotelPaid))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:w-48">
                        <span className="text-xs font-bold text-slate-500">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={allotAmounts.hotel || ""}
                          onChange={(e) => setAllotAmounts({ ...allotAmounts, hotel: Math.max(0, Number(e.target.value)) })}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Visa */}
                {(visaBilled > 0 || allotAmounts.visa > 0) && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🛂</span>
                        <span className="text-xs font-bold text-slate-800">Visa Fees</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Quoted: {formatCurrency(visaBilled)} | Paid: {formatCurrency(visaPaid)}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                        Pending needed: {formatCurrency(Math.max(0, visaBilled - visaPaid))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:w-48">
                      <span className="text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={allotAmounts.visa || ""}
                        onChange={(e) => setAllotAmounts({ ...allotAmounts, visa: Math.max(0, Number(e.target.value)) })}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* Insurance */}
                {(insuranceBilled > 0 || allotAmounts.insurance > 0) && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🛡️</span>
                        <span className="text-xs font-bold text-slate-800">Travel Insurance</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Quoted: {formatCurrency(insuranceBilled)} | Paid: {formatCurrency(insurancePaid)}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                        Pending needed: {formatCurrency(Math.max(0, insuranceBilled - insurancePaid))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:w-48">
                      <span className="text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={allotAmounts.insurance || ""}
                        onChange={(e) => setAllotAmounts({ ...allotAmounts, insurance: Math.max(0, Number(e.target.value)) })}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* Misc */}
                {(miscBilled > 0 || allotAmounts.misc > 0) && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🏷️</span>
                        <span className="text-xs font-bold text-slate-800">Misc Charges</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Quoted: {formatCurrency(miscBilled)} | Paid: {formatCurrency(miscPaid)}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                        Pending needed: {formatCurrency(Math.max(0, miscBilled - miscPaid))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:w-48">
                      <span className="text-xs font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min={0}
                        value={allotAmounts.misc || ""}
                        onChange={(e) => setAllotAmounts({ ...allotAmounts, misc: Math.max(0, Number(e.target.value)) })}
                        placeholder="0"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              {(() => {
                const totalAllot = (allotAmounts.flight || 0) + (allotAmounts.land || 0) + (allotAmounts.hotel || 0) + (allotAmounts.visa || 0) + (allotAmounts.insurance || 0) + (allotAmounts.misc || 0);
                const rem = generalPaid - totalAllot;
                const isOver = rem < 0;
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isOver ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Being Allotted</span>
                      <span className={`text-sm font-bold ${isOver ? 'text-red-700' : 'text-slate-800'}`}>
                        {formatCurrency(totalAllot)} of {formatCurrency(generalPaid)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        {isOver ? "Exceeds Pool By" : "Remaining in Pool"}
                      </span>
                      <span className={`text-sm font-bold ${isOver ? 'text-red-700' : 'text-emerald-700'}`}>
                        {formatCurrency(Math.abs(rem))}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToPool}
                disabled={allotting}
                className="text-xs font-semibold text-slate-500 hover:text-red-600 transition underline disabled:opacity-50"
              >
                Reset All Payments to Pool
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAllotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAllot}
                  disabled={allotting || ((allotAmounts.flight || 0) + (allotAmounts.land || 0) + (allotAmounts.hotel || 0) + (allotAmounts.visa || 0) + (allotAmounts.insurance || 0) + (allotAmounts.misc || 0)) <= 0 || ((allotAmounts.flight || 0) + (allotAmounts.land || 0) + (allotAmounts.hotel || 0) + (allotAmounts.visa || 0) + (allotAmounts.insurance || 0) + (allotAmounts.misc || 0)) > generalPaid}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                >
                  {allotting ? "Allotting..." : "Confirm & Allot in Database"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
