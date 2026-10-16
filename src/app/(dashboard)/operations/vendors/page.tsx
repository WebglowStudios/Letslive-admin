"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Save,
  Search,
  ArrowLeft,
  ExternalLink,
  X,
  Building2,
  Plane,
  Car,
  Compass,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Receipt,
  Users,
  MapPin,
  Phone,
  Mail,
  Edit3,
  RefreshCw,
  Calendar,
  Layers,
  Check,
} from "lucide-react";
import Link from "next/link";

interface VendorStats {
  totalCost: number;
  totalPaid: number;
  pendingBalance: number;
  bookingsCount: number;
  servicesCount: number;
}

interface Vendor {
  _id: string;
  name: string;
  type: string;
  contactPerson: string;
  phone: string;
  email: string;
  bankDetails: string;
  gstNumber: string;
  address: string;
  notes: string;
  stats?: VendorStats;
}

interface AssignedPart {
  _id: string;
  category: "accommodation" | "transport" | "activity" | "transfer";
  title: string;
  subtitle: string;
  type?: string;
  vendorCost: number;
  paidAmount: number;
  paymentStatus: "pending" | "paid" | "partial";
  paymentDueDate?: string;
  remarks?: string;
  details?: Record<string, any>;
}

interface VendorBookingGroup {
  operationId: string;
  operationObjectId: string | null;
  destination: string;
  travelDates: { start?: string; end?: string } | null;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    pax: number;
  };
  status: string;
  totals: {
    cost: number;
    paid: number;
    pending: number;
  };
  parts: AssignedPart[];
}

interface VendorPaymentRecord {
  _id: string;
  operationId?: string;
  operationObjectId?: string;
  destination?: string;
  customerName?: string;
  serviceType: string;
  description: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate?: string;
  paidDate?: string;
  paymentMode?: string;
  transactionId?: string;
  remarks?: string;
}

interface AssignmentsData {
  vendor: Vendor;
  stats: VendorStats;
  bookings: VendorBookingGroup[];
  payments: VendorPaymentRecord[];
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "assigned">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Vendor>>({});

