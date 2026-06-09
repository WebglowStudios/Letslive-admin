"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import RoleGuard from "@/components/guards/RoleGuard";
import { Clock, Trash2, Edit, Plus, CheckCircle, RefreshCw, LogIn, Tag, Filter } from "lucide-react";

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
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  approve: "bg-violet-100 text-violet-700",
  status_change: "bg-amber-100 text-amber-700",
  login: "bg-slate-100 text-slate-600",
  other: "bg-slate-100 text-slate-600",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus size={11} />,
  update: <Edit size={11} />,
  delete: <Trash2 size={11} />,
  approve: <CheckCircle size={11} />,
  status_change: <RefreshCw size={11} />,
  login: <LogIn size={11} />,
  other: <Tag size={11} />,
};

const ENTITY_LABELS: Record<string, string> = {
  package: "Package",
  destination: "Destination",
  booking: "Booking",
  career: "Career",
  article: "Article",
  review: "Review",
  enquiry: "Enquiry",
  staff: "Staff",
  operation: "Operation",
  vendor: "Vendor",
  other: "Other",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 text-red-600",
  manager: "bg-violet-50 text-violet-600",
  staff: "bg-cyan-50 text-cyan-600",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/admin/activity?page=${page}&limit=50`;
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

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filters change
  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <RoleGuard permission="activity.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Activity Log</h1>
            <p className="text-sm text-slate-500">{total} total actions recorded</p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
          <Filter size={14} className="text-slate-400 flex-shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
            className="text-sm border-none outline-none bg-transparent text-slate-600"
          >
            <option value="">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="approve">Approved</option>
            <option value="status_change">Status Changed</option>
            <option value="login">Login</option>
          </select>
          <div className="w-px h-4 bg-slate-200" />
          <select
            value={entityFilter}
            onChange={(e) => handleFilterChange(setEntityFilter, e.target.value)}
            className="text-sm border-none outline-none bg-transparent text-slate-600"
          >
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
        </div>

        {/* Log */}
        <div className="bg-white rounded-xl border border-slate-200">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Clock size={36} className="text-slate-300" />
              <p className="text-sm text-slate-400">No activity found</p>
            </div>
          ) : (
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
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${ROLE_COLORS[log.userRole] || "bg-slate-100 text-slate-500"}`}>
                            {log.userRole}
                          </span>
                          <span className="text-xs font-medium text-slate-600">{log.userName}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
                          {log.entity && (
                            <>
                              <span className="text-xs text-slate-300">•</span>
                              <span className="text-xs text-slate-400">{ENTITY_LABELS[log.entity] || log.entity}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-500"}`}>
                        {ACTION_ICONS[log.action]}
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
