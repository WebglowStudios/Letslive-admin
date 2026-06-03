"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Search, FileText, ExternalLink } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";

interface Application {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  appliedAt: string;
}

interface CareerWithApps {
  _id: string;
  title: string;
  department: string;
  location: string;
  applications: Application[];
}

export default function ApplicationsPage() {
  const [careers, setCareers] = useState<CareerWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCareer, setSelectedCareer] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      // Fetch all careers, then fetch applications for each
      const careersRes = await api.get("/careers?limit=50");
      const careersList = careersRes?.data || [];

      const withApps: CareerWithApps[] = [];
      for (const career of careersList) {
        try {
          const appsRes = await api.get(`/careers/${career._id}/applications`);
          const apps = appsRes?.data || [];
          if (apps.length > 0 || true) { // Include all careers for filtering
            withApps.push({
              _id: career._id,
              title: career.title,
              department: career.department,
              location: career.location,
              applications: apps,
            });
          }
        } catch {
          withApps.push({ ...career, applications: [] });
        }
      }
      setCareers(withApps);
    } catch {
      setCareers([]);
    } finally {
      setLoading(false);
    }
  }

  // Flatten all applications for display
  const allApplications = careers.flatMap((c) =>
    c.applications.map((app) => ({ ...app, careerTitle: c.title, careerId: c._id, department: c.department }))
  );

  // Filter
  const filtered = allApplications.filter((app) => {
    if (selectedCareer !== "all" && app.careerId !== selectedCareer) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        app.name?.toLowerCase().includes(q) ||
        app.email?.toLowerCase().includes(q) ||
        app.careerTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <RoleGuard permission="careers.edit">
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Job Applications</h1>
          <p className="text-xs text-slate-400">{allApplications.length} total applications across {careers.length} positions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Search size={16} className="text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or position..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          <select
            value={selectedCareer}
            onChange={(e) => setSelectedCareer(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
          >
            <option value="all">All Positions</option>
            {careers.map((c) => (
              <option key={c._id} value={c._id}>{c.title} ({c.applications.length})</option>
            ))}
          </select>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Applicant</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Applied</th>
                  <th className="px-6 py-3">Resume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Loading applications...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">No applications found</td></tr>
                ) : (
                  filtered.map((app, i) => (
                    <tr key={`${app.careerId}-${i}`} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700">{app.name}</p>
                        <p className="text-xs text-slate-400">{app.email}</p>
                        {app.phone && <p className="text-xs text-slate-400">{app.phone}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{app.careerTitle}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{app.department}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(app.appliedAt)}</td>
                      <td className="px-6 py-4">
                        {app.resume ? (
                          <a href={app.resume} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-600 font-medium hover:underline">
                            <ExternalLink size={12} /> View
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cover Letters (expandable) */}
        {filtered.some((app) => app.coverLetter) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Cover Letters</h3>
            {filtered.filter((app) => app.coverLetter).map((app, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-cyan-600" />
                  <span className="text-sm font-medium text-slate-700">{app.name}</span>
                  <span className="text-xs text-slate-400">— {app.careerTitle}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{app.coverLetter}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
