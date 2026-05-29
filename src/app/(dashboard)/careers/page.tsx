"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Career } from "@/types";
import { Plus, Search, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

export default function CareersPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = usePermission("careers.create");
  const canEdit = usePermission("careers.edit");
  const canDelete = usePermission("careers.delete");

  useEffect(() => {
    fetchCareers();
  }, []);

  async function fetchCareers() {
    try {
      const res = await api.get("/careers?limit=50");
      setCareers(res?.data || []);
    } catch {
      setCareers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this job listing?")) return;
    try {
      await api.del(`/careers/${id}`);
      setCareers((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Failed to delete");
    }
  }

  return (
    <RoleGuard permission="careers.view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search jobs..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          {canCreate && (
            <Link href="/careers/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">
              <Plus size={16} /> Add Job
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : careers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No job listings</td></tr>
                ) : (
                  careers.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{c.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{c.department}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{c.location}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 capitalize">{c.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {c.isActive ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <Link href={`/careers/${c._id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600">
                              <Edit size={16} />
                            </Link>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
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
