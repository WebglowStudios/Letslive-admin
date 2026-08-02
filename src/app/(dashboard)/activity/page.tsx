"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import RoleGuard from "@/components/guards/RoleGuard";
import {
  Clock, Trash2, Edit, Plus, CheckCircle, RefreshCw,
  LogIn, Tag, Filter, Users, UserCog, ShoppingCart,
  Star, MessageSquare, XCircle,
} from "lucide-react";

interface ActivityEntry {
  _id: string;
  createdAt: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityName?: string;
  description: string;
}

const ACTION_COLORS: Record<string, string> = {
  create:        "bg-emerald-100 text-emerald-700",
  update:        "bg-blue-100 text-blue-700",
  delete:        "bg-red-100 text-red-700",
  approve:       "bg-violet-100 text-violet-700",
  status_change: "bg-amber-100 text-amber-700",
  login:         "bg-slate-100 text-slate-600",
  other:         "bg-slate-100 text-slate-600",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create:        <Plus size={11} />,
  update:        <Edit size={11} />,
  delete:        <Trash2 size={11} />,
  approve:       <CheckCircle size={11} />,
  status_change: <RefreshCw size={11} />,
  login:         <LogIn size={11} />,
  other:         <Tag size={11} />,
};

// User-activity-specific icons by entity
const USER_ENTITY_ICONS: Record<string, React.ReactNode> = {
  booking: <ShoppingCart size={13} />,
  review:  <Star size={13} />,
  enquiry: <MessageSquare size={13} />,
  other:   <LogIn size={13} />,   // login / register
};

const ENTITY_LABELS: Record<string, string> = {
  package:     "Package",
  destination: "Destination",
  booking:     "Booking",
  career:      "Career",
  article:     "Article",
  review:      "Review",
  enquiry:     "Enquiry",
  staff:       "Staff",
  operation:   "Operation",
  vendor:      "Vendor",
  other:       "Other",
};

const STAFF_ROLE_COLORS: Record<string, string> = {
  admin:   "bg-purple-50 text-purple-600",
  manager: "bg-violet-50 text-violet-600",
  staff:   "bg-cyan-50 text-cyan-600",
  guest:   "bg-slate-50 text-slate-500",
};

