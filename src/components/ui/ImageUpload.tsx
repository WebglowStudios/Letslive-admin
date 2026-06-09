"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Upload, X, Image as ImageIcon, Loader2, Check, Eye, Trash2, ZoomIn } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface LibraryImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  createdAt: string;
}

// ─── LIGHTBOX ───
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <X size={18} />
      </button>
      <img
        src={url}
        alt="Preview"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 25px 60px rgba(0,0,0,.5)" }}
      />
    </div>,
    document.body
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/upload/library?limit=200`, { credentials: "include" });
      const json = await res.json();
      setImages(json.data || []);
    } catch { setImages([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (open) { fetchLibrary(); setSelected([]); } }, [open, fetchLibrary]);

  async function handleUpload(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(`${API_URL}/upload?folder=letslivetours`, { method: "POST", body: formData, credentials: "include" });
        const json = await res.json();
        if (json.data?.url) {
          setImages((prev) => [{
            url: json.data.url,
            publicId: json.data.publicId,
            width: json.data.width,
            height: json.data.height,
            createdAt: new Date().toISOString(),
          }, ...prev]);
        }
      }
    } catch { alert("Upload failed"); }
    finally { setUploading(false); }
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

  const modalContent = (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)" }} />

      {/* Modal */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(900px, 92vw)", height: "min(620px, 85vh)",
        background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Media Library</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading..." : "Upload New"}
            </button>
            <button type="button" onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <Loader2 size={32} className="animate-spin" style={{ color: "#0891b2" }} />
            </div>
          ) : images.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <ImageIcon size={48} style={{ color: "#cbd5e1" }} />
              <p style={{ fontSize: 14, color: "#64748b" }}>No images yet. Upload your first one!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
              {images.map((img) => {
                const isSelected = selected.includes(img.url);
                return (
                  <div
                    key={img.publicId}
                    className="group"
                    onClick={() => toggleSelect(img.url)}
                    style={{
                      position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", cursor: "pointer",
                      border: isSelected ? "3px solid #0891b2" : "2px solid transparent", transition: "border .15s",
                    }}
                  >
                    <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {/* Hover overlay */}
                    <div
                      className="group-hover:opacity-100"
                      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", opacity: 0, transition: "opacity .15s", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightbox(img.url); }}
                        style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.9)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        title="Preview"
                      >
                        <ZoomIn size={14} style={{ color: "#0f172a" }} />
                      </button>
                    </div>
                    {isSelected && (
                      <div style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "#0891b2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={12} style={{ color: "#fff" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: "#64748b" }}>{selected.length} selected | {images.length} total images</p>
          <button
            type="button"
            onClick={handleInsert}
            disabled={selected.length === 0}
            style={{
              padding: "8px 20px",
              background: selected.length > 0 ? "#0891b2" : "#e2e8f0",
              color: selected.length > 0 ? "#fff" : "#94a3b8",
              border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: selected.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            {multiple ? `Insert ${selected.length} Image${selected.length !== 1 ? "s" : ""}` : "Select Image"}
          </button>
        </div>
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
              className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Eye size={12} /> Preview
            </button>
            <button type="button" onClick={() => setModalOpen(true)}
              className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Upload size={12} /> Change
            </button>
            <button type="button" onClick={() => onChange("")}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
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
              {/* Hover overlay with eye + delete */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(url)}
                  className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  title="Preview"
                >
                  <Eye size={11} className="text-slate-800" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
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
        className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-200"
      >
        <Upload size={12} /> {images.length > 0 ? "Add More Images" : "Select Images"}
      </button>
      <span className="text-[10px] text-slate-400">{images.length} image(s)</span>

      <MediaLibraryModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={(urls) => onChange([...images, ...urls])} multiple />
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
