"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import ListInput from "@/components/ui/ListInput";
import TemplateControls from "@/components/ui/TemplateControls";
import ImageUpload, { MultiImageUpload } from "@/components/ui/ImageUpload";
import MealPicker from "@/components/ui/MealPicker";

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation: string;
  images: string[];
}

interface Activity {
  _key: number;
  title: string;
  description: string;
  duration: string;
  details: string[];
  images: string[];
}

interface Stay {
  _key: number;
  name: string;
  rating: string;
  nights: number;
  roomType: string;
  amenities: string[];
}

interface Transfer {
  _key: number;
  title: string;
  description: string;
  transferType: string;
  vehicleType: string;
  from: string;
  to: string;
  stops: string[];
  legs: { from: string; to: string; stops: string[]; transferType: string; vehicleType: string }[];
  day: number;
  details: string[];
  images: string[];
}

export default function NewPackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [tripDetailsSubTab, setTripDetailsSubTab] = useState("itinerary");

  // Basic info
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [durationNights, setDurationNights] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [hotelRating, setHotelRating] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [badge, setBadge] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [flightsIncluded, setFlightsIncluded] = useState(false);
  const [travellerCount, setTravellerCount] = useState("");

  // Payment config
  const [paymentMode, setPaymentMode] = useState<"full" | "partial">("full");
  const [depositType, setDepositType] = useState<"percent" | "fixed">("percent");
  const [depositValue, setDepositValue] = useState("30");
  const [depositLabel, setDepositLabel] = useState("");
  const [balanceDueDays, setBalanceDueDays] = useState("30");

  // Media
  const [heroImage, setHeroImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [destinationImages, setDestinationImages] = useState<string[]>([]);
  const [stayImages, setStayImages] = useState<string[]>([]);
  const [activityImages, setActivityImages] = useState<string[]>([]);

  // Lists
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [knowBeforeYouGo, setKnowBeforeYouGo] = useState<string[]>([]);
  const [thingsToCarry, setThingsToCarry] = useState<string[]>([]);

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { day: 1, title: "", description: "", activities: [], meals: [], accommodation: "", images: [] },
  ]);

  // Activities
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);

  // Stays
  const [stays, setStays] = useState<Stay[]>([]);

  // Transfers
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    api.get("/destinations?limit=100&admin=true").then((res) => setDestinations(res?.data || [])).catch(() => {});
  }, []);

  function addItineraryDay() {
    setItinerary([...itinerary, { day: itinerary.length + 1, title: "", description: "", activities: [], meals: [], accommodation: "", images: [] }]);
  }

  function removeItineraryDay(index: number) {
    setItinerary(itinerary.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 })));
  }

  function updateItinerary(index: number, field: string, value: unknown) {
    const updated = [...itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setItinerary(updated);
  }

  // Auto-generate itinerary day blocks to match durationDays when switching to Trip Details tab
  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    if (tabId === "tripdetails") {
      const days = parseInt(durationDays, 10);
      if (days > 0 && itinerary.length !== days) {
        if (days > itinerary.length) {
          const extras = Array.from({ length: days - itinerary.length }, (_, i) => ({
            day: itinerary.length + i + 1, title: "", description: "",
            activities: [], meals: [], accommodation: "", images: [],
          }));
          setItinerary((prev) => [...prev, ...extras]);
        } else {
          setItinerary((prev) => prev.slice(0, days).map((d, i) => ({ ...d, day: i + 1 })));
        }
      }
    }
  }

  // Activities helpers
  function addActivity() {
    setActivitiesList([...activitiesList, { _key: Date.now(), title: "", description: "", duration: "", details: [], images: [] }]);
  }
  function removeActivity(index: number) {
    setActivitiesList(activitiesList.filter((_, i) => i !== index));
  }
  function updateActivity(index: number, field: string, value: unknown) {
    const updated = [...activitiesList];
    updated[index] = { ...updated[index], [field]: value };
    setActivitiesList(updated);
  }

  // Stays helpers
  function addStay() {
    setStays([...stays, { _key: Date.now(), name: "", rating: "", nights: 0, roomType: "", amenities: [] }]);
  }
  function removeStay(index: number) {
    setStays(stays.filter((_, i) => i !== index));
  }
  function updateStay(index: number, field: string, value: unknown) {
    const updated = [...stays];
    updated[index] = { ...updated[index], [field]: value };
    setStays(updated);
  }

  // Transfers helpers
  function addTransfer() {
    setTransfers([...transfers, { _key: Date.now(), title: "", description: "", transferType: "Shared Transfer", vehicleType: "", from: "", to: "", stops: [], legs: [{ from: "", to: "", stops: [], transferType: "Shared Transfer", vehicleType: "" }], day: 0, details: [], images: [] }]);
  }
  function removeTransfer(index: number) {
    setTransfers(transfers.filter((_, i) => i !== index));
  }
  function updateTransfer(index: number, field: string, value: unknown) {
    const updated = [...transfers];
    updated[index] = { ...updated[index], [field]: value };
    setTransfers(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a package name");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        destination: destination || undefined,
        description,
        shortDescription,
        heroImage: heroImage || undefined,
        images,
        destinationImages,
        stayImages,
        activityImages,
        duration: { nights: Number(durationNights) || 0, days: Number(durationDays) || 0 },
        hotelRating: hotelRating || undefined,
        category: category || undefined,
        price: Number(price) || 0,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        discount: discount ? Number(discount) : undefined,
        badge: badge || undefined,
        isFeatured,
        isActive,
        flightsIncluded,
        travellerCount: travellerCount || undefined,
        paymentConfig: {
          mode: paymentMode,
          depositType,
          depositValue: Number(depositValue) || 30,
          depositLabel: depositLabel.trim() || undefined,
          balanceDueDays: Number(balanceDueDays) || 30,
        },
        highlights,
        keyPoints,
        inclusions,
        exclusions,
        knowBeforeYouGo,
        thingsToCarry,
        itinerary: itinerary.filter((d) => d.title).map((d) => ({
          day: d.day,
          title: d.title,
          description: d.description,
          activities: d.activities,
          meals: d.meals,
          accommodation: d.accommodation,
          images: d.images,
        })),
        activities: activitiesList.filter((a) => a.title).map((a) => ({
          title: a.title,
          description: a.description,
          duration: a.duration,
          details: a.details,
          images: a.images,
        })),
        stays: stays.filter((s) => s.name).map((s) => ({
          name: s.name,
          rating: s.rating,
          nights: Number(s.nights) || 0,
          roomType: s.roomType,
          amenities: s.amenities,
        })),
        transfers: transfers.filter((t) => t.title || t.legs.some(l => l.from || l.to)).map((t) => ({
          title: t.title,
          description: t.description,
          transferType: t.legs[0]?.transferType || t.transferType || undefined,
          vehicleType: t.legs[0]?.vehicleType || t.vehicleType || undefined,
          from: t.legs[0]?.from || t.from || undefined,
          to: t.legs[t.legs.length - 1]?.to || t.to || undefined,
          stops: t.stops,
          legs: t.legs.filter(l => l.from || l.to).map(l => ({
            from: l.from,
            to: l.to,
            stops: l.stops.length > 0 ? l.stops : undefined,
            transferType: l.transferType || undefined,
            vehicleType: l.vehicleType || undefined,
          })),
          day: t.day || undefined,
          details: t.details,
          images: t.images,
        })),
      };

      const res = await api.post("/packages", payload);
      if (res?.status === "success") {
        setSuccess("Package created successfully!");
        setTimeout(() => router.push("/packages"), 1500);
      } else {
        setError(res?.message || "Failed to create package");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create package";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "media", label: "Media" },
    { id: "tripdetails", label: "Trip Details" },
    { id: "content", label: "Inclusions & More" },
  ];

  return (
    <RoleGuard permission="packages.create">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/packages" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">New Package</h1>
            <p className="text-sm text-slate-500">Create a complete travel package</p>
          </div>
        </div>

        {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">

          {/* === BASIC INFO === */}
          {activeTab === "basic" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Package Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Maldives Luxury Overwater Villa Experience" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Destination
                  <span className="ml-2 text-xs font-normal text-slate-400">(optional — package won&apos;t appear on any destination page if left blank)</span>
                </label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">No destination (admin-only)</option>
                  {destinations.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
                <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Brief tagline for cards" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" placeholder="Detailed package description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nights *</label>
                  <input type="number" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Days *</label>
                  <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Hotel Rating</label>
                  <input type="text" value={hotelRating} onChange={(e) => setHotelRating(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="5-Star" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Select</option>
                    <option value="luxury">Luxury</option>
                    <option value="honeymoon">Honeymoon</option>
                    <option value="family">Family</option>
                    <option value="adventure">Adventure</option>
                    <option value="group">Group</option>
                    <option value="budget">Budget</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹) *</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="65000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Original Price</label>
                  <input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="85000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Discount %</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Badge</label>
                <input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Bestseller, Hot Deal, New" />
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={flightsIncluded} onChange={(e) => setFlightsIncluded(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-sm text-slate-700">Flights Included</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Traveller Count</label>
                <input type="text" value={travellerCount} onChange={(e) => setTravellerCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 2-15 people, Min 2 adults, etc." />
              </div>

              {/* Payment Configuration */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-600" />
                  <p className="text-sm font-semibold text-slate-700">Payment Configuration</p>
                </div>
                <p className="text-xs text-slate-400 -mt-2">Controls how customers pay when booking this package.</p>

                {/* Mode toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Mode</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("full")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${paymentMode === "full" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300"}`}
                    >
                      Full Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode("partial")}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${paymentMode === "partial" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300"}`}
                    >
                      Deposit + Balance
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {paymentMode === "full" ? "Customer pays the full amount at the time of booking." : "Customer pays a deposit now and the remaining balance before travel."}
                  </p>
                </div>

                {/* Deposit fields — only shown when partial */}
                {paymentMode === "partial" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit Type</label>
                        <select value={depositType} onChange={(e) => setDepositType(e.target.value as "percent" | "fixed")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
                          <option value="percent">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          {depositType === "percent" ? "Deposit %" : "Deposit Amount (₹)"}
                        </label>
                        <input
                          type="number"
                          value={depositValue}
                          onChange={(e) => setDepositValue(e.target.value)}
                          min="1"
                          max={depositType === "percent" ? "99" : undefined}
                          placeholder={depositType === "percent" ? "e.g. 30" : "e.g. 5000"}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Balance Due (days before travel)</label>
                        <input
                          type="number"
                          value={balanceDueDays}
                          onChange={(e) => setBalanceDueDays(e.target.value)}
                          min="1"
                          placeholder="e.g. 30"
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit Label (optional)</label>
                        <input
                          type="text"
                          value={depositLabel}
                          onChange={(e) => setDepositLabel(e.target.value)}
                          placeholder='e.g. "Book with ₹5,000"'
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="px-3 py-2 bg-cyan-50 border border-cyan-100 rounded-lg text-xs text-cyan-700">
                      Customer will pay <strong>{depositType === "percent" ? `${depositValue}%` : `₹${Number(depositValue).toLocaleString("en-IN")}`}</strong> at booking, and the balance is due <strong>{balanceDueDays} days</strong> before travel.
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* === MEDIA === */}
          {activeTab === "media" && (
            <>
              <div>
                <ImageUpload value={heroImage} onChange={setHeroImage} folder="packages" label="Hero Image (main large image)" />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Gallery Grid Categories</p>
                <p className="text-xs text-slate-400 mb-4">The first image from each category appears in the 2×2 grid on the package detail page.</p>
              </div>

              <MultiImageUpload images={destinationImages} onChange={setDestinationImages} folder="packages/destinations" label="Destination Images" />
              <MultiImageUpload images={stayImages} onChange={setStayImages} folder="packages/stays" label="Stay Images" />
              <MultiImageUpload images={activityImages} onChange={setActivityImages} folder="packages/activities" label="Activity Images" />
              <MultiImageUpload images={images} onChange={setImages} folder="packages/gallery" label="General Gallery Images" />
            </>
          )}

          {/* === TRIP DETAILS (Subtabs) === */}
          {activeTab === "tripdetails" && (
            <>
              {/* Subtab navigation */}
              <div className="flex gap-2 mb-4">
                {[
                  { id: "itinerary", label: "Itinerary" },
                  { id: "activities", label: "Activities" },
                  { id: "stay", label: "Stay" },
                  { id: "transfers", label: "Transfers" },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setTripDetailsSubTab(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tripDetailsSubTab === sub.id ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Subtab: Itinerary */}
              {tripDetailsSubTab === "itinerary" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Day-by-day Itinerary</p>
                    <button type="button" onClick={addItineraryDay} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                      <Plus size={14} /> Add Day
                    </button>
                  </div>
                  <div className="space-y-4">
                    {itinerary.map((day, i) => (
                      <div key={day.day} className="border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-cyan-700">Day {day.day}</span>
                          {itinerary.length > 1 && (
                            <button type="button" onClick={() => removeItineraryDay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          )}
                        </div>
                        <input type="text" value={day.title} onChange={(e) => updateItinerary(i, "title", e.target.value)} placeholder="Day title (e.g. Arrival & City Tour)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <textarea value={day.description} onChange={(e) => updateItinerary(i, "description", e.target.value)} placeholder="What happens this day..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Activities</label>
                          <ListInput label="" items={day.activities} onChange={(items) => updateItinerary(i, "activities", items)} placeholder="Add activity (e.g. Desert Safari)" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <MealPicker meals={day.meals} onChange={(items) => updateItinerary(i, "meals", items)} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Accommodation</label>
                            <input type="text" value={day.accommodation} onChange={(e) => updateItinerary(i, "accommodation", e.target.value)} placeholder="Hotel name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          </div>
                        </div>
                        <div>
                          <MultiImageUpload images={day.images} onChange={(items) => updateItinerary(i, "images", items)} label="Images" folder="packages" />
                        </div>
                      </div>
                    ))}
                    {itinerary.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No days added yet. Click &quot;Add Day&quot; to get started.</p>
                    )}
                  </div>
                </>
              )}

              {/* Subtab: Activities */}
              {tripDetailsSubTab === "activities" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Activities</p>
                    <button type="button" onClick={addActivity} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                      <Plus size={14} /> Add Activity
                    </button>
                  </div>
                  <div className="space-y-4">
                    {activitiesList.map((activity, i) => (
                      <div key={activity._key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-cyan-700">Activity {i + 1}</span>
                          <button type="button" onClick={() => removeActivity(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                        <input type="text" value={activity.title} onChange={(e) => updateActivity(i, "title", e.target.value)} placeholder="Activity title" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <textarea value={activity.description} onChange={(e) => updateActivity(i, "description", e.target.value)} placeholder="Activity description..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                        <input type="text" value={activity.duration} onChange={(e) => updateActivity(i, "duration", e.target.value)} placeholder="Duration (e.g. 2 hours)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <ListInput label="Details" items={activity.details} onChange={(items) => updateActivity(i, "details", items)} placeholder="Add detail" />
                        <div>
                          <MultiImageUpload images={activity.images} onChange={(items) => updateActivity(i, "images", items)} label="Images" folder="packages" />
                        </div>
                      </div>
                    ))}
                    {activitiesList.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No activities added yet. Click &quot;Add Activity&quot; to get started.</p>
                    )}
                  </div>
                </>
              )}

              {/* Subtab: Stay */}
              {tripDetailsSubTab === "stay" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Stays</p>
                    <button type="button" onClick={addStay} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                      <Plus size={14} /> Add Stay
                    </button>
                  </div>
                  <div className="space-y-4">
                    {stays.map((stay, i) => (
                      <div key={stay._key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-cyan-700">Stay {i + 1}</span>
                          <button type="button" onClick={() => removeStay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                        <input type="text" value={stay.name} onChange={(e) => updateStay(i, "name", e.target.value)} placeholder="Hotel/Resort name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <div className="grid grid-cols-3 gap-3">
                          <input type="text" value={stay.rating} onChange={(e) => updateStay(i, "rating", e.target.value)} placeholder="Rating (e.g. 5-Star)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          <input type="number" value={stay.nights || ""} onChange={(e) => updateStay(i, "nights", Number(e.target.value) || 0)} placeholder="Nights" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          <input type="text" value={stay.roomType} onChange={(e) => updateStay(i, "roomType", e.target.value)} placeholder="Room type" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>
                      </div>
                    ))}
                    {stays.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No stays added yet. Click &quot;Add Stay&quot; to get started.</p>
                    )}
                  </div>
                </>
              )}

              {/* Subtab: Transfers */}
              {tripDetailsSubTab === "transfers" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">Transfers</p>
                    <button type="button" onClick={addTransfer} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                      <Plus size={14} /> Add Transfer
                    </button>
                  </div>
                  <div className="space-y-4">
                    {transfers.map((transfer, i) => (
                      <div key={transfer._key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-cyan-700">Transfer {i + 1}</span>
                          <button type="button" onClick={() => removeTransfer(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                        <input type="text" value={transfer.title} onChange={(e) => updateTransfer(i, "title", e.target.value)} placeholder="Transfer title (e.g. Day 2 — Sightseeing & Intercity)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Day</label>
                          <input type="number" value={transfer.day || ""} onChange={(e) => updateTransfer(i, "day", Number(e.target.value) || 0)} placeholder="1" className="w-32 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </div>

                        {/* Legs (multiple from → to) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-600">Route Legs</label>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...transfers];
                                updated[i] = { ...updated[i], legs: [...updated[i].legs, { from: "", to: "", stops: [], transferType: "Shared Transfer", vehicleType: "" }] };
                                setTransfers(updated);
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold hover:bg-slate-200"
                            >
                              <Plus size={11} /> Add Leg
                            </button>
                          </div>
                          {transfer.legs.map((leg, li) => (
                            <div key={li} className="border border-slate-100 rounded-lg p-2.5 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 w-4 flex-shrink-0">{li + 1}.</span>
                                <input
                                  type="text"
                                  value={leg.from}
                                  onChange={(e) => {
                                    const updated = [...transfers];
                                    const legs = [...updated[i].legs];
                                    legs[li] = { ...legs[li], from: e.target.value };
                                    updated[i] = { ...updated[i], legs };
                                    setTransfers(updated);
                                  }}
                                  placeholder="From"
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <span className="text-slate-300 text-xs">→</span>
                                <input
                                  type="text"
                                  value={leg.to}
                                  onChange={(e) => {
                                    const updated = [...transfers];
                                    const legs = [...updated[i].legs];
                                    legs[li] = { ...legs[li], to: e.target.value };
                                    updated[i] = { ...updated[i], legs };
                                    setTransfers(updated);
                                  }}
                                  placeholder="To"
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                {transfer.legs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...transfers];
                                      const legs = updated[i].legs.filter((_, idx) => idx !== li);
                                      updated[i] = { ...updated[i], legs };
                                      setTransfers(updated);
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              {/* Transfer type & vehicle per leg */}
                              <div className="pl-6 flex items-center gap-2">
                                <select
                                  value={leg.transferType}
                                  onChange={(e) => {
                                    const updated = [...transfers];
                                    const legs = [...updated[i].legs];
                                    legs[li] = { ...legs[li], transferType: e.target.value };
                                    updated[i] = { ...updated[i], legs };
                                    setTransfers(updated);
                                  }}
                                  className="px-2 py-1.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                >
                                  <option value="Shared Transfer">Shared</option>
                                  <option value="Private Transfer">Private</option>
                                  <option value="Self Drive">Self Drive</option>
                                  <option value="Flight">Flight</option>
                                  <option value="Train">Train</option>
                                  <option value="Ferry">Ferry</option>
                                  <option value="Walk">Walk</option>
                                </select>
                                <input
                                  type="text"
                                  value={leg.vehicleType}
                                  onChange={(e) => {
                                    const updated = [...transfers];
                                    const legs = [...updated[i].legs];
                                    legs[li] = { ...legs[li], vehicleType: e.target.value };
                                    updated[i] = { ...updated[i], legs };
                                    setTransfers(updated);
                                  }}
                                  placeholder="Vehicle (e.g. SUV, Sedan)"
                                  className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                              </div>
                              {/* Stops within this leg */}
                              <div className="pl-6">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {leg.stops.map((stop, si) => (
                                    <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-600">
                                      {stop}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...transfers];
                                          const legs = [...updated[i].legs];
                                          legs[li] = { ...legs[li], stops: legs[li].stops.filter((_, idx) => idx !== si) };
                                          updated[i] = { ...updated[i], legs };
                                          setTransfers(updated);
                                        }}
                                        className="text-slate-400 hover:text-red-500 ml-0.5"
                                      >×</button>
                                    </span>
                                  ))}
                                  <input
                                    type="text"
                                    placeholder="+ stop"
                                    className="w-24 px-2 py-1 border border-dashed border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        if (!val) return;
                                        const updated = [...transfers];
                                        const legs = [...updated[i].legs];
                                        legs[li] = { ...legs[li], stops: [...legs[li].stops, val] };
                                        updated[i] = { ...updated[i], legs };
                                        setTransfers(updated);
                                        (e.target as HTMLInputElement).value = "";
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <p className="text-[10px] text-slate-400">Each leg is a separate from → to journey. Press Enter in the stop field to add intermediate stops within a leg.</p>
                        </div>

                        <textarea value={transfer.description} onChange={(e) => updateTransfer(i, "description", e.target.value)} placeholder="Additional notes..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                        <ListInput label="Details" items={transfer.details} onChange={(items) => updateTransfer(i, "details", items)} placeholder="Add detail" />
                        <div>
                          <MultiImageUpload images={transfer.images} onChange={(items) => updateTransfer(i, "images", items)} label="Images" folder="packages" />
                        </div>
                      </div>
                    ))}
                    {transfers.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">No transfers added yet. Click &quot;Add Transfer&quot; to get started.</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* === CONTENT (Lists) === */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <TemplateControls label="Key Points" category="keyPoints" items={keyPoints} onChange={setKeyPoints} />
              <ListInput label="Key Points (short labels for the checkmark box)" items={keyPoints} onChange={setKeyPoints} placeholder="e.g. Burj Khalifa At the Top" />
              <TemplateControls label="Trip Highlights" category="highlights" items={highlights} onChange={setHighlights} />
              <ListInput label="Trip Highlights (detailed bullet points)" items={highlights} onChange={setHighlights} placeholder="e.g. Stand atop the world's tallest building and witness Dubai's skyline at sunset" />
              <TemplateControls label="Inclusions" category="inclusions" items={inclusions} onChange={setInclusions} />
              <ListInput label="Inclusions" items={inclusions} onChange={setInclusions} placeholder="e.g. Return flights included" />
              <TemplateControls label="Exclusions" category="exclusions" items={exclusions} onChange={setExclusions} />
              <ListInput label="Exclusions" items={exclusions} onChange={setExclusions} placeholder="e.g. Visa fees not included" />
              <TemplateControls label="Know Before You Go" category="knowBeforeYouGo" items={knowBeforeYouGo} onChange={setKnowBeforeYouGo} />
              <ListInput label="Know Before You Go" items={knowBeforeYouGo} onChange={setKnowBeforeYouGo} placeholder="e.g. Valid passport required (6 months validity)" />
              <TemplateControls label="Things to Carry" category="thingsToCarry" items={thingsToCarry} onChange={setThingsToCarry} />
              <ListInput label="Things to Carry" items={thingsToCarry} onChange={setThingsToCarry} placeholder="e.g. Sunscreen SPF 50+" />
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button type="submit" disabled={loading} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2">
              <Save size={16} />
              {loading ? "Creating..." : "Create Package"}
            </button>
            <Link href="/packages" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}
