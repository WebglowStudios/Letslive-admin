"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";

interface FinanceData {
  vendorPayables: number;
  vendorPaid: number;
  vendorPending: number;
  customerReceivables: number;
  customerReceived: number;
  customerPending: number;
  netPosition: number;
  urgentPaymentsCount: number;
}

interface UrgentItem {
  _id: string;
  vendor: string;
  serviceType: string;
  amount: number;
  paidAmount: number;
  dueDate?: string;
  status: string;
  operation?: { operationId: string; customer: { name: string }; destination: string };
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [urgent, setUrgent] = useState<UrgentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [fRes, uRes] = await Promise.all([
          api.get("/operations/finance/overview"),
          api.get("/operations/finance/urgent"),
        ]);
        setData(fRes?.data || null);
        setUrgent(uRes?.data || []);
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
            <h1 className="text-lg font-bold text-slate-800">Finance Dashboard</h1>
            <p className="text-xs text-slate-400">Cash flow overview — receivables, payables, and urgent dues</p>
          </div>
        </div>

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp size={18} className="text-emerald-600" /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Received</p>
                </div>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(data.customerReceived)}</p>
                <p className="text-[10px] text-slate-400 mt-1">of {formatCurrency(data.customerReceivables)} total</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><DollarSign size={18} className="text-amber-600" /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Pending</p>
                </div>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(data.customerPending)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown size={18} className="text-red-600" /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Vendor Paid</p>
                </div>
                <p className="text-xl font-bold text-red-600">{formatCurrency(data.vendorPaid)}</p>
                <p className="text-[10px] text-slate-400 mt-1">of {formatCurrency(data.vendorPayables)} total</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center"><TrendingUp size={18} className="text-cyan-600" /></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Net Position</p>
                </div>
                <p className={`text-xl font-bold ${data.netPosition >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(data.netPosition)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Received - Paid</p>
              </div>
            </div>

            {/* Urgent Banner */}
            {data.urgentPaymentsCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-red-800">{data.urgentPaymentsCount} Urgent Payment{data.urgentPaymentsCount > 1 ? "s" : ""}</p>
                  <p className="text-xs text-red-600">Vendor payments due within 48 hours or already overdue</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Urgent Payments List */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-3">Urgent Vendor Payments</h2>
          {urgent.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <p className="text-sm text-emerald-600 font-semibold">All clear! No urgent payments.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {urgent.map((p) => (
                <div key={p._id} className="bg-white border border-red-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{p.vendor}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{p.serviceType} | {p.operation?.operationId} | {p.operation?.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-700">{formatCurrency(p.amount - p.paidAmount)}</p>
                    <p className="text-[10px] text-red-500">{p.dueDate ? `Due: ${formatDate(p.dueDate)}` : "OVERDUE"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
