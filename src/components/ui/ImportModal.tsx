"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, Loader2, Download, Package as PackageIcon, Map as MapIcon } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export function ImportModal({ open, onClose, onImport }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [packagesRes, itinerariesRes] = await Promise.all([
        api.get("/packages?admin=true&limit=1000"),
        api.get("/packages/custom")
      ]);
      const p = packagesRes?.data || [];
      const i = itinerariesRes?.data || [];
      
      const combined = [
        ...p.map((x: any) => ({ ...x, _type: "package" })),
        ...i.map((x: any) => ({ ...x, _type: "itinerary" }))
      ];
      
      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setItems(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const filtered = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(query.toLowerCase()) ||
      item.destination?.name?.toLowerCase().includes(query.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Download size={18} className="text-indigo-500" />
            Import from Existing
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by package name or destination..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p className="text-sm">Loading trips...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No trips found matching "{query}"
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors group cursor-pointer" onClick={() => onImport(item)}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${item._type === 'package' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {item._type === 'package' ? <PackageIcon size={18} /> : <MapIcon size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm line-clamp-1">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{item.destination?.name || 'No Destination'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{item.duration?.nights || 0}N / {item.duration?.days || 0}D</span>
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold group-hover:border-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  Import
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
