"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRole } from "@/hooks/usePermission";
import { Check, X, Eye, MapPin, Package } from "lucide-react";
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
                  <div className="flex items-center gap-2">
                    {app.entityType === 'Package' ? <Package size={16} className="text-indigo-500" /> : <MapPin size={16} className="text-teal-500" />}
                    <div>
                      <p className="text-sm font-bold text-slate-800">{app.action.toUpperCase()} {app.entityType}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs">{app.payload?.name || "No name specified"}</p>
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
