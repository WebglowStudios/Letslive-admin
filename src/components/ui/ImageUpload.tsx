"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ImageUploadProps {
  value: string; // current URL
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  showPreview?: boolean;
}

export default function ImageUpload({ value, onChange, folder = "letslivetours", label, showPreview = true }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/upload?folder=${folder}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();

      if (json.status === "success" && json.data?.url) {
        onChange(json.data.url);
      } else {
        setError(json.message || "Upload failed");
      }
    } catch {
      setError("Upload failed. Check Cloudinary config.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleUpload(file);
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}

      {/* Preview + Upload area */}
      {value && showPreview ? (
        <div className="relative group">
          <img src={value} alt="Uploaded" className="w-full h-40 object-cover rounded-xl border border-slate-200" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1"><Upload size={12} /> Replace</button>
            <button onClick={() => onChange("")} className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"><X size={12} /> Remove</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploading ? "border-cyan-400 bg-cyan-50" : "border-slate-200 hover:border-cyan-400 hover:bg-slate-50"}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-cyan-600 animate-spin" />
              <p className="text-xs text-cyan-600 font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon size={24} className="text-slate-400" />
              <p className="text-xs text-slate-500">Click to upload or drag & drop</p>
              <p className="text-[10px] text-slate-400">PNG, JPG, WebP up to 5MB</p>
            </div>
          )}
        </div>
      )}

      {/* URL input fallback (always available) */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL..."
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        {!value && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-cyan-700 disabled:opacity-50">
            <Upload size={12} /> Upload
          </button>
        )}
      </div>

      {error && <p className="text-[10px] text-red-500">{error}</p>}

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}

// ─── Multi-image upload variant ───

interface MultiImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
}

export function MultiImageUpload({ images, onChange, folder = "letslivetours", label }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).slice(0, 10).forEach((f) => formData.append("images", f));

      const res = await fetch(`${API_URL}/upload/multiple?folder=${folder}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (json.status === "success" && json.data) {
        const newUrls = json.data.map((d: { url: string }) => d.url);
        onChange([...images, ...newUrls]);
      }
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} alt="" className="w-16 h-12 object-cover rounded-lg border border-slate-200" />
              <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1 hover:bg-slate-200 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {uploading ? "Uploading..." : "Upload Images"}
        </button>
        <span className="text-[10px] text-slate-400">{images.length} image(s)</span>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden" />
    </div>
  );
}
