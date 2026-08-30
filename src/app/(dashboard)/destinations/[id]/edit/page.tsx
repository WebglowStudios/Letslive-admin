"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import ListInput from "@/components/ui/ListInput";
import ImageUpload, { MultiImageUpload } from "@/components/ui/ImageUpload";

interface WhyVisitEntry {
  icon: string;
  title: string;
  description: string;
}

interface TravelTip {
  question: string;
  answer: string;
}

interface GroupDeal {
  title: string;
  description: string;
  image: string;
  discountText: string;
}

export default function EditDestinationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // Tab 1: Basic Info
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [bestSeason, setBestSeason] = useState("");
  const [visaType, setVisaType] = useState("free");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Tab 2: Media
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // Tab 3: Page Content
  const [highlights, setHighlights] = useState<string[]>([]);
  const [whyVisit, setWhyVisit] = useState<WhyVisitEntry[]>([]);
  const [travelTips, setTravelTips] = useState<TravelTip[]>([]);
  const [photoGallery, setPhotoGallery] = useState<{ image: string; label: string }[]>([]);
  const [partners, setPartners] = useState<string[]>([]);

  // Tab 4: Group Deal
  const [groupDeal, setGroupDeal] = useState<GroupDeal>({
    title: "",
    description: "",
    image: "",
    discountText: "",
  });

  useEffect(() => {
    fetchDestination();
  }, [id]);

  async function fetchDestination() {
    try {
      const res = await api.get(`/destinations/${id}`);
      const d = res?.data || res;
      if (d) {
        setName(d.name || "");
        setCountry(d.country || "");
        setRegion(d.region || "");
        setDescription(d.description || "");
        setShortDescription(d.shortDescription || "");
        setCategory(d.category || "");
        setStartingPrice(d.startingPrice ? String(d.startingPrice) : "");
        setBestSeason(d.bestSeason || "");
        setVisaType(d.visaType || "free");
        setIsFeatured(d.isFeatured || false);
        setIsActive(d.isActive ?? true);
        setHeroImage(d.heroImage || "");
        setImages(d.images || []);
        setHighlights(d.highlights || []);
        setWhyVisit(
          d.whyVisit && d.whyVisit.length > 0
            ? d.whyVisit.map((w: { icon?: string; title?: string; description?: string }) => ({
                icon: w.icon || "",
                title: w.title || "",
                description: w.description || "",
              }))
            : []
        );
        setTravelTips(
          d.travelTips && d.travelTips.length > 0
            ? d.travelTips.map((t: { question?: string; answer?: string }) => ({
                question: t.question || "",
                answer: t.answer || "",
              }))
            : []
        );
        setPartners(d.partners || []);
        setPhotoGallery(
          d.photoGallery && d.photoGallery.length > 0
            ? d.photoGallery.map((p: { image?: string; label?: string }) => ({
                image: p.image || "",
                label: p.label || "",
              }))
            : []
        );
        setGroupDeal({
          title: d.groupDeal?.title || "",
          description: d.groupDeal?.description || "",
          image: d.groupDeal?.image || "",
          discountText: d.groupDeal?.discountText || "",
        });
      }
    } catch {
      setError("Failed to load destination");
    } finally {
      setFetching(false);
    }
  }

  // WhyVisit helpers
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

  // TravelTips helpers
  function addTravelTip() {
    setTravelTips([...travelTips, { question: "", answer: "" }]);
  }
  function removeTravelTip(index: number) {
    setTravelTips(travelTips.filter((_, i) => i !== index));
  }
  function updateTravelTip(index: number, field: string, value: string) {
    const updated = [...travelTips];
    updated[index] = { ...updated[index], [field]: value };
    setTravelTips(updated);
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
        startingPrice: startingPrice ? Number(startingPrice) : undefined,
        bestSeason,
        visaType,
        isFeatured,
        isActive,
        heroImage: heroImage || undefined,
        images,
        highlights,
        whyVisit: whyVisit.filter((w) => w.title),
        travelTips: travelTips.filter((t) => t.question),
        partners,
        photoGallery: photoGallery.filter((p) => p.image),
        groupDeal: groupDeal.title
          ? groupDeal
          : undefined,
      };

      const res = await api.put(`/destinations/${id}`, payload);
      if (res?.error) {
        setError(res.error);
      } else {
        const responseData = res?.data || res;
        if (responseData?.approvalRequired) {
          setSuccess(responseData.message || "Update submitted for admin approval!");
        } else {
          setSuccess("Destination updated successfully!");
        }
        setTimeout(() => router.push("/destinations"), 2000);
      }
    } catch {
      setError("Failed to update destination");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "media", label: "Media" },
    { id: "content", label: "Page Content" },
    { id: "groupdeal", label: "Group Deal" },
  ];

  if (fetching) {
    return (
      <RoleGuard permission="destinations.edit">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard permission="destinations.edit">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/destinations" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Edit Destination</h1>
            <p className="text-sm text-slate-500">Update destination details</p>
          </div>
        </div>

        {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">

          {/* === TAB 1: BASIC INFO === */}
          {activeTab === "basic" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Region</label>
                  <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
                <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select category</option>
                    <option value="beach">Beach</option>
                    <option value="city">City</option>
                    <option value="mountain">Mountain</option>
                    <option value="adventure">Adventure</option>
                    <option value="cultural">Cultural</option>
                    <option value="wildlife">Wildlife</option>
                    <option value="tropical">Tropical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Starting Price (₹)</label>
                  <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Best Season</label>
                  <input type="text" value={bestSeason} onChange={(e) => setBestSeason(e.target.value)} placeholder="e.g. October - April" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Visa Type</label>
                  <select value={visaType} onChange={(e) => setVisaType(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="free">Visa Free</option>
                    <option value="on-arrival">Visa on Arrival</option>
                    <option value="required">Visa Required</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-sm text-slate-700">Featured on homepage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-sm text-slate-700">Active</span>
                </label>
              </div>
            </>
          )}

          {/* === TAB 2: MEDIA === */}
          {activeTab === "media" && (
            <>
              <div>
                <ImageUpload value={heroImage} onChange={setHeroImage} folder="destinations" label="Hero Image" />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gallery / Slideshow Images</p>
                <p className="text-xs text-slate-400 mb-4">These images are displayed in the hero slideshow on the destination detail page.</p>
              </div>

              <MultiImageUpload images={images} onChange={setImages} folder="destinations" label="Slideshow Images" />
            </>
          )}

          {/* === TAB 3: PAGE CONTENT === */}
          {activeTab === "content" && (
            <>
              <ListInput label="Highlights (Marquee + Chips)" items={highlights} onChange={setHighlights} placeholder="e.g. Burj Khalifa, Desert Safari" />

              {/* Photo Gallery Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Photo Gallery</p>
                    <p className="text-xs text-slate-400">Images with labels shown in the highlights grid (1 big + 4 small)</p>
                  </div>
                  <button type="button" onClick={() => setPhotoGallery([...photoGallery, { image: "", label: "" }])} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                    <Plus size={14} /> Add Photo
                  </button>
                </div>
                <div className="space-y-3">
                  {photoGallery.map((photo, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-700">Photo {i + 1}</span>
                        <button type="button" onClick={() => setPhotoGallery(photoGallery.filter((_, j) => j !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                      <ImageUpload
                        value={photo.image}
                        onChange={(url) => { const u = [...photoGallery]; u[i] = { ...u[i], image: url }; setPhotoGallery(u); }}
                        label="Image"
                        folder="destinations"
                      />
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Label</label>
                        <input type="text" value={photo.label} onChange={(e) => { const u = [...photoGallery]; u[i] = { ...u[i], label: e.target.value }; setPhotoGallery(u); }} placeholder="Label (e.g. Burj Khalifa)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      </div>
                    </div>
                  ))}
                  {photoGallery.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No gallery photos yet. Click &quot;Add Photo&quot; to add images with labels.</p>
                  )}
                </div>
              </div>

              {/* Why Visit Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Why Visit Section</p>
                    <p className="text-xs text-slate-400">Cards showing key reasons to visit this destination</p>
                  </div>
                  <button type="button" onClick={addWhyVisit} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                    <Plus size={14} /> Add Card
                  </button>
                </div>
                <div className="space-y-4">
                  {whyVisit.map((entry, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-cyan-700">Card {i + 1}</span>
                        <button type="button" onClick={() => removeWhyVisit(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Icon (Material Symbol)</label>
                          <input type="text" value={entry.icon} onChange={(e) => updateWhyVisit(i, "icon", e.target.value)} placeholder="e.g. wb_sunny" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
                          <input type="text" value={entry.title} onChange={(e) => updateWhyVisit(i, "title", e.target.value)} placeholder="e.g. Best Time to Visit" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
                        <textarea value={entry.description} onChange={(e) => updateWhyVisit(i, "description", e.target.value)} placeholder="Brief description..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                      </div>
                    </div>
                  ))}
                  {whyVisit.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No why-visit cards yet. Click &quot;Add Card&quot; to create one.</p>
                  )}
                </div>
              </div>

              {/* Travel Tips Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Travel Tips (FAQ)</p>
                    <p className="text-xs text-slate-400">Question & answer accordion items</p>
                  </div>
                  <button type="button" onClick={addTravelTip} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                    <Plus size={14} /> Add Tip
                  </button>
                </div>
                <div className="space-y-4">
                  {travelTips.map((tip, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-cyan-700">Tip {i + 1}</span>
                        <button type="button" onClick={() => removeTravelTip(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Question</label>
                        <input type="text" value={tip.question} onChange={(e) => updateTravelTip(i, "question", e.target.value)} placeholder="e.g. What documents do I need?" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Answer</label>
                        <textarea value={tip.answer} onChange={(e) => updateTravelTip(i, "answer", e.target.value)} placeholder="Detailed answer..." rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                      </div>
                    </div>
                  ))}
                  {travelTips.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No travel tips yet. Click &quot;Add Tip&quot; to create one.</p>
                  )}
                </div>
              </div>

              {/* Partners */}
              <div className="pt-4 border-t border-slate-100">
                <MultiImageUpload images={partners} onChange={setPartners} label="Partner Logos" folder="destinations" />
              </div>
            </>
          )}

          {/* === TAB 4: GROUP DEAL === */}
          {activeTab === "groupdeal" && (
            <>
              <p className="text-xs text-slate-400 mb-2">Configure the group deal CTA section shown on the destination page. Leave title empty to hide.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input type="text" value={groupDeal.title} onChange={(e) => setGroupDeal({ ...groupDeal, title: e.target.value })} placeholder="e.g. Bigger Group? Get Special Offers!" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={groupDeal.description} onChange={(e) => setGroupDeal({ ...groupDeal, description: e.target.value })} placeholder="Describe the group deal offering..." rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
              </div>
              <ImageUpload value={groupDeal.image} onChange={(url) => setGroupDeal({ ...groupDeal, image: url })} label="Group Deal Image" folder="destinations" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount Text</label>
                <input type="text" value={groupDeal.discountText} onChange={(e) => setGroupDeal({ ...groupDeal, discountText: e.target.value })} placeholder="e.g. Save 15% on groups of 6+" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save Changes"}
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
