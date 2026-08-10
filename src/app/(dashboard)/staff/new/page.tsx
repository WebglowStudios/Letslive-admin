"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, UserPlus, Copy, Eye, EyeOff, Shield, Crown, UserCog, Users } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import PhoneInput from "@/components/ui/PhoneInput";

const roles = [
  {
    value: "admin",
    label: "Admin",
    icon: Crown,
    color: "border-purple-300 bg-purple-50",
    activeColor: "border-purple-500 bg-purple-100 ring-2 ring-purple-200",
    badge: "bg-purple-100 text-purple-700",
    description: "Full access to everything. Can manage all users, settings, and system configuration.",
  },
  {
    value: "manager",
    label: "Manager",
    icon: Shield,
    color: "border-cyan-300 bg-cyan-50",
    activeColor: "border-cyan-500 bg-cyan-100 ring-2 ring-cyan-200",
    badge: "bg-cyan-100 text-cyan-700",
    description: "Can manage packages, destinations, bookings, itineraries, and view all staff work.",
  },
  {
    value: "staff",
    label: "Staff",
    icon: UserCog,
    color: "border-emerald-300 bg-emerald-50",
    activeColor: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    description: "Can create packages, itineraries, handle enquiries, and manage their own content.",
  },
  {
    value: "guest",
    label: "Guest (Frontend Only)",
    icon: Users,
    color: "border-slate-200 bg-slate-50",
    activeColor: "border-slate-400 bg-slate-100 ring-2 ring-slate-200",
    badge: "bg-slate-100 text-slate-600",
    description: "Can only log in to the customer website dashboard. No admin panel access.",
  },
];

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  let pwd = "";
  for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

function getPasswordStrength(pwd: string): { label: string; color: string; width: string } {
  if (!pwd) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
  if (score <= 3) return { label: "Medium", color: "bg-amber-500", width: "66%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

export default function NewStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string; role: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "staff",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleGeneratePassword() {
    const pwd = generatePassword();
    setForm({ ...form, password: pwd });
    setShowPassword(true);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  function copyCredentials() {
    if (!createdUser) return;
    const loginUrl = createdUser.role === "guest" ? "https://www.letslivetours.com/login" : "https://admin.letslivetours.com/login";
    const text = `LetsLive Tours — Login Credentials\n\nName: ${createdUser.name}\nEmail: ${createdUser.email}\nPassword: ${createdUser.password}\nRole: ${createdUser.role}\n\nLogin at: ${loginUrl}`;
    navigator.clipboard.writeText(text);
    setCopied("all");
    setTimeout(() => setCopied(""), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.password) {
      setError("First name, email, and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/admin/staff", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password,
      });

      if (res?.status === "success" || res?.data) {
        setCreatedUser({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          password: form.password,
          role: form.role,
        });
      } else {
        setError(res?.message || res?.error || "Failed to create user");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const strength = getPasswordStrength(form.password);
  const selectedRole = roles.find((r) => r.value === form.role)!;

  // ─── SUCCESS STATE ───
  if (createdUser) {
    return (
      <RoleGuard permission="staff.create">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center pt-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus size={28} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">User Created Successfully!</h1>
            <p className="text-sm text-slate-500 mt-1">Share the credentials below with the new team member.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <p className="text-lg font-bold text-slate-800">{createdUser.name}</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${selectedRole.badge}`}>
                  {createdUser.role}
                </span>
              </div>
              <button
                onClick={copyCredentials}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors"
              >
                <Copy size={14} />
                {copied === "all" ? "Copied!" : "Copy All Credentials"}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-slate-700">{createdUser.email}</p>
                </div>
                <button onClick={() => copyToClipboard(createdUser.email, "email")} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <Copy size={14} className={copied === "email" ? "text-emerald-600" : "text-slate-400"} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</p>
                  <p className="text-sm font-mono font-medium text-slate-700">{createdUser.password}</p>
                </div>
                <button onClick={() => copyToClipboard(createdUser.password, "password")} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <Copy size={14} className={copied === "password" ? "text-emerald-600" : "text-slate-400"} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Login URL</p>
                  <p className="text-sm font-medium text-cyan-600">{createdUser.role === "guest" ? "https://www.letslivetours.com/login" : "https://admin.letslivetours.com/login"}</p>
                </div>
                <button onClick={() => copyToClipboard(createdUser.role === "guest" ? "https://www.letslivetours.com/login" : "https://admin.letslivetours.com/login", "url")} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <Copy size={14} className={copied === "url" ? "text-emerald-600" : "text-slate-400"} />
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
              <p className="text-xs text-amber-700">
                <strong>Important:</strong> Share these credentials securely. The user should change their password after first login.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setCreatedUser(null); setForm({ firstName: "", lastName: "", email: "", phone: "", role: "staff", password: "" }); }}
              className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors"
            >
              Create Another User
            </button>
            <Link href="/staff" className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Back to Staff List
            </Link>
          </div>
        </div>
      </RoleGuard>
    );
  }

  // ─── CREATE FORM ───
  return (
    <RoleGuard permission="staff.create">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/staff" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create Team Member</h1>
            <p className="text-sm text-slate-500">Add a new user to the admin panel with specific role permissions</p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-800 mb-1">Select Role</p>
            <p className="text-xs text-slate-400 mb-4">Choose the access level for this user</p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => {
                const IconComp = role.icon;
                const isActive = form.role === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${isActive ? role.activeColor : role.color} hover:shadow-sm`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <IconComp size={18} className={isActive ? "text-slate-700" : "text-slate-500"} />
                      <span className="text-sm font-bold text-slate-800">{role.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{role.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-800 mb-1">Personal Information</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Rahul"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Sharma"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="rahul@letslivetours.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone (optional)</label>
              <PhoneInput value={form.phone} onChange={(val) => setForm({ ...form, phone: val })} />
            </div>
          </div>

          {/* Password */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Login Password</p>
                <p className="text-xs text-slate-400">Set an initial password for this user</p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Generate Strong Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-20 font-mono"
                placeholder="Minimum 8 characters"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  {showPassword ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
                </button>
                {form.password && (
                  <button type="button" onClick={() => copyToClipboard(form.password, "pwd")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <Copy size={14} className={copied === "pwd" ? "text-emerald-600" : "text-slate-400"} />
                  </button>
                )}
              </div>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div className="space-y-1.5">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="text-[10px] font-semibold text-slate-500">Strength: {strength.label}</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <UserPlus size={16} />
              {loading ? "Creating..." : `Create ${selectedRole.label}`}
            </button>
            <Link href="/staff" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
