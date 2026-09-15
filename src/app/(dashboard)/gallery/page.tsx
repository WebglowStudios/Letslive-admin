"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MediaLibraryModal } from "@/components/ui/ImageUpload";

interface GalleryImage {
  _id: string;
  url: string;
  caption: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

export default function GalleryCMSPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchImages = async () => {
    try {
      const res = await api.get('/gallery');
      setImages(res?.data || []);
    } catch (error) {
      console.error("Failed to load gallery", error);
      showToast("Failed to load gallery images", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // 1. Add images selected from Media Library gadget (the same one used in packages)
  const handleMediaSelect = async (urls: string[]) => {
    setMediaModalOpen(false);
    if (!urls || urls.length === 0) return;

    setUploading(true);
    try {
      await api.post('/gallery', {
        urls,
        caption: "",
        isActive: true,
        sortOrder: images.length,
      });
      showToast(`Successfully added ${urls.length} image(s) to gallery`);
      await fetchImages();
    } catch (error: any) {
      console.error("Failed to add images to gallery", error);
      showToast(error.message || "Failed to add selected images", "error");
    } finally {
      setUploading(false);
    }
  };

  // 2. Direct upload from device
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("image", file);
        formData.append("folder", "gallery");

        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const url = uploadRes?.data?.url || uploadRes?.data?.imageUrl || uploadRes?.url;
        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error("No image URLs received from upload");
      }

      await api.post('/gallery', {
        urls: uploadedUrls,
        caption: "",
        isActive: true,
        sortOrder: images.length,
      });

      showToast(`Uploaded and added ${uploadedUrls.length} image(s)`);
      await fetchImages();
    } catch (error: any) {
      console.error("Upload failed", error);
      showToast(error.message || "Image upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleUpdate = async (id: string, updates: Partial<GalleryImage>) => {
    try {
      await api.put(`/gallery/${id}`, updates);
      setImages(prev => prev.map(img => img._id === id ? { ...img, ...updates } : img));
      showToast("Updated image details");
    } catch (error: any) {
      console.error("Update failed", error);
      showToast(error.message || "Failed to update image", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image from the gallery?")) return;
    try {
      await api.del(`/gallery/${id}`);
      setImages(prev => prev.filter(img => img._id !== id));
      showToast("Image removed from gallery");
    } catch (error: any) {
      console.error("Delete failed", error);
      showToast(error.message || "Delete failed", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
        <p className="text-sm text-slate-400">Loading gallery images...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Public Image Gallery</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage photos shown on the website's Trip Gallery page. Choose from the Media Library or upload directly.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Media Library Gadget Button */}
          <button
            type="button"
            onClick={() => setMediaModalOpen(true)}
            disabled={uploading}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            <ImageIcon size={18} />
            <span>Select from Media Library</span>
          </button>

          {/* Direct File Upload Button */}
          <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 cursor-pointer transition-colors">
            {uploading ? <Loader2 size={18} className="animate-spin text-cyan-400" /> : <Upload size={18} />}
            <span>Upload File</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleDirectUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <div className="text-center py-24 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <ImageIcon size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">No images in the gallery yet</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              Add photos using the Media Library gadget or upload directly. They will be displayed on the public website.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMediaModalOpen(true)}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus size={16} /> Select Images Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <div
              key={img._id}
              className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all flex flex-col ${
                img.isActive
                  ? "border-slate-800 hover:border-slate-700 shadow-md"
                  : "border-slate-800/50 opacity-60 bg-slate-900/60"
              }`}
            >
              {/* Image Preview */}
              <div className="h-52 relative group bg-slate-950 overflow-hidden">
                <img
                  src={img.url}
                  alt={img.caption || `Gallery photo ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-800/90 hover:bg-slate-700 text-white p-2.5 rounded-full transition-transform hover:scale-110"
                    title="View Original"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleUpdate(img._id, { isActive: !img.isActive })}
                    className="bg-slate-800/90 hover:bg-slate-700 text-white p-2.5 rounded-full transition-transform hover:scale-110"
                    title={img.isActive ? "Hide from website" : "Show on website"}
                  >
                    {img.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(img._id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full transition-transform hover:scale-110"
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Badge if inactive */}
                {!img.isActive && (
                  <span className="absolute top-3 right-3 text-xs bg-amber-500/90 text-black font-semibold px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                    Hidden
                  </span>
                )}
              </div>

              {/* Card Controls */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Caption / Description
                  </label>
                  <input
                    type="text"
                    value={img.caption || ""}
                    onChange={(e) =>
                      setImages((prev) =>
                        prev.map((i) => (i._id === img._id ? { ...i, caption: e.target.value } : i))
                      )
                    }
                    onBlur={() => handleUpdate(img._id, { caption: img.caption })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-sm px-3 py-2 text-white placeholder-slate-600 outline-none transition-colors"
                    placeholder="E.g., Sunset over Uluwatu Temple, Bali"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      Sort Order:
                    </label>
                    <input
                      type="number"
                      value={img.sortOrder}
                      onChange={(e) =>
                        setImages((prev) =>
                          prev.map((i) =>
                            i._id === img._id ? { ...i, sortOrder: Number(e.target.value) } : i
                          )
                        )
                      }
                      onBlur={() => handleUpdate(img._id, { sortOrder: img.sortOrder })}
                      className="w-16 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs py-1 px-2 text-white text-center outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdate(img._id, { isActive: !img.isActive })}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      img.isActive
                        ? "text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/50"
                        : "text-amber-400 bg-amber-950/50 hover:bg-amber-900/50"
                    }`}
                  >
                    {img.isActive ? "Visible" : "Hidden"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Library Gadget Modal */}
      {mediaModalOpen && (
        <MediaLibraryModal
          open={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelect={handleMediaSelect}
          multiple
        />
      )}
    </div>
  );
}
