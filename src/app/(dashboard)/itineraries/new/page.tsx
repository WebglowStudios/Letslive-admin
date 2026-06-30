"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { ArrowLeft, Save, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import ListInput from "@/components/ui/ListInput";
import ImageUpload from "@/components/ui/ImageUpload";

export default function NewCustomItineraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeTab, setActiveTab] = useState("client");

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Basic package info
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [durationNights, setDurationNights] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [hotelRating, setHotelRating] = useState("");
  const [price, setPrice] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [showOnDestination, setShowOnDestination] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Content
  const [highlights, setHighlights] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [knowBeforeYouGo, setKnowBeforeYouGo] = useState<string[]>([]);

  // Flights
  const [flights, setFlights] = useState<{ day: number; airline: string; flightNumber: string; from: string; to: string; departure: string; arrival: string; pnr: string; class: string; notes: string }[]>([]);

  // Stays
  const [stays, setStays] = useState<{ name: string; rating: string; nights: number; roomType: string; checkIn: string; checkOut: string; address: string; confirmationNo: string; amenities: string[] }[]>([]);

  // Itinerary
  const [itinerary, setItinerary] = useState<{ day: number; title: string; description: string; activities: string[]; meals: string[]; accommodation: string }[]>([
    { day: 1, title: "", description: "", activities: [], meals: [], accommodation: "" },
  ]);

  useEffect(() => {
    api.get("/destinations?limit=100").then((res) => setDestinations(res?.data || [])).catch(() => {});
    // Pre-fill from enquiry if provided
    if (enquiryId) {
      api.get(`/enquiries/${enquiryId}`).then((res) => {
        const e = res?.data;
        if (e) {
          setClientName(`${e.firstName || ""} ${e.lastName || ""}`.trim());
          setClientEmail(e.email || "");
          setClientPhone(e.phone || "");
          if (e.packageName) setName(`Custom: ${e.packageName}`);
          if (e.destination) setDescription(`Custom itinerary for ${e.destination}`);
        }
      }).catch(() => {});
    }
  }, [enquiryId]);

  function addDay() {
    setItinerary([...itinerary, { day: itinerary.length + 1, title: "", description: "", activities: [], meals: [], accommodation: "" }]);
  }
  function removeDay(i: number) {
    setItinerary(itinerary.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 })));
  }
  function updateDay(i: number, field: string, value: unknown) {
    const u = [...itinerary]; u[i] = { ...u[i], [field]: value }; setItinerary(u);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !name.trim()) { setError("Client name and itinerary name are required."); return; }
    setLoading(true); setError(""); setSuccess("");

    try {
      const payload = {
        name,
        isCustom: true,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        enquiryId: enquiryId || undefined,
        destination: destination || undefined,
        description,
        heroImage: heroImage || undefined,
        duration: { nights: Number(durationNights) || 0, days: Number(durationDays) || 0 },
        travelDates: (startDate || endDate) ? { startDate: startDate || undefined, endDate: endDate || undefined } : undefined,
        hotelRating: hotelRating || undefined,
        price: Number(price) || 0,
        highlights,
        inclusions,
        exclusions,
        knowBeforeYouGo,
        itinerary: itinerary.filter((d) => d.title).map((d) => ({
          day: d.day, title: d.title, description: d.description,
          activities: d.activities, meals: d.meals, accommodation: d.accommodation,
        })),
        flights: flights.filter((f) => f.airline || f.from || f.to).map((f) => ({
          day: f.day || undefined,
          airline: f.airline,
          flightNumber: f.flightNumber,
          from: f.from,
          to: f.to,
          departure: f.departure,
          arrival: f.arrival,
          pnr: f.pnr || undefined,
          class: f.class || undefined,
          notes: f.notes || undefined,
        })),
        stays: stays.filter((s) => s.name).map((s) => ({
          name: s.name,
          rating: s.rating,
          nights: Number(s.nights) || 0,
          roomType: s.roomType,
          checkIn: s.checkIn || undefined,
          checkOut: s.checkOut || undefined,
          address: s.address || undefined,
          confirmationNo: s.confirmationNo || undefined,
          amenities: s.amenities,
        })),
        isActive: true,
        showOnDestination,
      };

      const res = await api.post("/packages", payload);
      if (res?.status === "success" && res.data) {
        setCreatedId(res.data._id);
        setSuccess("Custom itinerary created! Share the link with your client.");
      } else {
        setError(res?.message || "Failed to create");
      }
    } catch { setError("Failed to create itinerary"); }
    finally { setLoading(false); }
  }

  const tabs = [
    { id: "client", label: "Client Info" },
    { id: "basic", label: "Trip Details" },
    { id: "itinerary", label: "Itinerary" },
    { id: "flights", label: "Flights & Stays" },
    { id: "content", label: "Inclusions" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/itineraries" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">New Custom Itinerary</h1>
          <p className="text-sm text-slate-500">Create a personalized trip plan for a client</p>
        </div>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      {success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <p className="font-semibold">{success}</p>
          {createdId && (
            <div className="mt-2 flex items-center gap-2">
              <input type="text" readOnly value={`https://letslivetours.com/itinerary/${createdId}`} className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs" />
              <button onClick={() => { navigator.clipboard.writeText(`https://letslivetours.com/itinerary/${createdId}`); }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1">
                <LinkIcon size={12} /> Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">

        {/* CLIENT INFO TAB */}
        {activeTab === "client" && (
          <>
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl mb-4">
              <p className="text-xs font-semibold text-cyan-800">This itinerary is private — it won&apos;t appear on the public website. Only accessible via the shareable link.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Name *</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Rajesh Sharma" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Email</label>
                <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="client@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Phone</label>
                <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="+91 98765 43210" />
              </div>
            </div>
            {enquiryId && <p className="text-xs text-slate-400">Linked to enquiry: {enquiryId}</p>}
          </>
        )}

        {/* TRIP DETAILS TAB */}
        {activeTab === "basic" && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Itinerary Title *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g. Custom Goa Beach Getaway for Mr. Sharma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Destination (optional)</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="">No specific destination</option>
                {destinations.map((d) => (<option key={d._id} value={d._id}>{d.name}</option>))}
              </select>
            </div>
            {/* Show on destination toggle — only relevant when a destination is selected */}
            <div className={`p-4 rounded-xl border transition-colors ${showOnDestination ? "bg-cyan-50 border-cyan-200" : "bg-slate-50 border-slate-200"}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={showOnDestination}
                    onChange={(e) => setShowOnDestination(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${showOnDestination ? "bg-cyan-600" : "bg-slate-300"}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showOnDestination ? "translate-x-5" : ""}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Show on destination page</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {showOnDestination
                      ? "This itinerary will appear publicly on the selected destination page."
                      : "Off by default — itinerary is private, accessible only via shareable link."}
                  </p>
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" placeholder="Brief overview of the custom trip..." />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nights</label>
                <input type="number" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Days</label>
                <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="6" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Price (₹)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="65000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Travel Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Travel End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hotel Rating</label>
                <input type="text" value={hotelRating} onChange={(e) => setHotelRating(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="5-Star" />
              </div>
              <div>
                <ImageUpload value={heroImage} onChange={setHeroImage} label="Hero Image" folder="itineraries" />
              </div>
            </div>
          </>
        )}

        {/* FLIGHTS & STAYS TAB */}
        {activeTab === "flights" && (
          <>
            {/* Flights */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Flights / Trains</p>
                <p className="text-xs text-slate-400">Add flight or train details for each travel day</p>
              </div>
              <button type="button" onClick={() => setFlights([...flights, { day: 0, airline: "", flightNumber: "", from: "", to: "", departure: "", arrival: "", pnr: "", class: "", notes: "" }])} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                <Plus size={14} /> Add Flight
              </button>
            </div>
            <div className="space-y-4">
              {flights.map((f, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-cyan-700">Flight {i + 1}</span>
                    <button type="button" onClick={() => setFlights(flights.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Day</label>
                      <input type="number" value={f.day || ""} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], day: Number(e.target.value) || 0 }; setFlights(u); }} placeholder="1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Airline / Operator</label>
                      <input type="text" value={f.airline} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], airline: e.target.value }; setFlights(u); }} placeholder="IndiGo" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Flight / Train No.</label>
                      <input type="text" value={f.flightNumber} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], flightNumber: e.target.value }; setFlights(u); }} placeholder="6E 2142" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">From</label>
                      <input type="text" value={f.from} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], from: e.target.value }; setFlights(u); }} placeholder="Delhi (DEL)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">To</label>
                      <input type="text" value={f.to} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], to: e.target.value }; setFlights(u); }} placeholder="Goa (GOI)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Departure</label>
                      <input type="text" value={f.departure} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], departure: e.target.value }; setFlights(u); }} placeholder="06:30 AM" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Arrival</label>
                      <input type="text" value={f.arrival} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], arrival: e.target.value }; setFlights(u); }} placeholder="09:15 AM" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Class</label>
                      <input type="text" value={f.class} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], class: e.target.value }; setFlights(u); }} placeholder="Economy" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">PNR (optional)</label>
                      <input type="text" value={f.pnr} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], pnr: e.target.value }; setFlights(u); }} placeholder="ABC123" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                  </div>
                  <input type="text" value={f.notes} onChange={(e) => { const u = [...flights]; u[i] = { ...u[i], notes: e.target.value }; setFlights(u); }} placeholder="Notes (e.g. 15kg baggage included)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              ))}
              {flights.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No flights added. Click &quot;Add Flight&quot; to get started.</p>}
            </div>

            {/* Stays */}
            <div className="flex items-center justify-between mt-8 mb-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Hotels / Stays</p>
                <p className="text-xs text-slate-400">Add hotel details with check-in/out dates</p>
              </div>
              <button type="button" onClick={() => setStays([...stays, { name: "", rating: "", nights: 0, roomType: "", checkIn: "", checkOut: "", address: "", confirmationNo: "", amenities: [] }])} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                <Plus size={14} /> Add Stay
              </button>
            </div>
            <div className="space-y-4">
              {stays.map((s, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-cyan-700">Stay {i + 1}</span>
                    <button type="button" onClick={() => setStays(stays.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                  <input type="text" value={s.name} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], name: e.target.value }; setStays(u); }} placeholder="Hotel name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" value={s.rating} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], rating: e.target.value }; setStays(u); }} placeholder="5-Star" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <input type="number" value={s.nights || ""} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], nights: Number(e.target.value) || 0 }; setStays(u); }} placeholder="Nights" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <input type="text" value={s.roomType} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], roomType: e.target.value }; setStays(u); }} placeholder="Room type" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Check-in</label>
                      <input type="date" value={s.checkIn} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], checkIn: e.target.value }; setStays(u); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Check-out</label>
                      <input type="date" value={s.checkOut} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], checkOut: e.target.value }; setStays(u); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                  </div>
                  <input type="text" value={s.address} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], address: e.target.value }; setStays(u); }} placeholder="Hotel address (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  <input type="text" value={s.confirmationNo} onChange={(e) => { const u = [...stays]; u[i] = { ...u[i], confirmationNo: e.target.value }; setStays(u); }} placeholder="Booking confirmation number (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              ))}
              {stays.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No stays added. Click &quot;Add Stay&quot; to get started.</p>}
            </div>
          </>
        )}

        {/* ITINERARY TAB */}
        {activeTab === "itinerary" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Day-by-day Plan</p>
              <button type="button" onClick={addDay} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100">
                <Plus size={14} /> Add Day
              </button>
            </div>
            <div className="space-y-4">
              {itinerary.map((day, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-cyan-700">Day {day.day}</span>
                    {itinerary.length > 1 && <button type="button" onClick={() => removeDay(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
                  </div>
                  <input type="text" value={day.title} onChange={(e) => updateDay(i, "title", e.target.value)} placeholder="Day title" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                  <textarea value={day.description} onChange={(e) => updateDay(i, "description", e.target.value)} placeholder="What happens this day..." rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <ListInput label="" items={day.activities} onChange={(items) => updateDay(i, "activities", items)} placeholder="Add activity" />
                    </div>
                    <div>
                      <ListInput label="" items={day.meals} onChange={(items) => updateDay(i, "meals", items)} placeholder="Add meal" />
                    </div>
                  </div>
                  <input type="text" value={day.accommodation} onChange={(e) => updateDay(i, "accommodation", e.target.value)} placeholder="Accommodation" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              ))}
            </div>
          </>
        )}

        {/* CONTENT TAB */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <ListInput label="Trip Highlights" items={highlights} onChange={setHighlights} placeholder="e.g. Private beach villa stay" />
            <ListInput label="Inclusions" items={inclusions} onChange={setInclusions} placeholder="e.g. Airport transfers included" />
            <ListInput label="Exclusions" items={exclusions} onChange={setExclusions} placeholder="e.g. Flights not included" />
            <ListInput label="Know Before You Go" items={knowBeforeYouGo} onChange={setKnowBeforeYouGo} placeholder="e.g. Carry sunscreen" />
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button type="submit" disabled={loading} className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors disabled:opacity-50 flex items-center gap-2">
            <Save size={16} />
            {loading ? "Creating..." : "Create Custom Itinerary"}
          </button>
          <Link href="/itineraries" className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
