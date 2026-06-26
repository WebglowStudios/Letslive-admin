"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Upload, X, Image as ImageIcon, Loader2, Check, Trash2, ZoomIn,
  FolderPlus, FolderOpen, ChevronRight, Home, ArrowLeft,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── AUTH-AWARE FETCH WRAPPER ───
// Handles 401 by attempting token refresh before giving up.
// This prevents the "upload logs you out" bug when the 15-min JWT expires mid-session.
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...options, credentials: "include" });

  if (res.status === 401) {
    // Attempt silent token refresh
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (refreshRes.ok) {
      // Retry original request with fresh token
      return fetch(url, { ...options, credentials: "include" });
    }
    // Refresh failed — return original 401 response (caller handles it)
  }

  return res;
}

interface LibraryImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  createdAt: string;
  name: string;
  format?: string;
  size?: number;
}

interface FolderItem {
  name: string;
  path: string;
}

// ─── HELPERS ───

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function groupByDate(images: LibraryImage[]): { date: string; images: LibraryImage[] }[] {
  const sorted = [...images].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const groups: Map<string, LibraryImage[]> = new Map();
  for (const img of sorted) {
    const key = formatDate(img.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(img);
  }
  return Array.from(groups.entries()).map(([date, images]) => ({ date, images }));
}

function truncateName(name: string, maxLen = 16) {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 3) + "...";
}

// ─── LIGHTBOX ───

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/15 border-none text-white flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors"
      >
        <X size={18} />
      </button>
      <img
        src={url}
        alt="Preview"
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
      />
    </div>,
    document.body
  );
}

// ─── CREATE FOLDER DIALOG ───

function CreateFolderDialog({ open, onClose, onCreated, currentPath }: {
  open: boolean;
  onClose: () => void;
  onCreated: (folder: FolderItem) => void;
  currentPath: string;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setName(""); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/upload/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folderName: name.trim(), parent: currentPath }),
      });
      const json = await res.json();
      if (json.data) {
        onCreated(json.data);
        onClose();
      } else {
        alert(json.message || "Failed to create folder");
      }
    } catch { alert("Failed to create folder"); }
    finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 rounded-2xl">
      <div className="bg-white rounded-xl p-5 shadow-xl w-80" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Create New Folder</h3>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="e.g. Kerala, Goa, Himachal..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleCreate} disabled={loading || !name.trim()}
            className="px-4 py-1.5 text-xs font-bold bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-700 transition-colors flex items-center gap-1">
            {loading && <Loader2 size={12} className="animate-spin" />}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MEDIA LIBRARY MODAL ───

