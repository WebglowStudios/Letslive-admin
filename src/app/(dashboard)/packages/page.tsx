"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Package, Destination } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, Trash2, Edit, Eye, Download, Copy, ChevronLeft, ChevronRight, X, Filter } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import { usePermission } from "@/hooks/usePermission";
import { useRole } from "@/hooks/usePermission";
import { generatePackagePdf } from "@/lib/generatePackagePdf";

const PER_PAGE = 50;

export default function PackagesPage() {
  const searchParams = useSearchParams();
  const destinationFilter = searchParams.get("destination") || "";
  const destNameFilter = searchParams.get("destName") || "";

  const [packages, setPackages] = useState<Package[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string>(destinationFilter || "all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const canCreate = usePermission("packages.create");
  const canEdit = usePermission("packages.edit");
  const canDelete = usePermission("packages.delete");
  const role = useRole();


  const fetchPackages = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      let url = `/packages?limit=${PER_PAGE}&page=${page}&admin=true`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (selectedDestination !== "all") {
        url += `&destination=${encodeURIComponent(selectedDestination)}`;
      }
      if (approvalFilter !== "all") {
        url += `&approvalStatus=${encodeURIComponent(approvalFilter)}`;
      }
      if (featuredFilter !== "all") {
        url += `&isFeatured=${encodeURIComponent(featuredFilter)}`;
      }
      const res = await api.get(url);
      setPackages(res?.data || []);
      setTotalPages(res?.pages || 1);
      setTotalCount(res?.total || 0);
    } catch {
      setPackages([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedDestination, approvalFilter, featuredFilter]);

  useEffect(() => {
    // Fetch destinations for filter dropdown
    api.get("/destinations?limit=100").then(res => {
      setDestinations(res?.data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchPackages(currentPage, searchQuery);
  }, [currentPage, fetchPackages]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchPackages(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPackages]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this package?")) return;
    try {
      const res = await api.del(`/packages/${id}`);
      if (res?.status === "success" || res === undefined) {
        // Refetch current page
        fetchPackages(currentPage, searchQuery);
      } else {
        alert("Failed to delete");
      }
    } catch {
      alert("Failed to delete");
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      await api.put(`/packages/${id}`, { isFeatured: !current });
      setPackages((prev) => prev.map((p) => p._id === id ? { ...p, isFeatured: !current } : p));
    } catch {
      alert("Failed to update");
    }
  }

  async function handleDownloadPdf(id: string) {
    try {
      const res = await api.get(`/packages/${id}`);
      const pkgData = res?.data || res;
      if (pkgData) {
        await generatePackagePdf(pkgData);
      } else {
        alert("Failed to fetch package details for PDF");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Check console for details.");
    }
  }

  async function handleApprovalChange(id: string, status: string) {
    try {
      await api.put(`/packages/${id}`, { approvalStatus: status });
      setPackages((prev) => prev.map((p) => p._id === id ? { ...p, approvalStatus: status } : p));
    } catch {
      alert("Failed to update approval status");
    }
  }

  async function handleDuplicate(id: string, name: string) {
    if (!confirm(`Duplicate "${name}"?`)) return;
    try {
      const res = await api.post(`/packages/${id}/duplicate`, {});
      if (res?.data) {
        fetchPackages(1, searchQuery);
        setCurrentPage(1);
        alert(`✅ Duplicated as "${res.data.name}" — edit it to adjust the details.`);
      }
    } catch {
      alert("Failed to duplicate package");
    }
  }

  return (
    <RoleGuard permission="packages.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 w-80">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search packages by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                <span className="text-xs font-bold">✕</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-600 cursor-pointer w-28"
              >
                <option value="all">All Destinations</option>
                {destinations.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-600 cursor-pointer w-24"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-600 cursor-pointer w-24"
              >
                <option value="all">Any Feature</option>
                <option value="true">Featured</option>
                <option value="false">Standard</option>
              </select>
            </div>
          </div>
          {canCreate && (
            <Link href="/packages/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">
              <Plus size={16} /> Add Package
            </Link>
          )}
        </div>

        {/* Info bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              {totalCount} package{totalCount !== 1 ? "s" : ""} total
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            {destNameFilter && selectedDestination === destinationFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold">
                Destination: {destNameFilter}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="px-6 py-3">Package</th>
                  <th className="px-6 py-3">Destination</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Approval</th>
                  <th className="px-6 py-3">Featured</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                ) : packages.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">No packages found</td></tr>
                ) : (
                  packages.map((p) => {
                    const dest = typeof p.destination === "object" ? p.destination : null;
                    return (
                      <tr key={p._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700 max-w-[220px] truncate">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.badge || p.category || ""}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {dest?.name ? dest.name : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                              <span>⚠</span> No destination
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{p.duration?.nights}N/{p.duration?.days}D</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{formatCurrency(p.price)}</td>
                        <td className="px-6 py-4">
                          {role === "admin" ? (
                            <select
                              value={p.approvalStatus || "pending"}
                              onChange={(e) => handleApprovalChange(p._id, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold border-none outline-none cursor-pointer ${
                                p.approvalStatus === "approved" ? "bg-emerald-100 text-emerald-700" :
                                p.approvalStatus === "rejected" ? "bg-red-100 text-red-700" :
                                "bg-amber-100 text-amber-700"
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              p.approvalStatus === "approved" ? "bg-emerald-100 text-emerald-700" :
                              p.approvalStatus === "rejected" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
                              {(p.approvalStatus || "pending").charAt(0).toUpperCase() + (p.approvalStatus || "pending").slice(1)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleFeatured(p._id, p.isFeatured)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.isFeatured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                            disabled={!canEdit}
                          >
                            {p.isFeatured ? "Featured" : "Normal"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <a href={`https://letslivetours.com/packages/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600" title="View on site">
                              <Eye size={16} />
                            </a>
                            <button
                              onClick={() => handleDownloadPdf(p._id)}
                              className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors"
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                            {canCreate && (
                              <button onClick={() => handleDuplicate(p._id, p.name)} className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600" title="Duplicate package">
                                <Copy size={16} />
                              </button>
                            )}
                            {canEdit && (
                              <Link href={`/packages/${p._id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600">
                                <Edit size={16} />
                              </Link>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  page === currentPage
                    ? "bg-cyan-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
