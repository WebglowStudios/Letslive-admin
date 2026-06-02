"use client";

import { useState, useRef } from "react";
import { Plus, X, GripVertical } from "lucide-react";

interface ListInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export default function ListInput({ label, items, onChange, placeholder }: ListInputProps) {
  const [inputValue, setInputValue] = useState("");
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  function addItem() {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInputValue("");
    }
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  function handleDragStart(index: number) {
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
          placeholder={placeholder || "Type and press Enter or click +"}
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
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg group cursor-grab active:cursor-grabbing active:bg-cyan-50 active:border-cyan-200 transition-colors"
            >
              <span className="text-slate-300 group-hover:text-slate-500 transition-colors cursor-grab">
                <GripVertical size={14} />
              </span>
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-slate-700 flex-1">{item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 1 && (
        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
          <GripVertical size={10} /> Drag items to reorder
        </p>
      )}
    </div>
  );
}
