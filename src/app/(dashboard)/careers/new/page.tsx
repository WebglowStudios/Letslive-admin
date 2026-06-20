"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";

export default function NewCareerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    type: "full-time",
    experience: "",
    description: "",
    isActive: true,
  });
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [responsibilities, setResponsibilities] = useState<string[]>([""]);
  const [benefits, setBenefits] = useState<string[]>([""]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        requirements: requirements.map(s => s.trim()).filter(Boolean),
        responsibilities: responsibilities.map(s => s.trim()).filter(Boolean),
        benefits: benefits.map(s => s.trim()).filter(Boolean),
      };

      const res = await api.post("/careers", payload);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Job listing created successfully!");
        setTimeout(() => router.push("/careers"), 1500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create job listing";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <RoleGuard permission="careers.create">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/careers" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">New Job Listing</h1>
            <p className="text-sm text-slate-500">Create a new career opportunity</p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g. Senior Travel Consultant"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Select department</option>
                <option value="operations">Operations</option>
                <option value="marketing">Marketing</option>
                <option value="technology">Technology</option>
                <option value="hr">HR</option>
                <option value="finance">Finance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Mumbai, India"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience</label>
              <input
                type="text"
                name="experience"
                value={form.experience}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="3-5 years"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="Job description and responsibilities..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Requirements</label>
            <div className="space-y-2">
              {requirements.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => { const arr = [...requirements]; arr[i] = e.target.value; setRequirements(arr); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder={`Requirement ${i + 1}`}
                  />
                  {requirements.length > 1 && (
                    <button type="button" onClick={() => setRequirements(requirements.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <span className="text-lg leading-none">−</span>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setRequirements([...requirements, ""])} className="flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 mt-1">
                <span className="text-lg leading-none">+</span> Add requirement
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsibilities</label>
            <div className="space-y-2">
              {responsibilities.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => { const arr = [...responsibilities]; arr[i] = e.target.value; setResponsibilities(arr); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder={`Responsibility ${i + 1}`}
                  />
                  {responsibilities.length > 1 && (
                    <button type="button" onClick={() => setResponsibilities(responsibilities.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <span className="text-lg leading-none">−</span>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setResponsibilities([...responsibilities, ""])} className="flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 mt-1">
                <span className="text-lg leading-none">+</span> Add responsibility
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Benefits</label>
            <div className="space-y-2">
              {benefits.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => { const arr = [...benefits]; arr[i] = e.target.value; setBenefits(arr); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder={`Benefit ${i + 1}`}
                  />
                  {benefits.length > 1 && (
                    <button type="button" onClick={() => setBenefits(benefits.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <span className="text-lg leading-none">−</span>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setBenefits([...benefits, ""])} className="flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 mt-1">
                <span className="text-lg leading-none">+</span> Add benefit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? "Creating..." : "Create Job Listing"}
            </button>
            <Link href="/careers" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
