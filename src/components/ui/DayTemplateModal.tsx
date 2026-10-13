"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Folder,
  FolderPlus,
  FileText,
  X,
  Loader2,
  ArrowLeft,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Clock,
  Utensils,
  Bed,
  Search,
  Plus,
  AlertTriangle
} from "lucide-react";
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
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolderState] = useState<string | null>(() => _cachedFolder);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection & bulk action states
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  // Create folder modal / popover
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  function setCurrentFolder(folder: string | null) {
    _cachedFolder = folder;
    persistFolder(folder);
    setCurrentFolderState(folder);
    setSearchQuery("");
    setIsSelectMode(false);
    setSelectedFolders([]);
    setSelectedTemplates([]);
  }

  useEffect(() => { setMounted(true); }, []);

  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/day-templates/folders');
      setFolders(res.data || []);
      if (res.counts) {
        setFolderCounts(res.counts);
      }
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
    setIsSelectMode(false);
    setSelectedFolders([]);
    setSelectedTemplates([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (currentFolder) {
      loadTemplates(currentFolder);
    } else {
      loadFolders();
    }
  }, [open, currentFolder, loadFolders, loadTemplates]);

  // Handle single template deletion
  const handleDeleteTemplate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this template?")) return;
    try {
      setDeleting(id);
      await api.del(`/day-templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      setSelectedTemplates((prev) => prev.filter((item) => item !== id));
      if (currentFolder) {
        setFolderCounts((prev) => ({
          ...prev,
          [currentFolder]: Math.max(0, (prev[currentFolder] || 1) - 1)
        }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete template");
    } finally {
      setDeleting(null);
    }
  };

  // Handle single folder deletion
  const handleDeleteFolder = async (e: React.MouseEvent, folderName: string) => {
    e.stopPropagation();
    const count = folderCounts[folderName] || 0;
    const msg = count > 0
      ? `Are you sure you want to delete folder "${folderName}" and all ${count} template(s) inside it?`
      : `Delete folder "${folderName}"?`;

    if (!confirm(msg)) return;

    try {
      setDeleting(folderName);
      await api.del(`/day-templates/folders/${encodeURIComponent(folderName)}`);
      setFolders((prev) => prev.filter((f) => f !== folderName));
      setSelectedFolders((prev) => prev.filter((f) => f !== folderName));
      if (currentFolder === folderName) {
        setCurrentFolder(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete folder");
    } finally {
      setDeleting(null);
    }
  };

  // Handle bulk folder deletion
  const handleBulkDeleteFolders = async () => {
    if (selectedFolders.length === 0) return;
    if (!confirm(`Delete ${selectedFolders.length} selected folder(s) and all templates inside them?`)) {
      return;
    }

    try {
      setDeleting("__bulk_folders__");
      await api.post('/day-templates/folders/bulk-delete', { folders: selectedFolders });
      setFolders((prev) => prev.filter((f) => !selectedFolders.includes(f)));
      setSelectedFolders([]);
      setIsSelectMode(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete selected folders");
    } finally {
      setDeleting(null);
    }
  };

  // Handle bulk template deletion
  const handleBulkDeleteTemplates = async () => {
    if (selectedTemplates.length === 0) return;
    if (!confirm(`Delete ${selectedTemplates.length} selected template(s)?`)) {
      return;
    }

    try {
      setDeleting("__bulk_templates__");
      await api.post('/day-templates/bulk-delete', { ids: selectedTemplates });
      setTemplates((prev) => prev.filter((t) => !selectedTemplates.includes(t._id)));
      if (currentFolder) {
        setFolderCounts((prev) => ({
          ...prev,
          [currentFolder]: Math.max(0, (prev[currentFolder] || selectedTemplates.length) - selectedTemplates.length)
        }));
      }
      setSelectedTemplates([]);
      setIsSelectMode(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete selected templates");
    } finally {
      setDeleting(null);
    }
  };

  // Create new folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      alert("Please enter a folder name");
      return;
    }

    try {
      setCreatingFolder(true);
      await api.post('/day-templates/folders', { name: trimmed });
      if (!folders.includes(trimmed)) {
        setFolders((prev) => [...prev, trimmed].sort((a, b) => a.localeCompare(b)));
        setFolderCounts((prev) => ({ ...prev, [trimmed]: 0 }));
      }
      setNewFolderName("");
      setShowCreateFolder(false);
      // Immediately navigate into the newly created folder so they can see it
      setCurrentFolder(trimmed);
    } catch (err: any) {
      alert(err.message || "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  // Selection toggle helpers
  const toggleFolderSelect = (folderName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFolders((prev) =>
      prev.includes(folderName) ? prev.filter((f) => f !== folderName) : [...prev, folderName]
    );
  };

  const toggleTemplateSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredFolders = folders.filter((f) =>
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectAllFolders = () => {
    if (selectedFolders.length === filteredFolders.length) {
      setSelectedFolders([]);
    } else {
      setSelectedFolders([...filteredFolders]);
    }
  };

  const selectAllTemplates = () => {
    if (selectedTemplates.length === filteredTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(filteredTemplates.map((t) => t._id));
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 gap-3">
          <div className="flex items-center gap-3">
            {currentFolder ? (
              <button 
                onClick={() => setCurrentFolder(null)} 
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
                title="Back to all folders"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-xs">
                <Folder size={18} />
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>{currentFolder ? currentFolder : "Day Templates Library"}</span>
                {currentFolder && (
                  <span className="text-xs font-normal text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                    {templates.length} {templates.length === 1 ? "template" : "templates"}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {currentFolder
                  ? "Select a template to insert, or manage templates in this folder"
                  : "Browse, create, or manage template folders"}
              </p>
            </div>
          </div>

          {/* HEADER TOOLBAR ACTIONS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder={currentFolder ? "Search templates..." : "Search folders..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-36 sm:w-48 bg-white"
              />
            </div>

            {/* In Folders View: + New Folder Button */}
            {!currentFolder && (
              <button
                type="button"
                onClick={() => setShowCreateFolder(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <FolderPlus size={14} />
                <span>+ New Folder</span>
              </button>
            )}

            {/* Selection Mode Toggle */}
            {(!currentFolder ? folders.length > 0 : templates.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(!isSelectMode);
                  setSelectedFolders([]);
                  setSelectedTemplates([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelectMode
                    ? "bg-indigo-50 text-indigo-700 border-indigo-300"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CheckSquare size={14} />
                <span>{isSelectMode ? "Done" : "Select"}</span>
              </button>
            )}

            {/* In Current Folder View: Delete Entire Folder Button */}
            {currentFolder && !isSelectMode && (
              <button
                type="button"
                onClick={(e) => handleDeleteFolder(e, currentFolder)}
                disabled={deleting === currentFolder}
                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                title="Delete this entire folder and all templates"
              >
                {deleting === currentFolder ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>Delete Folder</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SELECT MODE BANNER (When Select Mode is active) */}
        {isSelectMode && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={!currentFolder ? selectAllFolders : selectAllTemplates}
                className="font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
              >
                <CheckSquare size={13} />
                <span>
                  {(!currentFolder ? selectedFolders.length === filteredFolders.length : selectedTemplates.length === filteredTemplates.length)
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </button>
              <span className="text-slate-500">
                {!currentFolder
                  ? `${selectedFolders.length} of ${filteredFolders.length} folder(s) selected`
                  : `${selectedTemplates.length} of ${filteredTemplates.length} template(s) selected`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={!currentFolder ? handleBulkDeleteFolders : handleBulkDeleteTemplates}
                disabled={
                  (!currentFolder ? selectedFolders.length === 0 : selectedTemplates.length === 0) ||
                  deleting !== null
                }
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-xs"
              >
                {deleting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>
                  Delete Selected ({!currentFolder ? selectedFolders.length : selectedTemplates.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedFolders([]);
                  setSelectedTemplates([]);
                }}
                className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* CREATE FOLDER MODAL / PROMPT OVERLAY */}
        {showCreateFolder && (
          <div className="border-b border-indigo-100 bg-indigo-50/90 p-4 animate-in slide-in-from-top duration-150">
            <form onSubmit={handleCreateFolder} className="max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderPlus size={15} className="text-indigo-600" />
                  Create New Folder
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Bali, Himachal Pradesh, Dubai, Vietnam..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
                >
                  {creatingFolder ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>Create</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-3 text-indigo-500" />
              <p className="text-sm">Loading templates...</p>
            </div>
          ) : !currentFolder ? (
            /* FOLDERS VIEW */
            filteredFolders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <Folder size={48} className="mx-auto text-slate-300" />
                <p className="text-sm">
                  {searchQuery ? "No folders match your search." : "No folders found."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateFolder(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <FolderPlus size={14} />
                  <span>Create First Folder</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => {
                  const isSelected = selectedFolders.includes(folder);
                  const count = folderCounts[folder] || 0;
                  return (
                    <div
                      key={folder}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleFolderSelect(folder);
                        } else {
                          setCurrentFolder(folder);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center p-5 bg-white border rounded-xl transition-all cursor-pointer group select-none ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/30 shadow-xs"
                          : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      {/* Checkbox (in select mode or hover) */}
                      {isSelectMode ? (
                        <div className="absolute top-2.5 right-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleFolderSelect(folder, e as any)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      ) : (
                        /* Single Folder Delete Button (hover action) */
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(e, folder)}
                          disabled={deleting === folder}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`Delete folder "${folder}"`}
                        >
                          {deleting === folder ? (
                            <Loader2 size={14} className="animate-spin text-red-500" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}

                      <Folder
                        size={42}
                        className={`mb-2.5 transition-colors ${
                          isSelected
                            ? "text-indigo-600"
                            : "text-indigo-400 group-hover:text-indigo-500"
                        }`}
                        fill="currentColor"
                        fillOpacity={isSelected ? 0.35 : 0.2}
                      />
                      <span className="text-sm font-semibold text-slate-800 text-center line-clamp-2 px-1">
                        {folder}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 font-medium">
                        {count} {count === 1 ? "template" : "templates"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* TEMPLATES VIEW */
            filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <FileText size={48} className="mx-auto text-slate-300" />
                <p className="text-sm">
                  {searchQuery ? "No templates match your search." : `No templates found in "${currentFolder}".`}
                </p>
                <p className="text-xs text-slate-500">
                  Save a day from any package or itinerary into this folder to reuse it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedTemplates.includes(template._id);
                  return (
                    <div
                      key={template._id}
                      className={`relative bg-white border rounded-xl p-4 flex flex-col transition-all cursor-pointer group select-none ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/30 shadow-xs"
                          : "border-slate-200 hover:border-indigo-300 hover:shadow-xs"
                      }`}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleTemplateSelect(template._id);
                        } else {
                          onSelect(template);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 pr-6">
                          <FileText size={16} className="text-indigo-500 shrink-0" />
                          <span className="line-clamp-1">{template.name}</span>
                        </h3>

                        {/* Top-right action: Checkbox or Single Delete */}
                        {isSelectMode ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleTemplateSelect(template._id, e as any)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(e, template._id)}
                            disabled={deleting === template._id}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete template"
                          >
                            {deleting === template._id ? (
                              <Loader2 size={14} className="animate-spin text-red-500" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                      </div>

                      {template.title && (
                        <p className="text-xs font-semibold text-slate-700 mb-1 line-clamp-1">
                          {template.title}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {template.description || "No description"}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium text-slate-500 mt-auto pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            <Clock size={11} /> {template.activities?.length || 0} Acts
                          </span>
                          <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            <Utensils size={11} /> {template.meals?.length || 0} Meals
                          </span>
                          {template.accommodation && (
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate max-w-[120px]">
                              <Bed size={11} /> {template.accommodation}
                            </span>
                          )}
                        </div>

                        {!isSelectMode && (
                          <span className="text-[10px] text-indigo-600 font-bold group-hover:underline">
                            Insert ↵
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
