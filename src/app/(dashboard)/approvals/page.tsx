"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRole } from "@/hooks/usePermission";
import { Check, X, Eye, MapPin, Package, Star, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ApprovalRequest {
  _id: string;
  entityType: string;
  action: string;
  entityId?: any; // The original populated entity
  payload: any;
  status: string;
  requestedBy: { firstName: string; lastName: string; role: string };
  createdAt: string;
}

const DiffViewer = ({ approval }: { approval: ApprovalRequest }) => {
  if (approval.entityType === 'Review') {
    const payload = approval.payload || {};
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white text-amber-900 px-5 py-3 font-semibold border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={18} className="fill-amber-500 text-amber-500" />
            <span>Customer Review Submitted for Verification</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {payload.platform || 'Google'}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {payload.reviewerName || 'Anonymous Customer'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Tour: <strong className="text-slate-700">{payload.packageName || 'Selected Package'}</strong>
                {payload.tripType && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                    {payload.tripType}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < (payload.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                  />
                ))}
                <span className="font-bold text-sm text-slate-700 ml-1.5">{payload.rating || 5}/5</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Date: {formatDate(payload.reviewDate || approval.createdAt)}
              </span>
            </div>
          </div>

          {payload.title && (
            <p className="text-sm font-semibold text-slate-800">
              "{payload.title}"
            </p>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-serif italic">
            "{payload.text}"
          </div>

          {payload.reviewUrl && (
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-slate-400">Source Link:</span>
              <a
                href={payload.reviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-600 hover:text-cyan-700 underline font-medium truncate max-w-md flex items-center gap-1"
              >
                {payload.reviewUrl} <ExternalLink size={12} />
              </a>
            </div>
          )}

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
            <span>
              Logged by: <strong>{approval.requestedBy?.firstName} {approval.requestedBy?.lastName}</strong> ({approval.requestedBy?.role})
            </span>
            <span className="text-[11px] text-blue-700 font-medium">
              Approving will credit +1 review to this employee's target
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (approval.action === 'create') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 font-semibold border-b border-emerald-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          New {approval.entityType} Created
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {Object.entries(approval.payload).map(([key, val]) => (
                <tr key={key}>
                  <td className="py-2 pr-4 font-medium text-slate-600 w-1/4 align-top">{key}</td>
                  <td className="py-2 text-slate-800 break-words">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (approval.action === 'delete') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-red-50 text-red-700 px-4 py-2 font-semibold border-b border-red-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          {approval.entityType} Deletion Requested
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
           {approval.entityId ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-red-50/30">
                    <td className="py-2 pr-4 font-medium text-slate-600 w-1/4">Name</td>
                    <td className="py-2 text-slate-800">{approval.entityId.name}</td>
                  </tr>
                  <tr className="bg-red-50/30">
                    <td className="py-2 pr-4 font-medium text-slate-600 w-1/4">ID</td>
                    <td className="py-2 text-slate-800">{approval.entityId._id}</td>
                  </tr>
                </tbody>
              </table>
           ) : (
             <p className="text-slate-500">Original entity data unavailable.</p>
           )}
        </div>
      </div>
    );
  }

  // UPDATE action
  const original = approval.entityId || {};
  const payload = approval.payload || {};
  const allKeys = Array.from(new Set([...Object.keys(original), ...Object.keys(payload)]))
    .filter(k => !['_id', '__v', 'createdAt', 'updatedAt', 'createdBy', 'approvalStatus'].includes(k));

  const changes: { key: string, old: any, new: any }[] = [];
  allKeys.forEach(key => {
    const oldVal = original[key];
    const newVal = payload[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (newVal !== undefined) { // Ignore keys stripped out by payload reduction
        changes.push({ key, old: oldVal, new: newVal });
      }
    }
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col max-h-[60vh]">
      <div className="bg-blue-50 text-blue-700 px-4 py-2 font-semibold border-b border-blue-100 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        {changes.length} field(s) changed
      </div>
      <div className="overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 w-1/4">Field</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Old Value</th>
              <th className="px-4 py-3 font-semibold text-slate-600">New Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {changes.map(change => (
              <tr key={change.key}>
                <td className="px-4 py-3 font-medium text-slate-700 align-top">{change.key}</td>
                <td className="px-4 py-3 bg-red-50/30 text-red-700 align-top break-all">
                  <span className="line-through opacity-80">{typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old ?? '—')}</span>
                </td>
                <td className="px-4 py-3 bg-emerald-50/30 text-emerald-800 font-medium align-top break-all">
                  {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new ?? '—')}
                </td>
              </tr>
            ))}
            {changes.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-center text-slate-500">No substantive field changes detected.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function ApprovalsPage() {
  const currentRole = useRole();
  const isAdmin = currentRole === "admin";
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  
  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve and publish these changes?")) return;
    try {
      await api.put(`/approvals/${id}/approve`);
      fetchApprovals();
      setSelectedApproval(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter a reason for rejection (optional):");
    if (reason === null) return;
    try {
      await api.put(`/approvals/${id}/reject`, { reviewNotes: reason });
      fetchApprovals();
      setSelectedApproval(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading approvals...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pending Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review content changes requested by staff.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 text-left">Request Type</th>
              <th className="px-5 py-3 text-left">Requested By</th>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {approvals.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500 text-sm">No pending approvals.</td></tr>
            ) : approvals.map(app => (
              <tr key={app._id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    {app.entityType === 'Package' ? (
                      <Package size={16} className="text-indigo-500 shrink-0" />
                    ) : app.entityType === 'Review' ? (
                      <Star size={16} className="text-amber-500 fill-amber-500 shrink-0" />
                    ) : (
                      <MapPin size={16} className="text-teal-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{app.action.toUpperCase()} {app.entityType}</span>
                        {app.entityType === 'Review' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-extrabold bg-amber-100 text-amber-800">
                            {app.payload?.rating || 5}★
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">
                        {app.entityType === 'Review'
                          ? `${app.payload?.reviewerName || 'Customer'} • ${app.payload?.platform || 'Google'} • ${app.payload?.packageName || 'Tour'}`
                          : (app.payload?.name || "No name specified")}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-700">{app.requestedBy?.firstName} {app.requestedBy?.lastName}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{app.requestedBy?.role?.replace('-', ' ')}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {formatDate(app.createdAt)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => setSelectedApproval(app)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 flex items-center gap-1 ml-auto">
                    <Eye size={14} /> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  Review: {selectedApproval.action.toUpperCase()} {selectedApproval.entityType}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Requested by {selectedApproval.requestedBy?.firstName} {selectedApproval.requestedBy?.lastName}</p>
              </div>
              <button onClick={() => setSelectedApproval(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="w-full max-w-full">
                <DiffViewer approval={selectedApproval} />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
              <button onClick={() => setSelectedApproval(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
              {isAdmin && (
                <>
                  <button onClick={() => handleReject(selectedApproval._id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 flex items-center gap-1.5">
                    <X size={16} /> Reject
                  </button>
                  <button onClick={() => handleApprove(selectedApproval._id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 flex items-center gap-1.5">
                    <Check size={16} /> Approve & Publish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
