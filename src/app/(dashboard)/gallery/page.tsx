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
  Folder,
  FolderPlus,
  Filter,
  Check,
  X,
} from "lucide-react";
import { MediaLibraryModal } from "@/components/ui/ImageUpload";

interface GalleryImage {
  _id: string;
  url: string;
  caption: string;
  group?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

const PRESET_GROUPS = [
  "General",
  "Mountain Treks",
  "Beach Escapes",
  "Kashmir Diaries",
  "Group Tours",
  "Cultural Journeys",
  "Wildlife & Safari",
];

export default function GalleryCMSPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Group Management State
  const [selectedUploadGroup, setSelectedUploadGroup] = useState<string>("General");
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [customGroups, setCustomGroups] = useState<string[]>([]);

  // Collect all known groups (presets + custom + groups currently in database)
  const allGroups = Array.from(
    new Set([
      ...PRESET_GROUPS,
      ...customGroups,
      ...images.map((img) => (img.group && img.group.trim()) || "General"),
    ])
  ).sort();

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

  const handleCreateGroup = (nameToCreate?: string) => {
    const target = (nameToCreate || newGroupName).trim();
    if (!target) {
      showToast("Please enter a group name", "error");
      return null;
    }
    if (!customGroups.includes(target) && !PRESET_GROUPS.includes(target)) {
      setCustomGroups((prev) => [...prev, target]);
    }
    setSelectedUploadGroup(target);
    setIsCreatingNewGroup(false);
    setNewGroupName("");
    showToast(`Group "${target}" selected for uploads`);
    return target;
  };

  // 1. Add images selected from Media Library gadget
  const handleMediaSelect = async (urls: string[]) => {
    setMediaModalOpen(false);
    if (!urls || urls.length === 0) return;

    setUploading(true);
    const assignedGroup = selectedUploadGroup.trim() || "General";
    try {
      await api.post('/gallery', {
        urls,
        caption: "",
        group: assignedGroup,
        isActive: true,
        sortOrder: images.length,
      });
      showToast(`Successfully added ${urls.length} image(s) to "${assignedGroup}"`);
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
    const assignedGroup = selectedUploadGroup.trim() || "General";
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
        group: assignedGroup,
        isActive: true,
        sortOrder: images.length,
      });

      showToast(`Uploaded ${uploadedUrls.length} image(s) to "${assignedGroup}"`);
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
      setImages((prev) => prev.map((img) => (img._id === id ? { ...img, ...updates } : img)));
      showToast("Updated image details");
    } catch (error: any) {
      console.error("Update failed", error);
      showToast(error.message || "Failed to update image", "error");
    }
  };

  const handleCardGroupChange = (imgId: string, value: string) => {
    if (value === "__NEW__") {
      const entered = window.prompt("Enter new group name:");
      if (entered && entered.trim()) {
        const trimmed = entered.trim();
        if (!customGroups.includes(trimmed)) {
          setCustomGroups((prev) => [...prev, trimmed]);
        }
        handleUpdate(imgId, { group: trimmed });
      }
    } else {
      handleUpdate(imgId, { group: value });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image from the gallery?")) return;
    try {
      await api.del(`/gallery/${id}`);
      setImages((prev) => prev.filter((img) => img._id !== id));
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
            Manage photos shown on the website's Trip Gallery page. Organize photos into groups and categories.
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

      {/* Upload Group Selector Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Folder className="text-cyan-400" size={18} />
            <span>Upload Destination Group:</span>
          </div>

          {!isCreatingNewGroup ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedUploadGroup}
                onChange={(e) => {
                  if (e.target.value === "__NEW__") {
                    setIsCreatingNewGroup(true);
                  } else {
                    setSelectedUploadGroup(e.target.value);
                  }
                }}
                className="bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                {allGroups.map((grp) => (
                  <option key={grp} value={grp}>
                    {grp}
                  </option>
                ))}
                <option value="__NEW__" className="text-cyan-400 font-semibold">
                  + Create New Group...
                </option>
              </select>

              <button
                type="button"
                onClick={() => setIsCreatingNewGroup(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                title="Create a new group name"
              >
                <FolderPlus size={15} />
                <span>New Group</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter new group name..."
                className="bg-slate-950 border border-cyan-500 text-white text-sm rounded-xl px-3 py-2 outline-none w-56 placeholder-slate-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateGroup();
                  if (e.key === "Escape") {
                    setIsCreatingNewGroup(false);
                    setNewGroupName("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleCreateGroup()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Check size={14} /> Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewGroup(false);
                  setNewGroupName("");
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400">
          New uploads will automatically be assigned to <span className="text-cyan-300 font-semibold">{selectedUploadGroup || "General"}</span>
        </div>
      </div>

      {/* Filter by Category / Group */}
      {images.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter size={13} /> Group Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilterGroup("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
              filterGroup === "ALL"
                ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Photos ({images.length})
          </button>
          {allGroups.map((grp) => {
            const count = images.filter((i) => ((i.group && i.group.trim()) || "General") === grp).length;
            if (count === 0 && grp !== selectedUploadGroup) return null;
            return (
              <button
                key={grp}
                type="button"
                onClick={() => setFilterGroup(grp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
                  filterGroup === grp
                    ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>{grp}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    filterGroup === grp ? "bg-cyan-900/80 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
        (() => {
          const displayedImages = images.filter((img) => {
            if (filterGroup === "ALL") return true;
            return ((img.group && img.group.trim()) || "General") === filterGroup;
          });

          if (displayedImages.length === 0) {
            return (
              <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <Folder size={32} className="mx-auto text-slate-500" />
                <h3 className="text-base font-semibold text-white">No images in "{filterGroup}"</h3>
                <p className="text-xs text-slate-400">No photos match this group filter.</p>
                <button
                  type="button"
                  onClick={() => setFilterGroup("ALL")}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedImages.map((img, idx) => (
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

                    {/* Group Badge on Image */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-xs bg-slate-950/85 backdrop-blur-md text-cyan-300 font-medium px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1 shadow-sm">
                        <Folder size={12} className="text-cyan-400" />
                        {img.group || "General"}
                      </span>
                    </div>

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
                    <div className="space-y-3">
                      {/* Group Dropdown Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Folder size={12} className="text-cyan-400" /> Group / Category
                          </label>
                        </div>
                        <select
                          value={(img.group && img.group.trim()) || "General"}
                          onChange={(e) => handleCardGroupChange(img._id, e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs px-3 py-2 text-white outline-none transition-colors cursor-pointer"
                        >
                          {allGroups.map((grp) => (
                            <option key={grp} value={grp}>
                              {grp}
                            </option>
                          ))}
                          <option value="__NEW__" className="text-cyan-400 font-semibold">
                            + Assign to New Group...
                          </option>
                        </select>
                      </div>

                      {/* Caption / Description */}
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
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          Sort:
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
          );
        })()
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
