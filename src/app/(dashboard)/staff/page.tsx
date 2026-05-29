"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { User } from "@/types";
import { Plus, Search, UserX, Shield } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = usePermission("staff.create");
  const canEdit = usePermission("staff.edit");

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      const res = await api.get("/admin/staff");
      setStaff(res?.data || []);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(id: string, role: string) {
    try {
      await api.put(`/admin/staff/${id}`, { role });
      fetchStaff();
    } catch {
      alert("Failed to update role");
    }
  }

  async function deactivateUser(id: string) {
    if (!confirm("Deactivate this staff member?")) return;
    try {
      await api.put(`/admin/staff/${id}`, { isActive: false });
      fetchStaff();
    } catch {
      alert("Failed to deactivate");
    }
  }

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    manager: "bg-cyan-100 text-cyan-700",
    staff: "bg-emerald-100 text-emerald-700",
    guest: "bg-slate-100 text-slate-600",
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-red-100 text-red-700",
  };

  return (
    <RoleGuard permission="staff.view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search staff..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          {canCreate && (
            <Link href="/staff/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">
              <Plus size={16} /> Invite Staff
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Joined</th>
                  {canEdit && <th className="px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No staff members found</td></tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{member.firstName} {member.lastName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleColors[member.role] || ""}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${member.isActive ? statusColors.active : statusColors.inactive}`}>
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(member.createdAt)}</td>
                      {canEdit && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => updateRole(member._id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="staff">Staff</option>
                              <option value="guest">Guest</option>
                            </select>
                            {member.isActive && (
                              <button
                                onClick={() => deactivateUser(member._id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                                title="Deactivate"
                              >
                                <UserX size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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
