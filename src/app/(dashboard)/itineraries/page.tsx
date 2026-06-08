"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Plus, Eye, Edit, Copy, Trash2, Search, Filter, Download } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { generatePackagePdf } from "@/lib/generatePackagePdf";

interface CustomItinerary {
  _id: string;
  name: string;
  slug: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  destination?: { _id: string; name: string } | string;
  duration?: { nights: number; days: number };
  price?: number;
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt: string;
}

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<CustomItinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showMine, setShowMine] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchItineraries();
  }, []);

  async function fetchItineraries() {
    try {
      const res = await api.get("/packages/custom");
      setItineraries(res?.data || []);
    } catch {
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this custom itinerary?")) return;
    try {
      const res = await api.del(`/packages/${id}`);
      if (res?.status === "success") {
        setItineraries((prev) => prev.filter((i) => i._id !== id));
      }
    } catch {
      alert("Failed to delete");
    }
  }

  function copyLink(id: string) {
    const url = `https://letslivetours.com/itinerary/${id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  }

  async function handleDownloadPdf(id: string) {
    try {
      const res = await api.get(`/packages/${id}`);
      const pkgData = res?.data || res;
      if (pkgData) {
        await generatePackagePdf(pkgData);
      } else {
        alert("Failed to fetch itinerary details for PDF");
      }
    } catch {
      alert("Failed to generate PDF");
    }
  }

  // Client-side filtering
  const filtered = itineraries.filter((it) => {
    // "Created by me" filter
    if (showMine && it.createdBy) {
      const creatorId = typeof it.createdBy === "object" ? it.createdBy._id : it.createdBy;
      if (creatorId !== user?._id) return false;
    }
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const destName = typeof it.destination === "object" ? it.destination?.name?.toLowerCase() || "" : "";
      const matches =
        (it.name || "").toLowerCase().includes(q) ||
        (it.clientName || "").toLowerCase().includes(q) ||
        (it.clientEmail || "").toLowerCase().includes(q) ||
        destName.includes(q) ||
        String(it.price || "").includes(q);
      if (!matches) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Custom Itineraries</h1>
          <p className="text-xs text-slate-400">Personalized travel plans created for specific clients</p>
        </div>
        <Link href="/itineraries/new" className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 transition-colors">
          <Plus size={16} /> New Itinerary
        </Link>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={16} className="text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client, destination, or name..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <button onClick={() => setShowMine(false)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!showMine ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            All
          </button>
          <button onClick={() => setShowMine(true)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showMine ? "bg-cyan-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            Created by Me
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="px-6 py-3">Itinerary</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Destination</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Created By</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">No custom itineraries found.</td></tr>
              ) : (
                filtered.map((it) => {
                  const destName = typeof it.destination === "object" ? it.destination?.name : "";
                  return (
                  <tr key={it._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700 max-w-[200px] truncate">{it.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{it.clientName || "—"}</p>
                      <p className="text-xs text-slate-400">{it.clientEmail || ""}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{destName || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {it.duration ? `${it.duration.nights}N/${it.duration.days}D` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {it.price ? `₹${it.price.toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {it.createdBy ? `${it.createdBy.firstName} ${it.createdBy.lastName}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(it.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a href={`https://letslivetours.com/itinerary/${it._id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600" title="View">
                          <Eye size={16} />
                        </a>
                        <button onClick={() => copyLink(it._id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600" title="Copy shareable link">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => handleDownloadPdf(it._id)} className="p-1.5 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600" title="Download PDF">
                          <Download size={16} />
                        </button>
                        <Link href={`/packages/${it._id}/edit`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-cyan-600" title="Edit">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDelete(it._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete">
                          <Trash2 size={16} />
                        </button>
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
    </div>
  );
}
