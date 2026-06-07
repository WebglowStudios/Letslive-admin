"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";

interface SalespersonStat {
  _id: string;
  name: string;
  email: string;
  role: string;
  totalBookings: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  completed: number;
  avgMargin: number;
}

export default function SalespersonPage() {
  const [stats, setStats] = useState<SalespersonStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get("/operations/salesperson/stats");
        setStats(res?.data || []);
      } catch { /* */ }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <RoleGuard permission="bookings.view">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/operations" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Salesperson Performance</h1>
            <p className="text-xs text-slate-400">Revenue, profit, and bookings per team member</p>
          </div>
        </div>

        {stats.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <TrendingUp size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No performance data yet. Assign operations to staff to track metrics.</p>
          </div>
        ) : (
          <>
            {/* Leaderboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.slice(0, 3).map((s, i) => (
                <div key={s._id} className={`bg-white rounded-xl border p-5 ${i === 0 ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : "bg-amber-700"}`}>
                      {i === 0 ? <Trophy size={18} /> : `#${i + 1}`}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{s.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Revenue</p>
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(s.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Profit</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(s.totalProfit)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Bookings</p>
                      <p className="text-sm font-bold text-slate-800">{s.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Margin</p>
                      <p className="text-sm font-bold text-cyan-700">{s.avgMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Full Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] font-medium text-slate-500 uppercase bg-slate-50">
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Bookings</th>
                    <th className="px-5 py-3">Revenue</th>
                    <th className="px-5 py-3">Vendor Cost</th>
                    <th className="px-5 py-3">Profit</th>
                    <th className="px-5 py-3">Margin</th>
                    <th className="px-5 py-3">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.map((s, i) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.email}</p>
                      </td>
                      <td className="px-5 py-3 capitalize">{s.role}</td>
                      <td className="px-5 py-3 font-semibold">{s.totalBookings}</td>
                      <td className="px-5 py-3 font-semibold">{formatCurrency(s.totalRevenue)}</td>
                      <td className="px-5 py-3 text-red-600">{formatCurrency(s.totalCost)}</td>
                      <td className="px-5 py-3 font-bold text-emerald-600">{formatCurrency(s.totalProfit)}</td>
                      <td className="px-5 py-3 font-bold text-cyan-700">{s.avgMargin.toFixed(1)}%</td>
                      <td className="px-5 py-3">{s.completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
