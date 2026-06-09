"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const MEAL_OPTIONS = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Brunch",
  "Hi-Tea",
  "Welcome Dinner",
  "Gala Dinner",
  "BBQ Dinner",
  "Seafood Dinner",
  "All Meals Included",
];

interface MealPickerProps {
  meals: string[];
  onChange: (meals: string[]) => void;
}

export default function MealPicker({ meals, onChange }: MealPickerProps) {
  const [selected, setSelected] = useState("Breakfast");
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");

  function addMeal() {
    const val = customMode ? customText.trim() : selected;
    if (!val) return;
    if (meals.includes(val)) return; // no duplicates
    onChange([...meals, val]);
    if (customMode) setCustomText("");
  }

  function removeMeal(meal: string) {
    onChange(meals.filter((m) => m !== meal));
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-500 block">Meals</label>

      {/* Added meals chips */}
      {meals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {meals.map((meal) => (
            <span
              key={meal}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-full text-xs font-semibold"
            >
              {meal}
              <button
                type="button"
                onClick={() => removeMeal(meal)}
                className="hover:text-red-500 transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Picker row */}
      <div className="flex items-center gap-2">
        {!customMode ? (
          <select
            value={selected}
            onChange={(e) => {
              if (e.target.value === "__custom__") {
                setCustomMode(true);
              } else {
                setSelected(e.target.value);
              }
            }}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {MEAL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="__custom__">+ Custom meal...</option>
          </select>
        ) : (
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMeal())}
            placeholder="Type custom meal name..."
            autoFocus
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        )}

        <button
          type="button"
          onClick={addMeal}
          className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-cyan-700 transition-colors"
        >
          <Plus size={13} /> Add
        </button>

        {customMode && (
          <button
            type="button"
            onClick={() => { setCustomMode(false); setCustomText(""); }}
            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
