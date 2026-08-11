"use client";

import { useEffect, useState, Fragment } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { User } from "@/types";
import { Plus, Search, Trash2, KeyRound, Check, UserPen, Shield, X, Calendar } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission, useRole } from "@/hooks/usePermission";
import { ALL_PERMISSIONS, rolePermissions, Permission } from "@/lib/permissions";
import ImageUpload from "@/components/ui/ImageUpload";

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [editAvatar, setEditAvatar] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPermissionsId, setEditPermissionsId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<{ permission: string; expiresAt?: string }[]>([]);
  const canCreate = usePermission("staff.create");
  const canEdit = usePermission("staff.edit");
  const currentRole = useRole();

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
      setStaff((prev) => prev.map((m) => m._id === id ? { ...m, role: role as User["role"] } : m));
    } catch {
      alert("Failed to update role");
    }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/admin/staff/${id}`);
      setStaff((prev) => prev.filter((m) => m._id !== id));
    } catch {
      alert("Failed to delete user");
    }
  }

  async function resetPassword(id: string) {
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    try {
      await api.put(`/admin/staff/${id}`, { password: newPassword });
      setResetSuccess(id);
      setTimeout(() => { setResetId(null); setNewPassword(""); setResetSuccess(""); }, 2000);
    } catch {
      alert("Failed to reset password");
    }
  }

  async function updateProfile(id: string) {
    try {
      const payload = { avatar: editAvatar, description: editDescription };
      const res = await api.put(`/admin/staff/${id}`, payload);
      if (res?.data) {
        setStaff((prev) => prev.map((m) => m._id === id ? { ...m, avatar: res.data.avatar, description: res.data.description } : m));
        setEditProfileId(null);
      }
    } catch {
      alert("Failed to update profile");
    }
  }

  async function updatePermissions(id: string) {
    try {
      const res = await api.put(`/admin/staff/${id}`, { customPermissions: editingPermissions });
      if (res?.data) {
        setStaff((prev) => prev.map((m) => m._id === id ? { ...m, customPermissions: res.data.customPermissions } : m));
        setEditPermissionsId(null);
      }
    } catch {
      alert("Failed to update permissions");
    }
  }

  // Helper to group permissions by module (e.g., 'packages.view' -> 'packages')
  const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
    const module = perm.split(".")[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    manager: "bg-cyan-100 text-cyan-700",
    staff: "bg-emerald-100 text-emerald-700",
    guest: "bg-slate-100 text-slate-600",
  };

  const filtered = staff.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  return (
    <RoleGuard permission="staff.view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
          {canCreate && (
            <Link href="/staff/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">
              <Plus size={16} /> Create User
            </Link>
          )}
        </div>

        <p className="text-xs text-slate-400">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Joined</th>
                  {canEdit && <th className="px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No users found</td></tr>
                ) : (
                  filtered.map((member) => (
                    <Fragment key={member._id}>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{member.firstName} {member.lastName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{member.email}</td>
                      <td className="px-6 py-4">
                        {/* Only admin can change roles — backend also enforces this via adminOnly middleware */}
                        {currentRole === "admin" ? (
                          <select
                            value={member.role}
                            onChange={(e) => updateRole(member._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border-none outline-none cursor-pointer ${roleColors[member.role] || "bg-slate-100 text-slate-600"}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                            <option value="guest">Guest</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleColors[member.role] || ""}`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(member.createdAt)}</td>
                      {canEdit && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {/* Reset Password */}
                            {resetId === member._id ? (
                              <div className="flex items-center gap-1.5">
                                {resetSuccess === member._id ? (
                                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                    <Check size={14} /> Updated
                                  </span>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      placeholder="New password (8+ chars)"
                                      className="w-36 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                      autoFocus
                                      onKeyDown={(e) => e.key === "Enter" && resetPassword(member._id)}
                                    />
                                    <button
                                      onClick={() => resetPassword(member._id)}
                                      className="px-2.5 py-1.5 bg-cyan-600 text-white rounded-lg text-[11px] font-bold hover:bg-cyan-700 transition-colors"
                                    >
                                      Set
                                    </button>
                                    <button
                                      onClick={() => { setResetId(null); setNewPassword(""); }}
                                      className="px-2 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-colors"
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => { setResetId(member._id); setNewPassword(""); }}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                                title="Reset Password"
                              >
                                <KeyRound size={15} />
                              </button>
                            )}
                            {/* Edit Profile */}
                            <button
                              onClick={() => {
                                setEditProfileId(member._id);
                                setEditAvatar(member.avatar || "");
                                setEditDescription(member.description || "");
                                setEditPermissionsId(null);
                              }}
                              className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                              title="Edit Profile Image & Description"
                            >
                              <UserPen size={15} />
                            </button>
                            {/* Edit Permissions (Only Admin) */}
                            {currentRole === "admin" && member.role !== "admin" && (
                              <button
                                onClick={() => {
                                  setEditPermissionsId(member._id);
                                  setEditingPermissions(member.customPermissions || []);
                                  setEditProfileId(null);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Edit Custom Permissions"
                              >
                                <Shield size={15} />
                              </button>
                            )}
                            {/* Delete */}
                            <button
                              onClick={() => deleteUser(member._id, `${member.firstName} ${member.lastName}`)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete permanently"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {editProfileId === member._id && (
                      <tr key={`edit-${member._id}`} className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={5} className="px-6 py-6">
                          <div className="flex gap-6 items-start bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex-shrink-0 w-32">
                              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Profile Image</label>
                              <ImageUpload
                                value={editAvatar}
                                onChange={(url) => setEditAvatar(url)}
                              />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Public Description</label>
                                <textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Describe the employee's expertise (visible to customers)..."
                                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  rows={4}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateProfile(member._id)}
                                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 transition-colors"
                                >
                                  Save Profile
                                </button>
                                <button
                                  onClick={() => setEditProfileId(null)}
                                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {editPermissionsId === member._id && (
                      <tr key={`perms-${member._id}`} className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={5} className="px-6 py-6">
                          <div className="bg-white p-6 rounded-xl border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Custom Permissions</h3>
                            <p className="text-xs text-slate-500 mb-6">Assign temporary or permanent permissions beyond their base role.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                              {Object.entries(groupedPermissions).map(([module, perms]) => (
                                <div key={module}>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{module}</h4>
                                  <div className="space-y-3">
                                    {perms.map((p) => {
                                      const isIncludedInRole = rolePermissions[member.role]?.includes(p);
                                      const customPerm = editingPermissions.find(cp => cp.permission === p);
                                      const isChecked = isIncludedInRole || !!customPerm;

                                      return (
                                        <div key={p} className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                          <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={isIncludedInRole}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setEditingPermissions([...editingPermissions, { permission: p }]);
                                                  } else {
                                                    setEditingPermissions(editingPermissions.filter(cp => cp.permission !== p));
                                                  }
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                              />
                                              <span className={isIncludedInRole ? "text-slate-400" : "font-medium"}>
                                                {p.split('.')[1]}
                                              </span>
                                            </label>
                                            {isIncludedInRole && (
                                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">In Role</span>
                                            )}
                                          </div>
                                          
                                          {customPerm && !isIncludedInRole && (
                                            <div className="flex items-center gap-2 mt-1 pl-6">
                                              <Calendar size={12} className="text-slate-400" />
                                              <input
                                                type="date"
                                                value={customPerm.expiresAt ? new Date(customPerm.expiresAt).toISOString().split('T')[0] : ""}
                                                onChange={(e) => {
                                                  const newPerms = [...editingPermissions];
                                                  const idx = newPerms.findIndex(cp => cp.permission === p);
                                                  if (idx >= 0) {
                                                    newPerms[idx] = { 
                                                      ...newPerms[idx], 
                                                      expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                                                    };
                                                    setEditingPermissions(newPerms);
                                                  }
                                                }}
                                                className="text-xs px-2 py-1 border border-slate-200 rounded text-slate-600 focus:outline-none focus:border-indigo-500 bg-white"
                                              />
                                              <span className="text-[10px] text-slate-400">(Expires)</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                              <button
                                onClick={() => updatePermissions(member._id)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                              >
                                Save Permissions
                              </button>
                              <button
                                onClick={() => setEditPermissionsId(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
