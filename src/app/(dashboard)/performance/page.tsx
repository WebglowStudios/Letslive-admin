"use client";

import { useEffect, useState, useTransition } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  Activity,
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import SubmitReviewModal from "@/components/reviews/SubmitReviewModal";

interface TargetSummary {
  exists: boolean;
  id: string | null;
  periodType: "monthly" | "quarterly" | "yearly";
  year: number;
  month?: number;
  quarter?: number;
  salesTarget: number;
  salesAchieved: number;
  isSalesAchieved: boolean | null;
  salesProgressPercent: number;
  revenueTarget: number;
  revenueAchieved: number;
  isRevenueAchieved: boolean | null;
  revenueProgressPercent: number;
  grossProfitTarget?: number;
  grossProfitAchieved?: number;
  isGrossProfitAchieved?: boolean | null;
  grossProfitProgressPercent?: number;
  netProfitTarget?: number;
  netProfitAchieved?: number;
  isNetProfitAchieved?: boolean | null;
  netProfitProgressPercent?: number;
  reviewTarget: number;
  reviewAchieved: number;
  isReviewAchieved: boolean | null;
  reviewProgressPercent: number;
  targetPackageId?: string | null;
  targetPackageName?: string | null;
  notes?: string | null;
  overallStatus: "achieved" | "in-progress" | "missed" | "no-target";
}

interface PackageReviewStat {
  packageId: string;
  packageName: string;
  count: number;
}

interface PerformanceData {
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
  };
  period: "monthly" | "quarterly" | "yearly" | "all";
  year: number;
  month?: number;
  quarter?: number;
  inquiriesManaged: number;
  conversions: number;
  clientsHandled: number;
  revenueGenerated: number;
  profitGenerated: number;
  grossProfit?: number;
  netProfit?: number;
  incentivesEarned: number;
  pendingIncentives: number;
  totalReviewsEntered: number;
  reviewsByPackage: PackageReviewStat[];
  target: TargetSummary;
  recentActivity: any[];
}

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  activeLeadsCount?: number;
}

