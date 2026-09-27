"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Sparkles } from "lucide-react";

export interface CuratedIcon {
  id: string; // The exact Material Symbol ligature name
  name: string; // User-friendly label
  category:
    | "Heritage"
    | "Nature"
    | "Beach"
    | "Adventure"
    | "Wildlife"
    | "Dining"
    | "Stay"
    | "Transit"
    | "Badges";
  keywords: string[];
}

export const CURATED_ICONS: CuratedIcon[] = [
  // ─── Heritage & Landmarks ────────────────────────────────────────────────
  { id: "castle", name: "Castle & Palace", category: "Heritage", keywords: ["castle", "palace", "fort", "royal", "heritage", "monument"] },
  { id: "fort", name: "Historic Fort", category: "Heritage", keywords: ["fort", "citadel", "fortress", "bastion", "walls"] },
  { id: "temple_buddhist", name: "Buddhist Monastery", category: "Heritage", keywords: ["temple", "buddhist", "monastery", "zen", "ladakh", "himalaya"] },
  { id: "temple_hindu", name: "Hindu Temple", category: "Heritage", keywords: ["temple", "hindu", "mandir", "devbhoomi", "sacred", "spiritual", "shrine"] },
  { id: "mosque", name: "Mosque & Minaret", category: "Heritage", keywords: ["mosque", "masjid", "islamic", "monument", "architecture"] },
  { id: "church", name: "Church & Cathedral", category: "Heritage", keywords: ["church", "cathedral", "chapel", "christian", "historic"] },
  { id: "museum", name: "Museum & Exhibits", category: "Heritage", keywords: ["museum", "art", "exhibit", "history", "artifacts"] },
  { id: "monument", name: "Monuments & Memorials", category: "Heritage", keywords: ["monument", "statue", "memorial", "landmark"] },
  { id: "account_balance", name: "Classic Heritage", category: "Heritage", keywords: ["pillars", "architecture", "heritage", "palace", "government"] },
  { id: "history_edu", name: "Ancient History", category: "Heritage", keywords: ["history", "scroll", "culture", "ancient", "learning"] },
  { id: "architecture", name: "Iconic Architecture", category: "Heritage", keywords: ["architecture", "building", "modern", "design", "structure"] },
  { id: "palette", name: "Art & Handicrafts", category: "Heritage", keywords: ["art", "craft", "painting", "handicraft", "pottery", "culture"] },

  // ─── Nature & Landscapes ─────────────────────────────────────────────────
  { id: "landscape", name: "Mountain & Valleys", category: "Nature", keywords: ["mountain", "valley", "peaks", "himalayas", "landscape", "scenic"] },
  { id: "terrain", name: "Hills & Terrains", category: "Nature", keywords: ["hills", "terrain", "elevation", "cliff", "slopes", "nature"] },
  { id: "forest", name: "Forest & Woodlands", category: "Nature", keywords: ["forest", "trees", "jungle", "greenery", "woods", "nature"] },
  { id: "park", name: "National Parks", category: "Nature", keywords: ["park", "reserve", "sanctuary", "garden", "green"] },
  { id: "nature_people", name: "Pristine Nature", category: "Nature", keywords: ["nature", "outdoors", "peace", "green", "trees"] },
  { id: "eco", name: "Eco Tourism", category: "Nature", keywords: ["eco", "leaf", "flora", "sustainable", "green", "plants"] },
  { id: "nights_stay", name: "Desert Night & Sky", category: "Nature", keywords: ["night", "moon", "stars", "desert", "stargazing", "sky", "camping"] },
  { id: "wb_sunny", name: "Sun & Golden Hour", category: "Nature", keywords: ["sun", "sunny", "golden", "summer", "weather", "warm"] },
  { id: "ac_unit", name: "Snow & Winter", category: "Nature", keywords: ["snow", "winter", "cold", "ice", "snowflake", "chill"] },
  { id: "water", name: "Waterfalls & Rivers", category: "Nature", keywords: ["water", "falls", "cascade", "river", "spring", "stream"] },
  { id: "flare", name: "Sunrise & Sunsets", category: "Nature", keywords: ["sunrise", "sunset", "dawn", "twilight", "dusk", "sun"] },
  { id: "volcano", name: "Volcanoes & Geothermal", category: "Nature", keywords: ["volcano", "lava", "crater", "geothermal", "hot"] },

  // ─── Beaches & Water ─────────────────────────────────────────────────────
  { id: "beach_access", name: "Beach & Coastlines", category: "Beach", keywords: ["beach", "umbrella", "sand", "coast", "tropical", "ocean", "sea"] },
  { id: "surfing", name: "Surfing & Waves", category: "Beach", keywords: ["surf", "surfing", "waves", "ocean", "water sports"] },
  { id: "scuba_diving", name: "Scuba Diving & Coral", category: "Beach", keywords: ["scuba", "diving", "coral", "snorkel", "underwater", "marine"] },
  { id: "sailing", name: "Sailing & Yachts", category: "Beach", keywords: ["sail", "sailing", "yacht", "boat", "cruise"] },
  { id: "kayaking", name: "Kayaking & Canoeing", category: "Beach", keywords: ["kayak", "canoe", "paddle", "river", "backwaters", "lake"] },
  { id: "pool", name: "Infinity Pools", category: "Beach", keywords: ["pool", "swimming", "resort", "swim", "water"] },
  { id: "waves", name: "Ocean Waves", category: "Beach", keywords: ["ocean", "waves", "sea", "tide", "marine"] },
  { id: "houseboat", name: "Houseboat Cruises", category: "Beach", keywords: ["houseboat", "backwaters", "shikara", "kerala", "kashmir", "boat"] },
  { id: "water_lux", name: "Thermal Springs", category: "Beach", keywords: ["hot spring", "spa", "thermal", "mineral", "bath"] },

  // ─── Adventure & Thrills ─────────────────────────────────────────────────
  { id: "hiking", name: "Trekking & Trails", category: "Adventure", keywords: ["hiking", "trekking", "trek", "trails", "backpack", "mountains"] },
  { id: "paragliding", name: "Paragliding", category: "Adventure", keywords: ["paragliding", "flying", "sky", "glide", "adventure", "aerial"] },
  { id: "snowboarding", name: "Snowboarding", category: "Adventure", keywords: ["snowboard", "snow", "winter sports", "slopes"] },
  { id: "downhill_skiing", name: "Alpine Skiing", category: "Adventure", keywords: ["ski", "skiing", "downhill", "snow", "slopes"] },
  { id: "sports_motorsports", name: "Dune Bashing & ATV", category: "Adventure", keywords: ["dune", "desert", "atv", "quad", "motorsport", "safari"] },
  { id: "camping", name: "Glamping & Camping", category: "Adventure", keywords: ["camping", "tent", "glamping", "bonfire", "outdoor", "stars"] },
  { id: "explore", name: "Expeditions & Safari", category: "Adventure", keywords: ["explore", "compass", "expedition", "discovery", "adventure"] },
  { id: "snowmobile", name: "Snowmobile Safari", category: "Adventure", keywords: ["snowmobile", "snow", "ice", "arctic", "glacier"] },
  { id: "directions_bike", name: "Cycling Trails", category: "Adventure", keywords: ["bike", "cycling", "bicycle", "mountain bike"] },
  { id: "skateboarding", name: "Adventure Sports", category: "Adventure", keywords: ["sports", "action", "thrill", "skate"] },

  // ─── Wildlife & Safari ───────────────────────────────────────────────────
  { id: "pets", name: "Wildlife & Tigers", category: "Wildlife", keywords: ["wildlife", "safari", "tiger", "lion", "animals", "corbett", "jungle"] },
  { id: "cruelty_free", name: "Fauna & Birding", category: "Wildlife", keywords: ["animals", "birds", "fauna", "sanctuary", "conservation"] },
  { id: "visibility", name: "Wildlife Spotting", category: "Wildlife", keywords: ["spotting", "viewpoint", "binocular", "lookout", "sightseeing"] },
  { id: "camera_alt", name: "Photo Safaris", category: "Wildlife", keywords: ["camera", "photography", "photos", "wildlife", "scenic"] },

  // ─── Dining & Nightlife ──────────────────────────────────────────────────
  { id: "restaurant", name: "Fine Dining & Gourmet", category: "Dining", keywords: ["food", "dining", "restaurant", "cuisine", "gourmet", "chef"] },
  { id: "dinner_dining", name: "Romantic Dinners", category: "Dining", keywords: ["dinner", "evening", "romantic", "feast", "plate"] },
  { id: "local_dining", name: "Authentic Street Food", category: "Dining", keywords: ["street food", "local", "traditional", "flavor", "spices"] },
  { id: "bakery_dining", name: "Bakeries & Cafes", category: "Dining", keywords: ["bakery", "croissant", "pastry", "sweets", "dessert"] },
  { id: "local_cafe", name: "Coffee & Tea Estates", category: "Dining", keywords: ["coffee", "cafe", "tea", "plantation", "espresso"] },
  { id: "wine_bar", name: "Vineyards & Wine", category: "Dining", keywords: ["wine", "vineyard", "tasting", "cellar", "bar"] },
  { id: "nightlife", name: "Nightlife & Clubs", category: "Dining", keywords: ["nightlife", "party", "clubs", "music", "dance"] },
  { id: "local_bar", name: "Lounges & Cocktails", category: "Dining", keywords: ["bar", "cocktails", "drinks", "lounge", "pub"] },
  { id: "ramen_dining", name: "Asian & Regional Eats", category: "Dining", keywords: ["noodles", "ramen", "soup", "asian", "bowl"] },
  { id: "fastfood", name: "Quick Bites", category: "Dining", keywords: ["fastfood", "snacks", "burger", "bites"] },

  // ─── Stays & Wellness ────────────────────────────────────────────────────
  { id: "hotel_class", name: "5-Star Luxury Resorts", category: "Stay", keywords: ["hotel", "resort", "luxury", "5 star", "premium", "hospitality"] },
  { id: "bed", name: "Boutique Stays", category: "Stay", keywords: ["bed", "room", "boutique", "stay", "relax", "comfort"] },
  { id: "spa", name: "Ayurveda & Spa", category: "Stay", keywords: ["spa", "ayurveda", "massage", "wellness", "relaxation", "lotus"] },
  { id: "fitness_center", name: "Yoga & Wellness", category: "Stay", keywords: ["yoga", "wellness", "fitness", "meditation", "retreat"] },
  { id: "hot_tub", name: "Jacuzzi & Onsen", category: "Stay", keywords: ["jacuzzi", "tub", "soak", "onsen", "bath"] },
  { id: "chalet", name: "Wooden Chalets", category: "Stay", keywords: ["chalet", "lodge", "wooden", "cabin", "mountain"] },
  { id: "cottage", name: "Homestays & Cottages", category: "Stay", keywords: ["cottage", "homestay", "village", "cozy", "rural"] },
  { id: "apartment", name: "City Skyline Suites", category: "Stay", keywords: ["apartment", "city", "skyline", "urban", "penthouse"] },
  { id: "deck", name: "Scenic Viewing Decks", category: "Stay", keywords: ["deck", "balcony", "terrace", "patio", "view"] },

  // ─── Travel & Transit ────────────────────────────────────────────────────
  { id: "flight", name: "Scenic Flights", category: "Transit", keywords: ["flight", "plane", "air", "transfer", "flying"] },
  { id: "connecting_airports", name: "Airports & Transfers", category: "Transit", keywords: ["airport", "transit", "connectivity", "flights"] },
  { id: "directions_boat", name: "Ferry & Speedboats", category: "Transit", keywords: ["boat", "ferry", "speedboat", "islands"] },
  { id: "train", name: "Scenic Railway", category: "Transit", keywords: ["train", "railway", "scenic train", "express"] },
  { id: "directions_bus", name: "Luxury Coaches", category: "Transit", keywords: ["bus", "coach", "road trip", "transit"] },
  { id: "directions_car", name: "Chauffeur & Cab Tours", category: "Transit", keywords: ["car", "cab", "chauffeur", "private car", "drive"] },
  { id: "shopping_bag", name: "Bazaars & Souvenirs", category: "Transit", keywords: ["shopping", "bazaar", "market", "souvenirs", "crafts"] },
  { id: "local_mall", name: "Luxury Shopping", category: "Transit", keywords: ["mall", "shopping", "luxury", "retail"] },
  { id: "attractions", name: "Theme Parks & Rides", category: "Transit", keywords: ["attractions", "theme park", "rides", "ferris wheel"] },
  { id: "festival", name: "Festivals & Carnivals", category: "Transit", keywords: ["festival", "carnival", "fair", "mela", "culture"] },
  { id: "celebration", name: "Celebrations & Parties", category: "Transit", keywords: ["celebration", "party", "honeymoon", "festive"] },

  // ─── Badges & Highlights ─────────────────────────────────────────────────
  { id: "stars", name: "Top-Rated Experience", category: "Badges", keywords: ["stars", "rating", "top rated", "bestseller", "award"] },
  { id: "verified", name: "Verified & Safe", category: "Badges", keywords: ["verified", "safe", "trusted", "certified"] },
  { id: "savings", name: "Best Value & Budget", category: "Badges", keywords: ["savings", "budget", "affordable", "value", "deals"] },
  { id: "diamond", name: "Ultra-VIP Luxury", category: "Badges", keywords: ["diamond", "luxury", "vip", "exclusive", "premium"] },
  { id: "auto_awesome", name: "Must-Visit Highlight", category: "Badges", keywords: ["awesome", "sparkle", "highlight", "special", "magic"] },
  { id: "favorite", name: "Traveler Favorite", category: "Badges", keywords: ["favorite", "heart", "loved", "popular"] },
];

