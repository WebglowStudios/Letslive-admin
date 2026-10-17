"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Star, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface SubmitReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPackageId?: string;
}

interface PackageItem {
  _id: string;
  name: string;
  destination?: { name?: string };
}

const PLATFORMS = [
  { value: "Google", label: "Google Reviews" },
  { value: "TripAdvisor", label: "TripAdvisor" },
  { value: "Trustpilot", label: "Trustpilot" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "Direct / WhatsApp", label: "Direct Feedback / WhatsApp" },
  { value: "Other", label: "Other Platform" },
];

const TRIP_TYPES = [
  { value: "family", label: "Family" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "group", label: "Group / Friends" },
  { value: "solo", label: "Solo" },
  { value: "business", label: "Business" },
];

export default function SubmitReviewModal({
  open,
  onClose,
  onSuccess,
  initialPackageId,
}: SubmitReviewModalProps) {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  const [packageId, setPackageId] = useState(initialPackageId || "");
  const [packageSearch, setPackageSearch] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [platform, setPlatform] = useState("Google");
  const [customPlatform, setCustomPlatform] = useState("");
  const [reviewDate, setReviewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [tripType, setTripType] = useState("family");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    requiresApproval: boolean;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessInfo(null);
      if (initialPackageId) {
        setPackageId(initialPackageId);
      }
      fetchPackages();
    }
  }, [open, initialPackageId]);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const res = await api.get("/packages?admin=true&limit=500");
      setPackages(res?.data || []);
    } catch (err) {
      console.error("Failed to load packages", err);
    } finally {
      setLoadingPackages(false);
    }
  };

  if (!open) return null;

  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(packageSearch.toLowerCase()) ||
    (p.destination?.name && p.destination.name.toLowerCase().includes(packageSearch.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reviewerName.trim()) {
      setError("Please provide the customer/reviewer name.");
      return;
    }
    if (!packageId) {
      setError("Please select the package/tour this review belongs to.");
      return;
    }
    if (!text.trim()) {
      setError("Please enter the review text.");
      return;
    }

    setSubmitting(true);
    try {
      const chosenPlatform = platform === "Other" && customPlatform.trim() ? customPlatform.trim() : platform;

      const payload = {
        reviewerName: reviewerName.trim(),
        package: packageId,
        platform: chosenPlatform,
        reviewDate: reviewDate || new Date().toISOString(),
        rating,
        title: title.trim(),
        text: text.trim(),
        reviewUrl: reviewUrl.trim(),
        tripType: tripType || undefined,
      };

      const res = await api.post("/reviews/submit", payload);

      if (res?.status === "success") {
        setSuccessInfo({
          message: res.message || "Review submitted successfully!",
          requiresApproval: !!res.requiresApproval,
        });

        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2200);
      } else {
        setError(res?.message || "Failed to submit review.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while submitting the review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <Star size={18} className="fill-amber-500" />
              </span>
              <h3 className="font-bold text-slate-800 text-base">
                Log Customer / External Review
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter customer feedback brought in from Google, TripAdvisor, or direct channels.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successInfo ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 bg-white">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-800">
              {successInfo.requiresApproval
                ? "Sent for Verification!"
                : "Review Published!"}
            </h4>
            <p className="text-xs text-slate-600 max-w-md">
              {successInfo.requiresApproval
                ? "Your review was logged and routed to Content Approver. Once an administrator approves it, it will reflect in your performance review target!"
                : "The review has been added directly and ratings have been updated."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Note about workflow */}
            <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-100 text-cyan-900 flex items-start gap-2.5">
              <span className="text-base shrink-0">ℹ️</span>
              <p className="text-[11px] leading-relaxed">
                Staff submissions are routed to the <strong>Content Approver</strong>. Once approved by management, the review will count towards your <strong>Review Target</strong> on your Performance dashboard.
              </p>
            </div>

            {/* Reviewer Name & Platform Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer / Reviewer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. John Doe / Amit Sharma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Review Platform <span className="text-rose-500">*</span>
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {platform === "Other" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Specify Platform Name
                </label>
                <input
                  type="text"
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  placeholder="e.g. MakeMyTrip, WhatsApp Message, Email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>
            )}

            {/* Package Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tour / Package Reviewed <span className="text-rose-500">*</span>
              </label>
              {packages.length > 10 && (
                <input
                  type="text"
                  placeholder="Type to filter packages..."
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  className="w-full mb-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-slate-50"
                />
              )}
              <select
                required
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                disabled={loadingPackages}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              >
                <option value="">-- Choose Package --</option>
                {filteredPackages.map((pkg) => (
                  <option key={pkg._id} value={pkg._id}>
                    {pkg.name} {pkg.destination?.name ? `(${pkg.destination.name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Rating Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Submission Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Star Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={20}
                        className={`transition-colors ${
                          (hoverRating || rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-slate-700 text-xs ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>
            </div>

            {/* Trip Type & Title Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trip Type (Optional)
                </label>
                <select
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  {TRIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Review Headline / Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unforgettable Dubai Tour"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>
            </div>

            {/* Review URL / Proof Link */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Google Maps / Review URL (Optional)</span>
                {reviewUrl && (
                  <a
                    href={reviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:underline flex items-center gap-0.5 text-[10px]"
                  >
                    Test link <ExternalLink size={10} />
                  </a>
                )}
              </label>
              <input
                type="url"
                value={reviewUrl}
                onChange={(e) => setReviewUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/... or TripAdvisor review link"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
            </div>

            {/* Review Content */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Review Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full customer review here..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none leading-relaxed"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 shadow-sm shadow-cyan-200 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
