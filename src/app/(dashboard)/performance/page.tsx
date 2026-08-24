"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Activity,
  Briefcase,
  CheckCircle,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";

interface PerformanceData {
  inquiriesManaged: number;
  conversions: number;
  clientsHandled: number;
  revenueGenerated: number;
  profitGenerated: number;
  incentivesEarned: number;
  recentActivity: any[];
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await api.get('/users/me/performance');
        setData(res.data.data);
      } catch (err) {
        console.error("Failed to load performance data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Inquiries Managed",
      value: data?.inquiriesManaged || 0,
      icon: <Activity className="text-blue-500" size={24} />,
      bg: "bg-blue-50",
    },
    {
      title: "Conversions (Bookings)",
      value: data?.conversions || 0,
      icon: <CheckCircle className="text-green-500" size={24} />,
      bg: "bg-green-50",
    },
    {
      title: "Clients / Ops Handled",
      value: data?.clientsHandled || 0,
      icon: <Users className="text-purple-500" size={24} />,
      bg: "bg-purple-50",
    },
    {
      title: "Revenue Generated",
      value: formatCurrency(data?.revenueGenerated || 0),
      icon: <TrendingUp className="text-cyan-500" size={24} />,
      bg: "bg-cyan-50",
    },
    {
      title: "Profit Generated",
      value: formatCurrency(data?.profitGenerated || 0),
      icon: <Briefcase className="text-indigo-500" size={24} />,
      bg: "bg-indigo-50",
    },
    {
      title: "Incentives Earned",
      value: formatCurrency(data?.incentivesEarned || 0),
      icon: <DollarSign className="text-amber-500" size={24} />,
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Performance</h1>
          <p className="text-sm text-slate-500">Track your personal KPIs, conversions, and incentives.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${s.bg}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{s.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Converted Operations</h2>
        {data?.recentActivity?.length === 0 ? (
          <p className="text-sm text-slate-500">No recent operations assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg">Operation ID</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Revenue</th>
                  <th className="py-3 px-4">Profit</th>
                  <th className="py-3 px-4 rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentActivity?.map((op: any) => (
                  <tr key={op._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-cyan-600">
                      {op.operationId}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{op.customer?.name}</td>
                    <td className="py-3 px-4 text-slate-700 capitalize">{op.destination}</td>
                    <td className="py-3 px-4 text-slate-700">{formatCurrency(op.sellingPrice)}</td>
                    <td className="py-3 px-4 text-green-600 font-medium">+{formatCurrency(op.grossProfit)}</td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/operations/${op._id}`}
                        className="text-cyan-600 hover:text-cyan-700 font-medium text-xs bg-cyan-50 px-2 py-1 rounded-md"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