interface PackageOption {
  _id: string;
  name: string;
  destination?: { name?: string };
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const QUARTERS = [
  { value: 1, label: "Q1", range: "Jan – Mar" },
  { value: 2, label: "Q2", range: "Apr – Jun" },
  { value: 3, label: "Q3", range: "Jul – Sep" },
  { value: 4, label: "Q4", range: "Oct – Dec" },
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

export default function PerformancePage() {
  const { user: currentUser } = useAuthStore();
  const isAdminOrManager =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager" ||
    currentUser?.role === "sales-manager";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  // Selected filters
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(currentQuarter);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("me");

  // Data & staff state
  const [data, setData] = useState<PerformanceData | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showSubmitReviewModal, setShowSubmitReviewModal] = useState(false);

  // Target modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState(false);
  const [targetForm, setTargetForm] = useState({
    employeeId: "",
    periodType: "monthly" as "monthly" | "quarterly" | "yearly",
    year: currentYear,
    month: currentMonth,
    quarter: currentQuarter,
    salesTarget: 0,
    revenueTarget: 0,
    grossProfitTarget: 0,
    netProfitTarget: 0,
    reviewTarget: 0,
    packageId: "",
    notes: "",
  });

  // Load staff and packages for admins
  useEffect(() => {
    if (isAdminOrManager) {
      api
        .get("/users/staff")
        .then((res) => {
          if (res?.data) setStaffList(res.data);
        })
        .catch((err) => console.error("Failed to load staff list", err));

      api
        .get("/packages?admin=true&limit=200")
        .then((res) => {
          if (res?.data) setPackages(res.data);
        })
        .catch((err) => console.error("Failed to load packages", err));
    }
  }, [isAdminOrManager]);

  // Fetch performance data
  const fetchPerformance = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const endpoint =
        selectedStaffId === "me"
          ? `/users/me/performance`
          : `/users/${selectedStaffId}/performance`;

      const params = new URLSearchParams({
        period: periodType,
        year: String(selectedYear),
      });

      if (periodType === "monthly") {
        params.append("month", String(selectedMonth));
      } else if (periodType === "quarterly") {
        params.append("quarter", String(selectedQuarter));
      }

      const res = await api.get(`${endpoint}?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load performance data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [periodType, selectedYear, selectedMonth, selectedQuarter, selectedStaffId]);

  // Handle open target modal
  const handleOpenTargetModal = () => {
    const employeeToSet =
      selectedStaffId === "me"
        ? currentUser?._id || ""
        : selectedStaffId;

    // Pre-fill existing target values if available
    if (data?.target?.exists) {
      setTargetForm({
        employeeId: employeeToSet,
        periodType: data.target.periodType || periodType,
        year: data.target.year || selectedYear,
        month: data.target.month || selectedMonth,
        quarter: data.target.quarter || selectedQuarter,
        salesTarget: data.target.salesTarget || 0,
        revenueTarget: data.target.revenueTarget || 0,
        grossProfitTarget: data.target.grossProfitTarget || 0,
        netProfitTarget: data.target.netProfitTarget || 0,
        reviewTarget: data.target.reviewTarget || 0,
        packageId: data.target.targetPackageId || "",
        notes: data.target.notes || "",
      });
    } else {
      setTargetForm({
        employeeId: employeeToSet,
        periodType,
        year: selectedYear,
        month: selectedMonth,
        quarter: selectedQuarter,
        salesTarget: 0,
        revenueTarget: 0,
        grossProfitTarget: 0,
        netProfitTarget: 0,
        reviewTarget: 0,
        packageId: "",
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  // Submit target form
  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetForm.employeeId) {
      alert("Please select an employee.");
      return;
    }

    setSavingTarget(true);
    try {
      await api.post("/targets", {
        user: targetForm.employeeId,
        periodType: targetForm.periodType,
        year: targetForm.year,
        month: targetForm.periodType === "monthly" ? targetForm.month : undefined,
        quarter: targetForm.periodType === "quarterly" ? targetForm.quarter : undefined,
        salesTarget: Number(targetForm.salesTarget) || 0,
        revenueTarget: Number(targetForm.revenueTarget) || 0,
        grossProfitTarget: Number(targetForm.grossProfitTarget) || 0,
        netProfitTarget: Number(targetForm.netProfitTarget) || 0,
        reviewTarget: Number(targetForm.reviewTarget) || 0,
        package: targetForm.packageId || undefined,
        notes: targetForm.notes || undefined,
      });

      setIsModalOpen(false);
      fetchPerformance(true);
    } catch (err: any) {
      alert(err.message || "Failed to save target");
    } finally {
      setSavingTarget(false);
    }
  };

  // Delete target
  const handleDeleteTarget = async () => {
    if (!data?.target?.id) return;
    if (!confirm("Are you sure you want to remove this target?")) return;

    setDeletingTarget(true);
    try {
      await api.del(`/targets/${data.target.id}`);
      setIsModalOpen(false);
      fetchPerformance(true);
    } catch (err: any) {
      alert(err.message || "Failed to delete target");
    } finally {
      setDeletingTarget(false);
    }
  };

  // Reset to current time window
  const handleResetToCurrent = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setSelectedQuarter(currentQuarter);
  };

  // Calculate timeframe label
  const getTimeframeLabel = () => {
    if (periodType === "monthly") {
      const monthName = MONTHS.find((m) => m.value === selectedMonth)?.label || `Month ${selectedMonth}`;
      return `${monthName} ${selectedYear}`;
    }
    if (periodType === "quarterly") {
      const q = QUARTERS.find((item) => item.value === selectedQuarter);
      return `${q?.label} (${q?.range}) ${selectedYear}`;
    }
    return `Annual Year ${selectedYear}`;
  };

  // Selected employee name display
  const viewedEmployeeName =
    selectedStaffId === "me"
      ? `${currentUser?.firstName || "My"} ${currentUser?.lastName || "Performance"}`
      : staffList.find((s) => s._id === selectedStaffId)
      ? `${staffList.find((s) => s._id === selectedStaffId)?.firstName} ${
          staffList.find((s) => s._id === selectedStaffId)?.lastName
        }`
      : data?.user
      ? `${data.user.firstName} ${data.user.lastName}`
      : "Employee Performance";

  const target = data?.target;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
              <Trophy size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {selectedStaffId === "me" ? "My Performance" : viewedEmployeeName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Target milestones, sales generated, revenue produced & package reviews.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee selector for Admin & Managers */}
          {isAdminOrManager && (
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <User size={15} className="text-slate-400" />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="me">👤 My Performance (Me)</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Set Target Button (Admin/Manager) */}
          {isAdminOrManager && (
            <button
              onClick={handleOpenTargetModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all shadow-cyan-200 active:scale-95"
            >
              <Target size={15} />
              {target?.exists ? "Edit Target" : "Set Target"}
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchPerformance(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-cyan-600" : ""} />
          </button>
        </div>
      </div>

      {/* Timeframe Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Period Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setPeriodType("monthly")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                periodType === "monthly"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Calendar size={14} />
              Monthly
            </button>
            <button
              onClick={() => setPeriodType("quarterly")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                periodType === "quarterly"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Layers size={14} />
              Quarterly
            </button>
            <button
              onClick={() => setPeriodType("yearly")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                periodType === "yearly"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <TrendingUp size={14} />
              Yearly
            </button>
          </div>

          {/* Quick jump to current period */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Active Timeframe: <strong className="text-cyan-700">{getTimeframeLabel()}</strong>
            </span>
            <button
              onClick={handleResetToCurrent}
              className="text-[11px] font-semibold text-slate-500 hover:text-cyan-600 underline ml-2"
            >
              Jump to Current
            </button>
          </div>
        </div>

        {/* Dynamic Selectors Based on Period Type */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Month Selector if Monthly */}
          {periodType === "monthly" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.value})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quarter Selector if Quarterly */}
          {periodType === "quarterly" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Quarter:</span>
              <div className="flex items-center gap-1.5">
                {QUARTERS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => setSelectedQuarter(q.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedQuarter === q.value
                        ? "bg-cyan-50 border-cyan-400 text-cyan-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {q.label} <span className="text-[10px] text-slate-400 ml-0.5">({q.range})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Target Milestone Status Banner */}
          {target?.exists ? (
            <div
              className={`rounded-2xl p-6 border transition-all ${
                target.overallStatus === "achieved"
                  ? "bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border-emerald-200"
                  : target.overallStatus === "in-progress"
                  ? "bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-white border-cyan-200"
                  : "bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-white border-rose-200"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3.5 rounded-2xl shadow-sm ${
                      target.overallStatus === "achieved"
                        ? "bg-emerald-500 text-white shadow-emerald-200"
                        : target.overallStatus === "in-progress"
                        ? "bg-cyan-500 text-white shadow-cyan-200"
                        : "bg-rose-500 text-white shadow-rose-200"
                    }`}
                  >
                    {target.overallStatus === "achieved" ? (
                      <Trophy size={28} />
                    ) : target.overallStatus === "in-progress" ? (
                      <Sparkles size={28} />
                    ) : (
                      <AlertCircle size={28} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-800">
                        {target.overallStatus === "achieved"
                          ? "Target Achieved! Outstanding Performance"
                          : target.overallStatus === "in-progress"
                          ? "Target In Progress"
                          : "Target Missed for this Timeframe"}
                      </h2>
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          target.overallStatus === "achieved"
                            ? "bg-emerald-100 text-emerald-800"
                            : target.overallStatus === "in-progress"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {target.overallStatus === "achieved"
                          ? "✓ Achieved"
                          : target.overallStatus === "in-progress"
                          ? "⏳ In Progress"
                          : "✕ Missed"}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {target.overallStatus === "achieved"
                        ? `Congratulations! All targets set for ${getTimeframeLabel()} have been successfully met.`
                        : target.overallStatus === "in-progress"
                        ? `Tracking performance towards milestones set for ${getTimeframeLabel()}. Keep pushing!`
                        : `The period for ${getTimeframeLabel()} has completed without hitting all target metrics.`}
                    </p>

                    {target.notes && (
                      <div className="mt-3 p-3 bg-white/80 rounded-xl border border-slate-200/60 text-xs text-slate-700 italic flex items-center gap-2">
                        <span className="font-semibold not-italic text-slate-500">Admin Directive:</span>
                        "{target.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {isAdminOrManager && (
                  <button
                    onClick={handleOpenTargetModal}
                    className="self-start md:self-center px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
                  >
                    Update Target
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-200 text-slate-600">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    No Target Configured for {getTimeframeLabel()}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAdminOrManager
                      ? "Set sales, revenue, and package review targets for this employee to measure achievements."
                      : "No target has been assigned by management for this timeframe yet."}
                  </p>
                </div>
              </div>
              {isAdminOrManager && (
                <button
                  onClick={handleOpenTargetModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-colors"
                >
                  <Plus size={14} />
                  Set Target for {getTimeframeLabel()}
                </button>
              )}
            </div>
          )}

          {/* Target Milestone Progress Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-2 ${(target?.grossProfitTarget || target?.netProfitTarget) ? "lg:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-3"} gap-5`}>
            {/* 1. Sales Target Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Sales Target</h3>
                    <p className="text-[11px] text-slate-400">Bookings / Ops Closed</p>
                  </div>
                </div>

                {target?.salesTarget ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      target.isSalesAchieved
                        ? "bg-emerald-100 text-emerald-700"
                        : target.overallStatus === "missed"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {target.isSalesAchieved ? "✓ Met" : target.overallStatus === "missed" ? "✕ Missed" : "In Progress"}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">No Target</span>
                )}
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-slate-800">
                    {target?.salesAchieved || 0}
                  </span>
                  <span className="text-slate-400 text-sm ml-1">
                    / {target?.salesTarget ? `${target.salesTarget} Bookings` : "0 (No target)"}
                  </span>
                </div>
                {target?.salesTarget ? (
                  <span className="text-xs font-bold text-slate-600">
                    {target.salesProgressPercent}%
                  </span>
                ) : null}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    target?.isSalesAchieved
                      ? "bg-emerald-500"
                      : target?.overallStatus === "missed"
                      ? "bg-rose-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${target?.salesProgressPercent || 0}%` }}
                ></div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                {target?.salesTarget ? (
                  target.salesAchieved >= target.salesTarget ? (
                    <span className="text-emerald-600 font-semibold">
                      🎉 Goal achieved! +{target.salesAchieved - target.salesTarget} above target.
                    </span>
                  ) : (
                    <span>
                      Need <strong>{target.salesTarget - target.salesAchieved}</strong> more to meet target.
                    </span>
                  )
                ) : (
                  "Target not set for this period."
                )}
              </p>
            </div>

            {/* 2. Revenue Target Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Revenue Target</h3>
                    <p className="text-[11px] text-slate-400">Total Money Produced</p>
                  </div>
                </div>

                {target?.revenueTarget ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      target.isRevenueAchieved
                        ? "bg-emerald-100 text-emerald-700"
                        : target.overallStatus === "missed"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-cyan-100 text-cyan-700"
                    }`}
                  >
                    {target.isRevenueAchieved ? "✓ Met" : target.overallStatus === "missed" ? "✕ Missed" : "In Progress"}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">No Target</span>
                )}
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-slate-800">
                    {formatCurrency(target?.revenueAchieved || 0)}
                  </span>
                  <span className="text-slate-400 text-xs ml-1 block mt-0.5">
                    Target: {target?.revenueTarget ? formatCurrency(target.revenueTarget) : "₹0"}
                  </span>
                </div>
                {target?.revenueTarget ? (
                  <span className="text-xs font-bold text-slate-600">
                    {target.revenueProgressPercent}%
                  </span>
                ) : null}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    target?.isRevenueAchieved
                      ? "bg-emerald-500"
                      : target?.overallStatus === "missed"
                      ? "bg-rose-500"
                      : "bg-cyan-500"
                  }`}
                  style={{ width: `${target?.revenueProgressPercent || 0}%` }}
                ></div>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                {target?.revenueTarget ? (
                  target.revenueAchieved >= target.revenueTarget ? (
                    <span className="text-emerald-600 font-semibold">
                      🎉 Revenue target met (+{formatCurrency(target.revenueAchieved - target.revenueTarget)})
                    </span>
                  ) : (
                    <span>
                      Remaining: <strong>{formatCurrency(target.revenueTarget - target.revenueAchieved)}</strong>
                    </span>
                  )
                ) : (
                  "Target not set for this period."
                )}
              </p>
            </div>

            {/* 3. Review Target Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                    <Star size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Review Target</h3>
                    <p className="text-[11px] text-slate-400">
                      {target?.targetPackageName
                        ? `Target: ${target.targetPackageName}`
                        : "Across All Packages"}
                    </p>
                  </div>
                </div>

                {target?.reviewTarget ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      target.isReviewAchieved
                        ? "bg-emerald-100 text-emerald-700"
                        : target.overallStatus === "missed"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {target.isReviewAchieved ? "✓ Met" : target.overallStatus === "missed" ? "✕ Missed" : "In Progress"}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">No Target</span>
                )}
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-slate-800">
                    {target?.reviewAchieved || 0}
                  </span>
                  <span className="text-slate-400 text-sm ml-1">
                    / {target?.reviewTarget ? `${target.reviewTarget} Reviews` : "0 (No target)"}
                  </span>
                </div>
                {target?.reviewTarget ? (
                  <span className="text-xs font-bold text-slate-600">
                    {target.reviewProgressPercent}%
                  </span>
                ) : null}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    target?.isReviewAchieved
                      ? "bg-emerald-500"
                      : target?.overallStatus === "missed"
                      ? "bg-rose-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${target?.reviewProgressPercent || 0}%` }}
                ></div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px]">
                {target?.reviewTarget ? (
                  target.reviewAchieved >= target.reviewTarget ? (
                    <span className="text-emerald-600 font-semibold">
                      🎉 Review target met!
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Need <strong>{target.reviewTarget - target.reviewAchieved}</strong> more reviews.
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">Target not set for this period.</span>
                )}
                {target?.targetPackageName && (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium truncate max-w-[140px]" title={target.targetPackageName}>
                    {target.targetPackageName}
                  </span>
                )}
              </div>
            </div>

            {/* 4. Gross Profit Target Card (if configured) */}
            {target?.grossProfitTarget && target.grossProfitTarget > 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Gross Profit Target</h3>
                      <p className="text-[11px] text-slate-400">Total Margin (Pre-incentives)</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      target.isGrossProfitAchieved
                        ? "bg-emerald-100 text-emerald-700"
                        : target.overallStatus === "missed"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {target.isGrossProfitAchieved ? "✓ Met" : target.overallStatus === "missed" ? "✕ Missed" : "In Progress"}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-800">
                      {formatCurrency(target?.grossProfitAchieved ?? data?.grossProfit ?? 0)}
                    </span>
                    <span className="text-slate-400 text-xs ml-1 block mt-0.5">
                      Target: {formatCurrency(target.grossProfitTarget)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {target.grossProfitProgressPercent ?? Math.min(Math.round(((target.grossProfitAchieved || 0) / target.grossProfitTarget) * 100), 100)}%
                  </span>
                </div>

                <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      target.isGrossProfitAchieved
                        ? "bg-emerald-500"
                        : target.overallStatus === "missed"
                        ? "bg-rose-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${target.grossProfitProgressPercent || 0}%` }}
                  ></div>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  {(target.grossProfitAchieved || 0) >= target.grossProfitTarget ? (
                    <span className="text-emerald-600 font-semibold">
                      🎉 Gross profit target met (+{formatCurrency((target.grossProfitAchieved || 0) - target.grossProfitTarget)})
                    </span>
                  ) : (
                    <span>
                      Remaining: <strong>{formatCurrency(target.grossProfitTarget - (target.grossProfitAchieved || 0))}</strong>
                    </span>
                  )}
                </p>
              </div>
            ) : null}

            {/* 5. Net Profit Target Card (if configured) */}
            {target?.netProfitTarget && target.netProfitTarget > 0 ? (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Net Profit Target</h3>
                      <p className="text-[11px] text-slate-400">After Deducting Incentives</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      target.isNetProfitAchieved
                        ? "bg-emerald-100 text-emerald-700"
                        : target.overallStatus === "missed"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {target.isNetProfitAchieved ? "✓ Met" : target.overallStatus === "missed" ? "✕ Missed" : "In Progress"}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-800">
                      {formatCurrency(target?.netProfitAchieved ?? data?.netProfit ?? 0)}
                    </span>
                    <span className="text-slate-400 text-xs ml-1 block mt-0.5">
                      Target: {formatCurrency(target.netProfitTarget)}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {target.netProfitProgressPercent ?? Math.min(Math.round(((target.netProfitAchieved || 0) / target.netProfitTarget) * 100), 100)}%
                  </span>
                </div>

                <div className="mt-3 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      target.isNetProfitAchieved
                        ? "bg-emerald-500"
                        : target.overallStatus === "missed"
                        ? "bg-rose-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${target.netProfitProgressPercent || 0}%` }}
                  ></div>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  {(target.netProfitAchieved || 0) >= target.netProfitTarget ? (
                    <span className="text-emerald-600 font-semibold">
                      🎉 Net profit target met (+{formatCurrency((target.netProfitAchieved || 0) - target.netProfitTarget)})
                    </span>
                  ) : (
                    <span>
                      Remaining: <strong>{formatCurrency(target.netProfitTarget - (target.netProfitAchieved || 0))}</strong>
                    </span>
                  )}
                </p>
              </div>
            ) : null}
          </div>

          {/* Package Reviews Breakdown Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-amber-500" />
                  <h2 className="text-lg font-bold text-slate-800">
                    Package Reviews Logged ({data?.totalReviewsEntered || 0} Total)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approved customer reviews credited to this employee during {getTimeframeLabel()}.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => setShowSubmitReviewModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} /> Log Customer Review
                </button>
                <Link
                  href="/reviews"
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1"
                >
                  View all reviews →
                </Link>
              </div>
            </div>

            {data?.reviewsByPackage && data.reviewsByPackage.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {data.reviewsByPackage.map((pkg) => {
                  const isTargetPkg =
                    target?.targetPackageId &&
                    String(target.targetPackageId) === String(pkg.packageId);

                  return (
                    <div
                      key={pkg.packageId || pkg.packageName}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        isTargetPkg
                          ? "bg-amber-50/60 border-amber-300 ring-1 ring-amber-300"
                          : "bg-slate-50 border-slate-200/70 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 truncate" title={pkg.packageName}>
                            {pkg.packageName}
                          </p>
                          {isTargetPkg && (
                            <span className="shrink-0 text-[9px] font-extrabold uppercase bg-amber-500 text-white px-1.5 py-0.2 rounded">
                              Target Pkg
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Entered by this staff member
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-extrabold text-slate-800">
                          {pkg.count}
                        </span>
                        <span className="text-[10px] text-slate-400 block">reviews</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
                No package reviews were logged by this employee during {getTimeframeLabel()}.
              </div>
            )}
          </div>

          {/* General Operational & Sales Performance Stats */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Performance & Operational KPIs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Inquiries Managed</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {data?.inquiriesManaged || 0}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Total assigned leads</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Conversions (Bookings)</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {data?.conversions || 0}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {data?.inquiriesManaged
                      ? `${Math.round(((data.conversions || 0) / data.inquiriesManaged) * 100)}% conversion rate`
                      : "Converted from inquiries"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Clients / Ops Handled</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {data?.clientsHandled || 0}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Live trips & operations</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-cyan-50 text-cyan-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Revenue Generated</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {formatCurrency(data?.revenueGenerated || 0)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Total client selling price</p>
                </div>
              </div>

              {/* Gross Profit Generated */}
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                  <Briefcase size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Gross Profit</p>
                  <h3 className="text-2xl font-bold text-indigo-600">
                    +{formatCurrency(data?.grossProfit ?? data?.profitGenerated ?? 0)}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Selling price − vendor cost</p>
                </div>
              </div>

              {/* Net Profit Generated */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-sm text-emerald-800 font-medium">Net Profit</p>
                  <h3 className="text-2xl font-bold text-emerald-700">
                    +{formatCurrency(data?.netProfit ?? ((data?.grossProfit ?? data?.profitGenerated ?? 0) - (data?.incentivesEarned ?? 0)))}
                  </h3>
                  <p className="text-[10px] text-emerald-600/80 mt-0.5 font-medium">Gross profit − incentives</p>
                </div>
              </div>

              {/* Incentives Earned */}
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Incentives Earned</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {formatCurrency(data?.incentivesEarned || 0)}
                  </h3>
                  {data?.pendingIncentives ? (
                    <p className="text-[10px] font-semibold mt-0.5 text-amber-600">
                      {data.pendingIncentives} booking(s) pending approval
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5">Approved bonuses</p>
                  )}
                </div>
              </div>

              {/* Customer Reviews Credited */}
              <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                  <Star size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Reviews Credited</p>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {data?.totalReviewsEntered || 0}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Approved customer reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Operations Activity Table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Recent Converted Operations ({getTimeframeLabel()})
            </h2>
            {data?.recentActivity?.length === 0 ? (
              <p className="text-sm text-slate-500">No operations closed during this timeframe.</p>
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
                        <td className="py-3 px-4 font-semibold text-cyan-600">
                          {op.operationId}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {op.customer?.name?.trim() ||
                            op.customers?.[0]?.name?.trim() ||
                            (op.booking?.primaryTraveller?.firstName
                              ? `${op.booking.primaryTraveller.firstName} ${op.booking.primaryTraveller.lastName || ""}`.trim()
                              : "") ||
                            (op.booking?.user?.firstName
                              ? `${op.booking.user.firstName} ${op.booking.user.lastName || ""}`.trim()
                              : "") ||
                            (op.bookings?.[0]?.primaryTraveller?.firstName
                              ? `${op.bookings[0].primaryTraveller.firstName} ${op.bookings[0].primaryTraveller.lastName || ""}`.trim()
                              : "") ||
                            (op.bookings?.[0]?.user?.firstName
                              ? `${op.bookings[0].user.firstName} ${op.bookings[0].user.lastName || ""}`.trim()
                              : "") ||
                            op.clientName?.trim() ||
                            "Client"}
                        </td>
                        <td className="py-3 px-4 text-slate-700 capitalize">
                          {op.destination}
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">
                          {formatCurrency(op.sellingPrice)}
                        </td>
                        <td className="py-3 px-4 text-emerald-600 font-semibold">
                          +{formatCurrency(op.grossProfit)}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/operations/${op._id}`}
                            className="text-cyan-600 hover:text-cyan-700 font-semibold text-xs bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Target Configuration Modal (Admin & Manager) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {target?.exists ? "Edit Employee Target" : "Set New Employee Target"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define sales, revenue, and package review goals.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Employee *
                </label>
                <select
                  value={targetForm.employeeId}
                  onChange={(e) => setTargetForm({ ...targetForm, employeeId: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="">Select Employee...</option>
                  {currentUser && (
                    <option value={currentUser._id}>
                      {currentUser.firstName} {currentUser.lastName} (Me)
                    </option>
                  )}
                  {staffList
                    .filter((s) => s._id !== currentUser?._id)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.firstName} {s.lastName} ({s.role})
                      </option>
                    ))}
                </select>
              </div>

              {/* Period Type Selection */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Period Type
                  </label>
                  <select
                    value={targetForm.periodType}
                    onChange={(e) =>
                      setTargetForm({
                        ...targetForm,
                        periodType: e.target.value as "monthly" | "quarterly" | "yearly",
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Year
                  </label>
                  <select
                    value={targetForm.year}
                    onChange={(e) => setTargetForm({ ...targetForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {targetForm.periodType === "monthly" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Month
                    </label>
                    <select
                      value={targetForm.month}
                      onChange={(e) => setTargetForm({ ...targetForm, month: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                    >
                      {MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : targetForm.periodType === "quarterly" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Quarter
                    </label>
                    <select
                      value={targetForm.quarter}
                      onChange={(e) => setTargetForm({ ...targetForm, quarter: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                    >
                      {QUARTERS.map((q) => (
                        <option key={q.value} value={q.value}>
                          {q.label} ({q.range})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Scope
                    </label>
                    <div className="px-3 py-2 text-xs text-slate-500 font-medium bg-slate-50 rounded-xl border border-slate-200">
                      Full Calendar Year
                    </div>
                  </div>
                )}
              </div>

              {/* Targets: Sales, Revenue, Reviews */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sales Target
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={targetForm.salesTarget || ""}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, salesTarget: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Bookings closed</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Revenue Target (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500000"
                    value={targetForm.revenueTarget || ""}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, revenueTarget: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Total money ₹</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Review Target
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    value={targetForm.reviewTarget || ""}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, reviewTarget: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Reviews entered</span>
                </div>
              </div>

              {/* Profit Targets: Gross Profit & Net Profit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gross Profit Target (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 150000"
                    value={targetForm.grossProfitTarget || ""}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, grossProfitTarget: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Selling price minus vendor cost ₹</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Net Profit Target (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100000"
                    value={targetForm.netProfitTarget || ""}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, netProfitTarget: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Gross profit minus employee incentives ₹</span>
                </div>
              </div>

              {/* Optional Package for Review Target */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Specific Package (Optional)
                </label>
                <select
                  value={targetForm.packageId}
                  onChange={(e) => setTargetForm({ ...targetForm, packageId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="">Across All Packages (Any Review Counts)</option>
                  {packages.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.destination?.name ? `(${p.destination.name})` : ""}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  If selected, the review target will count only reviews entered for this specific package.
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Manager Directives / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on high-margin European packages and gather at least 10 customer testimonials."
                  value={targetForm.notes}
                  onChange={(e) => setTargetForm({ ...targetForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {target?.exists ? (
                  <button
                    type="button"
                    onClick={handleDeleteTarget}
                    disabled={deletingTarget}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    {deletingTarget ? "Deleting..." : "Remove Target"}
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingTarget}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm shadow-cyan-200 transition-colors disabled:opacity-50"
                  >
                    {savingTarget ? "Saving..." : "Save Target"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Customer Review Submission Modal */}
      <SubmitReviewModal
        open={showSubmitReviewModal}
        onClose={() => setShowSubmitReviewModal(false)}
        onSuccess={() => fetchPerformance(true)}
      />
    </div>
  );
}
