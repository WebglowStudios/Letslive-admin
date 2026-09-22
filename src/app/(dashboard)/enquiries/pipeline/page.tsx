"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Enquiry } from "@/types";
import {
  Phone, User, Calendar, AlertTriangle, RefreshCw,
  ChevronRight, Search, X, KanbanSquare, Table2, ArrowRight,
  TrendingUp, Users, CheckCircle2, ChevronDown, ChevronUp, DollarSign
} from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { useAuthStore } from "@/stores/authStore";

// ─── Pipeline columns definition ─────────────────────────────────────────────
const COLUMNS = [
  { id: "new",         label: "New",         color: "bg-blue-500",    light: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700" },
  { id: "assigned",    label: "Assigned",    color: "bg-indigo-500",  light: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  { id: "in-progress", label: "In Progress", color: "bg-sky-500",     light: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700" },
  { id: "follow-up",  label: "Follow-Up",   color: "bg-purple-500",  light: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { id: "dnp",        label: "DNP",         color: "bg-rose-500",    light: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-700" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-500",   light: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700" },
  { id: "converted",  label: "Converted",   color: "bg-emerald-500", light: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-700" },
] as const;

type ColumnId = typeof COLUMNS[number]["id"];

function mapStatusToColumn(status: string): ColumnId {
  if (status === "begin" || status === "new") return "new";
  if (status === "assigned") return "assigned";
  if (status === "dnp" || status === "busy") return "dnp";
  if (status === "follow-up" || status === "callback-scheduled" || status === "callback-requested") return "follow-up";
  if (status === "negotiation") return "negotiation";
  if (status === "converted") return "converted";
  return "in-progress"; // responded, in-progress, whatsapp-sent
}

const PRIORITY_DOTS: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500",
};

interface StaffMatrixItem {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  total: number;
  byStatus: Record<string, number>;
  dnpCount: number;
  followUpTodayCount: number;
  pipelineValue: number;
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────
function KanbanCard({
  enquiry,
  onDragStart,
}: {
  enquiry: Enquiry;
  onDragStart: (e: React.DragEvent, id: string, fromStatus: string) => void;
}) {
  const followUpToday = enquiry.followUpDate &&
    new Date(enquiry.followUpDate).toDateString() === new Date().toDateString();

  return (
    <Link
      href={`/enquiries/${enquiry._id}`}
      draggable
      onDragStart={(e) => onDragStart(e, enquiry._id, enquiry.status)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-nodrag]")) e.preventDefault();
      }}
      className="block bg-white rounded-xl border border-slate-200 p-3.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 transition-all select-none"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {enquiry.firstName} {enquiry.lastName || ""}
          </p>
          {enquiry.packageName && (
            <p className="text-[10px] text-cyan-600 font-medium truncate">📦 {enquiry.packageName}</p>
          )}
          {enquiry.destination && !enquiry.packageName && (
            <p className="text-[10px] text-slate-400 truncate">📍 {enquiry.destination}</p>
          )}
        </div>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${PRIORITY_DOTS[enquiry.priority] || "bg-slate-300"}`} title={enquiry.priority} />
      </div>

      {/* Contact */}
      <p className="text-[10px] text-slate-400 truncate mb-2">{enquiry.phone}</p>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* DNP badge */}
        {(enquiry.dnpCount > 0 || enquiry.status === "dnp") && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
            enquiry.dnpCount >= 6 ? "bg-red-100 text-red-700" :
            enquiry.dnpCount >= 3 ? "bg-orange-100 text-orange-700" :
            "bg-rose-50 text-rose-700"
          }`}>
            <Phone size={8} /> DNP {enquiry.dnpCount > 0 ? enquiry.dnpCount : 1}
          </span>
        )}

        {/* Follow-up today */}
        {followUpToday && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
            <Calendar size={8} /> Today
            {(() => {
              const d = new Date(enquiry.followUpDate!);
              if (d.getHours() !== 0 || d.getMinutes() !== 0) {
                return <span>{d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>;
              }
              return null;
            })()}
          </span>
        )}

        {/* Budget */}
        {enquiry.budget && (
          <span className="text-[9px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
            ₹{(enquiry.budget / 1000).toFixed(0)}k
          </span>
        )}

        {/* Channel */}
        {enquiry.channel && (
          <span className="text-[9px] text-slate-400 ml-auto capitalize">{enquiry.channel}</span>
        )}
      </div>

      {/* Assigned */}
      <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1 min-w-0">
          <User size={10} className="text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-500 truncate font-medium">
            {enquiry.assignedTo ? `${enquiry.assignedTo.firstName} ${enquiry.assignedTo.lastName || ""}` : "Unassigned"}
          </span>
        </div>
        {enquiry.status !== "new" && enquiry.status !== "assigned" && (
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
            {enquiry.status}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({
  col,
  cards,
  onDragStart,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragOver,
}: {
  col: typeof COLUMNS[number];
  cards: Enquiry[];
  onDragStart: (e: React.DragEvent, id: string, fromStatus: string) => void;
  onDrop: (e: React.DragEvent, toStatus: string) => void;
  onDragOver: (e: React.DragEvent, colId: string) => void;
  onDragLeave: () => void;
  isDragOver: boolean;
}) {
  const totalValue = cards.reduce((sum, e) => sum + (e.conversionValue || e.budget || 0), 0);

  return (
    <div
      className={`flex flex-col min-w-[250px] max-w-[290px] flex-1 rounded-2xl border-2 transition-colors ${
        isDragOver ? `${col.border} ${col.light}` : "border-transparent"
      }`}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${col.light} mb-3 border ${col.border}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.color}`} />
          <span className={`text-xs font-bold ${col.text}`}>{col.label}</span>
        </div>
        <span className={`text-xs font-bold ${col.text} bg-white px-2 py-0.5 rounded-full shadow-2xs`}>
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] px-0.5 pb-2">
        {cards.length === 0 ? (
          <div className={`rounded-xl border-2 border-dashed ${col.border} p-6 text-center`}>
            <p className={`text-[11px] ${col.text} opacity-50`}>No leads</p>
          </div>
        ) : (
          cards.map((e) => (
            <KanbanCard key={e._id} enquiry={e} onDragStart={onDragStart} />
          ))
        )}
      </div>

      {/* Column footer total */}
      {totalValue > 0 && (
        <div className={`mt-2 px-2.5 py-1.5 rounded-lg ${col.light} border ${col.border} text-center`}>
          <p className={`text-[10px] font-semibold ${col.text}`}>
            ₹{(totalValue / 100000).toFixed(1)}L pipeline
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Pipeline Component ──────────────────────────────────────────────────
export default function PipelinePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading pipeline...</div>}>
      <PipelineContent />
    </Suspense>
  );
}

function PipelineContent() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === "admin" || user?.role === "manager" || user?.role === "sales-manager";

  const [viewMode, setViewMode] = useState<"board" | "matrix">("board");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [assignedFilter, setAssignedFilter] = useState(() => searchParams.get("assignedTo") || "all");
  const [staffList, setStaffList] = useState<{ _id: string; firstName: string; lastName: string; email?: string }[]>([]);
  const [staffMatrix, setStaffMatrix] = useState<StaffMatrixItem[]>([]);
  const [matrixTotals, setMatrixTotals] = useState<any>(null);
  const [showSummaryBanner, setShowSummaryBanner] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; fromStatus: string } | null>(null);

  // Sync URL query params if assignedTo changes
  useEffect(() => {
    const a = searchParams.get("assignedTo");
    if (a) setAssignedFilter(a);
  }, [searchParams]);

  // Fetch sales staff list for filter dropdown
  useEffect(() => {
    if (!isManager) return;
    api.get("/users/staff?department=sales").then((res) => {
      const list = res?.data || res || [];
      setStaffList(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [isManager]);

  // Fetch staff pipeline matrix (per-salesperson breakdown across stages)
  const fetchMatrix = useCallback(async () => {
    setMatrixLoading(true);
    try {
      const res = await api.get("/enquiries/pipeline/matrix");
      if (res?.data) {
        setStaffMatrix(res.data.staff || []);
        setMatrixTotals(res.data.totals || null);
      }
    } catch {
      // fallback
    } finally {
      setMatrixLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // Fetch enquiries for the board
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "300" });
      if (search) params.set("search", search);
      if (assignedFilter && assignedFilter !== "all") {
        params.set("assignedTo", assignedFilter);
      }
      const res = await api.get(`/enquiries?${params}`);
      // Exclude "closed" and "resolved" from active pipeline
      const data = (res?.data || []).filter((e: Enquiry) =>
        !["closed", "resolved"].includes(e.status)
      );
      setEnquiries(data);
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [search, assignedFilter]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleDragStart(e: React.DragEvent, id: string, fromStatus: string) {
    dragRef.current = { id, fromStatus };
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  }

  function handleDragLeave() {
    setDragOverCol(null);
  }

  async function handleDrop(e: React.DragEvent, toStatus: string) {
    e.preventDefault();
    setDragOverCol(null);
    const drag = dragRef.current;
    if (!drag || drag.fromStatus === toStatus) return;

    // Optimistic update
    setEnquiries((prev) =>
      prev.map((enq) =>
        enq._id === drag.id ? { ...enq, status: toStatus as Enquiry["status"] } : enq
      )
    );

    try {
      await api.put(`/enquiries/${drag.id}`, { status: toStatus });
      fetchMatrix(); // Refresh matrix counts
    } catch {
      fetchEnquiries();
      alert("Failed to move enquiry");
    }
    dragRef.current = null;
  }

  // Group enquiries into columns
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = enquiries.filter((e) => mapStatusToColumn(e.status) === col.id);
    return acc;
  }, {} as Record<ColumnId, Enquiry[]>);

  const totalActive = enquiries.length;
  const totalConverted = grouped["converted"]?.length || 0;
  const conversionRate = totalActive > 0
    ? Math.round((totalConverted / totalActive) * 100)
    : 0;

  // Selected salesperson name
  const selectedStaffObj = staffList.find((s) => s._id === assignedFilter);
  const selectedStaffName = assignedFilter === "unassigned"
    ? "Unassigned Leads"
    : selectedStaffObj
    ? `${selectedStaffObj.firstName} ${selectedStaffObj.lastName}`
    : null;

  return (
    <RoleGuard permission="enquiries.view">
      <div className="flex flex-col space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                {selectedStaffName ? `${selectedStaffName}'s Pipeline` : "Sales Pipeline"}
              </h2>
              {assignedFilter !== "all" && (
                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                  Filtered
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalActive} active leads · {conversionRate}% conversion · Drag cards to change stages
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Board vs Matrix */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode("board")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "board"
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <KanbanSquare size={13} /> Board View
              </button>
              <button
                onClick={() => setViewMode("matrix")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "matrix"
                    ? "bg-white text-indigo-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Table2 size={13} /> Sales Rep Breakdown
              </button>
            </div>

            {/* Salesperson Filter Dropdown */}
            {isManager && (
              <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-colors ${
                assignedFilter !== "all"
                  ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-700"
              }`}>
                <User size={13} className={assignedFilter !== "all" ? "text-indigo-600 shrink-0" : "text-slate-400 shrink-0"} />
                <span className="text-xs font-bold">Salesperson:</span>
                <select
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                  className="bg-transparent border-none text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer max-w-[150px]"
                >
                  <option value="all">All Sales Reps</option>
                  <option value="unassigned">Unassigned Leads</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
                {assignedFilter !== "all" && (
                  <button
                    onClick={() => setAssignedFilter("all")}
                    title="Clear filter"
                    className="text-indigo-500 hover:text-indigo-700 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search leads..."
                className="bg-transparent border-none outline-none text-xs w-32 focus:w-44 transition-all"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); }}>
                  <X size={12} className="text-slate-400" />
                </button>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={() => { fetchEnquiries(); fetchMatrix(); }}
              className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 shadow-2xs"
              title="Refresh"
            >
              <RefreshCw size={13} className={`text-slate-500 ${loading || matrixLoading ? "animate-spin" : ""}`} />
            </button>

            {/* List View Link */}
            <Link
              href={assignedFilter !== "all" ? `/enquiries?assignedTo=${assignedFilter}` : "/enquiries"}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white rounded-lg px-3 py-1.5 shadow-2xs"
            >
              List View <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Sales Rep Quick-Summary Bar (Collapsible / At-a-glance status) */}
        {isManager && staffMatrix.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Sales Team Overview
                </span>
                <span className="text-[11px] text-slate-400">
                  (Click any salesperson to filter their pipeline)
                </span>
              </div>
              <button
                onClick={() => setShowSummaryBanner(!showSummaryBanner)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title={showSummaryBanner ? "Collapse" : "Expand"}
              >
                {showSummaryBanner ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showSummaryBanner && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                {/* All Leads Card */}
                <button
                  onClick={() => setAssignedFilter("all")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    assignedFilter === "all"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="text-[10px] uppercase font-bold opacity-75">All Leads</p>
                  <p className="text-base font-extrabold mt-0.5">
                    {matrixTotals?.totalLeads || totalActive}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] opacity-80">
                    <span>DNP: {matrixTotals?.dnp || 0}</span>
                    <span>·</span>
                    <span>Follow-Up: {matrixTotals?.followUp || 0}</span>
                  </div>
                </button>

                {/* Staff Cards */}
                {staffMatrix.map((staff) => {
                  const isSelected = assignedFilter === staff._id;
                  const dnpCount = staff.byStatus["dnp"] || staff.dnpCount || 0;
                  const followUpCount = staff.byStatus["follow-up"] || 0;
                  const inProgressCount = staff.byStatus["in-progress"] || 0;

                  return (
                    <button
                      key={staff._id}
                      onClick={() => setAssignedFilter(staff._id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] font-bold truncate">
                          {staff.fullName}
                        </p>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          {staff.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {dnpCount > 0 && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                            isSelected ? "bg-rose-500/30 text-white" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            <Phone size={8} /> DNP: {dnpCount}
                          </span>
                        )}
                        {followUpCount > 0 && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                            isSelected ? "bg-purple-500/30 text-white" : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}>
                            <Calendar size={8} /> F/U: {followUpCount}
                          </span>
                        )}
                        {inProgressCount > 0 && (
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${
                            isSelected ? "bg-sky-500/30 text-white" : "bg-sky-50 text-sky-700"
                          }`}>
                            Prog: {inProgressCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MAIN VIEW: Matrix View OR Kanban Board */}
        {viewMode === "matrix" ? (
          /* ─── SALES REP BREAKDOWN MATRIX TABLE ───────────────────────────── */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Sales Team Pipeline Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  Distribution of leads per salesperson across DNP, Follow-Up, In-Progress, and other stages
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-rose-600">
                  <Phone size={11} /> DNP = Customer Did Not Pick
                </span>
                <span className="flex items-center gap-1 font-semibold text-purple-600">
                  <Calendar size={11} /> F/U = Scheduled Follow-Up
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Salesperson</th>
                    <th className="py-3 px-3 text-center">Total Leads</th>
                    <th className="py-3 px-3 text-center text-rose-700 bg-rose-50/60 font-bold">DNP Leads</th>
                    <th className="py-3 px-3 text-center text-purple-700 bg-purple-50/60 font-bold">Follow-Up</th>
                    <th className="py-3 px-3 text-center">In Progress</th>
                    <th className="py-3 px-3 text-center">New / Assigned</th>
                    <th className="py-3 px-3 text-center">Negotiation</th>
                    <th className="py-3 px-3 text-center text-emerald-700">Converted</th>
                    <th className="py-3 px-3 text-right">Pipeline Value</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        {matrixLoading ? "Loading staff breakdown..." : "No leads in active pipeline."}
                      </td>
                    </tr>
                  ) : (
                    staffMatrix.map((staff) => {
                      const dnp = staff.byStatus["dnp"] || staff.dnpCount || 0;
                      const followUp = staff.byStatus["follow-up"] || 0;
                      const inProgress = (staff.byStatus["in-progress"] || 0) + (staff.byStatus["responded"] || 0) + (staff.byStatus["whatsapp-sent"] || 0);
                      const newOrAssigned = (staff.byStatus["new"] || 0) + (staff.byStatus["begin"] || 0) + (staff.byStatus["assigned"] || 0);
                      const negotiation = staff.byStatus["negotiation"] || 0;
                      const converted = staff.byStatus["converted"] || 0;

                      return (
                        <tr
                          key={staff._id}
                          className="hover:bg-indigo-50/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {staff.firstName ? staff.firstName[0].toUpperCase() : "U"}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-xs">
                                  {staff.fullName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {staff.email || (staff.role === "unassigned" ? "Needs manager assignment" : "")}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-extrabold text-sm text-slate-800">
                              {staff.total}
                            </span>
                          </td>

                          {/* DNP */}
                          <td className="py-3 px-3 text-center bg-rose-50/30">
                            {dnp > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full text-xs border border-rose-200">
                                <Phone size={10} /> {dnp}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-medium">0</span>
                            )}
                          </td>

                          {/* Follow-Up */}
                          <td className="py-3 px-3 text-center bg-purple-50/30">
                            {followUp > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full text-xs border border-purple-200">
                                <Calendar size={10} /> {followUp}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-medium">0</span>
                            )}
                          </td>

                          {/* In Progress */}
                          <td className="py-3 px-3 text-center">
                            {inProgress > 0 ? (
                              <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                                {inProgress}
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>

                          {/* New / Assigned */}
                          <td className="py-3 px-3 text-center">
                            {newOrAssigned > 0 ? (
                              <span className="font-medium text-slate-700">
                                {newOrAssigned}
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>

                          {/* Negotiation */}
                          <td className="py-3 px-3 text-center">
                            {negotiation > 0 ? (
                              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                {negotiation}
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>

                          {/* Converted */}
                          <td className="py-3 px-3 text-center">
                            {converted > 0 ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {converted}
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>

                          {/* Pipeline Value */}
                          <td className="py-3 px-3 text-right font-semibold text-slate-700">
                            {staff.pipelineValue > 0 ? (
                              <span>₹{(staff.pipelineValue / 100000).toFixed(2)}L</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Action to switch to Board */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setAssignedFilter(staff._id);
                                setViewMode("board");
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              View Board <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Summary Footer Row */}
                {staffMatrix.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                      <td className="py-3 px-4">
                        Total Team Pipeline
                      </td>
                      <td className="py-3 px-3 text-center text-sm">
                        {matrixTotals?.totalLeads || totalActive}
                      </td>
                      <td className="py-3 px-3 text-center text-rose-800 bg-rose-100/50">
                        {matrixTotals?.dnp || 0}
                      </td>
                      <td className="py-3 px-3 text-center text-purple-800 bg-purple-100/50">
                        {matrixTotals?.followUp || 0}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {matrixTotals?.inProgress || 0}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {matrixTotals?.newOrAssigned || 0}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {matrixTotals?.negotiation || 0}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-800">
                        {matrixTotals?.converted || 0}
                      </td>
                      <td className="py-3 px-3 text-right">
                        ₹{((matrixTotals?.pipelineValue || 0) / 100000).toFixed(2)}L
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setAssignedFilter("all");
                            setViewMode("board");
                          }}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
                        >
                          View All
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          /* ─── KANBAN BOARD VIEW ─────────────────────────────────────────── */
          <>
            {/* Priority legend & Active filter pill */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Priority:</span>
                {Object.entries(PRIORITY_DOTS).map(([p, cls]) => (
                  <span key={p} className="flex items-center gap-1 capitalize">
                    <span className={`w-2 h-2 rounded-full ${cls}`} /> {p}
                  </span>
                ))}
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 font-medium text-rose-700">
                  <Phone size={9} /> DNP = Customer Did Not Pick
                </span>
                <span className="flex items-center gap-1 font-medium text-purple-700">
                  <Calendar size={9} /> Today = Follow-up due today
                </span>
              </div>

              {assignedFilter !== "all" && (
                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
                  <User size={11} className="text-indigo-600" />
                  <span>Showing leads for: <strong>{selectedStaffName}</strong></span>
                  <button
                    onClick={() => setAssignedFilter("all")}
                    className="ml-1 text-indigo-500 hover:text-indigo-800"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Kanban columns */}
            {loading && enquiries.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-slate-400">
                <RefreshCw size={18} className="animate-spin text-slate-400 mr-2" />
                Loading pipeline...
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    col={col}
                    cards={grouped[col.id] || []}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    isDragOver={dragOverCol === col.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
