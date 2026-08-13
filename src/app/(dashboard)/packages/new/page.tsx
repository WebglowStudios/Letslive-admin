"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { ArrowLeft, Save, Plus, Trash2, Wand2, ArrowUp, ArrowDown, Download } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/guards/RoleGuard";
import ListInput from "@/components/ui/ListInput";
import TemplateControls from "@/components/ui/TemplateControls";
import ImageUpload, { MultiImageUpload } from "@/components/ui/ImageUpload";
import MealPicker from "@/components/ui/MealPicker";
import TextTemplateControls from "@/components/ui/TextTemplateControls";
import { DayTemplateModal } from "@/components/ui/DayTemplateModal";
import { SaveDayTemplateModal } from "@/components/ui/SaveDayTemplateModal";
import { ImportModal } from "@/components/ui/ImportModal";

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation: string;
  images: string[];
}

interface Stay {
  _key: number;
  name: string;
  rating: string;
  nights: number;
  roomType: string;
  rooms?: number;
  amenities: string[];
  checkIn?: string;
  checkOut?: string;
  address?: string;
  confirmationNo?: string;
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
  const [customDestinationText, setCustomDestinationText] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [durationNights, setDurationNights] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [hotelRating, setHotelRating] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const [showDayTemplateModal, setShowDayTemplateModal] = useState(false);
  const [loadTemplateDayIndex, setLoadTemplateDayIndex] = useState<number | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateDayData, setSaveTemplateDayData] = useState<any>(null);
  
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportData = (p: any) => {
    if (p.name) setName(p.name);
    if (p.destination?._id) setDestination(p.destination._id);
    else if (p.destination) setDestination(p.destination);
    if (p.description) setDescription(p.description);
    if (p.shortDescription) setShortDescription(p.shortDescription);
    if (p.duration) {
      setDurationNights(p.duration.nights?.toString() || "");
      setDurationDays(p.duration.days?.toString() || "");
    }
    if (p.hotelRating) setHotelRating(p.hotelRating);
    if (p.category) setCategory(p.category);
    if (p.price) setPrice(p.price.toString());
    if (p.originalPrice) setOriginalPrice(p.originalPrice.toString());
    if (p.discount) setDiscount(p.discount.toString());
    if (p.discountType) setDiscountType(p.discountType);
    if (p.isFeatured !== undefined) setIsFeatured(p.isFeatured);
    if (p.isActive !== undefined) setIsActive(p.isActive);
    if (p.isGroupTour !== undefined) setIsGroupTour(p.isGroupTour);
    if (p.flightsIncluded !== undefined) setFlightsIncluded(p.flightsIncluded);
    if (p.departures) setDepartures(p.departures.map((d: any) => ({ ...d, startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '', endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '' })));
    if (p.travellerCount) setTravellerCount(p.travellerCount.toString());
    if (p.adultCount) setAdultCount(p.adultCount.toString());
    if (p.childCount) setChildCount(p.childCount.toString());
    if (p.priceUnit) setPriceUnit(p.priceUnit);
    if (p.heroImage) setHeroImage(p.heroImage);
    if (p.destinationImages) setDestinationImages(p.destinationImages);
    if (p.stayImages) setStayImages(p.stayImages);
    if (p.activityImages) setActivityImages(p.activityImages);
    if (p.images) setImages(p.images);
    if (p.itinerary) setItinerary(p.itinerary.map((day: any) => ({ ...day, _key: Date.now() + Math.random() })));
    if (p.stays) setStays(p.stays.map((stay: any) => ({ ...stay, _key: Date.now() + Math.random() })));
    if (p.transfers) setTransfers(p.transfers.map((t: any) => ({ ...t, _key: Date.now() + Math.random() })));
    if (p.inclusions) setInclusions(p.inclusions);
    if (p.exclusions) setExclusions(p.exclusions);
    if (p.thingsToCarry) setThingsToCarry(p.thingsToCarry);
    if (p.paymentPolicy) setPaymentPolicy(p.paymentPolicy);
    if (p.cancellationPolicy) setCancellationPolicy(p.cancellationPolicy);
    if (p.flightCancellationPolicy) setFlightCancellationPolicy(p.flightCancellationPolicy);
    
    setShowImportModal(false);
  };

  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [badge, setBadge] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [flightsIncluded, setFlightsIncluded] = useState(false);
  const [travellerCount, setTravellerCount] = useState("");
  const [adultCount, setAdultCount] = useState("");
  const [childCount, setChildCount] = useState("");
  const [priceUnit, setPriceUnit] = useState("person");

  // Departures (Group Tour)
  const [isGroupTour, setIsGroupTour] = useState(false);
  const [departures, setDepartures] = useState<{ _id?: string; startDate: string; endDate: string; totalSlots: number; bookedSlots?: number; status?: string; priceCategory?: string; price: number }[]>([]);

  // Auto-compute end date from start date + itinerary days (editable override)
  function computeEndDate(start: string, days: string): string {
    const d = parseInt(days, 10);
    if (!start || !d || d <= 0) return "";
    const date = new Date(start);
    date.setDate(date.getDate() + d - 1);
    return date.toISOString().split("T")[0];
  }

  // Auto-calculation handlers
  const handlePriceChange = (val: string) => {
    setPrice(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0) {
      if (originalPrice && parseFloat(originalPrice) > p) {
        const op = parseFloat(originalPrice);
        if (discountType === "percent") {
          setDiscount(Math.round(((op - p) / op) * 100).toString());
        } else {
          setDiscount(Math.round(op - p).toString());
        }
      } else if (discount && parseFloat(discount) > 0) {
        const d = parseFloat(discount);
        if (discountType === "percent" && d < 100) {
          setOriginalPrice(Math.round(p / (1 - d / 100)).toString());
        } else if (discountType === "amount") {
          setOriginalPrice(Math.round(p + d).toString());
        }
      }
    }
  };

  const handleOriginalPriceChange = (val: string) => {
    setOriginalPrice(val);
    const op = parseFloat(val);
    const p = parseFloat(price);
    if (!isNaN(op) && !isNaN(p) && op > p && p > 0) {
      if (discountType === "percent") {
        setDiscount(Math.round(((op - p) / op) * 100).toString());
      } else {
        setDiscount(Math.round(op - p).toString());
      }
    } else if (!val || isNaN(op)) {
      setDiscount("");
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscount(val);
    const d = parseFloat(val);
    const p = parseFloat(price);
    if (!isNaN(d) && !isNaN(p) && d > 0 && p > 0) {
      if (discountType === "percent" && d < 100) {
        setOriginalPrice(Math.round(p / (1 - d / 100)).toString());
      } else if (discountType === "amount") {
        setOriginalPrice(Math.round(p + d).toString());
      }
    } else if (!val || isNaN(d) || d === 0) {
      setOriginalPrice("");
    }
  };

  const handleDiscountTypeChange = (type: "percent" | "amount") => {
    setDiscountType(type);
    setDiscount("");
    if (price) {
      setOriginalPrice(price);
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
  const [paymentPolicy, setPaymentPolicy] = useState<string[]>([]);
  const [cancellationPolicy, setCancellationPolicy] = useState<string[]>([]);
  const [flightCancellationPolicy, setFlightCancellationPolicy] = useState<string[]>([]);

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { day: 1, title: "", description: "", activities: [], meals: [], accommodation: "", images: [] },
  ]);

  // Stays
  const [stays, setStays] = useState<Stay[]>([]);

  // Transfers
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  // Transfer mode: day-wise blocks OR overall summary
  const [transferMode, setTransferMode] = useState<'daywise' | 'summary'>('daywise');
  const [transferSummary, setTransferSummary] = useState('');

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

  function moveItineraryDay(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === itinerary.length - 1) return;
    const newItinerary = [...itinerary];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newItinerary[index], newItinerary[swapIndex]] = [newItinerary[swapIndex], newItinerary[index]];
    setItinerary(newItinerary.map((d, i) => ({ ...d, day: i + 1 })));
  }

  // Auto-generate itinerary and transfer day blocks to match durationDays when switching to Trip Details tab
  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    if (tabId === "tripdetails") {
      const days = parseInt(durationDays, 10);
      if (days > 0) {
        if (itinerary.length !== days) {
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
        if (transfers.length !== days) {
          if (days > transfers.length) {
            const extraTransfers = Array.from({ length: days - transfers.length }, (_, i) => ({
              _key: Date.now() + i, title: "", description: "", transferType: "Shared Transfer", vehicleType: "", 
              from: "", to: "", stops: [], legs: [{ from: "", to: "", stops: [], transferType: "Shared Transfer", vehicleType: "" }], 
              day: transfers.length + i + 1, details: [], images: []
            }));
            setTransfers((prev) => [...prev, ...extraTransfers]);
          } else {
            setTransfers((prev) => transfers.slice(0, days).map((t, i) => ({ ...t, day: i + 1 })));
          }
        }
      }
    }
  }

  // Stays helpers
  function addStay() {
    setStays([...stays, { _key: Date.now(), name: "", rating: "", nights: 0, roomType: "", rooms: 0, amenities: [] }]);
  }
  function removeStay(index: number) {
    setStays(stays.filter((_, i) => i !== index));
  }
  function updateStay(index: number, field: string, value: unknown) {
    const updated = [...stays];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate checkOut date if checkIn or nights change
    if (field === 'checkIn' || field === 'nights') {
      const stay = updated[index];
      if (stay.checkIn && stay.nights && !isNaN(Number(stay.nights))) {
        const checkInDate = new Date(stay.checkIn);
        if (!isNaN(checkInDate.getTime())) {
          checkInDate.setDate(checkInDate.getDate() + Number(stay.nights));
          stay.checkOut = checkInDate.toISOString().split('T')[0];
        }
      }
    }
    
    setStays(updated);
  }
  function moveStay(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stays.length - 1) return;
    const newStays = [...stays];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newStays[index], newStays[swapIndex]] = [newStays[swapIndex], newStays[index]];
    setStays(newStays);
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
  function moveTransfer(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === transfers.length - 1) return;
    const newTransfers = [...transfers];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newTransfers[index], newTransfers[swapIndex]] = [newTransfers[swapIndex], newTransfers[index]];
    setTransfers(newTransfers);
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
        customDestinationText: (!destination && customDestinationText) ? customDestinationText.trim() : undefined,
        description,
        shortDescription,
        heroImage: heroImage || undefined,
        images,
        destinationImages,
        stayImages,
        activityImages,
        duration: { nights: Number(durationNights) || 0, days: Number(durationDays) || 0 },
        hotelRating: hotelRating || undefined,
        category: category === "custom" ? (customCategory || undefined) : (category || undefined),
        price: Number(price) || 0,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        discount: discount ? Number(discount) : undefined,
        discountType,
        badge: badge || undefined,
        isFeatured,
        isActive,
        isGroupTour,
        departures: isGroupTour ? departures.filter((d) => d.startDate && d.endDate).map((d) => ({
          startDate: d.startDate,
          endDate: d.endDate,
          totalSlots: Number(d.totalSlots) || 0,
          price: Number(d.price) || 0,
          status: d.status || "available",
        })) : undefined,
        flightsIncluded,
        travellerCount: travellerCount || undefined,
        adultCount: adultCount ? Number(adultCount) : undefined,
        childCount: childCount ? Number(childCount) : undefined,
        priceUnit,
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
        paymentPolicy,
        cancellationPolicy,
        flightCancellationPolicy,
        itinerary: itinerary.filter((d) => d.title).map((d) => ({
          day: d.day,
          title: d.title,
          description: d.description,
          activities: d.activities,
          meals: d.meals,
          accommodation: d.accommodation,
          images: d.images,
        })),
        stays: stays.filter((s) => s.name).map((s) => ({
          name: s.name,
          rating: s.rating,
          nights: Number(s.nights) || 0,
          roomType: s.roomType,
          rooms: Number(s.rooms) || 0,
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
        transferSummary: transferMode === 'summary' && transferSummary.trim() ? transferSummary.trim() : undefined,

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
    { id: "policies", label: "Policies" },
  ];

  return (
    <RoleGuard permission="packages.create">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/packages" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">New Package</h1>
              <p className="text-sm text-slate-500">Create a new travel package</p>
            </div>
          </div>
          <button type="button" onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition-colors">
            <Download size={16} /> Import from Existing
          </button>
        </div>

        <ImportModal open={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImportData} />

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
                <select value={destination} onChange={(e) => { setDestination(e.target.value); if(e.target.value) setCustomDestinationText(""); }} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3">
                  <option value="">No specific destination (Custom)</option>
                  {destinations.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
                </select>
                {!destination && (
                  <input type="text" value={customDestinationText} onChange={(e) => setCustomDestinationText(e.target.value)} placeholder="Type custom destination name (optional)..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Description</label>
                <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Brief tagline for cards" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Full Description</label>
                  <TextTemplateControls label="Description" category="description" text={description} onChange={setDescription} />
                </div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" placeholder="Detailed package description..." />
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
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-2">
                    <option value="">Select</option>
                    <option value="luxury">Luxury</option>
                    <option value="honeymoon">Honeymoon</option>
                    <option value="family">Family</option>
                    <option value="adventure">Adventure</option>
                    <option value="group">Group</option>
                    <option value="budget">Budget</option>
                    <option value="custom">Custom</option>
                  </select>
                  {category === "custom" && (
                    <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Type custom category..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹) *</label>
                  <input type="number" value={price} onChange={(e) => handlePriceChange(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="65000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit</label>
                  <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="person">Per Person</option>
                    <option value="group">Total Group</option>
                    <option value="couple">Per Couple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Original Price</label>
                  <input type="number" value={originalPrice} onChange={(e) => handleOriginalPriceChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="85000" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Discount</label>
                    <div className="flex bg-slate-100 rounded-md p-0.5">
                      <button type="button" onClick={() => handleDiscountTypeChange("percent")} className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-colors ${discountType === "percent" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>%</button>
                      <button type="button" onClick={() => handleDiscountTypeChange("amount")} className={`px-2 py-0.5 text-[10px] font-bold rounded-sm transition-colors ${discountType === "amount" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>₹</button>
                    </div>
                  </div>
                  <input type="number" value={discount} onChange={(e) => handleDiscountChange(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder={discountType === "percent" ? "20" : "5000"} />
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
                  <input type="checkbox" checked={isGroupTour} onChange={(e) => setIsGroupTour(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-sm text-slate-700">Group Tour</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={flightsIncluded} onChange={(e) => setFlightsIncluded(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-sm text-slate-700">Flights Included</span>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Overall Traveller Count</label>
                  <input type="text" value={travellerCount} onChange={(e) => setTravellerCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 2-15 people" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Adults</label>
                  <input type="number" value={adultCount} onChange={(e) => setAdultCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Children</label>
                  <input type="number" value={childCount} onChange={(e) => setChildCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 1" />
                </div>
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

              {isGroupTour && (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Group Tour Departures</p>
                      <p className="text-xs text-slate-400">Manage available slots and dates for this group tour.</p>
                    </div>
                    <button type="button" onClick={() => setDepartures([...departures, { startDate: "", endDate: "", totalSlots: 0, status: "available", price: 0 }])} className="text-xs bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-cyan-200">
                      + Add Departure
                    </button>
                  </div>
                  <div className="space-y-3">
                    {departures.map((dep, i) => (
                      <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Start Date</label>
                            <input type="date" value={dep.startDate} onChange={(e) => {
                              const arr = [...departures];
                              arr[i].startDate = e.target.value;
                              if (e.target.value && durationDays) arr[i].endDate = computeEndDate(e.target.value, durationDays);
                              setDepartures(arr);
                            }} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">End Date</label>
                            <input type="date" value={dep.endDate} onChange={(e) => {
                              const arr = [...departures]; arr[i].endDate = e.target.value; setDepartures(arr);
                            }} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Total Slots</label>
                            <input type="number" value={dep.totalSlots || ""} onChange={(e) => {
                              const arr = [...departures]; arr[i].totalSlots = Number(e.target.value); setDepartures(arr);
                            }} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="e.g. 20" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Price</label>
                            <input type="number" value={dep.price || ""} onChange={(e) => {
                              const arr = [...departures]; arr[i].price = Number(e.target.value); setDepartures(arr);
                            }} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" placeholder="e.g. 5000" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Status</label>
                            <select value={dep.status || "available"} onChange={(e) => {
                              const arr = [...departures]; arr[i].status = e.target.value; setDepartures(arr);
                            }} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm">
                              <option value="available">Available</option>
                              <option value="sold-out">Sold Out</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between h-full pt-1 gap-2">
                          <button type="button" onClick={() => setDepartures(departures.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {departures.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No departures added.</p>}
                  </div>
                </div>
              )}
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
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-cyan-700">Day {day.day}</span>
                            <button type="button" onClick={() => { setLoadTemplateDayIndex(i); setShowDayTemplateModal(true); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors border border-indigo-100 flex items-center gap-1"><Download size={12}/> Load Template</button>
                            <button type="button" onClick={() => { setSaveTemplateDayData(day); setShowSaveTemplateModal(true); }} className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded-md transition-colors border border-teal-100 flex items-center gap-1"><Save size={12}/> Save Template</button>
                          </div>
                          <div className="flex items-center gap-1">
                            {i > 0 && <button type="button" onClick={() => moveItineraryDay(i, 'up')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowUp size={14} /></button>}
                            {i < itinerary.length - 1 && <button type="button" onClick={() => moveItineraryDay(i, 'down')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowDown size={14} /></button>}
                            {itinerary.length > 1 && (
                              <button type="button" onClick={() => removeItineraryDay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                            )}
                          </div>
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
                          <div className="flex items-center gap-1">
                            {i > 0 && <button type="button" onClick={() => moveStay(i, 'up')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowUp size={14} /></button>}
                            {i < stays.length - 1 && <button type="button" onClick={() => moveStay(i, 'down')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowDown size={14} /></button>}
                            <button type="button" onClick={() => removeStay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <input type="text" value={stay.name} onChange={(e) => updateStay(i, "name", e.target.value)} placeholder="Hotel/Resort name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        <div className="grid grid-cols-4 gap-3">
                          <input type="text" value={stay.rating} onChange={(e) => updateStay(i, "rating", e.target.value)} placeholder="Rating (e.g. 5-Star)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          <input type="number" value={stay.nights || ""} onChange={(e) => updateStay(i, "nights", Number(e.target.value) || 0)} placeholder="Nights" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          <input type="text" value={stay.roomType} onChange={(e) => updateStay(i, "roomType", e.target.value)} placeholder="Room type" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          <input type="number" value={stay.rooms || ""} onChange={(e) => updateStay(i, "rooms", Number(e.target.value) || 0)} placeholder="Rooms" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
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
                  {/* Mode toggle */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-1">
                    <button
                      type="button"
                      onClick={() => setTransferMode('daywise')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        transferMode === 'daywise' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Day-wise Transfers
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferMode('summary')}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        transferMode === 'summary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Overall Summary
                    </button>
                  </div>

                  {/* Day-wise mode */}
                  {transferMode === 'daywise' && (
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
                          <div className="flex items-center gap-1">
                            {i > 0 && <button type="button" onClick={() => moveTransfer(i, 'up')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowUp size={14} /></button>}
                            {i < transfers.length - 1 && <button type="button" onClick={() => moveTransfer(i, 'down')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowDown size={14} /></button>}
                            <button type="button" onClick={() => removeTransfer(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {/* Title + Day row with auto-fetch */}
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Title</label>
                            <input type="text" value={transfer.title} onChange={(e) => updateTransfer(i, "title", e.target.value)} placeholder="Transfer title (e.g. Day 2 — Sightseeing & Intercity)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                          </div>
                          <div className="flex-shrink-0">
                            <label className="text-xs font-medium text-slate-500 mb-1 block">Day</label>
                            <div className="flex items-center gap-1">
                              <input type="number" value={transfer.day || ""} onChange={(e) => updateTransfer(i, "day", Number(e.target.value) || 0)} placeholder="1" className="w-20 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                              {(() => {
                                const matched = itinerary.find((d) => d.day === transfer.day && transfer.day > 0);
                                return (
                                  <button
                                    type="button"
                                    title={matched ? `Fetch: "${matched.title}"` : "Enter a day number to auto-fetch its itinerary title"}
                                    disabled={!matched || !matched.title}
                                    onClick={() => matched && matched.title && updateTransfer(i, "title", matched.title)}
                                    className={`flex items-center gap-1 px-2.5 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                                      matched && matched.title
                                        ? "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 hover:border-violet-400 cursor-pointer"
                                        : "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                    }`}
                                  >
                                    <Wand2 size={13} />
                                  </button>
                                );
                              })()}
                            </div>
                            {(() => {
                              const matched = itinerary.find((d) => d.day === transfer.day && transfer.day > 0);
                              return matched && matched.title ? (
                                <p className="text-[10px] text-violet-500 mt-1 truncate max-w-[160px]" title={matched.title}>↑ "{matched.title}"</p>
                              ) : transfer.day > 0 ? (
                                <p className="text-[10px] text-slate-400 mt-1">No Day {transfer.day} itinerary found</p>
                              ) : null;
                            })()}
                          </div>
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
                                  <option value="No Transfer Required">No Transfer Required</option>
                                  <option value="Self Drive">Self Drive</option>
                                  <option value="Flight">Flight</option>
                                  <option value="Train">Train</option>
                                  <option value="Ferry">Ferry</option>
                                  <option value="Walk">Walk</option>
                                </select>
                                <div className="flex-1 flex gap-1">
                                  <input list="vehicle-types" type="text" value={leg.vehicleType} onChange={(e) => { const updated = [...transfers]; const legs = [...updated[i].legs]; legs[li] = { ...legs[li], vehicleType: e.target.value }; updated[i] = { ...updated[i], legs }; setTransfers(updated); }} placeholder="Vehicle (e.g. SUV)" className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                                  <datalist id="vehicle-types">
                                    <option value="Sedan" />
                                    <option value="SUV" />
                                    <option value="Innova" />
                                    <option value="Innova Crysta" />
                                    <option value="Tempo Traveller" />
                                    <option value="Mini Bus" />
                                  </datalist>
                                  <button type="button" onClick={() => {
                                    const v = leg.vehicleType;
                                    if (!v) return;
                                    setTransfers(transfers.map(t => ({ ...t, legs: t.legs.map(l => ({ ...l, vehicleType: v })) })));
                                  }} title="Apply to all transfers" className="px-2 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 rounded flex items-center justify-center text-[10px] font-semibold border border-cyan-100 transition-colors whitespace-nowrap">
                                    Apply All
                                  </button>
                                </div>
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
                                  {(() => {
                                    const matched = itinerary.find((d) => d.day === transfer.day && transfer.day > 0);
                                    if (matched && matched.activities && matched.activities.length > 0) {
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = [...transfers];
                                            const legs = [...updated[i].legs];
                                            const newStops = matched.activities.filter(a => !legs[li].stops.includes(a));
                                            if (newStops.length === 0) return;
                                            legs[li] = { ...legs[li], stops: [...legs[li].stops, ...newStops] };
                                            updated[i] = { ...updated[i], legs };
                                            setTransfers(updated);
                                          }}
                                          className="ml-1 px-2 py-1 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded text-[11px] font-medium hover:bg-cyan-100 transition-colors whitespace-nowrap"
                                          title="Fetch itinerary activities as route stops"
                                        >
                                          + Fetch Activities
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
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

                  {/* Overall Summary mode */}
                  {transferMode === 'summary' && (
                    <div className="space-y-3">
                      <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs font-semibold text-amber-800">Overall Summary Mode</p>
                        <p className="text-xs text-amber-700 mt-0.5">Write a general description of travel arrangements. This is shown on the package page only when no day-wise transfers are added.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Transfer Summary</label>
                        <textarea
                          value={transferSummary}
                          onChange={(e) => setTransferSummary(e.target.value)}
                          rows={6}
                          placeholder={`e.g. All transfers throughout the trip are by private air-conditioned vehicle. Airport pickup and drop are included on Day 1 and Day 6. Intercity travel between Manali and Shimla is by comfortable Tempo Traveller. All vehicles are well-maintained and drivers are experienced.`}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none leading-relaxed"
                        />
                        <p className="text-xs text-slate-400 mt-1.5">
                          {transferSummary.trim().length > 0
                            ? `${transferSummary.trim().length} characters`
                            : 'Describe the general travel/transport arrangements for the entire trip.'}
                        </p>
                      </div>
                    </div>
                  )}
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
              <ListInput label="Things to Carry" items={thingsToCarry} onChange={setThingsToCarry} placeholder="e.g. Comfortable walking shoes" />
            </div>
          )}

          {/* === POLICIES === */}
          {activeTab === "policies" && (
            <div className="space-y-8 bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">Booking & Cancellation Policies</h3>
              
              <div className="space-y-4">
                <TemplateControls label="Payment Policy" category="paymentPolicy" items={paymentPolicy} onChange={setPaymentPolicy} />
                <ListInput label="Payment Policy" items={paymentPolicy} onChange={setPaymentPolicy} placeholder="e.g. 50% advance to confirm booking" />
              </div>

              <div className="space-y-4">
                <TemplateControls label="Cancellation Policy" category="cancellationPolicy" items={cancellationPolicy} onChange={setCancellationPolicy} />
                <ListInput label="Cancellation Policy" items={cancellationPolicy} onChange={setCancellationPolicy} placeholder="e.g. Free cancellation up to 30 days before departure" />
              </div>

              <div className="space-y-4">
                <TemplateControls label="Trains / Flight Cancellation Policy" category="flightCancellationPolicy" items={flightCancellationPolicy} onChange={setFlightCancellationPolicy} />
                <ListInput label="Trains / Flight Cancellation Policy" items={flightCancellationPolicy} onChange={setFlightCancellationPolicy} placeholder="e.g. Non-refundable after ticketing" />
              </div>
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

      <DayTemplateModal
        open={showDayTemplateModal}
        onClose={() => { setShowDayTemplateModal(false); setLoadTemplateDayIndex(null); }}
        onSelect={(template) => {
          if (loadTemplateDayIndex !== null) {
            updateItinerary(loadTemplateDayIndex, "title", template.title || "");
            updateItinerary(loadTemplateDayIndex, "description", template.description || "");
            updateItinerary(loadTemplateDayIndex, "activities", template.activities || []);
            updateItinerary(loadTemplateDayIndex, "meals", template.meals || []);
            updateItinerary(loadTemplateDayIndex, "accommodation", template.accommodation || "");
            updateItinerary(loadTemplateDayIndex, "images", template.images || []);
          }
          setShowDayTemplateModal(false);
          setLoadTemplateDayIndex(null);
        }}
      />
      {saveTemplateDayData && (
        <SaveDayTemplateModal
          open={showSaveTemplateModal}
          onClose={() => { setShowSaveTemplateModal(false); setSaveTemplateDayData(null); }}
          dayData={saveTemplateDayData}
        />
      )}
    </RoleGuard>
  );
}
