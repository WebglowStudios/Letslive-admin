"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Download, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import ListInput from "@/components/ui/ListInput";
import DayActivitiesInput, { DayActivityItem } from "@/components/ui/DayActivitiesInput";
import ImageUpload, { MultiImageUpload } from "@/components/ui/ImageUpload";
import MealPicker from "@/components/ui/MealPicker";
import TextTemplateControls from "@/components/ui/TextTemplateControls";
import TemplateControls from "@/components/ui/TemplateControls";
import PhoneInput from "@/components/ui/PhoneInput";
import { DayTemplateModal } from "@/components/ui/DayTemplateModal";
import { SaveDayTemplateModal } from "@/components/ui/SaveDayTemplateModal";
import { useRecentEdits } from "@/hooks/useRecentEdits";

interface ItineraryDay {
  day: number; title: string; description: string;
  activities: (string | DayActivityItem)[]; meals: string[]; accommodation: string; images: string[];
}
interface Stay {
  _key: number; name: string; rating: string; nights: number; roomType: string; rooms?: number;
  checkIn: string; checkOut: string; address: string; confirmationNo: string; amenities: string[];
  remark?: string; showRemarkToCustomer?: boolean;
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
  const { addEditItem } = useRecentEdits("itineraries");

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

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
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isGroupTour, setIsGroupTour] = useState(false);
  const [departures, setDepartures] = useState<{ _id?: string; startDate: string; endDate: string; totalSlots: number; bookedSlots?: number; status?: string; priceCategory?: string; price: number }[]>([]);
  const [flightsIncluded, setFlightsIncluded] = useState(false);
  const [travellerCount, setTravellerCount] = useState("");
  const [adultCount, setAdultCount] = useState("");
  const [childCount, setChildCount] = useState("");
  const [priceUnit, setPriceUnit] = useState("person");
  const [extraPersonPrice, setExtraPersonPrice] = useState("");
  const [showOnDestination, setShowOnDestination] = useState(false);
  const [isInternational, setIsInternational] = useState(false);
  const [visaIncluded, setVisaIncluded] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showDayTemplateModal, setShowDayTemplateModal] = useState(false);
  const [loadTemplateDayIndex, setLoadTemplateDayIndex] = useState<number | null>(null);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateDayData, setSaveTemplateDayData] = useState<any>(null);

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

  // Trip details
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [flights, setFlights] = useState<{ _key: number; day: number; airline: string; flightNumber: string; from: string; to: string; departure: string; arrival: string; pnr: string; class: string; notes: string }[]>([]);

  useEffect(() => {
    api.get("/destinations?limit=100&admin=true").then((res) => setDestinations(res?.data || [])).catch(() => {});
    fetchItinerary();
  }, [id]);

  useEffect(() => {
    if (name && id) {
      addEditItem(id, name);
    }
  }, [name, id, addEditItem]);

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
      setCustomDestinationText(p.customDestinationText || "");
      setDescription(p.description || "");
      setShortDescription(p.shortDescription || "");
      setDurationNights(p.duration?.nights ? String(p.duration.nights) : "");
      setDurationDays(p.duration?.days ? String(p.duration.days) : "");
      setHotelRating(p.hotelRating || "");

      const predefinedCategories = ["luxury", "honeymoon", "family", "adventure", "group", "budget"];
      if (p.category && predefinedCategories.includes(p.category)) {
        setCategory(p.category);
        setCustomCategory("");
      } else if (p.category) {
        setCategory("custom");
        setCustomCategory(p.category);
      } else {
        setCategory("");
        setCustomCategory("");
      }

      setPrice(p.price ? String(p.price) : "");
      setPriceUnit(p.priceUnit || "person");
      setExtraPersonPrice(p.extraPersonPrice ? String(p.extraPersonPrice) : "");
      setOriginalPrice(p.originalPrice ? String(p.originalPrice) : "");
      setDiscount(p.discount ? String(p.discount) : "");
      setDiscountType(p.discountType || "percent");
      setIsFeatured(p.isFeatured || false);
      setIsActive(p.isActive ?? true);
      setIsGroupTour(p.isGroupTour || false);
      setIsInternational(p.isInternational || false);
      setVisaIncluded(p.visaIncluded || false);
      setFlightsIncluded(p.flightsIncluded || false);
      if (p.departures) setDepartures(p.departures.map((d: any) => ({ ...d, startDate: d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '', endDate: d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '' })));
      setTravellerCount(p.travellerCount || "");
      setAdultCount(p.adultCount != null ? String(p.adultCount) : "");
      setChildCount(p.childCount != null ? String(p.childCount) : "");
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
      setPaymentPolicy(p.paymentPolicy || []);
      setCancellationPolicy(p.cancellationPolicy || []);
      setFlightCancellationPolicy(p.flightCancellationPolicy || []);
      setItinerary(
        p.itinerary?.length > 0
          ? p.itinerary.map((d: any, i: number) => ({
              day: d.day || i + 1,
              title: d.title || "",
              description: d.description || "",
              activities: (d.activities || []).map((a: any) =>
                typeof a === "string" ? { title: a, description: "", image: "", images: [] } : { title: a.title || "", description: a.description || "", image: a.image || (a.images?.[0] || ""), images: a.images || (a.image ? [a.image] : []) }
              ),
              meals: d.meals || [],
              accommodation: d.accommodation || "",
              images: d.images || [],
            }))
          : [{ day: 1, title: "", description: "", activities: [], meals: [], accommodation: "", images: [] }]
      );
      setStays(
        p.stays?.length > 0
          ? p.stays.map((s: any, i: number) => ({ _key: Date.now() + i + 1000, name: s.name || "", rating: s.rating || "", nights: s.nights || 0, roomType: s.roomType || "", rooms: s.rooms || 0, checkIn: s.checkIn || "", checkOut: s.checkOut || "", address: s.address || "", confirmationNo: s.confirmationNo || "", amenities: s.amenities || [], remark: s.remark || s.remarks || "", showRemarkToCustomer: s.showRemarkToCustomer ?? false }))
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
  function updateItinerary(index: number, field: string, value: unknown) { setItinerary(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; }); }
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
            const extraDays = itinerary.slice(days);
            const hasContent = extraDays.some(d => d.title || d.description || (d.images && d.images.length > 0) || (d.activities && d.activities.length > 0));
            if (hasContent) {
              if (!confirm(`Reducing from ${itinerary.length} to ${days} days will remove ${itinerary.length - days} day(s) that contain content (including images). Continue?`)) return;
            }
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
            const extraTransfers = transfers.slice(days);
            const hasTransferContent = extraTransfers.some(t => t.title || t.description || (t.images && t.images.length > 0));
            if (hasTransferContent) {
              if (!confirm(`Reducing transfers from ${transfers.length} to ${days} will remove transfer(s) that contain content. Continue?`)) return;
            }
            setTransfers((prev) => prev.slice(0, days).map((t, i) => ({ ...t, day: i + 1 })));
          }
        }
      }
    }
  }


  function addStay() { setStays([...stays, { _key: Date.now(), name: "", rating: "", nights: 0, roomType: "", rooms: 0, checkIn: "", checkOut: "", address: "", confirmationNo: "", amenities: [], remark: "", showRemarkToCustomer: false }]); }
  function removeStay(i: number) { setStays(stays.filter((_, idx) => idx !== i)); }
  function updateStay(i: number, field: string, value: unknown) { 
    const u = [...stays]; 
    u[i] = { ...u[i], [field]: value }; 
    
    // Auto-calculate checkOut date if checkIn or nights change
    if (field === 'checkIn' || field === 'nights') {
      const stay = u[i];
      if (stay.checkIn && stay.nights && !isNaN(Number(stay.nights))) {
        const checkInDate = new Date(stay.checkIn);
        if (!isNaN(checkInDate.getTime())) {
          checkInDate.setDate(checkInDate.getDate() + Number(stay.nights));
          stay.checkOut = checkInDate.toISOString().split('T')[0];
        }
      }
    }
    
    setStays(u); 
  }
  function moveStay(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stays.length - 1) return;
    const newStays = [...stays];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newStays[index], newStays[swapIndex]] = [newStays[swapIndex], newStays[index]];
    setStays(newStays);
  }

  function addTransfer() { setTransfers([...transfers, { _key: Date.now(), title: "", description: "", transferType: "Shared Transfer", vehicleType: "", from: "", to: "", stops: [], legs: [{ from: "", to: "", stops: [], transferType: "Shared Transfer", vehicleType: "" }], day: 0, details: [], images: [] }]); }
  function removeTransfer(i: number) { setTransfers(transfers.filter((_, idx) => idx !== i)); }
  function updateTransfer(i: number, field: string, value: unknown) { const u = [...transfers]; u[i] = { ...u[i], [field]: value }; setTransfers(u); }
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
    setLoading(true); setError(""); setSuccess("");
    try {
      const payload = {
        name,
        clientName: clientName?.trim() || undefined,
        clientEmail: clientEmail?.trim() || undefined,
        clientPhone: clientPhone?.trim() || undefined,
        destination: destination || undefined, customDestinationText: (!destination && customDestinationText) ? customDestinationText.trim() : undefined, description, shortDescription,
        heroImage: heroImage || undefined, images, destinationImages, stayImages, activityImages,
        isInternational,
        visaIncluded,
        duration: { nights: Number(durationNights) || 0, days: Number(durationDays) || 0 },
        travelDates: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined,
        hotelRating: hotelRating || undefined,
        category: category === "custom" ? (customCategory || undefined) : (category || undefined),
        price: Number(price) || 0,
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        discount: discount ? Number(discount) : undefined,
        discountType,
        isFeatured, isActive, isGroupTour, flightsIncluded,
        travellerCount: travellerCount || undefined,
        adultCount: adultCount ? Number(adultCount) : undefined,
        childCount: childCount ? Number(childCount) : undefined,
        priceUnit,
        extraPersonPrice: extraPersonPrice ? Number(extraPersonPrice) : 0,
        showOnDestination,
        keyPoints, highlights, inclusions, exclusions, knowBeforeYouGo, thingsToCarry,
        paymentPolicy, cancellationPolicy, flightCancellationPolicy,
        paymentConfig: { mode: paymentMode, depositType, depositValue: Number(depositValue) || 30, depositLabel: depositLabel.trim() || undefined, balanceDueDays: Number(balanceDueDays) || 30 },
        itinerary: itinerary.filter((d) => d.title || d.description || (d.images && d.images.length > 0) || (d.activities && d.activities.length > 0)).map((d) => ({
          day: d.day,
          title: d.title,
          description: d.description,
          activities: (d.activities || []).map((a: any) => {
            if (typeof a === "string") return a;
            return {
              title: a.title || "",
              description: a.description || undefined,
              image: a.image || (a.images && a.images[0]) || "",
              images: a.images && a.images.length > 0 ? a.images : (a.image ? [a.image] : []),
            };
          }),
          meals: d.meals,
          accommodation: d.accommodation,
          images: d.images,
        })),
        stays: stays.filter((s) => s.name).map((s) => ({ name: s.name, rating: s.rating, nights: Number(s.nights) || 0, roomType: s.roomType, rooms: Number(s.rooms) || 0, checkIn: s.checkIn || undefined, checkOut: s.checkOut || undefined, address: s.address || undefined, confirmationNo: s.confirmationNo || undefined, amenities: s.amenities, remark: s.remark?.trim() || undefined, showRemarkToCustomer: !!s.showRemarkToCustomer })),
        transfers: transfers.filter((t) => t.title || t.legs.some(l => l.from || l.to)).map((t) => ({ title: t.title, description: t.description, transferType: t.legs[0]?.transferType || t.transferType || undefined, vehicleType: t.legs[0]?.vehicleType || t.vehicleType || undefined, from: t.legs[0]?.from || t.from || undefined, to: t.legs[t.legs.length - 1]?.to || t.to || undefined, stops: t.stops, legs: t.legs.filter(l => l.from || l.to).map(l => ({ from: l.from, to: l.to, stops: l.stops.length > 0 ? l.stops : undefined, transferType: l.transferType || undefined, vehicleType: l.vehicleType || undefined })), day: t.day || undefined, details: t.details, images: t.images })),
        flights: flights.filter((f) => f.airline || f.from || f.to).map((f) => ({ day: f.day || undefined, airline: f.airline, flightNumber: f.flightNumber, from: f.from, to: f.to, departure: f.departure, arrival: f.arrival, pnr: f.pnr || undefined, class: f.class || undefined, notes: f.notes || undefined })),
        departures: isGroupTour ? departures.filter((d) => d.startDate && d.endDate).map((d) => ({
          _id: d._id || undefined, startDate: d.startDate, endDate: d.endDate, totalSlots: Number(d.totalSlots) || 0, bookedSlots: d.bookedSlots || 0, status: d.status || 'available', price: Number(d.price) || 0,
        })) : undefined,
      };
      const res = await api.put(`/packages/${id}`, payload);
      if (res?.status === "success") {
        setSuccess("Itinerary updated successfully!");
        setTimeout(() => router.back(), 1500);
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
    { id: "policies", label: "Policies" },
  ];

  if (fetching) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><ArrowLeft size={20} /></button>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Client Email <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="client@email.com (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Client Phone <span className="text-xs font-normal text-slate-400">(optional)</span>
                </label>
                <PhoneInput value={clientPhone} onChange={setClientPhone} />
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
              <select value={destination} onChange={(e) => { setDestination(e.target.value); if(e.target.value) setCustomDestinationText(""); }} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3">
                <option value="">No specific destination (Custom)</option>
                {destinations.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
              </select>
              {!destination && (
                <input type="text" value={customDestinationText} onChange={(e) => setCustomDestinationText(e.target.value)} placeholder="Type custom destination name (optional)..." className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              )}
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Price (₹) {isGroupTour ? "" : "*"}
                </label>
                <input type="number" value={isGroupTour ? "" : price} onChange={(e) => handlePriceChange(e.target.value)} required={!isGroupTour} disabled={isGroupTour} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" placeholder={isGroupTour ? "Locked (Uses Slot Price)" : "65000"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit</label>
                <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="person">Per Person</option>
                  <option value="group">Total Group</option>
                  <option value="couple">Per Couple</option>
                </select>
                {priceUnit === "group" && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Extra Pax Price (₹)</label>
                    <input type="number" value={extraPersonPrice} onChange={(e) => setExtraPersonPrice(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 15000" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Original Price</label>
                <input type="number" value={isGroupTour ? "" : originalPrice} onChange={(e) => handleOriginalPriceChange(e.target.value)} disabled={isGroupTour} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" placeholder={isGroupTour ? "Locked" : "85000"} />
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
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Overall Traveller Count</label><input type="text" value={travellerCount} onChange={(e) => setTravellerCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 2 Adults" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Adults</label><input type="number" value={adultCount} onChange={(e) => setAdultCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 2" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Children</label><input type="number" value={childCount} onChange={(e) => setChildCount(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. 1" /></div>
            </div>
            <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /><span className="text-sm text-slate-700">Featured on homepage</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /><span className="text-sm text-slate-700">Active</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isGroupTour} onChange={(e) => setIsGroupTour(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /><span className="text-sm text-slate-700">Group Tour</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={flightsIncluded} onChange={(e) => setFlightsIncluded(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" /><span className="text-sm text-slate-700">Flights Included</span></label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isInternational} onChange={(e) => {
                  setIsInternational(e.target.checked);
                  if (!e.target.checked) setVisaIncluded(false);
                }} className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                <span className="text-sm text-slate-700">International Itinerary (Requires Passport & PAN)</span>
              </label>
            </div>
            {isInternational && (
              <label className="flex items-center gap-2 cursor-pointer bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                <input type="checkbox" checked={visaIncluded} onChange={(e) => setVisaIncluded(e.target.checked)} className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" />
                <div>
                  <span className="text-sm font-semibold text-amber-900 block">Visa Included</span>
                  <span className="text-xs text-amber-700">Is the Visa cost included in this itinerary?</span>
                </div>
              </label>
            )}
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

            {isGroupTour && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4 mt-4">
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-cyan-700">Day {day.day}</span>
                          <button type="button" onClick={() => { setLoadTemplateDayIndex(i); setShowDayTemplateModal(true); }} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors border border-indigo-100 flex items-center gap-1"><Download size={12}/> Load Template</button>
                          <button type="button" onClick={() => { setSaveTemplateDayData(day); setShowSaveTemplateModal(true); }} className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded-md transition-colors border border-teal-100 flex items-center gap-1"><Save size={12}/> Save Template</button>
                        </div>
                        <div className="flex items-center gap-1">
                          {i > 0 && <button type="button" onClick={() => moveItineraryDay(i, 'up')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowUp size={14} /></button>}
                          {i < itinerary.length - 1 && <button type="button" onClick={() => moveItineraryDay(i, 'down')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowDown size={14} /></button>}
                          {itinerary.length > 1 && <button type="button" onClick={() => removeItineraryDay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                      <input type="text" value={day.title} onChange={(e) => updateItinerary(i, "title", e.target.value)} placeholder="Day title" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <textarea value={day.description} onChange={(e) => updateItinerary(i, "description", e.target.value)} placeholder="What happens this day..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                      <div><label className="text-xs font-medium text-slate-500 mb-1 block">Activities & Photos</label><DayActivitiesInput activities={day.activities} onChange={(items) => updateItinerary(i, "activities", items)} placeholder="Add activity" /></div>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Check-in</label><input type="date" value={stay.checkIn} onChange={(e) => updateStay(i, "checkIn", e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                        <div><label className="text-xs font-medium text-slate-500 mb-1 block">Check-out</label><input type="date" value={stay.checkOut} onChange={(e) => updateStay(i, "checkOut", e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" /></div>
                      </div>
                      <input type="text" value={stay.address} onChange={(e) => updateStay(i, "address", e.target.value)} placeholder="Hotel address" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <input type="text" value={stay.confirmationNo} onChange={(e) => updateStay(i, "confirmationNo", e.target.value)} placeholder="Confirmation number" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <textarea
                          value={stay.remark || ""}
                          onChange={(e) => updateStay(i, "remark", e.target.value)}
                          placeholder="Stay remark / notes (e.g. Complimentary breakfast included, base category room, mountain view...)"
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        />
                        <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!stay.showRemarkToCustomer}
                              onChange={(e) => updateStay(i, "showRemarkToCustomer", e.target.checked)}
                              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700">
                              Show remark to customer
                            </span>
                          </label>
                          <span className={`text-[11px] font-medium flex items-center gap-1 ${stay.showRemarkToCustomer ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            {stay.showRemarkToCustomer ? (
                              <><Eye size={12} /> Visible on customer itinerary & PDF</>
                            ) : (
                              <><EyeOff size={12} /> Internal only (hidden from client)</>
                            )}
                          </span>
                        </div>
                      </div>
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-cyan-700">Transfer {i + 1}</span>
                        <div className="flex items-center gap-1">
                          {i > 0 && <button type="button" onClick={() => moveTransfer(i, 'up')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowUp size={14} /></button>}
                          {i < transfers.length - 1 && <button type="button" onClick={() => moveTransfer(i, 'down')} className="p-1 text-slate-400 hover:text-cyan-600"><ArrowDown size={14} /></button>}
                          <button type="button" onClick={() => removeTransfer(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </div>
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
                                <option value="Shared Transfer">Shared</option><option value="Private Transfer">Private</option><option value="No Transfer Required">No Transfer Required</option><option value="Self Drive">Self Drive</option><option value="Flight">Flight</option><option value="Train">Train</option><option value="Ferry">Ferry</option><option value="Walk">Walk</option>
                              </select>
                              <div className="flex-1 flex gap-1">
                                <input list="vehicle-types" type="text" value={leg.vehicleType} onChange={(e) => { const u = [...transfers]; const legs = [...u[i].legs]; legs[li] = { ...legs[li], vehicleType: e.target.value }; u[i] = { ...u[i], legs }; setTransfers(u); }} placeholder="Vehicle (e.g. SUV)" className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500" />
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
                                  placeholder="+ stop (Enter)"
                                  className="w-28 px-2 py-1 border border-dashed border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-500"
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
                                          const actTitles = matched.activities
                                            .map(a => typeof a === 'string' ? a : a.title)
                                            .filter(Boolean);
                                          const newStops = actTitles.filter(a => !legs[li].stops.includes(a));
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
            <Save size={16} />{loading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
        </div>
      </form>
      <DayTemplateModal
        open={showDayTemplateModal}
        onClose={() => { setShowDayTemplateModal(false); setLoadTemplateDayIndex(null); }}
        onSelect={(template) => {
          if (loadTemplateDayIndex !== null) {
            // Apply all template fields atomically to prevent stale-closure overwrites
            setItinerary(prev => prev.map((d, i) =>
              i === loadTemplateDayIndex
                ? {
                    ...d,
                    title: template.title || "",
                    description: template.description || "",
                    activities: (template.activities || []).map((a: any) => {
                      if (typeof a === "string") {
                        return { title: a, description: "", image: "", images: [] };
                      }
                      const img = a.image || (a.images && a.images[0]) || "";
                      return {
                        title: a.title || a.name || "",
                        description: a.description || "",
                        image: img,
                        images: a.images && a.images.length > 0 ? a.images : (img ? [img] : []),
                      };
                    }),
                    meals: template.meals || [],
                    accommodation: template.accommodation || "",
                    images: template.images || [],
                  }
                : d
            ));
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
    </div>
  );
}
