"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import ImageUpload, { MultiImageUpload } from "@/components/ui/ImageUpload";
import IconPicker from "@/components/ui/IconPicker";

interface WhyVisitEntry {
  icon: string;
  title: string;
  description: string;
}

export default function NewDestinationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [startingPrice, setStartingPrice] = useState("");
  const [bestSeason, setBestSeason] = useState("");
  const [visaType, setVisaType] = useState("free");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [whyVisit, setWhyVisit] = useState<WhyVisitEntry[]>([]);

  function addWhyVisit() {
    setWhyVisit([...whyVisit, { icon: "", title: "", description: "" }]);
  }
  function removeWhyVisit(index: number) {
    setWhyVisit(whyVisit.filter((_, i) => i !== index));
  }
  function updateWhyVisit(index: number, field: string, value: string) {
    const updated = [...whyVisit];
    updated[index] = { ...updated[index], [field]: value };
    setWhyVisit(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name,
        country,
        region,
        description,
        shortDescription,
        category: category || undefined,
        heroImage: heroImage || undefined,
        images,
        startingPrice: startingPrice ? Number(startingPrice) : undefined,
        bestSeason,
        visaType,
        isFeatured,
        isActive,
        whyVisit: whyVisit.filter((w) => w.title.trim() || w.icon.trim()),
      };

      const res = await api.post("/destinations", payload);
      if (res?.error) {
        setError(res.error);
      } else {
        const responseData = res?.data || res;
        if (responseData?.approvalRequired) {
          setSuccess(responseData.message || "Destination creation submitted for admin approval!");
        } else {
          setSuccess("Destination created successfully!");
        }
        setTimeout(() => router.push("/destinations"), 2000);
      }
    } catch {
      setError("Failed to create destination");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RoleGuard permission="destinations.create">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/destinations" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">New Destination</h1>
            <p className="text-sm text-slate-500">Add a new travel destination</p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g. Bali, Indonesia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Indonesia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Region</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Southeast Asia"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="Full description of the destination..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Brief tagline for cards"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select category</option>
              <option value="beach">Beach</option>
              <option value="mountain">Mountain</option>
              <option value="city">City</option>
              <option value="cultural">Cultural</option>
              <option value="adventure">Adventure</option>
              <option value="island">Island</option>
              <option value="wildlife">Wildlife</option>
              <option value="tropical">Tropical</option>
            </select>
          </div>

          {/* Hero Image - Media Library */}
          <ImageUpload value={heroImage} onChange={setHeroImage} label="Hero Image" folder="destinations" />

          {/* Gallery Images - Media Library */}
          <MultiImageUpload images={images} onChange={setImages} label="Gallery / Slideshow Images" folder="destinations" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Starting Price (₹)</label>
              <input
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="25000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Best Season</label>
              <input
                type="text"
                value={bestSeason}
                onChange={(e) => setBestSeason(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Oct - Mar"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Visa Type</label>
            <select
              value={visaType}
              onChange={(e) => setVisaType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="free">Visa Free</option>
              <option value="on-arrival">Visa on Arrival</option>
              <option value="required">Visa Required</option>
            </select>
          </div>

          {/* Why Visit Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Why Visit Section</p>
                <p className="text-xs text-slate-400">Cards showing key reasons to visit this destination</p>
              </div>
              <button
                type="button"
                onClick={addWhyVisit}
                className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100 transition-colors"
              >
                <Plus size={14} /> Add Card
              </button>
            </div>
            <div className="space-y-4">
              {whyVisit.map((entry, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-cyan-700">Card {i + 1}</span>
                      {entry.icon && (
                        <span className="material-symbols-rounded text-base text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100 leading-none">
                          {entry.icon.toLowerCase().replace(/[\s-]+/g, "_")}
                        </span>
                      )}
                      {entry.title && (
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[220px]">
                          — {entry.title}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWhyVisit(i)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Icon (Preloaded Dropdown)</label>
                      <IconPicker
                        value={entry.icon}
                        onChange={(icon) => updateWhyVisit(i, "icon", icon)}
                        placeholder="Select an icon..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => updateWhyVisit(i, "title", e.target.value)}
                        placeholder="e.g. Grand Forts & Palaces"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
                    <textarea
                      value={entry.description}
                      onChange={(e) => updateWhyVisit(i, "description", e.target.value)}
                      placeholder="Brief description..."
                      rows={2}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                  </div>
                </div>
              ))}
              {whyVisit.length === 0 && (
                <p className="text-xs text-slate-400 italic">No why-visit cards added yet. Click &quot;Add Card&quot; to highlight features.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-700">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? "Creating..." : "Create Destination"}
            </button>
            <Link href="/destinations" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