// ─── Shared Timeline Log ─────────────────────────────────────────────────────
function LogTimeline({ logs }: { logs: ActivityEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Clock size={36} className="text-slate-300" />
        <p className="text-sm text-slate-400">No activity found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-0">
      {logs.map((log, index) => (
        <div key={log._id} className="relative flex gap-4 pb-5 last:pb-0">
          {/* Timeline line */}
          {index < logs.length - 1 && (
            <div className="absolute left-[17px] top-10 bottom-0 w-px bg-slate-100" />
          )}

          {/* Icon dot */}
          <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-500"}`}>
            {ACTION_ICONS[log.action] || <Tag size={11} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{log.description}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${STAFF_ROLE_COLORS[log.userRole] || "bg-slate-100 text-slate-500"}`}>
                    {log.userRole}
                  </span>
                  <span className="text-xs font-medium text-slate-600">{log.userName}</span>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
                  {log.entity && log.entity !== "other" && (
                    <>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">{ENTITY_LABELS[log.entity] || log.entity}</span>
                    </>
                  )}
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-500"}`}>
                {ACTION_ICONS[log.action]}
                {log.action.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Employee Activity Tab ────────────────────────────────────────────────────
function EmployeeActivity() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/admin/activity?page=${page}&limit=50&userType=staff`;
      if (actionFilter) url += `&action=${actionFilter}`;
      if (entityFilter) url += `&entity=${entityFilter}`;
      const res = await api.get(url);
      setLogs(res?.data || []);
      setTotal(res?.total || 0);
      setPages(res?.pages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function handleFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <Filter size={14} className="text-slate-400 flex-shrink-0" />
        <select value={actionFilter} onChange={(e) => handleFilter(setActionFilter, e.target.value)} className="text-sm border-none outline-none bg-transparent text-slate-600">
          <option value="">All Actions</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
          <option value="approve">Approved</option>
          <option value="status_change">Status Changed</option>
          <option value="login">Login</option>
        </select>
        <div className="w-px h-4 bg-slate-200" />
        <select value={entityFilter} onChange={(e) => handleFilter(setEntityFilter, e.target.value)} className="text-sm border-none outline-none bg-transparent text-slate-600">
          <option value="">All Types</option>
          <option value="package">Packages</option>
          <option value="destination">Destinations</option>
          <option value="booking">Bookings</option>
          <option value="career">Careers</option>
          <option value="article">Articles</option>
          <option value="review">Reviews</option>
          <option value="enquiry">Enquiries</option>
          <option value="staff">Staff</option>
          <option value="operation">Operations</option>
          <option value="vendor">Vendors</option>
        </select>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <UserCog size={13} /> {total} employee actions
        </div>
      </div>

      {/* Log */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <LogTimeline logs={logs} />
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Activity Tab ────────────────────────────────────────────────────────
function UserActivity() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/admin/activity?page=${page}&limit=50&userType=user`;
      if (actionFilter) url += `&action=${actionFilter}`;
      if (entityFilter) url += `&entity=${entityFilter}`;
      const res = await api.get(url);
      setLogs(res?.data || []);
      setTotal(res?.total || 0);
      setPages(res?.pages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function handleFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  // Customer-specific summary cards for quick overview
  const loginCount  = logs.filter((l) => l.action === "login").length;
  const bookingCount = logs.filter((l) => l.entity === "booking" && l.action === "create").length;
  const cancelCount  = logs.filter((l) => l.entity === "booking" && l.action === "status_change").length;
  const reviewCount  = logs.filter((l) => l.entity === "review").length;
  const enquiryCount = logs.filter((l) => l.entity === "enquiry").length;
  const registerCount = logs.filter((l) => l.action === "create" && l.entity === "other").length;

  return (
    <div className="space-y-4">
      {/* Quick stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Registrations", value: registerCount, icon: <Plus size={14} />, color: "text-emerald-600 bg-emerald-50" },
          { label: "Logins",        value: loginCount,    icon: <LogIn size={14} />,       color: "text-slate-600 bg-slate-50" },
          { label: "Bookings",      value: bookingCount,  icon: <ShoppingCart size={14} />, color: "text-cyan-600 bg-cyan-50" },
          { label: "Cancellations", value: cancelCount,   icon: <XCircle size={14} />,      color: "text-red-500 bg-red-50" },
          { label: "Reviews",       value: reviewCount,   icon: <Star size={14} />,         color: "text-amber-500 bg-amber-50" },
          { label: "Enquiries",     value: enquiryCount,  icon: <MessageSquare size={14} />,color: "text-violet-600 bg-violet-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-2`}>{s.icon}</div>
            <p className="text-lg font-bold text-slate-800">{s.value}</p>
            <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 pl-1">* Stats reflect current page ({logs.length} records). Use pagination to see more.</p>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <Filter size={14} className="text-slate-400 flex-shrink-0" />
        <select value={actionFilter} onChange={(e) => handleFilter(setActionFilter, e.target.value)} className="text-sm border-none outline-none bg-transparent text-slate-600">
          <option value="">All Actions</option>
          <option value="create">Registered / Booked / Reviewed</option>
          <option value="login">Logins</option>
          <option value="status_change">Cancellations</option>
        </select>
        <div className="w-px h-4 bg-slate-200" />
        <select value={entityFilter} onChange={(e) => handleFilter(setEntityFilter, e.target.value)} className="text-sm border-none outline-none bg-transparent text-slate-600">
          <option value="">All Events</option>
          <option value="other">Registration / Login</option>
          <option value="booking">Bookings</option>
          <option value="review">Reviews</option>
          <option value="enquiry">Enquiries</option>
        </select>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <Users size={13} /> {total} customer events
        </div>
      </div>

      {/* Log */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users size={36} className="text-slate-300" />
            <p className="text-sm text-slate-400">No customer activity yet</p>
            <p className="text-xs text-slate-300">Activity is logged when customers register, book, review, or enquire.</p>
          </div>
        ) : (
          <div className="p-6 space-y-0">
            {logs.map((log, index) => {
              const entityIcon = USER_ENTITY_ICONS[log.entity] || <Tag size={13} />;
              const dotColor =
                log.entity === "booking" && log.action === "create" ? "bg-cyan-100 text-cyan-700" :
                log.entity === "booking" && log.action === "status_change" ? "bg-red-100 text-red-600" :
                log.entity === "review"  ? "bg-amber-100 text-amber-600" :
                log.entity === "enquiry" ? "bg-violet-100 text-violet-600" :
                log.action === "login"   ? "bg-slate-100 text-slate-500" :
                "bg-emerald-100 text-emerald-700";

              return (
                <div key={log._id} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < logs.length - 1 && (
                    <div className="absolute left-[17px] top-10 bottom-0 w-px bg-slate-100" />
                  )}
                  <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${dotColor}`}>
                    {entityIcon}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-slate-700 leading-snug">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-semibold uppercase tracking-wide">
                        <Users size={9} /> customer
                      </span>
                      <span className="text-xs font-medium text-slate-600">{log.userName}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
                      {log.entity && log.entity !== "other" && (
                        <>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400 capitalize">{ENTITY_LABELS[log.entity] || log.entity}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActivityPage() {
  const [tab, setTab] = useState<"employees" | "users">("employees");

  return (
    <RoleGuard permission="activity.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Activity Log</h1>
            <p className="text-sm text-slate-500">Track actions by employees and customers</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab("employees")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === "employees" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <UserCog size={16} />
            Employee Activity
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === "users" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Users size={16} />
            User Activity
          </button>
        </div>

        {/* Content */}
        {tab === "employees" ? <EmployeeActivity /> : <UserActivity />}
      </div>
    </RoleGuard>
  );
}
