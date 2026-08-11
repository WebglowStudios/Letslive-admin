"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Review, Package } from "@/types";
import { formatDate } from "@/lib/utils";
import { Check, Trash2, Plus, X, Star } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";

export default function ReviewsPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingPackages, setLoadingPackages] = useState(true);

  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Manual Review Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ reviewerName: "", rating: 5, title: "", text: "", tripType: "", travelDate: "" });
  const [submitting, setSubmitting] = useState(false);

  const canApprove = usePermission("reviews.approve");
  const canDelete = usePermission("reviews.delete");
  const canEdit = usePermission("reviews.edit"); // Assuming 'reviews.edit' allows adding manual reviews

  const fetchPackages = useCallback(async (search: string) => {
    setLoadingPackages(true);
    try {
      let url = `/packages?limit=100&admin=true`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      const res = await api.get(url);
      setPackages(res?.data || []);
    } catch {
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPackages]);

  useEffect(() => {
    if (selectedPackage) {
      fetchReviews(selectedPackage._id);
    } else {
      setReviews([]);
    }
  }, [selectedPackage]);

  async function fetchReviews(packageId: string) {
    setLoadingReviews(true);
    try {
      const res = await api.get(`/reviews/admin/package/${packageId}`);
      setReviews(res?.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
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

  async function submitManualReview(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPackage) return;
    setSubmitting(true);
    try {
      const res = await api.post("/reviews/manual", {
        package: selectedPackage._id,
        ...manualForm,
      });
      if (res.status === "success") {
        setShowManualModal(false);
        setManualForm({ reviewerName: "", rating: 5, title: "", text: "", tripType: "", travelDate: "" });
        fetchReviews(selectedPackage._id);
      } else {
        alert(res.message || "Failed to submit");
      }
    } catch (err: any) {
      alert(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === "approved" && !r.isApproved) return false;
    if (statusFilter === "pending" && r.isApproved) return false;
    if (ratingFilter !== "all" && r.rating !== parseInt(ratingFilter)) return false;
    return true;
  });

  return (
    <RoleGuard permission="reviews.view">
      <div className="flex h-[calc(100vh-120px)] gap-6">
        {/* Left Panel: Packages List */}
        <div className="w-1/3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-800 mb-3">Packages</h2>
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loadingPackages ? (
              <div className="text-center py-10 text-sm text-slate-400">Loading...</div>
            ) : packages.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">No packages found</div>
            ) : (
              packages.map((pkg) => (
                <button
                  key={pkg._id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    selectedPackage?._id === pkg._id ? "bg-emerald-50 border border-emerald-100" : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <p className={`text-sm font-medium ${selectedPackage?._id === pkg._id ? "text-emerald-700" : "text-slate-700"}`}>
                    {pkg.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      {pkg.rating || 0} ({pkg.reviewCount || 0})
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Reviews Detail */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col relative">
          {selectedPackage ? (
            <>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="font-semibold text-slate-800 text-lg">{selectedPackage.name}</h2>
                  <p className="text-sm text-slate-500">{reviews.length} total reviews</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                  {canEdit && (
                    <button
                      onClick={() => setShowManualModal(true)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} /> Add Review
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {loadingReviews ? (
                  <div className="text-center py-12 text-sm text-slate-400">Loading reviews...</div>
                ) : filteredReviews.length === 0 ? (
                  <div className="text-center py-12 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    No reviews found for this package
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredReviews.map((r) => {
                      const user = typeof r.user === "object" ? r.user : null;
                      const reviewerName = r.reviewerName || (user ? `${user.firstName} ${user.lastName}` : "Anonymous");
                      const initial = reviewerName[0] || "?";
                      
                      return (
                        <div key={r._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-xs font-bold text-cyan-700">
                                  {initial}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                    {reviewerName}
                                    {r.isVerified && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Verified</span>}
                                    {!r.user && <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Manual</span>}
                                  </p>
                                  <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
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
                                <button onClick={() => handleApprove(r._id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-transparent hover:border-emerald-200" title="Approve">
                                  <Check size={16} />
                                </button>
                              )}
                              {canDelete && (
                                <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 border border-transparent hover:border-red-200" title="Delete">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <Star size={48} className="text-slate-200 mb-4" />
              <p>Select a package to view its reviews</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Review Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Add Manual Review</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitManualReview} className="p-5 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reviewer Name</label>
                  <input
                    type="text"
                    required
                    value={manualForm.reviewerName}
                    onChange={(e) => setManualForm({...manualForm, reviewerName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                  <select
                    value={manualForm.rating}
                    onChange={(e) => setManualForm({...manualForm, rating: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trip Type (Optional)</label>
                  <select
                    value={manualForm.tripType}
                    onChange={(e) => setManualForm({...manualForm, tripType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">None</option>
                    <option value="honeymoon">Honeymoon</option>
                    <option value="family">Family</option>
                    <option value="solo">Solo</option>
                    <option value="group">Group</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Review Title (Optional)</label>
                  <input
                    type="text"
                    value={manualForm.title}
                    onChange={(e) => setManualForm({...manualForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Brief summary of the review"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Review Text</label>
                  <textarea
                    required
                    rows={4}
                    value={manualForm.text}
                    onChange={(e) => setManualForm({...manualForm, text: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Full review description..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
