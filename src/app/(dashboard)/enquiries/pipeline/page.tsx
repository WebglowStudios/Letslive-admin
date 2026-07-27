"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Enquiry } from "@/types";
import {
  Phone, User, Calendar, AlertTriangle, Plus, RefreshCw,
  ChevronRight, Search, X
} from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";

// ─── Pipeline columns definition ─────────────────────────────────────────────
const COLUMNS = [
  { id: "new",         label: "New",         color: "bg-blue-500",    light: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700" },
  { id: "assigned",    label: "Assigned",    color: "bg-indigo-500",  light: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
  { id: "in-progress", label: "In Progress", color: "bg-amber-500",   light: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700" },
  { id: "follow-up",  label: "Follow-Up",   color: "bg-purple-500",  light: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { id: "converted",  label: "Converted",   color: "bg-emerald-500", light: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-700" },
] as const;

type ColumnId = typeof COLUMNS[number]["id"];

const PRIORITY_DOTS: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-400",
  high: "bg-amber-400",
  urgent: "bg-red-500",
};

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
        // allow drag without navigating
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
        {enquiry.dnpCount > 0 && (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
            enquiry.dnpCount >= 6 ? "bg-red-100 text-red-700" :
            enquiry.dnpCount >= 3 ? "bg-orange-100 text-orange-700" :
            "bg-amber-50 text-amber-700"
          }`}>
            <Phone size={8} /> DNP {enquiry.dnpCount}
          </span>
        )}

        {/* Follow-up today */}
        {followUpToday && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
            <Calendar size={8} /> Today
          </span>
        )}

        {/* Budget */}
        {enquiry.budget && (
          <span className="text-[9px] text-slate-400">
            ₹{(enquiry.budget / 1000).toFixed(0)}k
          </span>
        )}

        {/* Channel */}
        {enquiry.channel && (
          <span className="text-[9px] text-slate-400 ml-auto">{enquiry.channel}</span>
        )}
      </div>

      {/* Assigned */}
      {enquiry.assignedTo && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-50">
          <User size={9} className="text-slate-300" />
          <span className="text-[9px] text-slate-400">
            {enquiry.assignedTo.firstName} {enquiry.assignedTo.lastName}
          </span>
        </div>
      )}
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
      className={`flex flex-col min-w-[240px] max-w-[280px] flex-1 rounded-2xl border-2 transition-colors ${
        isDragOver ? `${col.border} ${col.light}` : "border-transparent"
      }`}
      onDragOver={(e) => onDragOver(e, col.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, col.id)}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${col.light} mb-3`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.color}`} />
          <span className={`text-xs font-bold ${col.text}`}>{col.label}</span>
        </div>
        <span className={`text-xs font-bold ${col.text} bg-white px-2 py-0.5 rounded-full`}>
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-260px)] px-0.5 pb-2">
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
        <div className={`mt-2 px-2 py-1.5 rounded-lg ${col.light} text-center`}>
          <p className={`text-[10px] font-semibold ${col.text}`}>
            ₹{(totalValue / 100000).toFixed(1)}L pipeline
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PipelinePage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; fromStatus: string } | null>(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search) params.set("search", search);
      const res = await api.get(`/enquiries?${params}`);
      // Exclude "closed" and "resolved" from pipeline
      const data = (res?.data || []).filter((e: Enquiry) =>
        !["closed", "resolved"].includes(e.status)
      );
      setEnquiries(data);
    } catch {
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

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
    } catch {
      // Revert on failure
      fetchEnquiries();
      alert("Failed to move enquiry");
    }
    dragRef.current = null;
  }

  // Group enquiries by status
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = enquiries.filter((e) => e.status === col.id);
    return acc;
  }, {} as Record<string, Enquiry[]>);

  const totalActive = enquiries.length;
  const totalConverted = grouped["converted"]?.length || 0;
  const conversionRate = totalActive > 0
    ? Math.round((totalConverted / totalActive) * 100)
    : 0;

  return (
    <RoleGuard permission="enquiries.view">
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Sales Pipeline</h2>
            <p className="text-xs text-slate-400">
              {totalActive} active leads · {conversionRate}% conversion · Drag cards to move stages
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search leads..."
                className="bg-transparent border-none outline-none text-sm w-36"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); }}>
                  <X size={12} className="text-slate-400" />
                </button>
              )}
            </div>
            <button
              onClick={fetchEnquiries}
              className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={`text-slate-500 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/enquiries"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg px-3 py-2"
            >
              List View <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Priority legend */}
        <div className="flex items-center gap-4 mb-4 text-[10px] text-slate-400">
          <span className="font-semibold">Priority:</span>
          {Object.entries(PRIORITY_DOTS).map(([p, cls]) => (
            <span key={p} className="flex items-center gap-1 capitalize">
              <span className={`w-2 h-2 rounded-full ${cls}`} /> {p}
            </span>
          ))}
          <span className="ml-4 text-slate-300">|</span>
          <span className="flex items-center gap-1"><Phone size={9} /> = DNP count</span>
          <span className="flex items-center gap-1"><Calendar size={9} /> Today = follow-up due</span>
        </div>

        {/* Kanban board */}
        {loading && enquiries.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-sm text-slate-400">
            Loading pipeline...
          </div>
        ) : (
          <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
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
      </div>
    </RoleGuard>
  );
}
