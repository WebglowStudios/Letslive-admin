"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Review } from "@/types";
import { formatDate } from "@/lib/utils";
import { Check, X, Trash2 } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const canApprove = usePermission("reviews.approve");
  const canDelete = usePermission("reviews.delete");

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const res = await api.get("/reviews/featured");
      setReviews(res?.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      await api.put(`/reviews/${id}/approve`);
      setReviews((prev) => prev.map((r) => r._id === id ? { ...r, isApproved: true } : r));
    } catch {
      alert("Failed to approve");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    try {
      await api.del(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      alert("Failed to delete");
    }
  }

  return (
    <RoleGuard permission="reviews.view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{reviews.length} reviews</p>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">
              No reviews to moderate
            </div>
          ) : (
            reviews.map((r) => {
              const user = typeof r.user === "object" ? r.user : null;
              const pkg = typeof r.package === "object" ? r.package : null;
              return (
                <div key={r._id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-xs font-bold text-cyan-700">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {user ? `${user.firstName} ${user.lastName}` : "Anonymous"}
                          </p>
                          <p className="text-xs text-slate-400">{pkg?.name || "Package"} • {formatDate(r.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-sm ${i < r.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
                        ))}
                        <span className="text-xs text-slate-400 ml-1">{r.rating}/5</span>
                      </div>
                      {r.title && <p className="text-sm font-medium text-slate-700 mb-1">{r.title}</p>}
                      <p className="text-sm text-slate-600 leading-relaxed">{r.text}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.isApproved ? "Approved" : "Pending"}
                      </span>
                      {canApprove && !r.isApproved && (
                        <button onClick={() => handleApprove(r._id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600" title="Approve">
                          <Check size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
