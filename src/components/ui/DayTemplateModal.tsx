"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Folder, FileText, X, Loader2, ArrowLeft, Trash2, Check, Clock, Utensils, Bed, Search } from "lucide-react";
import { api } from "@/lib/api";

interface DayTemplate {
  _id: string;
  name: string;
  folder: string;
  title: string;
  description: string;
  activities: (string | any)[];
  recommendations?: (string | any)[];
  meals: string[];
  accommodation: string;
  images: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (template: DayTemplate) => void;
}

// ─── PERSISTENT FOLDER STATE ───────────────────────────────────────────────
function getPersistedFolder(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("day_template_last_folder") || null;
  }
  return null;
}

function persistFolder(folder: string | null): void {
  if (typeof window !== "undefined") {
    if (folder) {
      localStorage.setItem("day_template_last_folder", folder);
    } else {
      localStorage.removeItem("day_template_last_folder");
    }
  }
}

let _cachedFolder = getPersistedFolder();

export function DayTemplateModal({ open, onClose, onSelect }: Props) {
  const [mounted, setMounted] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolderState] = useState<string | null>(() => _cachedFolder);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  function setCurrentFolder(folder: string | null) {
    _cachedFolder = folder;
    persistFolder(folder);
    setCurrentFolderState(folder);
    setSearchQuery("");
  }

  useEffect(() => { setMounted(true); }, []);

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/day-templates/folders');
      setFolders(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async (folder: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/day-templates?folder=${encodeURIComponent(folder)}`);
      setTemplates(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setCurrentFolderState(_cachedFolder);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (currentFolder) {
      loadTemplates(currentFolder);
    } else {
      loadFolders();
    }
  }, [open, currentFolder, loadFolders, loadTemplates]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this template?")) return;
    try {
      setDeleting(id);
      await api.del(`/day-templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      alert("Failed to delete template");
    } finally {
      setDeleting(null);
    }
  };

  const filteredFolders = folders.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            {currentFolder ? (
              <button 
                onClick={() => setCurrentFolder(null)} 
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Folder size={18} /></div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {currentFolder ? currentFolder : "Day Templates Library"}
              </h2>
              <p className="text-xs text-slate-500">
                {currentFolder ? "Select a template to insert into your itinerary" : "Browse folders to find a day template"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={currentFolder ? "Search templates..." : "Search folders..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-48 sm:w-64"
              />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : !currentFolder ? (
            /* FOLDERS VIEW */
            filteredFolders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">{searchQuery ? "No folders match your search." : "No folders found. Save a day as a template first."}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredFolders.map(folder => (
                  <button 
                    key={folder}
                    onClick={() => setCurrentFolder(folder)}
                    className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <Folder size={40} className="text-indigo-400 group-hover:text-indigo-500 mb-3" fill="currentColor" fillOpacity={0.2} />
                    <span className="text-sm font-semibold text-slate-700 text-center line-clamp-2">{folder}</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            /* TEMPLATES VIEW */
            filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-slate-400">{searchQuery ? "No templates match your search." : "No templates found in this folder."}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <div 
                    key={template._id} 
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col hover:border-indigo-300 transition-colors cursor-pointer group"
                    onClick={() => onSelect(template)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={16} className="text-indigo-500" /> 
                        {template.name}
                      </h3>
                      <button 
                        onClick={(e) => handleDelete(e, template._id)}
                        disabled={deleting === template._id}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {deleting === template._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                    {template.title && <p className="text-sm text-slate-600 font-medium mb-1">{template.title}</p>}
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{template.description || "No description"}</p>
                    
                    <div className="flex flex-wrap gap-3 text-[10px] font-medium text-slate-500 mt-auto pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Clock size={12}/> {template.activities?.length || 0} Acts</span>
                      <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Utensils size={12}/> {template.meals?.length || 0} Meals</span>
                      {template.accommodation && <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded truncate max-w-[120px]"><Bed size={12}/> {template.accommodation}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
