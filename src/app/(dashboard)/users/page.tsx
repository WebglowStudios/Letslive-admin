"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { Search, Trash2, UserPlus, X, Copy, Eye, EyeOff, KeyRound, Check } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission, useRole } from "@/hooks/usePermission";
import PhoneInput from "@/components/ui/PhoneInput";

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pwd = "";
  for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: generatePassword(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);
  const [showPwd, setShowPwd] = useState(true);
  const [copied, setCopied] = useState("");

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  async function handleCreate() {
    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email and password are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/staff", { ...form, role: "user" });
      setCreated({ name: `${form.firstName} ${form.lastName}`.trim(), email: form.email, password: form.password });
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">Add Customer</h3>
            <p className="text-xs text-slate-400">Create a customer account for a walk-in visitor</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        {created ? (
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <UserPlus size={20} className="text-emerald-600" />
            </div>
            <p className="text-center font-semibold text-slate-800">Account Created for {created.name}!</p>
            {[
              { label: "Email", value: created.email, key: "email" },
              { label: "Password", value: created.password, key: "pwd" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                  <p className="text-sm font-mono font-medium text-slate-700">{item.value}</p>
                </div>
                <button onClick={() => copyText(item.value, item.key)} className="p-2 hover:bg-slate-200 rounded-lg">
                  <Copy size={14} className={copied === item.key ? "text-emerald-600" : "text-slate-400"} />
                </button>
              </div>
            ))}
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-700">
              Customer logs in at: <strong>www.letslivetours.com/login</strong>
            </div>
            <button onClick={onClose} className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold text-slate-700">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Last Name</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <PhoneInput value={form.phone} onChange={(val) => setForm({ ...form, phone: val })} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">Password *</label>
                <button type="button" onClick={() => setForm({ ...form, password: generatePassword() })} className="text-[10px] text-cyan-600 hover:text-cyan-700 font-semibold">Regenerate</button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded">
                  {showPwd ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 disabled:opacity-40 flex items-center justify-center gap-2">
                <UserPlus size={14} /> {saving ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const canDelete = usePermission("users.delete");
  const currentRole = useRole();
  const isAdmin = currentRole === "admin";

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await api.get("/users?limit=100");
      setUsers(res?.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch {
      alert("Failed to delete");
    }
  }

  async function resetPassword(id: string) {
    if (!newPassword || newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    try {
      await api.put(`/users/${id}/password`, { password: newPassword });
      setResetSuccess(id);
      setTimeout(() => { setResetId(null); setNewPassword(""); setResetSuccess(""); }, 2000);
    } catch {
      alert("Failed to reset password");
    }
  }

  const roleBadge: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    manager: "bg-cyan-100 text-cyan-700",
    staff: "bg-emerald-100 text-emerald-700",
    guest: "bg-slate-100 text-slate-600",
    user: "bg-blue-100 text-blue-700",
  };

  const filtered = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <RoleGuard permission="users.view">
      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onCreated={() => { fetchUsers(); setShowAddCustomer(false); }}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
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
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors"
            >
              <UserPlus size={15} /> Add Customer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Joined</th>
                  {(canDelete || isAdmin) && <th className="px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">No users found</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{u.firstName} {u.lastName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{u.phone || <span className="text-slate-300">—</span>}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleBadge[u.role] || "bg-slate-100 text-slate-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                      {(canDelete || isAdmin) && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {/* Reset Password */}
                            {isAdmin && (
                              resetId === u._id ? (
                                <div className="flex items-center gap-1.5">
                                  {resetSuccess === u._id ? (
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
                                        onKeyDown={(e) => e.key === "Enter" && resetPassword(u._id)}
                                      />
                                      <button
                                        onClick={() => resetPassword(u._id)}
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
                                  onClick={() => { setResetId(u._id); setNewPassword(""); }}
                                  className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                                  title="Reset Password"
                                >
                                  <KeyRound size={15} />
                                </button>
                              )
                            )}
                            {/* Delete */}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete permanently"
                              >
                                <Trash2 size={15} />
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
