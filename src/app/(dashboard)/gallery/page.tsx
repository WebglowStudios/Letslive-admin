"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Plus, Trash2, Eye, EyeOff, Save } from "lucide-react";

interface GalleryImage {
  _id: string;
  url: string;
  caption: string;
  isActive: boolean;
  sortOrder: number;
}

export default function GalleryCMSPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    try {
      const res = await api.get('/gallery');
      setImages(res.data.data);
    } catch (error) {
      console.error("Failed to load gallery", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload to S3
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = uploadRes.data.imageUrl;

      // 2. Add to Gallery
      await api.post('/gallery', { url, caption: "", isActive: true, sortOrder: 0 });
      fetchImages();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<GalleryImage>) => {
    try {
      await api.put(`/gallery/${id}`, updates);
      setImages(prev => prev.map(img => img._id === id ? { ...img, ...updates } : img));
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      await api.delete(`/gallery/${id}`);
      setImages(prev => prev.filter(img => img._id !== id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Image Gallery</h1>
          <p className="text-slate-400 text-sm mt-1">Upload and manage images shown in the public gallery.</p>
        </div>
        <div>
          <label className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 cursor-pointer transition-colors">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Upload Image
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-slate-400">No images in the gallery yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {images.map(img => (
            <div key={img._id} className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${img.isActive ? 'border-slate-800' : 'border-slate-800/50 opacity-60'}`}>
              <div className="h-48 relative group">
                <img src={img.url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => handleUpdate(img._id, { isActive: !img.isActive })} className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full" title={img.isActive ? "Hide Image" : "Show Image"}>
                    {img.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button onClick={() => handleDelete(img._id)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Caption</label>
                  <input
                    type="text"
                    value={img.caption || ""}
                    onChange={e => setImages(prev => prev.map(i => i._id === img._id ? { ...i, caption: e.target.value } : i))}
                    onBlur={() => handleUpdate(img._id, { caption: img.caption })}
                    className="w-full bg-slate-950 border border-slate-800 rounded text-sm px-3 py-1.5 text-white placeholder-slate-600"
                    placeholder="E.g., Beautiful sunset in Bali"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Sort Order</label>
                    <input
                      type="number"
                      value={img.sortOrder}
                      onChange={e => setImages(prev => prev.map(i => i._id === img._id ? { ...i, sortOrder: Number(e.target.value) } : i))}
                      onBlur={() => handleUpdate(img._id, { sortOrder: img.sortOrder })}
                      className="w-20 bg-slate-950 border border-slate-800 rounded text-sm px-2 py-1 text-white text-center"
                    />
                  </div>
                  {!img.isActive && (
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md">Hidden</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