  // Assignments Modal state
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsData, setAssignmentsData] = useState<AssignmentsData | null>(null);
  const [assignmentTab, setAssignmentTab] = useState<"bookings" | "payments">("bookings");
  const [bookingSearch, setBookingSearch] = useState("");

  // Quick Payment Update state
  const [updatingPaymentItem, setUpdatingPaymentItem] = useState<{
    category: string;
    serviceId: string;
    title: string;
    cost: number;
    paid: number;
    status: string;
    dueDate?: string;
    remarks?: string;
  } | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    try {
      const res = await api.get("/vendors");
      setVendors(res?.data || []);
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  async function openAssignmentsModal(v: Vendor) {
    setActiveVendor(v);
    setAssignmentsLoading(true);
    setAssignmentsData(null);
    setAssignmentTab("bookings");
    setBookingSearch("");
    try {
      const res = await api.get(`/vendors/${v._id}/assignments`);
      if (res?.data) {
        setAssignmentsData(res.data);
      }
    } catch {
      alert("Failed to load vendor assignments");
    } finally {
      setAssignmentsLoading(false);
    }
  }

  async function refreshActiveAssignments() {
    if (!activeVendor) return;
    setAssignmentsLoading(true);
    try {
      const res = await api.get(`/vendors/${activeVendor._id}/assignments`);
      if (res?.data) {
        setAssignmentsData(res.data);
        // Also refresh vendor in background to update card stats
        fetchVendors();
      }
    } catch {
      // silent
    } finally {
      setAssignmentsLoading(false);
    }
  }

  async function handleQuickPaymentSave() {
    if (!activeVendor || !updatingPaymentItem) return;
    setSavingPayment(true);
    try {
      await api.put(
        `/vendors/${activeVendor._id}/assignments/${updatingPaymentItem.category}/${updatingPaymentItem.serviceId}/payment`,
        {
          paymentStatus: updatingPaymentItem.status,
          paidAmount: updatingPaymentItem.paid,
          paymentDueDate: updatingPaymentItem.dueDate || null,
          remarks: updatingPaymentItem.remarks || "",
        }
      );
      setUpdatingPaymentItem(null);
      await refreshActiveAssignments();
    } catch {
      alert("Failed to update payment");
    } finally {
      setSavingPayment(false);
    }
  }

  async function addVendor() {
    try {
      const res = await api.post("/vendors", { name: "New Vendor", type: "mixed" });
      if (res?.data) {
        setVendors([res.data, ...vendors]);
        setEditing(res.data._id);
        setForm(res.data);
      }
    } catch {
      alert("Failed to create vendor");
    }
  }

  async function saveVendor() {
    if (!editing || !form.name?.trim()) return;
    try {
      const res = await api.put(`/vendors/${editing}`, form);
      if (res?.data) {
        setVendors(vendors.map((v) => (v._id === editing ? { ...v, ...res.data } : v)));
        setEditing(null);
        setForm({});
      }
    } catch {
      alert("Failed to save");
    }
  }

  async function deleteVendor(id: string) {
    if (!confirm("Delete this vendor?")) return;
    try {
      await api.del(`/vendors/${id}`);
      setVendors(vendors.filter((v) => v._id !== id));
      if (activeVendor?._id === id) setActiveVendor(null);
    } catch {
      alert("Failed to delete");
    }
  }

  // Filter vendors
  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      // Type filter
      if (typeFilter !== "all" && v.type !== typeFilter) return false;

      // Status filter
      if (statusFilter === "pending" && (v.stats?.pendingBalance || 0) <= 0) return false;
      if (statusFilter === "paid" && ((v.stats?.pendingBalance || 0) > 0 || (v.stats?.totalCost || 0) === 0)) return false;
      if (statusFilter === "assigned" && (v.stats?.servicesCount || 0) === 0) return false;

      // Search
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (v.name || "").toLowerCase().includes(q) ||
        (v.type || "").toLowerCase().includes(q) ||
        (v.contactPerson || "").toLowerCase().includes(q) ||
        (v.phone || "").toLowerCase().includes(q) ||
        (v.email || "").toLowerCase().includes(q)
      );
    });
  }, [vendors, search, typeFilter, statusFilter]);

  // Overall stats
  const aggregateStats = useMemo(() => {
    return vendors.reduce(
      (acc, v) => {
        acc.totalCost += v.stats?.totalCost || 0;
        acc.totalPaid += v.stats?.totalPaid || 0;
        acc.pendingBalance += v.stats?.pendingBalance || 0;
        acc.servicesCount += v.stats?.servicesCount || 0;
        return acc;
      },
      { totalCost: 0, totalPaid: 0, pendingBalance: 0, servicesCount: 0 }
    );
  }, [vendors]);

  // Filtered bookings in assignments modal
  const filteredBookings = useMemo(() => {
    if (!assignmentsData) return [];
    if (!bookingSearch.trim()) return assignmentsData.bookings;
    const q = bookingSearch.toLowerCase();
    return assignmentsData.bookings.filter((b) => {
      const matchOp = (b.operationId || "").toLowerCase().includes(q);
      const matchDest = (b.destination || "").toLowerCase().includes(q);
      const matchCust = (b.customer.name || "").toLowerCase().includes(q);
      const matchPart = b.parts.some(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.subtitle || "").toLowerCase().includes(q) ||
          (p.remarks || "").toLowerCase().includes(q)
      );
      return matchOp || matchDest || matchCust || matchPart;
    });
  }, [assignmentsData, bookingSearch]);

  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case "flight":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "hotel":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "vehicle":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "activity":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={11} /> Paid
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
            <Clock size={11} /> Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
            <AlertCircle size={11} /> Pending
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "accommodation":
        return <Building2 size={14} className="text-amber-600" />;
      case "transport":
        return <Plane size={14} className="text-blue-600" />;
      case "activity":
        return <Compass size={14} className="text-purple-600" />;
      case "transfer":
        return <Car size={14} className="text-emerald-600" />;
      default:
        return <Layers size={14} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/operations"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Directory & Financials</h1>
            <p className="text-xs text-slate-500">
              Track vendor payments, balances, and inspect exactly which booking parts are assigned to each vendor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchVendors}
            className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Refresh vendor balances"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={addVendor}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700 shadow-sm transition"
          >
            <Plus size={14} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Aggregate Financial Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Vendors</span>
            <Users size={16} className="text-cyan-600" />
          </div>
          <div className="text-xl font-bold text-slate-800">{vendors.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {vendors.filter((v) => (v.stats?.servicesCount || 0) > 0).length} actively assigned
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Assigned Cost</span>
            <Receipt size={16} className="text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatCurrency(aggregateStats.totalCost)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Across {aggregateStats.servicesCount} assigned parts
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Paid</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {formatCurrency(aggregateStats.totalPaid)}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">
            {aggregateStats.totalCost > 0
              ? `${Math.round((aggregateStats.totalPaid / aggregateStats.totalCost) * 100)}% settled`
              : "No cost logged"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Balance</span>
            <CreditCard size={16} />
          </div>
          <div className={`text-xl font-bold ${aggregateStats.pendingBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {formatCurrency(aggregateStats.pendingBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {aggregateStats.pendingBalance > 0 ? "Payables outstanding" : "All cleared"}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-md">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors by name, contact, phone, email..."
            className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            {["all", "hotel", "flight", "vehicle", "activity", "mixed"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md capitalize transition ${
                  typeFilter === t ? "bg-white text-slate-900 shadow-xs font-semibold" : "hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none"
          >
            <option value="all">All Vendors</option>
            <option value="pending">Pending Balance &gt; ₹0</option>
            <option value="paid">Fully Settled</option>
            <option value="assigned">Assigned Bookings Only</option>
          </select>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading vendors and calculating live balances...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
          No vendors found matching your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const stats = v.stats || {
              totalCost: 0,
              totalPaid: 0,
              pendingBalance: 0,
              bookingsCount: 0,
              servicesCount: 0,
            };
            const percentPaid = stats.totalCost > 0 ? Math.min(100, Math.round((stats.totalPaid / stats.totalCost) * 100)) : 100;

            return (
              <div
                key={v._id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
              >
                {editing === v._id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase block mb-1">Name *</label>
                        <input
                          type="text"
                          value={form.name || ""}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase block mb-1">Type</label>
                        <select
                          value={form.type || "mixed"}
                          onChange={(e) => setForm({ ...form, type: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="flight">Flight</option>
                          <option value="hotel">Hotel</option>
                          <option value="vehicle">Vehicle</option>
                          <option value="activity">Activity</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase block mb-1">Contact Person</label>
                        <input
                          type="text"
                          value={form.contactPerson || ""}
                          onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase block mb-1">Phone</label>
                        <input
                          type="text"
                          value={form.phone || ""}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase block mb-1">Email</label>
                        <input
                          type="email"
                          value={form.email || ""}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase block mb-1">GST Number</label>
                        <input
                          type="text"
                          value={form.gstNumber || ""}
                          onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase block mb-1">Bank Details</label>
                      <input
                        type="text"
                        value={form.bankDetails || ""}
                        onChange={(e) => setForm({ ...form, bankDetails: e.target.value })}
                        placeholder="Account no / IFSC / Bank name"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase block mb-1">Address</label>
                      <input
                        type="text"
                        value={form.address || ""}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveVendor}
                        className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                      >
                        <Save size={12} /> Save
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setForm({});
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${getTypeBadgeColor(
                              v.type
                            )}`}
                          >
                            {v.type}
                          </span>
                        </div>
                        {v.contactPerson && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="text-slate-400">Contact:</span> {v.contactPerson}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(v._id);
                            setForm(v);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-700 text-xs flex items-center gap-1 transition"
                          title="Edit vendor profile"
                        >
                          <Edit3 size={14} />
                          <span className="hidden sm:inline text-[11px] font-medium">Edit</span>
                        </button>
                        <button
                          onClick={() => deleteVendor(v._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                          title="Delete vendor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 mb-4 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                      {v.phone && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          <a href={`tel:${v.phone}`} className="hover:text-cyan-600 truncate">
                            {v.phone}
                          </a>
                        </p>
                      )}
                      {v.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <a href={`mailto:${v.email}`} className="hover:text-cyan-600 truncate" title={v.email}>
                            {v.email}
                          </a>
                        </p>
                      )}
                      {v.gstNumber && (
                        <p className="truncate text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-400">GST:</span> {v.gstNumber}
                        </p>
                      )}
                      {v.bankDetails && (
                        <p className="truncate text-[11px] text-slate-500" title={v.bankDetails}>
                          <span className="font-semibold text-slate-400">Bank:</span> {v.bankDetails}
                        </p>
                      )}
                    </div>

                    {/* Financial Summary Strip */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 mb-4">
                      <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200">
                        <div className="px-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Assigned Cost</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">
                            {formatCurrency(stats.totalCost)}
                          </p>
                        </div>
                        <div className="px-1">
                          <p className="text-[10px] uppercase font-bold text-emerald-600">Total Paid</p>
                          <p className="text-sm font-bold text-emerald-600 mt-0.5">
                            {formatCurrency(stats.totalPaid)}
                          </p>
                        </div>
                        <div className="px-1">
                          <p className="text-[10px] uppercase font-bold text-amber-600">Pending</p>
                          <p
                            className={`text-sm font-bold mt-0.5 ${
                              stats.pendingBalance > 0 ? "text-amber-600" : "text-emerald-600"
                            }`}
                          >
                            {formatCurrency(stats.pendingBalance)}
                          </p>
                        </div>
                      </div>

                      {/* Settlement progress bar */}
                      {stats.totalCost > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span>Settled: {percentPaid}%</span>
                            <span>
                              {stats.bookingsCount} Booking{stats.bookingsCount !== 1 ? "s" : ""} •{" "}
                              {stats.servicesCount} Part{stats.servicesCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Assigned Bookings Button */}
                    <button
                      onClick={() => openAssignmentsModal(v)}
                      className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                        stats.servicesCount > 0
                          ? "bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100"
                          : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      <Receipt size={14} className="text-cyan-700" />
                      <span>
                        {stats.servicesCount > 0
                          ? `View Assigned Bookings & Payments (${stats.bookingsCount} Bookings, ${stats.servicesCount} Parts)`
                          : "View Assigned Bookings & Payments (0)"}
                      </span>
                      <ExternalLink size={12} className="opacity-60 ml-auto" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VENDOR ASSIGNMENTS & PAYMENTS MODAL                                       */}
      {/* ========================================================================= */}
      {activeVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{activeVendor.name}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${getTypeBadgeColor(
                      activeVendor.type
                    )}`}
                  >
                    {activeVendor.type}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                  {activeVendor.contactPerson && (
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" /> {activeVendor.contactPerson}
                    </span>
                  )}
                  {activeVendor.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" /> {activeVendor.phone}
                    </span>
                  )}
                  {activeVendor.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" /> {activeVendor.email}
                    </span>
                  )}
                  {activeVendor.bankDetails && (
                    <span className="text-[11px] text-slate-400">
                      Bank: {activeVendor.bankDetails}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={refreshActiveAssignments}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition"
                  title="Refresh data"
                >
                  <RefreshCw size={14} className={assignmentsLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setActiveVendor(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Financial KPI Cards */}
            {assignmentsData && (
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total Assigned Cost</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">
                      {formatCurrency(assignmentsData.stats.totalCost)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {assignmentsData.stats.servicesCount} parts assigned
                    </p>
                  </div>
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Total Paid</p>
                    <p className="text-lg font-bold text-emerald-600 mt-0.5">
                      {formatCurrency(assignmentsData.stats.totalPaid)}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {assignmentsData.stats.totalCost > 0
                        ? `${Math.round(
                            (assignmentsData.stats.totalPaid / assignmentsData.stats.totalCost) * 100
                          )}% settled`
                        : "No costs"}
                    </p>
                  </div>
                  <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                    <p className="text-[10px] uppercase font-bold text-amber-700">Pending Balance</p>
                    <p
                      className={`text-lg font-bold mt-0.5 ${
                        assignmentsData.stats.pendingBalance > 0 ? "text-amber-700" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(assignmentsData.stats.pendingBalance)}
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      {assignmentsData.stats.pendingBalance > 0 ? "To be paid" : "Zero due"}
                    </p>
                  </div>
                  <div className="bg-cyan-50/70 p-3 rounded-xl border border-cyan-100">
                    <p className="text-[10px] uppercase font-bold text-cyan-700">Bookings / Ops</p>
                    <p className="text-lg font-bold text-cyan-800 mt-0.5">
                      {assignmentsData.stats.bookingsCount}
                    </p>
                    <p className="text-[11px] text-cyan-700 mt-0.5">
                      {assignmentsData.payments.length} payment records
                    </p>
                  </div>
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setAssignmentTab("bookings")}
                      className={`px-3 py-1.5 rounded-md transition ${
                        assignmentTab === "bookings"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Assigned Bookings ({assignmentsData.bookings.length})
                    </button>
                    <button
                      onClick={() => setAssignmentTab("payments")}
                      className={`px-3 py-1.5 rounded-md transition ${
                        assignmentTab === "payments"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Payment History ({assignmentsData.payments.length})
                    </button>
                  </div>

                  {assignmentTab === "bookings" && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs flex-1 max-w-xs">
                      <Search size={14} className="text-slate-400" />
                      <input
                        type="text"
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        placeholder="Search booking ID, customer, hotel..."
                        className="bg-transparent border-none outline-none w-full text-xs"
                      />
                      {bookingSearch && (
                        <button onClick={() => setBookingSearch("")} className="text-slate-400 hover:text-slate-600">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Body Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
              {assignmentsLoading ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading booking assignments and services...
                </div>
              ) : !assignmentsData ? (
                <div className="text-center py-12 text-slate-400 text-sm">No data available.</div>
              ) : assignmentTab === "bookings" ? (
                /* Tab 1: Bookings & Assigned Parts */
                filteredBookings.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
                    {bookingSearch
                      ? "No bookings match your search query."
                      : "No bookings or services currently assigned to this vendor."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((b) => (
                      <div
                        key={b.operationId + (b.operationObjectId || "")}
                        className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                      >
                        {/* Booking Header */}
                        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {b.operationObjectId ? (
                              <Link
                                href={`/operations/${b.operationObjectId}`}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 transition"
                                title="Open full booking in operations"
                              >
                                {b.operationId}
                                <ExternalLink size={12} />
                              </Link>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-700 text-white rounded-lg text-xs font-bold">
                                {b.operationId}
                              </span>
                            )}

                            {b.destination && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                                <MapPin size={12} className="text-red-500" />
                                {b.destination}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                              <Users size={12} className="text-slate-400" />
                              <span className="font-semibold">{b.customer.name}</span>
                              <span className="text-slate-400">({b.customer.pax} Pax)</span>
                            </span>

                            {b.travelDates?.start && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                <Calendar size={11} className="text-slate-400" />
                                {formatDate(b.travelDates.start)}
                                {b.travelDates.end && ` - ${formatDate(b.travelDates.end)}`}
                              </span>
                            )}
                          </div>

                          {/* Booking Subtotal for this vendor */}
                          <div className="flex items-center gap-3 text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold block">Vendor Cost</span>
                              <span className="font-bold text-slate-800">{formatCurrency(b.totals.cost)}</span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div>
                              <span className="text-emerald-600 text-[10px] uppercase font-bold block">Paid</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(b.totals.paid)}</span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div>
                              <span className="text-amber-600 text-[10px] uppercase font-bold block">Pending</span>
                              <span
                                className={`font-bold ${
                                  b.totals.pending > 0 ? "text-amber-600" : "text-emerald-600"
                                }`}
                              >
                                {formatCurrency(b.totals.pending)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assigned Parts Breakdown */}
                        <div className="divide-y divide-slate-100">
                          {b.parts.map((part) => (
                            <div
                              key={part._id}
                              className="p-3.5 sm:p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 mt-0.5">
                                  {getCategoryIcon(part.category)}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{part.title}</span>
                                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {part.category.replace("_", " ")}
                                    </span>
                                    {getStatusBadge(part.paymentStatus)}
                                  </div>
                                  <p className="text-xs text-slate-600">{part.subtitle}</p>

                                  {/* Specific part details */}
                                  {part.details && (
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                                      {part.details.checkIn && (
                                        <span>
                                          Check-in: {formatDate(part.details.checkIn)}
                                        </span>
                                      )}
                                      {part.details.checkOut && (
                                        <span>
                                          Check-out: {formatDate(part.details.checkOut)}
                                        </span>
                                      )}
                                      {part.details.confirmationNumber && (
                                        <span>
                                          Conf #: <span className="text-slate-600 font-mono">{part.details.confirmationNumber}</span>
                                        </span>
                                      )}
                                      {part.details.pnr && (
                                        <span>
                                          PNR: <span className="text-slate-600 font-mono">{part.details.pnr}</span>
                                        </span>
                                      )}
                                      {part.details.driverName && (
                                        <span>
                                          Driver: {part.details.driverName} {part.details.driverContact ? `(${part.details.driverContact})` : ""}
                                        </span>
                                      )}
                                      {part.remarks && (
                                        <span className="italic text-slate-500">
                                          Note: {part.remarks}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Part Financials & Update Payment Action */}
                              <div className="flex items-center justify-between md:justify-end gap-4 pl-11 md:pl-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                                <div className="text-right">
                                  <div className="text-xs">
                                    <span className="text-slate-400 mr-1.5">Vendor Cost:</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(part.vendorCost)}</span>
                                  </div>
                                  <div className="text-[11px]">
                                    <span className="text-slate-400 mr-1.5">Paid:</span>
                                    <span className="font-semibold text-emerald-600">{formatCurrency(part.paidAmount)}</span>
                                    {part.vendorCost - part.paidAmount > 0 && (
                                      <span className="text-amber-600 ml-1.5">
                                        (Due {formatCurrency(part.vendorCost - part.paidAmount)})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    setUpdatingPaymentItem({
                                      category: part.category,
                                      serviceId: part._id,
                                      title: part.title,
                                      cost: part.vendorCost,
                                      paid: part.paidAmount,
                                      status: part.paymentStatus,
                                      dueDate: part.paymentDueDate ? part.paymentDueDate.split("T")[0] : "",
                                      remarks: part.remarks || "",
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 hover:text-cyan-700 transition shrink-0"
                                >
                                  Update Payment
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Tab 2: Vendor Payment Transaction Records */
                assignmentsData.payments.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
                    No direct vendor payment transactions recorded for this vendor yet.
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Date / Due</th>
                            <th className="py-2.5 px-3 font-semibold">Booking ID</th>
                            <th className="py-2.5 px-3 font-semibold">Service</th>
                            <th className="py-2.5 px-3 font-semibold">Description</th>
                            <th className="py-2.5 px-3 font-semibold">Amount</th>
                            <th className="py-2.5 px-3 font-semibold">Paid</th>
                            <th className="py-2.5 px-3 font-semibold">Mode / Txn</th>
                            <th className="py-2.5 px-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {assignmentsData.payments.map((p) => (
                            <tr key={p._id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                <div>{p.paidDate ? formatDate(p.paidDate) : p.dueDate ? formatDate(p.dueDate) : "—"}</div>
                                {p.dueDate && p.paidDate && (
                                  <div className="text-[10px] text-slate-400">Due: {formatDate(p.dueDate)}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {p.operationObjectId ? (
                                  <Link
                                    href={`/operations/${p.operationObjectId}`}
                                    target="_blank"
                                    className="font-bold text-cyan-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    {p.operationId || "View"}
                                    <ExternalLink size={10} />
                                  </Link>
                                ) : (
                                  p.operationId || "—"
                                )}
                              </td>
                              <td className="py-2.5 px-3 capitalize font-medium text-slate-700">
                                {p.serviceType}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={p.description}>
                                {p.description || "—"}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                                {formatCurrency(p.amount)}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-600 whitespace-nowrap">
                                {formatCurrency(p.paidAmount)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                                {p.paymentMode || "—"}
                                {p.transactionId && <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">{p.transactionId}</div>}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing assignments for <strong className="text-slate-800">{activeVendor.name}</strong>
              </span>
              <button
                onClick={() => setActiveVendor(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK PAYMENT UPDATE MODAL                                                */}
      {/* ========================================================================= */}
      {updatingPaymentItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Update Vendor Payment</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{updatingPaymentItem.title}</p>
              </div>
              <button
                onClick={() => setUpdatingPaymentItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500">Total Vendor Cost:</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatCurrency(updatingPaymentItem.cost)}
                </span>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Payment Status
                </label>
                <select
                  value={updatingPaymentItem.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    let nextPaid = updatingPaymentItem.paid;
                    if (nextStatus === "paid") {
                      nextPaid = updatingPaymentItem.cost;
                    } else if (nextStatus === "pending") {
                      nextPaid = 0;
                    }
                    setUpdatingPaymentItem({
                      ...updatingPaymentItem,
                      status: nextStatus,
                      paid: nextPaid,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                >
                  <option value="pending">Pending (Unpaid)</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid (Fully Settled)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  value={updatingPaymentItem.paid}
                  onChange={(e) =>
                    setUpdatingPaymentItem({
                      ...updatingPaymentItem,
                      paid: Number(e.target.value) || 0,
                      status:
                        Number(e.target.value) >= updatingPaymentItem.cost
                          ? "paid"
                          : Number(e.target.value) > 0
                          ? "partial"
                          : "pending",
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {updatingPaymentItem.status?.toLowerCase() === "partial" && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-amber-900 font-medium">Total Amount:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(updatingPaymentItem.cost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-amber-900 font-medium">Paid Amount:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(updatingPaymentItem.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-amber-200 font-bold">
                    <span className="text-amber-950">Remaining Amount:</span>
                    <span className="text-amber-900 flex items-center gap-1.5">
                      <span>{formatCurrency(Math.max(0, updatingPaymentItem.cost - (updatingPaymentItem.paid || 0)))}</span>
                      {updatingPaymentItem.cost > 0 && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {Math.round((Math.max(0, updatingPaymentItem.cost - (updatingPaymentItem.paid || 0)) / updatingPaymentItem.cost) * 100)}% due
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Payment Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={updatingPaymentItem.dueDate || ""}
                  onChange={(e) =>
                    setUpdatingPaymentItem({
                      ...updatingPaymentItem,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Payment Note / Remarks
                </label>
                <input
                  type="text"
                  value={updatingPaymentItem.remarks || ""}
                  onChange={(e) =>
                    setUpdatingPaymentItem({
                      ...updatingPaymentItem,
                      remarks: e.target.value,
                    })
                  }
                  placeholder="e.g. Paid via UPI ref 9283921"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setUpdatingPaymentItem(null)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickPaymentSave}
                disabled={savingPayment}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold hover:bg-cyan-700 shadow-xs disabled:opacity-50"
              >
                {savingPayment ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
