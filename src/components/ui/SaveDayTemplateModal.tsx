"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Save, X, Loader2, Folder, FolderPlus, Plus, Check } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  dayData: any; // The IItineraryDay object
}

export function SaveDayTemplateModal({ open, onClose, dayData }: Props) {
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("");
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [saving, setSaving] = useState(false);

  // Load existing folders when modal opens
  useEffect(() => {
    if (!open) return;

    // Pre-populate template name from day title if empty
    if (!name && dayData?.title) {
      setName(`Day Template: ${dayData.title}`);
    }

    const lastFolder = typeof window !== "undefined"
      ? localStorage.getItem("day_template_last_folder") || ""
      : "";

    setLoadingFolders(true);
    api.get('/day-templates/folders')
      .then((res: any) => {
        const fetched: string[] = res.data || [];
        setExistingFolders(fetched);

        // Pre-select last folder or default
        if (lastFolder && fetched.includes(lastFolder)) {
          setFolder(lastFolder);
          setIsCreatingNewFolder(false);
        } else if (fetched.length > 0) {
          setFolder(fetched[0]);
          setIsCreatingNewFolder(false);
        } else {
          setIsCreatingNewFolder(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load folders:", err);
      })
      .finally(() => {
        setLoadingFolders(false);
      });
  }, [open, dayData]);

  const handleAddNewFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      alert("Please enter a folder name");
      return;
    }

    try {
      await api.post('/day-templates/folders', { name: trimmed });
      if (!existingFolders.includes(trimmed)) {
        setExistingFolders((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
      }
      setFolder(trimmed);
      setNewFolderName("");
      setIsCreatingNewFolder(false);
    } catch (err: any) {
      // Even if already exists, just select it
      if (!existingFolders.includes(trimmed)) {
        setExistingFolders((prev) => [...prev, trimmed]);
      }
      setFolder(trimmed);
      setNewFolderName("");
      setIsCreatingNewFolder(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Template name is required");

    let targetFolder = folder.trim();
    if (isCreatingNewFolder) {
      targetFolder = newFolderName.trim();
      if (!targetFolder) {
        return alert("Please enter a folder name or select an existing folder.");
      }
    }

    if (!targetFolder) {
      targetFolder = "Uncategorized";
    }

    setSaving(true);
    try {
      await api.post('/day-templates', {
        name: name.trim(),
        folder: targetFolder,
        title: dayData.title || "",
        description: dayData.description || "",
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
        recommendations: (dayData.recommendations || [])
          .map((a: any) => (typeof a === "string" ? a : (a.title || a.name || "")).trim())
          .filter(Boolean),
        meals: dayData.meals || [],
        accommodation: dayData.accommodation || "",
        images: dayData.images || []
      });

      // Persist chosen folder
      if (typeof window !== "undefined") {
        localStorage.setItem("day_template_last_folder", targetFolder);
      }

      alert("Template saved successfully into folder: " + targetFolder);
      onClose();
      setName("");
      setNewFolderName("");
      setIsCreatingNewFolder(false);
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
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Save size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Save as Day Template
              </h2>
              <p className="text-xs text-slate-500">
                Save this day into a folder for one-click re-use across itineraries
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* TEMPLATE NAME */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Day 1: Ubud Waterfall & Rice Terraces Tour"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              required
            />
          </div>

          {/* FOLDER SELECTION & CREATION */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Folder / Destination Category <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewFolder(!isCreatingNewFolder);
                  if (!isCreatingNewFolder) {
                    setNewFolderName("");
                  }
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {isCreatingNewFolder ? (
                  <span>Choose Existing Folder</span>
                ) : (
                  <>
                    <FolderPlus size={14} />
                    <span>+ Create New Folder</span>
                  </>
                )}
              </button>
            </div>

            {isCreatingNewFolder ? (
              /* CREATE NEW FOLDER INPUT */
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                <p className="text-xs text-indigo-900 font-semibold flex items-center gap-1.5">
                  <FolderPlus size={14} className="text-indigo-600" />
                  Create a New Folder
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Bali, Kashmir, Vietnam, Dubai..."
                    className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewFolder}
                    disabled={!newFolderName.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1 shrink-0"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                <p className="text-[11px] text-indigo-600/90">
                  This new folder will be created and templates will be organized inside it.
                </p>
              </div>
            ) : (
              /* SELECT EXISTING FOLDER */
              <div className="space-y-2">
                {loadingFolders ? (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Loading folders...</span>
                  </div>
                ) : existingFolders.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                    <span>No folders found. Create your first folder!</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewFolder(true)}
                      className="font-bold underline text-amber-900"
                    >
                      Create Now
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      value={folder}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setIsCreatingNewFolder(true);
                        } else {
                          setFolder(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {existingFolders.map((f) => (
                        <option key={f} value={f}>
                          📁 {f}
                        </option>
                      ))}
                      <option value="__NEW__">➕ + Create New Folder...</option>
                    </select>

                    {/* Quick Pill Selection */}
                    <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                      {existingFolders.slice(0, 10).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFolder(f)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all flex items-center gap-1 ${
                            folder === f
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
                          }`}
                        >
                          <Folder size={12} className={folder === f ? "text-indigo-200" : "text-slate-400"} />
                          {f}
                          {folder === f && <Check size={12} className="ml-0.5" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* SUMMARY INFO */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Day Details being saved:</p>
            <p className="truncate text-slate-600">• Title: <strong className="text-slate-700">{dayData?.title || "(Untitled Day)"}</strong></p>
            <p className="text-slate-500">• Activities: {dayData?.activities?.length || 0} • Meals: {dayData?.meals?.length || 0} • Stay: {dayData?.accommodation || "None"}</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
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
