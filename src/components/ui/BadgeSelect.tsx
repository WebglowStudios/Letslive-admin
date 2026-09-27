"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Tag, X } from "lucide-react";

export const PRESET_BADGES = [
  "Bestseller",
  "Hot Deal",
  "Popular",
  "Trending",
  "Top Rated",
  "New",
  "Special Offer",
  "Limited Seats",
  "Exclusive",
  "Featured",
  "Honeymoon Special",
  "Romantic",
  "Family Pick",
  "All-Inclusive",
  "Weekend Getaway",
  "Early Bird",
  "Seasonal Special",
  "Premium",
] as const;

interface BadgeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function BadgeSelect({
  value = "",
  onChange,
  className = "",
  disabled = false,
}: BadgeSelectProps) {
  // Check if current value matches one of our preset badges
  const isPreset = PRESET_BADGES.includes(value as (typeof PRESET_BADGES)[number]);
  const isCustomModeInitial = !isPreset && Boolean(value.trim());

  const [isCustom, setIsCustom] = useState(isCustomModeInitial);
  const [customText, setCustomText] = useState(isCustomModeInitial ? value : "");
  const customInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    const isCurrentlyPreset = PRESET_BADGES.includes(value as (typeof PRESET_BADGES)[number]);
    if (!isCurrentlyPreset && value.trim()) {
      setIsCustom(true);
      setCustomText(value);
    } else if (isCurrentlyPreset) {
      setIsCustom(false);
    } else if (!value) {
      setIsCustom(false);
      setCustomText("");
    }
  }, [value]);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "__custom__") {
      setIsCustom(true);
      onChange(customText.trim());
      setTimeout(() => customInputRef.current?.focus(), 50);
    } else {
      setIsCustom(false);
      onChange(selected);
    }
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomText(text);
    onChange(text);
  };

  const handleClear = () => {
    setIsCustom(false);
    setCustomText("");
    onChange("");
  };

  const selectValue = isCustom ? "__custom__" : isPreset ? value : "";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Badge</label>
        {value.trim() && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
              <Sparkles size={12} className="text-amber-500" />
              {value}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                title="Remove badge"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <select
            value={selectValue}
            onChange={handleDropdownChange}
            disabled={disabled}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white cursor-pointer transition-all disabled:opacity-50"
          >
            <option value="">No Badge (None)</option>
            <optgroup label="Popular Badges">
              {PRESET_BADGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </optgroup>
            <option value="__custom__">✨ Custom Badge...</option>
          </select>
        </div>

        {/* Custom Badge Input Box */}
        {isCustom && (
          <div className="flex items-center gap-2 p-3 bg-cyan-50/50 border border-cyan-200 rounded-xl animate-in fade-in slide-in-from-top-1 duration-150">
            <Tag size={16} className="text-cyan-600 shrink-0" />
            <input
              ref={customInputRef}
              type="text"
              value={customText}
              onChange={handleCustomTextChange}
              disabled={disabled}
              placeholder="Type custom badge (e.g. Monsoon Special, 50% Off)..."
              className="w-full bg-white px-3 py-1.5 border border-cyan-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
