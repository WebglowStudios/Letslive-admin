"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export const COUNTRIES = [
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "Russia", code: "RU", dialCode: "+7", flag: "🇷🇺" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export default function PhoneInput({ value, onChange, className = "", placeholder = "Phone Number", required = false }: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial value (e.g. "+91 9876543210")
  const [dialCode, setDialCode] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");

  useEffect(() => {
    // Only parse if value looks like it has a dial code and we haven't synced it yet
    if (value && value !== `${dialCode} ${localNumber}` && value !== `${dialCode}${localNumber}`) {
      let matchedCode = "+91";
      let localPart = value;
      
      // Try to find matching dial code
      if (value.startsWith("+")) {
        const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        for (const country of sortedCountries) {
          if (value.startsWith(country.dialCode + " ") || value.startsWith(country.dialCode)) {
            matchedCode = country.dialCode;
            localPart = value.substring(country.dialCode.length).trim();
            break;
          }
        }
      }
      
      setDialCode(matchedCode);
      setLocalNumber(localPart);
    }
  }, [value, dialCode, localNumber]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocal = e.target.value.replace(/[^\d\s-]/g, ""); // Allow digits, spaces, hyphens
    setLocalNumber(newLocal);
    onChange(`${dialCode} ${newLocal}`);
  };

  const selectCountry = (code: string) => {
    setDialCode(code);
    setIsOpen(false);
    setSearch("");
    onChange(`${code} ${localNumber}`);
  };

  const selectedCountry = COUNTRIES.find((c) => c.dialCode === dialCode) || COUNTRIES[0];
  const filteredCountries = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search)
  );

  return (
    <div className={`relative flex items-center bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 transition-all ${className}`} ref={dropdownRef}>
      
      {/* Country Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 border-r border-slate-200 hover:bg-slate-50 transition-colors shrink-0 text-sm h-full rounded-l-lg"
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="text-slate-600 font-medium">{selectedCountry.dialCode}</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c.dialCode)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 transition-colors ${dialCode === c.dialCode ? "bg-cyan-50 text-cyan-700 font-medium" : "text-slate-700"}`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-left truncate">{c.name}</span>
                <span className="text-slate-400 text-xs">{c.dialCode}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No countries found</p>
            )}
          </div>
        </div>
      )}

      {/* Phone Number Input */}
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        required={required}
        className="flex-1 w-full px-3 py-2 text-sm bg-transparent outline-none rounded-r-lg"
      />
    </div>
  );
}
