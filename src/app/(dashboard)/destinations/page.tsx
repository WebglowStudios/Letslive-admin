"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { Plus, Search, Trash2, Edit, Eye } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";
import { useRole } from "@/hooks/usePermission";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = usePermission("destinations.create");
  const canEdit = usePermission("destinations.edit");
  const canDelete = usePermission("destinations.delete");
  const role = useRole();

  useEffect(() => {
    fetchDestinations();
  }, []);

  async function fetchDestinations() {
    try {
      const res = await api.get("/destinations?limit=50&admin=true");
      setDestinations(res?.data || []);
    } catch {
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    try {
      await api.del(`/destinations/${id}`);
      setDestinations((prev) => prev.filter((d) => d._id !== id));
    } catch {
      alert("Failed to delete");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await api.put(`/destinations/${id}`, { isFeatured: !current });
      setDestinations((prev) => prev.map((d) => d._id === id ? { ...d, isFeatured: !current } : d));
    } catch {
      alert("Failed to update");
    }
  }

  async function handleApprovalChange(id: string, status: string) {
    try {
      await api.put(`/destinations/${id}`, { approvalStatus: status });
      setDestinations((prev) => prev.map((d) => d._id === id ? { ...d, approvalStatus: status } : d));
    } catch {
      alert("Failed to update approval status");
    }
  }

  return (
    <RoleGuard permission="destinations.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search destinations..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          {canCreate && (
            <Link href="/destinations/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">
              <Plus size={16} /> Add Destination
            </Link>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3">Region</th>
                  <th className="px-6 py-3">Packages</th>
                  <th className="px-6 py-3">Approval</th>
                  <th className="px-6 py-3">Featured</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : destinations.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No destinations found</td></tr>
                ) : (
                  destinations.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {d.heroImage && (
                            <img src={d.heroImage} alt={d.name} className="w-10 h-10 rounded-lg object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-700">{d.name}</p>
                            <p className="text-xs text-slate-400">{d.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{d.region || d.country || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{d.packageCount}</td>
                      <td className="px-6 py-4">
                        {role === "admin" ? (
                          <select
                            value={d.approvalStatus || "pending"}
                            onChange={(e) => handleApprovalChange(d._id, e.target.value)}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold border-none outline-none cursor-pointer ${
                              d.approvalStatus === "approved" ? "bg-emerald-100 text-emerald-700" :
                              d.approvalStatus === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            d.approvalStatus === "approved" ? "bg-emerald-100 text-emerald-700" :
                            d.approvalStatus === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {(d.approvalStatus || "pending").charAt(0).toUpperCase() + (d.approvalStatus || "pending").slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleFeatured(d._id, d.isFeatured)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${d.isFeatured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                          disabled={!canEdit}
                        >
                          {d.isFeatured ? "Featured" : "Normal"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${d.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {d.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a href={`https://letslivetours.com/destinations/${d.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600" title="View on site">
                            <Eye size={16} />
                          </a>
                          {canEdit && (
                            <Link href={`/destinations/${d._id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600">
                              <Edit size={16} />
                            </Link>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(d._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
