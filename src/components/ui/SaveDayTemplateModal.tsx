"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Save, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  dayData: any; // The IItineraryDay object
}

export function SaveDayTemplateModal({ open, onClose, dayData }: Props) {
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      setFolder(localStorage.getItem("day_template_last_folder") || "");
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Template name is required");
    
    setSaving(true);
    try {
      await api.post('/day-templates', {
        name,
        folder: folder.trim() || "Uncategorized",
        title: dayData.title,
        description: dayData.description,
        activities: (dayData.activities || []).map((a: any) => {
          if (typeof a === "string") {
            return { title: a, description: "", image: "", images: [] };
          }
          const img = a.image || (a.images && a.images[0]) || "";
          return {
            title: a.title || a.name || "",
            description: a.description || "",
            image: img,
            images: a.images && a.images.length > 0 ? a.images : (img ? [img] : []),
          };
        }),
        meals: dayData.meals,
        accommodation: dayData.accommodation,
        images: dayData.images
      });
      alert("Template saved successfully!");
      onClose();
      setName("");
      setFolder("");
    } catch (err: any) {
      alert(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Save size={18} className="text-indigo-500" />
            Save as Day Template
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Template Name *</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Day 1: Manali Arrival & Sightseeing"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Folder / Category</label>
            <input 
              type="text" 
              value={folder} 
              onChange={e => setFolder(e.target.value)} 
              placeholder="e.g. Himachal Pradesh (defaults to Uncategorized)"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
            <p className="text-xs text-blue-700">This will save the current day's title, description, activities, meals, and accommodation as a reusable template.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
