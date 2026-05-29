"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Download, Search } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

interface Subscriber {
  _id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const canExport = usePermission("newsletter.export");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    try {
      const res = await api.get("/newsletter?limit=100");
      setSubscribers(res?.data || []);
    } catch {
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const csv = "Email,Status,Subscribed Date\n" + subscribers.map((s) => `${s.email},${s.isActive ? "Active" : "Unsubscribed"},${formatDate(s.createdAt)}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <RoleGuard permission="newsletter.view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Search subscribers..." className="bg-transparent border-none outline-none text-sm w-full" />
          </div>
          {canExport && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : subscribers.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-sm text-slate-400">No subscribers</td></tr>
                ) : (
                  subscribers.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-700">{s.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {s.isActive ? "Active" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(s.createdAt)}</td>
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