function MediaLibraryModal({ open, onClose, onSelect, multiple = false }: {
  open: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
}) {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("letslivetours");
  const [pathHistory, setPathHistory] = useState<string[]>(["letslivetours"]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [draggedImage, setDraggedImage] = useState<LibraryImage | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchLibrary = useCallback(async (folder: string) => {
    setLoading(true);
    try {
      const [imagesRes, foldersRes] = await Promise.all([
        authFetch(`${API_URL}/upload/library?folder=${encodeURIComponent(folder)}&limit=200`, { credentials: "include" }),
        authFetch(`${API_URL}/upload/folders?parent=${encodeURIComponent(folder)}`, { credentials: "include" }),
      ]);
      const imagesJson = await imagesRes.json();
      const foldersJson = await foldersRes.json();
      setImages(imagesJson.data || []);
      setFolders(foldersJson.data || []);
    } catch {
      setImages([]);
      setFolders([]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open) {
      fetchLibrary(currentPath);
      setSelected([]);
    }
  }, [open, currentPath, fetchLibrary]);

  function navigateTo(path: string) {
    setCurrentPath(path);
    setPathHistory((prev) => {
      const idx = prev.indexOf(path);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, path];
    });
  }

  function goBack() {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1);
      setPathHistory(newHistory);
      setCurrentPath(newHistory[newHistory.length - 1]);
    }
  }

  async function handleDeleteFolder() {
    const folderName = currentPath.split('/').pop() || currentPath;
    const imageCount = images.length;
    const msg = imageCount > 0
      ? `Delete folder "${folderName}" and all ${imageCount} image(s) inside it? This cannot be undone.`
      : `Delete empty folder "${folderName}"? This cannot be undone.`;

    if (!confirm(msg)) return;

    setDeletingFolder(true);
    try {
      const res = await authFetch(`${API_URL}/upload/folders?path=${encodeURIComponent(currentPath)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.status === 'success') {
        // Navigate back to parent
        goBack();
      } else {
        alert(json.message || 'Failed to delete folder');
      }
    } catch {
      alert('Failed to delete folder');
    } finally {
      setDeletingFolder(false);
    }
  }

  async function handleUpload(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await authFetch(`${API_URL}/upload?folder=${encodeURIComponent(currentPath)}`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const json = await res.json();
        if (json.data?.url) {
          setImages((prev) => [{
            url: json.data.url,
            publicId: json.data.publicId,
            width: json.data.width,
            height: json.data.height,
            createdAt: new Date().toISOString(),
            name: json.data.name || file.name.replace(/\.[^/.]+$/, '') || 'image',
            format: json.data.format,
          }, ...prev]);
        }
      }
    } catch { alert("Upload failed"); }
    finally { setUploading(false); }
  }

  async function handleDelete(publicId: string) {
    if (!confirm('Delete this image from Cloudinary? This cannot be undone.')) return;
    setDeleting(publicId);
    try {
      await authFetch(`${API_URL}/upload/${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setImages((prev) => prev.filter((img) => img.publicId !== publicId));
      setSelected((prev) => {
        const deleted = images.find((i) => i.publicId === publicId);
        return deleted ? prev.filter((url) => url !== deleted.url) : prev;
      });
    } catch { alert('Failed to delete image'); }
    finally { setDeleting(null); }
  }

  // ─── DRAG & DROP to move image into folder ───
  function handleDragStart(e: React.DragEvent, img: LibraryImage) {
    setDraggedImage(img);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", img.publicId);
  }

  function handleDragEnd() {
    setDraggedImage(null);
    setDragOverFolder(null);
  }

  function handleFolderDragOver(e: React.DragEvent, folderPath: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolder(folderPath);
  }

  function handleFolderDragLeave() {
    setDragOverFolder(null);
  }

  async function handleFolderDrop(e: React.DragEvent, targetFolder: string) {
    e.preventDefault();
    setDragOverFolder(null);

    if (!draggedImage) return;

    setMoving(true);
    try {
      const res = await authFetch(`${API_URL}/upload/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicId: draggedImage.publicId, targetFolder }),
      });
      const json = await res.json();
      if (json.status === "success") {
        // Remove from current view
        setImages((prev) => prev.filter((img) => img.publicId !== draggedImage.publicId));
        setSelected((prev) => prev.filter((url) => url !== draggedImage.url));
      } else {
        alert(json.message || "Failed to move image");
      }
    } catch {
      alert("Failed to move image");
    } finally {
      setMoving(false);
      setDraggedImage(null);
    }
  }

  function toggleSelect(url: string) {
    if (multiple) {
      setSelected((prev) => prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]);
    } else {
      setSelected([url]);
    }
  }

  function handleInsert() {
    onSelect(selected);
    onClose();
  }

  if (!open || !mounted) return null;

  const dateGroups = groupByDate(images);
  const breadcrumbs = currentPath.split('/');

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(960px,94vw)] h-[min(680px,88vh)] bg-white rounded-2xl flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800">Media Library</h2>
          </div>
          <div className="flex gap-2 items-center">
            {/* Delete Folder button — only visible inside a subfolder */}
            {currentPath !== 'letslivetours' && (
              <button type="button" onClick={handleDeleteFolder} disabled={deletingFolder}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {deletingFolder ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                {deletingFolder ? "Deleting..." : "Delete Folder"}
              </button>
            )}
            <button type="button" onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none rounded-lg text-[11px] font-semibold cursor-pointer transition-colors">
              <FolderPlus size={13} /> New Folder
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white border-none rounded-lg text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-60">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? "Uploading..." : "Upload Here"}
            </button>
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 border-none flex items-center justify-center cursor-pointer transition-colors">
              <X size={15} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Breadcrumb / Navigation */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex items-center gap-1.5 text-xs bg-white">
          {pathHistory.length > 1 && (
            <button type="button" onClick={goBack}
              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 border-none flex items-center justify-center cursor-pointer mr-1 transition-colors">
              <ArrowLeft size={12} className="text-slate-600" />
            </button>
          )}
          {breadcrumbs.map((crumb, i) => {
            const path = breadcrumbs.slice(0, i + 1).join('/');
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={path} className="flex items-center gap-1.5">
                {i === 0 ? (
                  <button type="button" onClick={() => navigateTo(path)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 border-none cursor-pointer transition-colors ${isLast ? 'text-cyan-700 font-semibold bg-cyan-50' : 'text-slate-500'}`}>
                    <Home size={11} />
                    <span>{crumb}</span>
                  </button>
                ) : (
                  <>
                    <ChevronRight size={11} className="text-slate-300" />
                    <button type="button" onClick={() => navigateTo(path)}
                      className={`px-1.5 py-0.5 rounded hover:bg-slate-100 border-none cursor-pointer transition-colors ${isLast ? 'text-cyan-700 font-semibold bg-cyan-50' : 'text-slate-500'}`}>
                      {crumb}
                    </button>
                  </>
                )}
              </span>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={28} className="animate-spin text-cyan-600" />
            </div>
          ) : (
            <>
              {/* Folders */}
              {folders.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Folders {draggedImage && <span className="text-cyan-600 normal-case">(drop image on a folder to move it)</span>}</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
                    {folders.map((folder) => (
                      <button
                        key={folder.path}
                        type="button"
                        onClick={() => navigateTo(folder.path)}
                        onDragOver={(e) => handleFolderDragOver(e, folder.path)}
                        onDragLeave={handleFolderDragLeave}
                        onDrop={(e) => handleFolderDrop(e, folder.path)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-left group ${
                          dragOverFolder === folder.path
                            ? 'border-cyan-400 bg-cyan-50 ring-2 ring-cyan-200 scale-[1.02] shadow-md'
                            : 'border-slate-150 bg-slate-50/80 hover:bg-cyan-50 hover:border-cyan-200'
                        }`}
                      >
                        <FolderOpen size={18} className={`flex-shrink-0 transition-colors ${dragOverFolder === folder.path ? 'text-cyan-600' : 'text-amber-500 group-hover:text-cyan-600'}`} />
                        <span className={`text-xs font-semibold truncate transition-colors ${dragOverFolder === folder.path ? 'text-cyan-700' : 'text-slate-700 group-hover:text-cyan-700'}`}>{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Images grouped by date */}
              {images.length === 0 && folders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <ImageIcon size={44} className="text-slate-200" />
                  <p className="text-sm text-slate-400">This folder is empty</p>
                  <p className="text-[11px] text-slate-300">Upload images or create subfolders to organize</p>
                </div>
              ) : images.length === 0 && folders.length > 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <ImageIcon size={32} className="text-slate-200" />
                  <p className="text-xs text-slate-400">No images in this folder</p>
                </div>
              ) : (
                dateGroups.map((group) => (
                  <div key={group.date} className="mb-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 sticky top-0 bg-white py-1 z-10">
                      {group.date}
                    </p>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
                      {group.images.map((img) => {
                        const isSelected = selected.includes(img.url);
                        return (
                          <div
                            key={img.publicId}
                            className={`group flex flex-col items-center cursor-pointer ${draggedImage?.publicId === img.publicId ? 'opacity-40' : ''}`}
                            onClick={() => toggleSelect(img.url)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, img)}
                            onDragEnd={handleDragEnd}
                          >
                            {/* Image tile */}
                            <div
                              className={`relative w-full aspect-square rounded-lg overflow-hidden transition-all ${
                                isSelected
                                  ? 'ring-2 ring-cyan-500 ring-offset-2 shadow-md'
                                  : 'border border-slate-200 hover:border-cyan-300 hover:shadow-sm'
                              }`}
                            >
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />

                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setLightbox(img.url); }}
                                  className="w-7 h-7 rounded-full bg-white/90 hover:bg-white border-none flex items-center justify-center cursor-pointer transition-colors"
                                  title="Preview"
                                >
                                  <ZoomIn size={12} className="text-slate-700" />
                                </button>
                                {!isSelected && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(img.publicId); }}
                                    disabled={deleting === img.publicId}
                                    className="w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-600 border-none flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-colors"
                                    title="Delete"
                                  >
                                    {deleting === img.publicId
                                      ? <Loader2 size={11} className="text-white animate-spin" />
                                      : <Trash2 size={11} className="text-white" />
                                    }
                                  </button>
                                )}
                              </div>

                              {/* Selected check */}
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center shadow">
                                  <Check size={11} className="text-white" />
                                </div>
                              )}
                            </div>

                            {/* Image name (below thumbnail, like Windows) */}
                            <p
                              className={`mt-1.5 text-[10px] text-center leading-tight max-w-full truncate px-0.5 ${
                                isSelected ? 'text-cyan-700 font-semibold' : 'text-slate-500'
                              }`}
                              title={img.name}
                            >
                              {truncateName(img.name, 18)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-[11px] text-slate-400">
            {moving && <span className="text-cyan-600 font-semibold mr-2"><Loader2 size={11} className="inline animate-spin mr-1" />Moving image...</span>}
            {selected.length > 0 && <span className="text-cyan-700 font-semibold">{selected.length} selected</span>}
            {selected.length > 0 && " · "}
            {images.length} image{images.length !== 1 ? "s" : ""} · {folders.length} folder{folders.length !== 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={handleInsert}
            disabled={selected.length === 0}
            className={`px-5 py-2 border-none rounded-lg text-xs font-bold cursor-pointer transition-all ${
              selected.length > 0
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {multiple ? `Insert ${selected.length} Image${selected.length !== 1 ? "s" : ""}` : "Select Image"}
          </button>
        </div>

        {/* Create Folder Dialog */}
        <CreateFolderDialog
          open={showCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          currentPath={currentPath}
          onCreated={(folder) => setFolders((prev) => [...prev, folder])}
        />
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleUpload(e.target.files)} style={{ display: "none" }} />

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ─── SINGLE IMAGE UPLOAD ───

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}

      {value ? (
        <div className="relative group">
          <img src={value} alt="Selected" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button type="button" onClick={() => setLightbox(true)}
              className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-50 transition-colors">
              <ZoomIn size={12} /> Preview
            </button>
            <button type="button" onClick={() => setModalOpen(true)}
              className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-50 transition-colors">
              <Upload size={12} /> Change
            </button>
            <button type="button" onClick={() => onChange("")}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-red-600 transition-colors">
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full border-2 border-dashed border-slate-200 hover:border-cyan-400 rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-slate-50 flex flex-col items-center gap-2"
        >
          <ImageIcon size={24} className="text-slate-400" />
          <span className="text-xs text-slate-500">Click to open Media Library</span>
        </button>
      )}

      <MediaLibraryModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={(urls) => { if (urls[0]) onChange(urls[0]); }} />
      {lightbox && value && <Lightbox url={value} onClose={() => setLightbox(false)} />}
    </div>
  );
}

// ─── MULTI IMAGE UPLOAD ───

interface MultiImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
}

export function MultiImageUpload({ images, onChange, label }: MultiImageUploadProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt="" className="w-20 h-16 object-cover rounded-lg border border-slate-200" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(url)}
                  className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors border-none cursor-pointer"
                  title="Preview"
                >
                  <ZoomIn size={11} className="text-slate-800" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors border-none cursor-pointer"
                  title="Remove"
                >
                  <Trash2 size={11} className="text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-200 transition-colors"
      >
        <Upload size={12} /> {images.length > 0 ? "Add More Images" : "Select Images"}
      </button>
      <span className="text-[10px] text-slate-400">{images.length} image(s)</span>

      <MediaLibraryModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={(urls) => onChange([...images, ...urls])} multiple />
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
