"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Minus, Save, FolderOpen, Search, Trash2, Loader2 } from "lucide-react";

interface Template {
  _id: string;
  name: string;
  items: string[];
}

interface Props {
  label: string;
  category: "inclusions" | "exclusions" | "thingsToCarry" | "keyPoints" | "knowBeforeYouGo" | "highlights";
  items: string[];
  onChange: (items: string[]) => void;
}

export default function PointListWithTemplates({ label, category, items, onChange }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [category]);

  async function fetchTemplates() {
    try {
      const res = await api.get(`/package-templates?category=${category}`);
      if (res?.data) setTemplates(res.data);
    } catch {
      // silent
    }
  }

  function addItem() {
    onChange([...items, ""]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, value: string) {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  }

  async function handleSave() {
    if (!saveName.trim()) return;
    setSaveLoading(true);
    try {
      const filtered = items.filter((i) => i.trim());
      await api.post("/package-templates", { name: saveName.trim(), category, items: filtered });
      await fetchTemplates();
      setShowSaveModal(false);
      setSaveName("");
    } catch {
      alert("Failed to save template. Name might already exist.");
    } finally {
      setSaveLoading(false);
    }
  }

  function loadTemplate(template: Template) {
    onChange([...template.items]);
    setShowLoadDropdown(false);
    setSearchQuery("");
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this template?")) return;
    setDeleting(id);
    try {
      await api.del(`/package-templates/${id}`);
      setTemplates(prev => prev.filter(t => t._id !== id));
    } catch {
      alert("Failed to delete template");
    } finally {
      setDeleting(null);
    }
  }

  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-2">
          {/* Load from saved */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLoadDropdown(!showLoadDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
            >
              <FolderOpen size={13} />
              Load Saved
            </button>
            {showLoadDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLoadDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2 max-h-64 flex flex-col">
                  <div className="px-3 pb-2 border-b border-slate-100 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 -mt-1 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-cyan-400 focus:bg-white"
                    />
                  </div>
                  <div className="overflow-y-auto flex-1 py-1">
                    {filteredTemplates.length === 0 ? (
                      <div className="px-4 py-4 text-xs text-slate-400 text-center">
                        {searchQuery ? "No matching templates" : "No saved templates"}
                      </div>
                    ) : (
                      filteredTemplates.map((t) => (
                        <div
                          key={t._id}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between group cursor-pointer"
                          onClick={() => loadTemplate(t)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium truncate pr-2 max-w-[150px]">{t.name}</span>
                            <span className="text-[10px] text-slate-400">{t.items.length} items</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, t._id)}
                            disabled={deleting === t._id}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {deleting === t._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Save current */}
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            disabled={items.filter((i) => i.trim()).length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={13} />
            Save
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder={`${label} point ${i + 1}`}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Minus size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700 mt-1"
        >
          <Plus size={14} /> Add point
        </button>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Save as Template</h3>
            <p className="text-sm text-slate-500 mb-4">
              Save these {items.filter((i) => i.trim()).length} points as a reusable template for &quot;{label}&quot;.
            </p>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Standard International, Budget Domestic..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveName.trim() || saveLoading}
                className="flex-1 px-4 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50"
              >
                {saveLoading ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
