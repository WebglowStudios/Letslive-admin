"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { formatDate } from "@/lib/utils";
import { Search, Trash2, UserPlus, X, Copy, Eye, EyeOff, KeyRound, Check, Shield } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission, useRole } from "@/hooks/usePermission";
import PhoneInput from "@/components/ui/PhoneInput";

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pwd = "";
  for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function ManagePasswordModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [revealedPwd, setRevealedPwd] = useState<string | null>(null);
  const [fetchingPwd, setFetchingPwd] = useState(true);
  const [showRevealed, setShowRevealed] = useState(true);
  const [isPreExisting, setIsPreExisting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  const [password, setPassword] = useState(generatePassword());
  const [showPwd, setShowPwd] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");

  useEffect(() => {
    fetchCurrentPassword();
  }, [user._id]);

  async function fetchCurrentPassword() {
    setFetchingPwd(true);
    try {
      const res = await api.get(`/users/${user._id}/password-reveal`);
      if (res?.data?.password) {
        setRevealedPwd(res.data.password);
        setIsPreExisting(false);
        setShowResetForm(false);
      } else {
        setRevealedPwd(null);
        setIsPreExisting(true);
        setShowResetForm(true);
      }
    } catch {
      setRevealedPwd(null);
      setIsPreExisting(true);
      setShowResetForm(true);
    } finally {
      setFetchingPwd(false);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  }

  function copyAll(pwdToCopy: string) {
    const creds = `LetsLive Tours Account Credentials:\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nPassword: ${pwdToCopy}\nLogin URL: https://www.letslivetours.com/login`;
    copyText(creds, "all");
  }

  async function handleSave() {
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put(`/users/${user._id}/password`, { password });
      setRevealedPwd(password);
      setIsPreExisting(false);
      setSuccess(true);
      setShowResetForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100/80 flex items-center justify-center text-cyan-700">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">User Password</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">
                {user.firstName} {user.lastName} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {fetchingPwd ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading password...</p>
          </div>
        ) : success ? (
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-slate-800 text-base">New Password Saved!</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                The password for <strong>{user.firstName} {user.lastName}</strong> has been updated and is active.
              </p>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              {[
                { label: "Email", value: user.email, key: "email" },
                { label: "New Password", value: password, key: "password" },
                { label: "Portal URL", value: "https://www.letslivetours.com/login", key: "url" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1 px-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.label}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-800 select-all">
                      {item.value}
                    </span>
                  </div>
                  <button
                    onClick={() => copyText(item.value, item.key)}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors flex items-center gap-1 text-[11px]"
                    title={`Copy ${item.label}`}
                  >
                    {copiedKey === item.key ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check size={12} /> Copied
                      </span>
                    ) : (
                      <Copy size={13} className="text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => copyAll(password)}
              className="w-full py-2.5 px-4 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {copiedKey === "all" ? (
                <>
                  <Check size={14} className="text-emerald-600" /> All Credentials Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy All Credentials (WhatsApp / Email)
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* If user has an existing viewable password */}
            {revealedPwd && (
              <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound size={13} className="text-emerald-600" /> User's Registered Password
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(revealedPwd, "revealed")}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-emerald-100/70 transition-colors"
                  >
                    {copiedKey === "revealed" ? (
                      <>
                        <Check size={12} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-base font-mono font-bold text-slate-800 select-all tracking-wide">
                    {showRevealed ? revealedPwd : "••••••••••••"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRevealed(!showRevealed)}
                    className="p-1.5 hover:bg-emerald-100/60 rounded-lg text-emerald-700 transition-colors"
                    title={showRevealed ? "Hide password" : "Show password"}
                  >
                    {showRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => copyAll(revealedPwd)}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy All Login Info (for WhatsApp / Email)
                  </button>
                </div>
              </div>
            )}

            {/* Note if older pre-existing account */}
            {isPreExisting && (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-amber-950">Older Account:</strong> This user registered before viewable passwords were enabled (it is stored as a one-way bcrypt hash). Set a new password below to view and manage it going forward.
                </div>
              </div>
            )}

            {/* Change Password toggle if revealedPwd is present */}
            {revealedPwd && !showResetForm && (
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold hover:underline flex items-center gap-1"
                >
                  ✎ Change / Reset this password
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* Reset / Set Password Form */}
            {showResetForm && (
              <div className="space-y-4 pt-1">
                {revealedPwd && (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-700">Set New Password</span>
                    <button
                      type="button"
                      onClick={() => setShowResetForm(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
                    >
                      Cancel change
                    </button>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                    {error}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">New Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generatePassword();
                        setPassword(generated);
                        setError("");
                      }}
                      className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1"
                    >
                      Regenerate
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter 8+ characters..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-20"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => copyText(password, "input")}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy password"
                      >
                        {copiedKey === "input" ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                        title={showPwd ? "Hide password" : "Show password"}
                      >
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Minimum 8 characters.</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !password}
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    {saving ? "Saving..." : "Save & Set Password"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
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
  const [managePasswordUser, setManagePasswordUser] = useState<User | null>(null);
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

      {managePasswordUser && (
        <ManagePasswordModal
          user={managePasswordUser}
          onClose={() => setManagePasswordUser(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <span className="px-5 py-2 text-sm font-bold rounded-lg bg-white text-slate-800 shadow-sm">Customers</span>
            <Link href="/staff" className="px-5 py-2 text-sm font-semibold rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors">Staff & Management</Link>
          </div>
        </div>
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
                  <th className="px-6 py-3">Password</th>
                  <th className="px-6 py-3">Joined</th>
                  {(canDelete || isAdmin) && <th className="px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No users found</td></tr>
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
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setManagePasswordUser(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 rounded-lg text-xs text-slate-600 hover:text-cyan-700 transition-colors group cursor-pointer"
                          title="Set and view password"
                        >
                          <span className="font-mono text-slate-400 tracking-wider">••••••••</span>
                          <span className="text-[10px] font-bold text-cyan-600 group-hover:text-cyan-700 flex items-center gap-0.5 ml-1">
                            <Eye size={11} /> View / Set
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(u.createdAt)}</td>
                      {(canDelete || isAdmin) && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {/* Manage Password */}
                            {isAdmin && (
                              <button
                                onClick={() => setManagePasswordUser(u)}
                                className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                                title="Set & View Password"
                              >
                                <KeyRound size={15} />
                              </button>
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
