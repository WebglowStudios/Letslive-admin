"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import ListInput from "@/components/ui/ListInput";
import ImageUpload, { MultiImageUpload } from "@/components/ui/ImageUpload";
import MealPicker from "@/components/ui/MealPicker";
import TextTemplateControls from "@/components/ui/TextTemplateControls";
import TemplateControls from "@/components/ui/TemplateControls";

interface ItineraryDay {
  day: number; title: string; description: string;
  activities: string[]; meals: string[]; accommodation: string; images: string[];
}
interface Stay {
  _key: number; name: string; rating: string; nights: number; roomType: string;
  checkIn: string; checkOut: string; address: string; confirmationNo: string; amenities: string[];
}
interface Transfer {
  _key: number; title: string; description: string; transferType: string; vehicleType: string;
  from: string; to: string; stops: string[];
  legs: { from: string; to: string; stops: string[]; transferType: string; vehicleType: string }[];
  day: number; details: string[]; images: string[];
}

export default function EditCustomItineraryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeTab, setActiveTab] = useState("client");
  const [tripDetailsSubTab, setTripDetailsSubTab] = useState("itinerary");

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

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
  const [showOnDestination, setShowOnDestination] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Auto-compute end date from start date + itinerary days (editable override)
  function computeEndDate(start: string, days: string): string {
    const d = parseInt(days, 10);
    if (!start || !d || d <= 0) return "";
    const date = new Date(start);
    date.setDate(date.getDate() + d - 1);
    return date.toISOString().split("T")[0];
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (value && durationDays) setEndDate(computeEndDate(value, durationDays));
  }

  function handleDurationDaysChange(value: string) {
    setDurationDays(value);
    if (startDate && value) setEndDate(computeEndDate(startDate, value));
  }
  // Auto-calculation handlers
  const handlePriceChange = (val: string) => {
    setPrice(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0) {
      if (originalPrice && parseFloat(originalPrice) > p) {
        const op = parseFloat(originalPrice);
        setDiscount(Math.round(((op - p) / op) * 100).toString());
      } else if (discount && parseFloat(discount) > 0 && parseFloat(discount) < 100) {
        const d = parseFloat(discount);
        setOriginalPrice(Math.round(p / (1 - d / 100)).toString());
      }
    }
  };

  const handleOriginalPriceChange = (val: string) => {
    setOriginalPrice(val);
    const op = parseFloat(val);
    const p = parseFloat(price);
    if (!isNaN(op) && !isNaN(p) && op > p && p > 0) {
      setDiscount(Math.round(((op - p) / op) * 100).toString());
    } else if (!val || isNaN(op)) {
      setDiscount("");
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscount(val);
    const d = parseFloat(val);
    const p = parseFloat(price);
    if (!isNaN(d) && !isNaN(p) && d > 0 && d < 100 && p > 0) {
      setOriginalPrice(Math.round(p / (1 - d / 100)).toString());
    } else if (!val || isNaN(d) || d === 0) {
      setOriginalPrice("");
    }
  };

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

  // Trip details
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [flights, setFlights] = useState<{ _key: number; day: number; airline: string; flightNumber: string; from: string; to: string; departure: string; arrival: string; pnr: string; class: string; notes: string }[]>([]);

  useEffect(() => {
    api.get("/destinations?limit=100&admin=true").then((res) => setDestinations(res?.data || [])).catch(() => {});
    fetchItinerary();
  }, [id]);

  async function fetchItinerary() {
    try {
      const res = await api.get(`/packages/${id}`);
      const p = res?.data || res;
      if (!p) { setError("Itinerary not found"); return; }
      const destId = typeof p.destination === "object" ? p.destination?._id : p.destination;
      setClientName(p.clientName || "");
      setClientEmail(p.clientEmail || "");
      setClientPhone(p.clientPhone || "");
      setName(p.name || "");
      setDestination(destId || "");
      setDescription(p.description || "");
      setShortDescription(p.shortDescription || "");
      setDurationNights(p.duration?.nights ? String(p.duration.nights) : "");
      setDurationDays(p.duration?.days ? String(p.duration.days) : "");
      setHotelRating(p.hotelRating || "");
      setCategory(p.category || "");
      setPrice(p.price ? String(p.price) : "");
      setOriginalPrice(p.originalPrice ? String(p.originalPrice) : "");
      setDiscount(p.discount ? String(p.discount) : "");
      setBadge(p.badge || "");
      setIsFeatured(p.isFeatured || false);
      setIsActive(p.isActive ?? true);
      setFlightsIncluded(p.flightsIncluded || false);
      setTravellerCount(p.travellerCount || "");
      setShowOnDestination(p.showOnDestination || false);
      if (p.travelDates) {
        setStartDate(p.travelDates.startDate ? new Date(p.travelDates.startDate).toISOString().split("T")[0] : "");
        setEndDate(p.travelDates.endDate ? new Date(p.travelDates.endDate).toISOString().split("T")[0] : "");
      }
      const pc = p.paymentConfig;
      if (pc) {
        setPaymentMode(pc.mode || "full");
        setDepositType(pc.depositType || "percent");
        setDepositValue(pc.depositValue != null ? String(pc.depositValue) : "30");
        setDepositLabel(pc.depositLabel || "");
        setBalanceDueDays(pc.balanceDueDays != null ? String(pc.balanceDueDays) : "30");
      }
      setHeroImage(p.heroImage || "");
      setImages(p.images || []);
      setDestinationImages(p.destinationImages || []);
      setStayImages(p.stayImages || []);
      setActivityImages(p.activityImages || []);
      setKeyPoints(p.keyPoints || []);
      setHighlights(p.highlights || []);
      setInclusions(p.inclusions || []);
      setExclusions(p.exclusions || []);
      setKnowBeforeYouGo(p.knowBeforeYouGo || []);
      setThingsToCarry(p.thingsToCarry || []);
      setItinerary(
        p.itinerary?.length > 0
          ? p.itinerary.map((d: any, i: number) => ({ day: d.day || i + 1, title: d.title || "", description: d.description || "", activities: d.activities || [], meals: d.meals || [], accommodation: d.accommodation || "", images: d.images || [] }))
          : [{ day: 1, title: "", description: "", activities: [], meals: [], accommodation: "", images: [] }]
      );
      setStays(
        p.stays?.length > 0
          ? p.stays.map((s: any, i: number) => ({ _key: Date.now() + i + 1000, name: s.name || "", rating: s.rating || "", nights: s.nights || 0, roomType: s.roomType || "", checkIn: s.checkIn || "", checkOut: s.checkOut || "", address: s.address || "", confirmationNo: s.confirmationNo || "", amenities: s.amenities || [] }))
          : []
      );
      setTransfers(
        p.transfers?.length > 0
          ? p.transfers.map((t: any, i: number) => ({
              _key: Date.now() + i + 2000,
              title: t.title || "", description: t.description || "",
              transferType: t.transferType || "Shared Transfer", vehicleType: t.vehicleType || "",
              from: t.from || "", to: t.to || "", stops: t.stops || [],
              legs: t.legs?.length > 0 ? t.legs.map((l: any) => ({ from: l.from || "", to: l.to || "", stops: l.stops || [], transferType: l.transferType || "Shared Transfer", vehicleType: l.vehicleType || "" })) : [{ from: t.from || "", to: t.to || "", stops: [], transferType: t.transferType || "Shared Transfer", vehicleType: t.vehicleType || "" }],
              day: t.day || 0, details: t.details || [], images: t.images || [],
            }))
          : []
      );
      setFlights(
        p.flights?.length > 0
          ? p.flights.map((f: any, i: number) => ({ _key: Date.now() + i + 5000, day: f.day || 0, airline: f.airline || "", flightNumber: f.flightNumber || "", from: f.from || "", to: f.to || "", departure: f.departure || "", arrival: f.arrival || "", pnr: f.pnr || "", class: f.class || "", notes: f.notes || "" }))
          : []
      );
    } catch { setError("Failed to load itinerary"); }
    finally { setFetching(false); }
  }

  function addItineraryDay() { setItinerary([...itinerary, { day: itinerary.length + 1, title: "", description: "", activities: [], meals: [], accommodation: "", images: [] }]); }
  function removeItineraryDay(index: number) { setItinerary(itinerary.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }))); }
  function updateItinerary(index: number, field: string, value: unknown) { const u = [...itinerary]; u[index] = { ...u[index], [field]: value }; setItinerary(u); }

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


  function addStay() { setStays([...stays, { _key: Date.now(), name: "", rating: "", nights: 0, roomType: "", checkIn: "", checkOut: "", address: "", confirmationNo: "", amenities: [] }]); }
  function removeStay(i: number) { setStays(stays.filter((_, idx) => idx !== i)); }
  function updateStay(i: number, field: string, value: unknown) { const u = [...stays]; u[i] = { ...u[i], [field]: value }; setStays(u); }

  function addTransfer() { setTransfers([...transfers, { _key: Date.now(), title: "", description: "", transferType: "Shared Transfer", vehicleType: "", from: "", to: "", stops: [], legs: [{ from: "", to: "", stops: [], transferType: "Shared Transfer", vehicleType: "" }], day: 0, details: [], images: [] }]); }
  function removeTransfer(i: number) { setTransfers(transfers.filter((_, idx) => idx !== i)); }
  function updateTransfer(i: number, field: string, value: unknown) { const u = [...transfers]; u[i] = { ...u[i], [field]: value }; setTransfers(u); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      const payload = {
        name, clientName, clientEmail: clientEmail || undefined, clientPhone: clientPhone || undefined,
        destination: destination || undefined, description, shortDescription,
        heroImage: heroImage || undefined, images, destinationImages, stayImages, activityImages,
        duration: { nights: Number(durationNights) || 0, days: Number(durationDays) || 0 },
        travelDates: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined,
        hotelRating: hotelRating || undefined, category: category || undefined,
        price: Number(price) || 0,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        discount: discount ? Number(discount) : undefined,
        badge: badge || undefined, isFeatured, isActive, flightsIncluded,
        travellerCount: travellerCount || undefined, showOnDestination,
        keyPoints, highlights, inclusions, exclusions, knowBeforeYouGo, thingsToCarry,
        paymentConfig: { mode: paymentMode, depositType, depositValue: Number(depositValue) || 30, depositLabel: depositLabel.trim() || undefined, balanceDueDays: Number(balanceDueDays) || 30 },
        itinerary: itinerary.filter((d) => d.title).map((d) => ({ day: d.day, title: d.title, description: d.description, activities: d.activities, meals: d.meals, accommodation: d.accommodation, images: d.images })),
        stays: stays.filter((s) => s.name).map((s) => ({ name: s.name, rating: s.rating, nights: Number(s.nights) || 0, roomType: s.roomType, checkIn: s.checkIn || undefined, checkOut: s.checkOut || undefined, address: s.address || undefined, confirmationNo: s.confirmationNo || undefined, amenities: s.amenities })),
        transfers: transfers.filter((t) => t.title || t.legs.some(l => l.from || l.to)).map((t) => ({ title: t.title, description: t.description, transferType: t.legs[0]?.transferType || t.transferType || undefined, vehicleType: t.legs[0]?.vehicleType || t.vehicleType || undefined, from: t.legs[0]?.from || t.from || undefined, to: t.legs[t.legs.length - 1]?.to || t.to || undefined, stops: t.stops, legs: t.legs.filter(l => l.from || l.to).map(l => ({ from: l.from, to: l.to, stops: l.stops.length > 0 ? l.stops : undefined, transferType: l.transferType || undefined, vehicleType: l.vehicleType || undefined })), day: t.day || undefined, details: t.details, images: t.images })),
        flights: flights.filter((f) => f.airline || f.from || f.to).map((f) => ({ day: f.day || undefined, airline: f.airline, flightNumber: f.flightNumber, from: f.from, to: f.to, departure: f.departure, arrival: f.arrival, pnr: f.pnr || undefined, class: f.class || undefined, notes: f.notes || undefined })),
      };
      const res = await api.put(`/packages/${id}`, payload);
      if (res?.status === "success") {
        setSuccess("Itinerary updated successfully!");
        setTimeout(() => router.push("/itineraries"), 1500);
      } else { setError(res?.message || "Failed to update"); }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update itinerary");
    } finally { setLoading(false); }
  }

  const tabs = [
    { id: "client", label: "Client Info" },
    { id: "basic", label: "Basic Info" },
    { id: "media", label: "Media" },
    { id: "tripdetails", label: "Trip Details" },
    { id: "content", label: "Inclusions & More" },
  ];

  if (fetching) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/itineraries" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Edit Custom Itinerary</h1>
          <p className="text-sm text-slate-500">Update the personalized trip plan</p>
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{success}</div>}

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">

        {/* ── CLIENT INFO ── */}
        {activeTab === "client" && (
          <>
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
              <p className="text-xs font-semibold text-cyan-800">Client details are private and only visible to staff.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Email</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Phone</label>
                <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
          </>
        )}

        {/* ── BASIC INFO ── */}
        {activeTab === "basic" && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Itinerary Title *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination <span className="text-xs font-normal text-slate-400">(optional)</span></label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="">No specific destination</option>
                {destinations.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
              </select>
            </div>
            <div className={`p-4 rounded-xl border transition-colors ${showOnDestination ? "bg-cyan-50 border-cyan-200" : "bg-slate-50 border-slate-200"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input type="checkbox" checked={showOnDestination} onChange={(e) => setShowOnDestination(e.target.checked)} className="sr-only" />
                  <div className={`w-10 h-5 rounded-full transition-colors ${showOnDestination ? "bg-cyan-600" : "bg-slate-300"}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showOnDestination ? "translate-x-5" : ""}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Show on destination page</p>
                  <p className="text-xs text-slate-400 mt-0.5">{showOnDestination ? "Visible publicly on destination page." : "Private — accessible only via shareable link."}</p>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
              <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Full Description</label>
                <TextTemplateControls label="Description" category="description" text={description} onChange={setDescription} />
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nights</label><input type="number" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Days</label><input type="number" value={durationDays} onChange={(e) => handleDurationDaysChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Travel Start Date</label><input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Travel End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Hotel Rating</label><input type="text" value={hotelRating} onChange={(e) => setHotelRating(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="5-Star" /></div>
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
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹) *</label><input type="number" value={price} onChange={(e) => handlePriceChange(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Original Price</label><input type="number" value={originalPrice} onChange={(e) => handleOriginalPriceChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Discount %</label><input type="number" value={discount} onChange={(e) => handleDiscountChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Badge</label><input type="text" value={badge} onChange={(e) => setBadge(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Bestseller, Hot Deal, New" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Traveller Count</label><input type="text" value={travellerCount} onChange={(e) => setTravellerCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 2 Adults" /></div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /><span className="text-sm text-slate-700">Featured on homepage</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /><span className="text-sm text-slate-700">Active</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={flightsIncluded} onChange={(e) => setFlightsIncluded(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /><span className="text-sm text-slate-700">Flights Included</span></label>
            </div>
            {/* Payment config */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-600" /><p className="text-sm font-semibold text-slate-700">Payment Configuration</p></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPaymentMode("full")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${paymentMode === "full" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300"}`}>Full Payment</button>
                <button type="button" onClick={() => setPaymentMode("partial")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${paymentMode === "partial" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-500 border-slate-200 hover:border-cyan-300"}`}>Deposit + Balance</button>
              </div>
              {paymentMode === "partial" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit Type</label><select value={depositType} onChange={(e) => setDepositType(e.target.value as "percent" | "fixed")} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"><option value="percent">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option></select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1.5">{depositType === "percent" ? "Deposit %" : "Deposit Amount (₹)"}</label><input type="number" value={depositValue} onChange={(e) => setDepositValue(e.target.value)} min="1" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Balance Due (days before travel)</label><input type="number" value={balanceDueDays} onChange={(e) => setBalanceDueDays(e.target.value)} min="1" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Deposit Label (optional)</label><input type="text" value={depositLabel} onChange={(e) => setDepositLabel(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── MEDIA ── */}
        {activeTab === "media" && (
          <>
            <div><ImageUpload value={heroImage} onChange={setHeroImage} folder="itineraries" label="Hero Image" /></div>
            <div className="pt-4 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Gallery Grid Categories</p></div>
            <MultiImageUpload images={destinationImages} onChange={setDestinationImages} folder="itineraries/destinations" label="Destination Images" />
            <MultiImageUpload images={stayImages} onChange={setStayImages} folder="itineraries/stays" label="Stay Images" />
            <MultiImageUpload images={activityImages} onChange={setActivityImages} folder="itineraries/activities" label="Activity Images" />
            <MultiImageUpload images={images} onChange={setImages} folder="itineraries/gallery" label="General Gallery Images" />
          </>
        )}

        {/* ── TRIP DETAILS ── */}
        {activeTab === "tripdetails" && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              {[{ id: "itinerary", label: "Itinerary" }, { id: "stay", label: "Stay" }, { id: "transfers", label: "Transfers" }, { id: "flights", label: "Flights" }].map((sub) => (
                <button key={sub.id} type="button" onClick={() => setTripDetailsSubTab(sub.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tripDetailsSubTab === sub.id ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"}`}>{sub.label}</button>
              ))}
            </div>

            {tripDetailsSubTab === "itinerary" && (
              <>
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-700">Day-by-day Itinerary</p><button type="button" onClick={addItineraryDay} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100"><Plus size={14} /> Add Day</button></div>
                <div className="space-y-4">
                  {itinerary.map((day, i) => (
                    <div key={day.day} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm font-bold text-cyan-700">Day {day.day}</span>{itinerary.length > 1 && <button type="button" onClick={() => removeItineraryDay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}</div>
                      <input type="text" value={day.title} onChange={(e) => updateItinerary(i, "title", e.target.value)} placeholder="Day title" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <textarea value={day.description} onChange={(e) => updateItinerary(i, "description", e.target.value)} placeholder="What happens this day..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                      <div><label className="text-xs font-medium text-slate-500 mb-1 block">Activities</label><ListInput label="" items={day.activities} onChange={(items) => updateItinerary(i, "activities", items)} placeholder="Add activity" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <MealPicker meals={day.meals} onChange={(items) => updateItinerary(i, "meals", items)} />
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Accommodation</label><input type="text" value={day.accommodation} onChange={(e) => updateItinerary(i, "accommodation", e.target.value)} placeholder="Hotel name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                      </div>
                      <MultiImageUpload images={day.images} onChange={(items) => updateItinerary(i, "images", items)} label="Day Images" folder="itineraries" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {tripDetailsSubTab === "stay" && (
              <>
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-700">Hotels / Stays</p><button type="button" onClick={addStay} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100"><Plus size={14} /> Add Stay</button></div>
                <div className="space-y-4">
                  {stays.map((stay, i) => (
                    <div key={stay._key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm font-bold text-cyan-700">Stay {i + 1}</span><button type="button" onClick={() => removeStay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div>
                      <input type="text" value={stay.name} onChange={(e) => updateStay(i, "name", e.target.value)} placeholder="Hotel/Resort name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" value={stay.rating} onChange={(e) => updateStay(i, "rating", e.target.value)} placeholder="5-Star" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <input type="number" value={stay.nights || ""} onChange={(e) => updateStay(i, "nights", Number(e.target.value))} placeholder="Nights" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <input type="text" value={stay.roomType} onChange={(e) => updateStay(i, "roomType", e.target.value)} placeholder="Room type" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Check-in</label><input type="date" value={stay.checkIn} onChange={(e) => updateStay(i, "checkIn", e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Check-out</label><input type="date" value={stay.checkOut} onChange={(e) => updateStay(i, "checkOut", e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                      </div>
                      <input type="text" value={stay.address} onChange={(e) => updateStay(i, "address", e.target.value)} placeholder="Hotel address" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <input type="text" value={stay.confirmationNo} onChange={(e) => updateStay(i, "confirmationNo", e.target.value)} placeholder="Confirmation number" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                  ))}
                  {stays.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No stays yet.</p>}
                </div>
              </>
            )}

            {tripDetailsSubTab === "transfers" && (
              <>
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-700">Transfers</p><button type="button" onClick={addTransfer} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100"><Plus size={14} /> Add Transfer</button></div>
                <div className="space-y-4">
                  {transfers.map((transfer, i) => (
                    <div key={transfer._key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm font-bold text-cyan-700">Transfer {i + 1}</span><button type="button" onClick={() => removeTransfer(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div>
                      <input type="text" value={transfer.title} onChange={(e) => updateTransfer(i, "title", e.target.value)} placeholder="Transfer title" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <div><label className="text-xs font-medium text-slate-500 mb-1 block">Day</label><input type="number" value={transfer.day || ""} onChange={(e) => updateTransfer(i, "day", Number(e.target.value) || 0)} placeholder="1" className="w-32 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between"><label className="text-xs font-semibold text-slate-600">Route Legs</label><button type="button" onClick={() => { const u = [...transfers]; u[i] = { ...u[i], legs: [...u[i].legs, { from: "", to: "", stops: [], transferType: "Shared Transfer", vehicleType: "" }] }; setTransfers(u); }} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold hover:bg-slate-200"><Plus size={11} /> Add Leg</button></div>
                        {transfer.legs.map((leg, li) => (
                          <div key={li} className="border border-slate-100 rounded-lg p-2.5 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 w-4">{li + 1}.</span>
                              <input type="text" value={leg.from} onChange={(e) => { const u = [...transfers]; const legs = [...u[i].legs]; legs[li] = { ...legs[li], from: e.target.value }; u[i] = { ...u[i], legs }; setTransfers(u); }} placeholder="From" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                              <span className="text-slate-300 text-xs">→</span>
                              <input type="text" value={leg.to} onChange={(e) => { const u = [...transfers]; const legs = [...u[i].legs]; legs[li] = { ...legs[li], to: e.target.value }; u[i] = { ...u[i], legs }; setTransfers(u); }} placeholder="To" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                              {transfer.legs.length > 1 && <button type="button" onClick={() => { const u = [...transfers]; u[i] = { ...u[i], legs: u[i].legs.filter((_, idx) => idx !== li) }; setTransfers(u); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>}
                            </div>
                            <div className="pl-6 flex gap-2">
                              <select value={leg.transferType} onChange={(e) => { const u = [...transfers]; const legs = [...u[i].legs]; legs[li] = { ...legs[li], transferType: e.target.value }; u[i] = { ...u[i], legs }; setTransfers(u); }} className="px-2 py-1.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500">
                                <option value="Shared Transfer">Shared</option><option value="Private Transfer">Private</option><option value="Self Drive">Self Drive</option><option value="Flight">Flight</option><option value="Train">Train</option><option value="Ferry">Ferry</option><option value="Walk">Walk</option>
                              </select>
                              <input type="text" value={leg.vehicleType} onChange={(e) => { const u = [...transfers]; const legs = [...u[i].legs]; legs[li] = { ...legs[li], vehicleType: e.target.value }; u[i] = { ...u[i], legs }; setTransfers(u); }} placeholder="Vehicle (e.g. SUV)" className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <textarea value={transfer.description} onChange={(e) => updateTransfer(i, "description", e.target.value)} placeholder="Additional notes..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                      <ListInput label="Details" items={transfer.details} onChange={(items) => updateTransfer(i, "details", items)} placeholder="Add detail" />
                      <MultiImageUpload images={transfer.images} onChange={(items) => updateTransfer(i, "images", items)} label="Images" folder="itineraries" />
                    </div>
                  ))}
                  {transfers.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No transfers yet.</p>}
                </div>
              </>
            )}

            {tripDetailsSubTab === "flights" && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div><p className="text-sm font-medium text-slate-700">Flights / Trains</p><p className="text-xs text-slate-400">Add flight or train details</p></div>
                  <button type="button" onClick={() => setFlights([...flights, { _key: Date.now(), day: 0, airline: "", flightNumber: "", from: "", to: "", departure: "", arrival: "", pnr: "", class: "", notes: "" }])} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100"><Plus size={14} /> Add Flight</button>
                </div>
                <div className="space-y-4">
                  {flights.map((f, i) => (
                    <div key={f._key} className="border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between"><span className="text-sm font-bold text-cyan-700">Flight {i + 1}</span><button type="button" onClick={() => setFlights(flights.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Day</label><input type="number" value={f.day || ""} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], day: Number(e.target.value) || 0 }; setFlights(u); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Airline</label><input type="text" value={f.airline} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], airline: e.target.value }; setFlights(u); }} placeholder="IndiGo" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Flight No.</label><input type="text" value={f.flightNumber} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], flightNumber: e.target.value }; setFlights(u); }} placeholder="6E 2142" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">From</label><input type="text" value={f.from} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], from: e.target.value }; setFlights(u); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">To</label><input type="text" value={f.to} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], to: e.target.value }; setFlights(u); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Departure</label><input type="text" value={f.departure} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], departure: e.target.value }; setFlights(u); }} placeholder="06:30 AM" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Arrival</label><input type="text" value={f.arrival} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], arrival: e.target.value }; setFlights(u); }} placeholder="09:15 AM" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Class</label><input type="text" value={f.class} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], class: e.target.value }; setFlights(u); }} placeholder="Economy" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">PNR</label><input type="text" value={f.pnr} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], pnr: e.target.value }; setFlights(u); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                      </div>
                      <input type="text" value={f.notes} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], notes: e.target.value }; setFlights(u); }} placeholder="Notes (e.g. 15kg baggage included)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                  ))}
                  {flights.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No flights added.</p>}
                </div>
              </>
            )}
          </>
        )}

        {/* ── INCLUSIONS & MORE ── */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <TemplateControls label="Key Points" category="keyPoints" items={keyPoints} onChange={setKeyPoints} />
            <ListInput label="Key Points" items={keyPoints} onChange={setKeyPoints} placeholder="e.g. Burj Khalifa At the Top" />
            <TemplateControls label="Trip Highlights" category="highlights" items={highlights} onChange={setHighlights} />
            <ListInput label="Trip Highlights" items={highlights} onChange={setHighlights} placeholder="e.g. Private beach villa stay" />
            <TemplateControls label="Inclusions" category="inclusions" items={inclusions} onChange={setInclusions} />
            <ListInput label="Inclusions" items={inclusions} onChange={setInclusions} placeholder="e.g. Airport transfers included" />
            <TemplateControls label="Exclusions" category="exclusions" items={exclusions} onChange={setExclusions} />
            <ListInput label="Exclusions" items={exclusions} onChange={setExclusions} placeholder="e.g. Flights not included" />
            <TemplateControls label="Know Before You Go" category="knowBeforeYouGo" items={knowBeforeYouGo} onChange={setKnowBeforeYouGo} />
            <ListInput label="Know Before You Go" items={knowBeforeYouGo} onChange={setKnowBeforeYouGo} placeholder="e.g. Valid passport required" />
            <TemplateControls label="Things to Carry" category="thingsToCarry" items={thingsToCarry} onChange={setThingsToCarry} />
            <ListInput label="Things to Carry" items={thingsToCarry} onChange={setThingsToCarry} placeholder="e.g. Sunscreen SPF 50+" />
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            <Save size={16} />{loading ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/itineraries" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
