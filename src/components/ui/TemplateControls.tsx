"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Save, FolderOpen } from "lucide-react";

interface Template {
  _id: string;
  name: string;
  items: string[];
}

interface Props {
  label: string;
  category: "inclusions" | "exclusions" | "thingsToCarry" | "keyPoints" | "knowBeforeYouGo" | "highlights" | "description" | "paymentPolicy" | "cancellationPolicy" | "flightCancellationPolicy";
  items: string[];
  onChange: (items: string[]) => void;
}

export default function TemplateControls({ label, category, items, onChange }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

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

  async function handleSave() {
    if (!saveName.trim()) return;
    setSaveLoading(true);
    try {
      const filtered = items.filter((i) => i && i.trim());
      await api.post("/package-templates", { name: saveName.trim(), category, items: filtered });
      await fetchTemplates();
      setShowSaveModal(false);
      setSaveName("");
    } catch {
      alert("Failed to save template. Name might already exist for this category.");
    } finally {
      setSaveLoading(false);
    }
  }

  function loadTemplate(template: Template) {
    onChange([...template.items]);
    setShowLoadDropdown(false);
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 -mb-4">
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
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 max-h-52 overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">No saved templates for {label}</div>
                ) : (
                  templates.map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => loadTemplate(t)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span className="font-medium">{t.name}</span>
                      <span className="text-xs text-slate-400">{t.items.length} items</span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Save current */}
        <button
          type="button"
          onClick={() => setShowSaveModal(true)}
          disabled={items.filter((i) => i && i.trim()).length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save size={13} />
          Save as Template
        </button>
      </div>

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Save &quot;{label}&quot; as Template</h3>
            <p className="text-sm text-slate-500 mb-4">
              Save these {items.filter((i) => i && i.trim()).length} points as a reusable template.
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
    </>
  );
}
