"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Plus, Tag, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  validFrom: string;
  validUntil: string;
  usedCount: number;
  usageLimit?: number;
  isActive: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get("/coupons");
      setCoupons(res.data || []);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/coupons/${id}`, { isActive: !currentStatus });
      fetchCoupons();
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.del(`/coupons/${id}`);
      fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Tag className="w-8 h-8 text-cyan-600" /> Discount Codes
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Manage promotional and discount codes for your customers.</p>
        </div>
        <Link
          href="/coupons/new"
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm shadow-cyan-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Code
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-cyan-50 text-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No discount codes yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Create your first promotional code to offer discounts to your customers during checkout.</p>
          <Link href="/coupons/new" className="inline-flex bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-all">
            Create Code
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code & Value</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Validity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 tracking-wide text-lg">{coupon.code}</div>
                    <div className="text-sm font-medium text-cyan-600 mt-1">
                      {coupon.type === "percentage" ? `${coupon.value}% OFF` : `${formatCurrency(coupon.value)} OFF`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium">{coupon.usedCount} used</div>
                    {coupon.usageLimit && <div className="text-xs text-slate-400 mt-1">out of {coupon.usageLimit} limit</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700 font-medium">Until {formatDate(coupon.validUntil)}</div>
                    <div className="text-xs text-slate-400 mt-1">From {formatDate(coupon.validFrom)}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleStatus(coupon._id, coupon.isActive)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        coupon.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => deleteCoupon(coupon._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
