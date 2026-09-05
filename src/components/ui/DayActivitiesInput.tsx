"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, X, GripVertical, Pencil, Check, Image as ImageIcon, ZoomIn, Trash2, RefreshCw } from "lucide-react";
import { MediaLibraryModal } from "./ImageUpload";

export interface DayActivityItem {
  title: string;
  description?: string;
  image?: string;
  images?: string[];
}

interface DayActivitiesInputProps {
  label?: string;
  activities: (string | DayActivityItem)[];
  onChange: (activities: DayActivityItem[]) => void;
  placeholder?: string;
  folder?: string;
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center p-4"
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

export default function DayActivitiesInput({
  label,
  activities = [],
  onChange,
  placeholder,
}: DayActivitiesInputProps) {
  // Normalize incoming activities to DayActivityItem[]
  const items: DayActivityItem[] = activities.map((a) => {
    if (typeof a === "string") {
      return { title: a, description: "", image: "", images: [] };
    }
    const img = a.image || (a.images && a.images[0]) || "";
    return {
      title: a.title || "",
      description: a.description || "",
      image: img,
      images: a.images && a.images.length > 0 ? a.images : (img ? [img] : []),
    };
  });

  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [modalItemIndex, setModalItemIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const editRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (editingIndex !== null) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [editingIndex]);

  function addItem() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Support | separator for bulk adding multiple items at once
    if (trimmed.includes("|")) {
      const newItems: DayActivityItem[] = trimmed
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s && !items.some((it) => it.title === s))
        .map((title) => ({ title, image: "", images: [] }));

      if (newItems.length > 0) {
        onChange([...items, ...newItems]);
        setInputValue("");
      }
      return;
    }

    if (!items.some((it) => it.title === trimmed)) {
      onChange([...items, { title: trimmed, image: "", images: [] }]);
      setInputValue("");
    }
  }

  function removeItem(index: number) {
    if (editingIndex === index) cancelEdit();
    onChange(items.filter((_, i) => i !== index));
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditingValue(items[index].title);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (trimmed && trimmed !== items[editingIndex].title) {
      const updated = [...items];
      updated[editingIndex] = { ...updated[editingIndex], title: trimmed };
      onChange(updated);
    }
    cancelEdit();
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingValue("");
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") cancelEdit();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  function handleDragStart(index: number) {
    if (editingIndex !== null) return;
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index;
  }

  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }
    const reordered = [...items];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    onChange(reordered);
    dragItem.current = null;
    dragOverItem.current = null;
  }

  function handleSetActivityImage(index: number, url: string) {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      image: url,
      images: url ? [url] : [],
    };
    onChange(updated);
  }

  function handleRemoveActivityImage(index: number) {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      image: "",
      images: [],
    };
    onChange(updated);
  }

  function handleUpdateDescription(index: number, description: string) {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      description,
    };
    onChange(updated);
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}

      {/* Add activity input bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Add activity (e.g. Shikara Ride on Dal Lake) · Use | for multiple"}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3.5 py-2 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Activity list */}
      {items.length > 0 && (
        <ul className="mt-2.5 space-y-2">
          {items.map((item, i) => (
            <li
              key={`${item.title}-${i}`}
              draggable={editingIndex !== i}
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-start gap-2.5 px-3 py-2.5 border rounded-xl group transition-all ${
                editingIndex === i
                  ? "bg-cyan-50/60 border-cyan-300 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
              }`}
            >
              <span
                className={`transition-colors cursor-grab active:cursor-grabbing shrink-0 mt-1 ${
                  editingIndex === i ? "text-cyan-400" : "text-slate-300 group-hover:text-slate-500"
                }`}
              >
                <GripVertical size={14} />
              </span>

              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>

              {/* Title & Description display or edit */}
              <div className="flex-1 min-w-0">
                {editingIndex === i ? (
                  <div className="flex items-center gap-1.5 mb-1">
                    <input
                      ref={editRef}
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={commitEdit}
                      className="flex-1 bg-white border border-cyan-400 rounded-lg px-2 py-1 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-0"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commitEdit();
                      }}
                      className="p-1 text-emerald-600 hover:text-emerald-700 shrink-0"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        cancelEdit();
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold text-slate-800 truncate cursor-pointer select-none"
                      onDoubleClick={() => startEdit(i)}
                      title="Double-click to edit activity name"
                    >
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      className="p-1 text-slate-300 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Edit activity name"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                )}

                {/* Optional description input */}
                <input
                  type="text"
                  value={item.description || ""}
                  onChange={(e) => handleUpdateDescription(i, e.target.value)}
                  placeholder="+ Add short details / description (optional)..."
                  className="w-full text-xs text-slate-600 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-cyan-400 focus:bg-slate-50 focus:outline-none px-1 py-0.5 rounded transition-colors placeholder:text-slate-300 mt-0.5"
                />
              </div>

              {/* Linked Image Section for this Activity */}
              <div className="flex items-center shrink-0">
                {item.image ? (
                  <div className="relative group/img flex items-center">
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(item.image || null)}
                          className="w-5 h-5 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-colors"
                          title="Preview image"
                        >
                          <ZoomIn size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalItemIndex(i)}
                          className="w-5 h-5 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition-colors"
                          title="Change image"
                        >
                          <RefreshCw size={9} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveActivityImage(i)}
                          className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                          title="Remove image"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalItemIndex(i)}
                    className="px-2.5 py-1.5 border border-dashed border-slate-300 hover:border-cyan-500 rounded-lg text-xs font-medium text-slate-500 hover:text-cyan-700 bg-slate-50/50 hover:bg-cyan-50/50 flex items-center gap-1.5 transition-all"
                    title="Attach photo to this activity"
                  >
                    <ImageIcon size={13} className="text-slate-400 group-hover:text-cyan-500" />
                    <span>+ Photo</span>
                  </button>
                )}
              </div>

              {/* Remove Activity Button */}
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Remove activity"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Helpful Hint */}
      {items.length > 0 && editingIndex === null && (
        <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
          <GripVertical size={10} /> Drag to reorder · Double-click to edit · Click <strong>+ Photo</strong> to attach a photo to each activity
        </p>
      )}

      {/* Media Library Modal for choosing activity image */}
      {modalItemIndex !== null && (
        <MediaLibraryModal
          open={true}
          onClose={() => setModalItemIndex(null)}
          onSelect={(urls) => {
            if (urls && urls[0]) {
              handleSetActivityImage(modalItemIndex, urls[0]);
            }
            setModalItemIndex(null);
          }}
          multiple={false}
        />
      )}

      {/* Lightbox for previewing activity image */}
      {previewUrl && <Lightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
