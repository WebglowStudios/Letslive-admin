"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { MapPin, Sparkles, X } from "lucide-react";

interface DestinationItem {
  _id: string;
  name: string;
}

interface DestinationSelectProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  suggestedDestination?: string;
}

export default function DestinationSelect({
  value,
  onChange,
  label,
  placeholder = "Select Destination...",
  required = false,
  className = "",
  suggestedDestination,
}: DestinationSelectProps) {
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/destinations?limit=100&admin=true")
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        // Sort destinations alphabetically
        const sorted = [...list].sort((a: any, b: any) =>
          (a.name || "").localeCompare(b.name || "")
        );
        setDestinations(sorted);
      })
      .catch(() => {
        // Fallback or silent catch
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Determine if current value is in destination list
  const knownDestination = useMemo(() => {
    if (!value) return null;
    return destinations.find(
      (d) => d.name.toLowerCase().trim() === value.toLowerCase().trim()
    );
  }, [value, destinations]);

  // Sync custom mode when value or destination list changes
  useEffect(() => {
    if (value && destinations.length > 0) {
      if (!knownDestination) {
        setIsCustomMode(true);
        setCustomText(value);
      } else {
        setIsCustomMode(false);
        setCustomText("");
      }
    }
  }, [value, knownDestination, destinations.length]);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value;
    if (selected === "__custom__") {
      setIsCustomMode(true);
      if (knownDestination) {
        setCustomText("");
        onChange("");
      }
    } else {
      setIsCustomMode(false);
      setCustomText("");
      onChange(selected);
    }
  }

  function handleCustomTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCustomText(val);
    onChange(val);
  }

  const selectVal = isCustomMode ? "__custom__" : knownDestination ? knownDestination.name : value ? "__custom__" : "";

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {suggestedDestination && suggestedDestination.trim() !== value.trim() && (
            <button
              type="button"
              onClick={() => {
                onChange(suggestedDestination);
                setIsCustomMode(false);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded-md border border-cyan-200 transition-colors"
              title="Auto-fill destination from package interest"
            >
              <Sparkles size={10} className="text-cyan-600" /> Auto-fill: {suggestedDestination}
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <select
          value={selectVal}
          onChange={handleSelectChange}
          disabled={loading && destinations.length === 0}
          className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors pr-8"
        >
          <option value="">{loading ? "Loading destinations..." : placeholder}</option>
          {destinations.map((d) => (
            <option key={d._id} value={d.name}>
              {d.name}
            </option>
          ))}
          <option value="__custom__">✏️ Custom / Other (Type Manually)...</option>
        </select>
      </div>

      {/* Custom input revealed when custom mode is selected or custom value exists */}
      {isCustomMode && (
        <div className="pt-1 space-y-1">
          <div className="relative flex items-center">
            <MapPin size={13} className="absolute left-2.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={customText || value}
              onChange={handleCustomTextChange}
              placeholder="Type custom destination name..."
              className="w-full border border-cyan-300 bg-cyan-50/40 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-xs"
              autoFocus={isCustomMode && !value}
            />
            {(customText || value) && (
              <button
                type="button"
                onClick={() => {
                  setCustomText("");
                  onChange("");
                }}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 pl-1">
            Custom destination saved as typed.
          </p>
        </div>
      )}
    </div>
  );
}