const CATEGORIES = [
  "All",
  "Heritage",
  "Nature",
  "Beach",
  "Adventure",
  "Wildlife",
  "Dining",
  "Stay",
  "Transit",
  "Badges",
] as const;

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function IconPicker({
  value = "",
  onChange,
  placeholder = "Choose an icon...",
  className = "",
  disabled = false,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [customInput, setCustomInput] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize currently selected value: trim, lowercase, replace spaces/hyphens with underscore
  const normalizedValue = useMemo(() => {
    if (!value) return "";
    return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  }, [value]);

  // Find if currently selected value matches one of our curated items
  const selectedIconMeta = useMemo(() => {
    if (!normalizedValue) return null;
    return CURATED_ICONS.find((item) => item.id === normalizedValue) || null;
  }, [normalizedValue]);

  // Filter icons based on category and search query
  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CURATED_ICONS.filter((item) => {
      // Category filter
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!q) return true;
      if (item.id.toLowerCase().includes(q)) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      if (item.category.toLowerCase().includes(q)) return true;
      if (item.keywords.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [search, selectedCategory]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (iconId: string) => {
    const clean = iconId.trim().toLowerCase().replace(/[\s-]+/g, "_");
    onChange(clean);
    setIsOpen(false);
  };

  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customInput.trim()) return;
    const clean = customInput.trim().toLowerCase().replace(/[\s-]+/g, "_");
    onChange(clean);
    setCustomInput("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const normalizedCustomInput = customInput.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const normalizedSearch = search.trim().toLowerCase().replace(/[\s-]+/g, "_");

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 border rounded-xl bg-white text-left transition-all ${
          isOpen
            ? "border-cyan-500 ring-2 ring-cyan-100 shadow-sm"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Visual Icon Badge */}
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              normalizedValue
                ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            {normalizedValue ? (
              <span className="material-symbols-rounded text-[22px] leading-none select-none">
                {normalizedValue}
              </span>
            ) : (
              <Sparkles size={16} />
            )}
          </div>

          {/* Label & Ligature code */}
          <div className="truncate flex-1 min-w-0">
            {normalizedValue ? (
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {selectedIconMeta ? selectedIconMeta.name : normalizedValue}
                </span>
                <span className="text-[11px] font-mono text-slate-400 truncate">
                  {normalizedValue}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">{placeholder}</span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {normalizedValue && !disabled && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 hover:text-slate-600 rounded-md hover:bg-slate-100"
              title="Clear icon"
            >
              <X size={14} />
            </div>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-cyan-600" : ""}`}
          />
        </div>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[320px] max-w-[420px] z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 80+ icons (e.g. castle, beach, night)..."
              className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Icons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredIcons.map((item) => {
              const isSelected = normalizedValue === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={`${item.name} (${item.id})`}
                  onClick={() => handleSelect(item.id)}
                  className={`group flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-200 font-semibold shadow-xs"
                      : "border-slate-100 hover:border-cyan-300 hover:bg-cyan-50/50 text-slate-700 hover:text-cyan-700"
                  }`}
                >
                  <span className="material-symbols-rounded text-[24px] mb-1 leading-none select-none transition-transform group-hover:scale-110">
                    {item.id}
                  </span>
                  <span className="text-[10px] w-full truncate text-slate-600 group-hover:text-cyan-800 leading-tight">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* No results prompt */}
          {filteredIcons.length === 0 && (
            <div className="text-center py-4 px-2 space-y-2">
              <p className="text-xs text-slate-500">
                No preloaded icons found matching &quot;{search}&quot;.
              </p>
              {normalizedSearch && (
                <button
                  type="button"
                  onClick={() => handleSelect(normalizedSearch)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100 border border-cyan-200 transition-colors"
                >
                  <span className="material-symbols-rounded text-[18px]">
                    {normalizedSearch}
                  </span>
                  Use &quot;{normalizedSearch}&quot; as custom icon
                </button>
              )}
            </div>
          )}

          {/* Custom Icon Entry Input */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span>Custom Material Symbol:</span>
              <span className="text-[10px] text-slate-400">Live preview</span>
            </div>
            <form onSubmit={handleApplyCustom} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g. castle, kayak, fort..."
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              {/* Instant Live Preview Badge */}
              <div
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-cyan-700"
                title="Icon preview"
              >
                {normalizedCustomInput ? (
                  <span className="material-symbols-rounded text-[20px] select-none">
                    {normalizedCustomInput}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300 font-mono">?</span>
                )}
              </div>

              <button
                type="submit"
                disabled={!normalizedCustomInput}
                className="px-2.5 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-medium hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-colors"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
