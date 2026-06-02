"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Package } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = usePermission("packages.create");
  const canEdit = usePermission("packages.edit");
  const canDelete = usePermission("packages.delete");

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const res = await api.get("/packages?limit=50");
      setPackages(res?.data || []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this package?")) return;
    try {
      const res = await api.del(`/packages/${id}`);
      if (res?.status === "success" || res === undefined) {
        setPackages((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch {
      alert("Failed to delete");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await api.put(`/packages/${id}`, { isFeatured: !current });
      setPackages((prev) => prev.map((p) => p._id === id ? { ...p, isFeatured: !current } : p));
    } catch {
      alert("Failed to update");
    }
  }

  return (
    <RoleGuard permission="packages.view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search packages..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          {canCreate && (
            <Link href="/packages/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">
              <Plus size={16} /> Add Package
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Package</th>
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Rating</th>
                  <th className="px-6 py-3">Featured</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : packages.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No packages found</td></tr>
                ) : (
                  packages.map((p) => {
                    const dest = typeof p.destination === "object" ? p.destination : null;
                    return (
                      <tr key={p._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700 max-w-[220px] truncate">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.badge || p.category || ""}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{dest?.name || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{p.duration?.nights}N/{p.duration?.days}D</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{formatCurrency(p.price)}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">⭐ {p.rating} ({p.reviewCount})</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleFeatured(p._id, p.isFeatured)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.isFeatured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                            disabled={!canEdit}
                          >
                            {p.isFeatured ? "Featured" : "Normal"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <Link href={`/packages/${p._id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600">
                                <Edit size={16} />
                              </Link>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
