"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X, GripVertical, Pencil, Check } from "lucide-react";

interface ListInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export default function ListInput({ label, items, onChange, placeholder }: ListInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Focus the edit input when it appears
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
      const newItems = trimmed
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s && !items.includes(s));
      if (newItems.length > 0) {
        onChange([...items, ...newItems]);
        setInputValue("");
      }
      return;
    }

    if (!items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInputValue("");
    }
  }

  function removeItem(index: number) {
    if (editingIndex === index) cancelEdit();
    onChange(items.filter((_, i) => i !== index));
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setEditingValue(items[index]);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const trimmed = editingValue.trim();
    if (trimmed && trimmed !== items[editingIndex]) {
      const updated = [...items];
      updated[editingIndex] = trimmed;
      onChange(updated);
    }
    cancelEdit();
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditingValue("");
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") cancelEdit();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addItem(); }
  }

  function handleDragStart(index: number) {
    if (editingIndex !== null) return; // don't drag while editing
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

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type and press Enter · Use | to add multiple"}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-2.5 bg-cyan-50 text-cyan-700 rounded-xl hover:bg-cyan-100 transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
        >
          <Plus size={16} /> Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              draggable={editingIndex !== i}
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg group transition-colors ${
                editingIndex === i
                  ? "bg-cyan-50 border-cyan-300"
                  : "bg-slate-50 border-slate-200 cursor-grab active:cursor-grabbing active:bg-cyan-50 active:border-cyan-200"
              }`}
            >
              <span className={`transition-colors cursor-grab ${editingIndex === i ? "text-cyan-300" : "text-slate-300 group-hover:text-slate-500"}`}>
                <GripVertical size={14} />
              </span>
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>

              {editingIndex === i ? (
                /* ── Inline edit mode ── */
                <>
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
                    onMouseDown={(e) => { e.preventDefault(); commitEdit(); }}
                    className="p-1 text-emerald-500 hover:text-emerald-700 transition-colors shrink-0"
                    title="Save (Enter)"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                    title="Cancel (Esc)"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                /* ── Display mode ── */
                <>
                  <span
                    className="text-sm text-slate-700 flex-1 cursor-pointer select-none"
                    onDoubleClick={() => startEdit(i)}
                    title="Double-click to edit"
                  >
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="p-1 text-slate-300 hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Edit item"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove item"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {items.length > 1 && editingIndex === null && (
        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
          <GripVertical size={10} /> Drag to reorder · Double-click to edit · Use <span className="font-mono font-bold">|</span> to add multiple at once
        </p>
      )}
      {items.length === 0 && (
        <p className="text-[10px] text-slate-400 mt-1">
          Tip: use <span className="font-mono font-bold">|</span> to add multiple items at once, e.g. <span className="font-mono">Item A | Item B | Item C</span>
        </p>
      )}
    </div>
  );
}
