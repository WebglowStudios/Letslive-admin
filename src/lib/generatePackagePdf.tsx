import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Svg,
  Path,
  Link,
  Font,
} from "@react-pdf/renderer";

// Disable automatic hyphenation for all text in the PDF
Font.registerHyphenationCallback((word: string) => [word]);

// ─── Brand palette (mirrors globals.css tokens) ───────────────────────────────
const C = {
  gn:      "#004d5e",   // --gn  (primary dark teal)
  gn2:     "#007a96",   // --gn2
  gn3:     "#00AECC",   // --gn3 (accent teal)
  cu:      "#F5A623",   // --cu  (amber / gold — accent only)
  cuLight: "#FEF3DC",   // amber tint for backgrounds
  ink:     "#0a1a1f",   // --ink
  ink2:    "#1a3a42",   // --ink2
  ink3:    "#4a7a85",   // --ink3
  ink4:    "#8ab5be",   // --ink4
  iv:      "#f0fafa",   // --iv  (page bg tint)
  iv2:     "#e0f5f7",   // --iv2
  line:    "#d4ecf0",   // slightly stronger than --line for print
  white:   "#ffffff",
};

// ─── SVG Icon Components (Material Icons paths at 24x24 viewBox) ──────────────

const Icon = ({ d, color = C.gn3, size = 12 }: { d: string; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d={d} fill={color} />
  </Svg>
);

// Icon paths (Material Icons)
const ICONS = {
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z",
  calendar: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  hotel: "M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z",
  restaurant: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  directions: "M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z",
  bus: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
  flight: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  train: "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm4 0h-5V6h5v4zm1.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  car: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  boat: "M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.93V7c0-1.1-.9-2-2-2h-3V3h-2v2h-2V3H9v2H6c-1.1 0-2 .9-2 2v3.93l-1.28.11c-.26.08-.48.26-.6.5s-.14.52-.06.78L3.95 19zM6 7h12v4.22l-6-1.5-6 1.5V7z",
  activity: "M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  backpack: "M17 4.14V2c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v2.14C8.72 4.59 7 6.47 7 8.76V20c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8.76c0-2.29-1.72-4.17-4-4.62zM13 3h-2V2h2v1zm2 10h-2v2h-2v-2H9v-2h2V9h2v2h2v2z",
  info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z",
  arrowForward: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: (string | { title: string; image?: string; images?: string[] })[];
  recommendations?: (string | { title: string; image?: string; images?: string[] })[];
  meals: string[];
  accommodation: string;
}
interface Stay {
  name: string; rating: string; nights: number; roomType: string; amenities: string[];
  rooms?: number;
  checkIn?: string; checkOut?: string; address?: string; confirmationNo?: string;
  remark?: string; showRemarkToCustomer?: boolean;
}
interface TransferLeg {
  from?: string; to?: string; stops?: string[];
  transferType?: string; vehicleType?: string;
}
interface Transfer {
  title: string; description: string; transferType?: string; vehicleType?: string;
  from?: string; to?: string; stops?: string[]; details: string[];
  legs?: TransferLeg[]; day?: number;
}
interface Flight {
  day?: number; airline: string; flightNumber: string;
  from: string; to: string; departure: string; arrival: string;
  pnr?: string; class?: string; notes?: string;
}
export interface PartnerItem {
  name: string;
  image?: string;
}
interface PackageData {
  name: string; slug: string;
  isInternational?: boolean;
  visaIncluded?: boolean;
  flightsIncluded?: boolean;
  destination?: { name: string; slug?: string; country?: string };
  description?: string; shortDescription?: string;
  duration: { nights: number; days: number };
  travelDates?: { startDate?: string; endDate?: string };
  hotelRating?: string; category?: string;
  price: number; originalPrice?: number; priceUnit?: string; discount?: number; discountType?: "percent" | "amount";
  badge?: string; rating?: number; reviewCount?: number;
  highlights?: string[]; keyPoints?: string[];
  itinerary?: ItineraryDay[];
  inclusions?: string[]; exclusions?: string[];
  stays?: Stay[]; transfers?: Transfer[];
  flights?: Flight[];
  knowBeforeYouGo?: string[]; thingsToCarry?: string[];
  paymentPolicy?: string[]; cancellationPolicy?: string[]; flightCancellationPolicy?: string[];
  images?: string[]; heroImage?: string;
  destinationImages?: string[]; stayImages?: string[]; activityImages?: string[];
  isCustom?: boolean; clientName?: string; clientEmail?: string; clientPhone?: string;
  travellerCount?: string; adultCount?: number; childCount?: number;
  transferSummary?: string;
  partnerLogos?: PartnerItem[];
  bookingMeta?: {
    dateChangeHistory?: { oldDate: string; newDate: string; reason: string; changedAt: string }[];
    totalAmount?: number;
    paidAmount?: number;
    paymentStatus?: string;
  };
}

// ─── Helper: Dynamic Vehicle Icon ─────────────────────────────────────────────
function getVehicleIcon(type?: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("flight") || t.includes("plane") || t.includes("air")) return ICONS.flight;
  if (t.includes("train") || t.includes("rail")) return ICONS.train;
  if (t.includes("boat") || t.includes("ferry") || t.includes("ship") || t.includes("cruise") || t.includes("speed boat") || t.includes("speed-boat")) return ICONS.boat;
  if (t.includes("bus") || t.includes("coach")) return ICONS.bus;
  return ICONS.car; // default
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverPage: {
    backgroundColor: C.gn,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  coverHero: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    objectFit: "cover", opacity: 0.18,
  },
  coverOverlay: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0,20,28,0.55)",
  },
  // Top amber accent stripe
  coverTopStripe: {
    position: "absolute", top: 0, left: 0, right: 0, height: 5,
    backgroundColor: C.cu,
  },
  // Left teal sidebar stripe
  coverSideBar: {
    position: "absolute", top: 0, left: 0, bottom: 0, width: 6,
    backgroundColor: C.gn3,
  },
  coverContent: {
    position: "relative",
    padding: 52,
    paddingLeft: 56,
    flex: 1,
    justifyContent: "space-between",
  },
  coverLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  coverLogoBox: {
    width: 28, height: 28,
    backgroundColor: C.cu,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  coverLogoText: {
    fontSize: 10, fontFamily: "Helvetica-Bold",
    color: C.ink, letterSpacing: 0.5,
  },
  coverBrand: {
    fontSize: 11, fontFamily: "Helvetica-Bold",
    color: C.white, letterSpacing: 4, opacity: 0.9,
  },
  coverTagline: {
    fontSize: 8, color: C.ink4, letterSpacing: 2, marginTop: 2,
  },
  coverMiddle: {
    marginTop: 48,
  },
  coverCategoryPill: {
    flexDirection: "row",
    marginBottom: 14,
  },
  coverCategoryText: {
    fontSize: 8, fontFamily: "Helvetica-Bold",
    color: C.cu, letterSpacing: 2,
    borderWidth: 1, borderColor: C.cu,
    paddingVertical: 3, paddingHorizontal: 10,
    borderRadius: 20,
  },
  coverTitle: {
    fontSize: 36, fontFamily: "Helvetica-Bold",
    color: C.white, lineHeight: 1.15,
    marginBottom: 10,
  },
  coverDestLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  coverDestDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.gn3,
    marginRight: 4,
  },
  coverDestText: {
    fontSize: 14, color: C.gn3, fontFamily: "Helvetica-Bold",
  },
  coverPills: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24,
  },
  coverPillGold: {
    backgroundColor: C.cu,
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
  },
  coverPillOutline: {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12,
  },
  coverPillGoldText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.ink,
  },
  coverPillOutlineText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.85)",
  },
  coverClientCard: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10, padding: 16, marginTop: 12,
    borderLeftWidth: 3, borderLeftColor: C.gn3,
  },
  coverClientLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    color: C.gn3, letterSpacing: 2, marginBottom: 5,
  },
  coverClientName: {
    fontSize: 14, fontFamily: "Helvetica-Bold", color: C.white,
  },
  coverClientDetail: {
    fontSize: 8, color: "rgba(255,255,255,0.6)", marginTop: 3,
  },
  coverPriceBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12, padding: 22,
    borderWidth: 1.5, borderColor: "rgba(245,166,35,0.5)",
  },
  coverPriceLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    color: C.ink4, letterSpacing: 2, marginBottom: 4,
  },
  coverPriceOriginal: {
    fontSize: 11, color: C.ink4, textDecoration: "line-through", marginBottom: 2,
  },
  coverPriceAmount: {
    fontSize: 30, fontFamily: "Helvetica-Bold", color: C.cu, lineHeight: 1,
  },
  coverPriceUnit: {
    fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 4,
  },
  coverDiscountBadge: {
    backgroundColor: C.cu,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16,
    alignItems: "center",
  },

  // ── Content page shell ─────────────────────────────────────────────────────
  page: {
    paddingTop: 44, paddingBottom: 40, paddingHorizontal: 44,
    backgroundColor: C.white,
  },
  pageHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 44, paddingTop: 14,
  },
  headerLine: {
    height: 2.5, backgroundColor: C.gn, marginBottom: 8,
    borderRadius: 2,
  },
  headerInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerBrand: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold",
    color: C.gn2, letterSpacing: 3,
  },
  headerSection: {
    fontSize: 7, color: C.ink4, letterSpacing: 1,
  },
  pageFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 44, paddingBottom: 14,
  },
  footerLine: {
    height: 1, backgroundColor: C.line, marginBottom: 8,
  },
  footerInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerText: {
    fontSize: 7, color: C.ink4,
  },
  footerPage: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.ink3,
  },

  // ── Section heading ────────────────────────────────────────────────────────
  sectionBlock: { marginBottom: 18 },
  sectionBar: {
    width: 32, height: 3, backgroundColor: C.cu,
    borderRadius: 2, marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 15, fontFamily: "Helvetica-Bold",
    color: C.gn, letterSpacing: 0.3,
  },

  // ── Trip summary / glance cards ────────────────────────────────────────────
  glanceGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18,
  },
  glanceCard: {
    width: "47%", backgroundColor: C.iv, borderRadius: 8,
    padding: 14, borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 3, borderLeftColor: C.gn3,
  },
  glanceLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    color: C.ink3, letterSpacing: 1.5, marginBottom: 5, textTransform: "uppercase",
  },
  glanceValue: {
    fontSize: 13, fontFamily: "Helvetica-Bold", color: C.gn,
  },
  glanceValueGold: {
    fontSize: 13, fontFamily: "Helvetica-Bold", color: C.cu,
  },

  // ── Description ───────────────────────────────────────────────────────────
  descText: {
    fontSize: 9.5, color: C.ink2, lineHeight: 1.65, marginBottom: 16,
  },

  // ── Highlight / bullet list ────────────────────────────────────────────────
  bulletRow: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 6,
  },
  bulletDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.cu, marginRight: 8, marginTop: 3.5, flexShrink: 0,
  },
  bulletTealDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.gn3, marginRight: 8, marginTop: 3.5, flexShrink: 0,
  },
  bulletText: {
    fontSize: 9, color: C.ink2, flex: 1, lineHeight: 1.5,
  },

  // ── Gallery ───────────────────────────────────────────────────────────────
  galleryGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  galleryCell: {
    width: "48%", height: 195,
    borderRadius: 8, overflow: "hidden",
    borderWidth: 1, borderColor: C.line,
  },
  galleryImg: {
    width: "100%", height: "100%", objectFit: "cover",
  },

  // ── Itinerary day card ─────────────────────────────────────────────────────
  dayCard: {
    marginBottom: 10, borderRadius: 8, overflow: "hidden",
    borderWidth: 1, borderColor: C.line,
  },
  dayHeader: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.iv2,
    paddingVertical: 7, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  dayBadge: {
    backgroundColor: C.gn,
    borderRadius: 5, paddingVertical: 2.5, paddingHorizontal: 8,
    marginRight: 10,
  },
  dayBadgeText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white,
  },
  dayTitle: {
    fontSize: 10, fontFamily: "Helvetica-Bold",
    color: C.gn, flex: 1,
  },
  dayBody: {
    backgroundColor: C.white,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  dayDescription: {
    fontSize: 8.5, color: C.ink2, lineHeight: 1.5, marginBottom: 8,
  },
  dayActivitiesLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    color: C.gn2, letterSpacing: 1, marginBottom: 4,
  },
  dayActivitiesRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 8,
  },
  dayActivityChip: {
    backgroundColor: C.iv,
    borderWidth: 1, borderColor: C.line,
    borderRadius: 4, paddingVertical: 2.5, paddingHorizontal: 7,
  },
  dayActivityChipText: {
    fontSize: 7.5, color: C.ink2,
  },
  dayMeta: {
    flexDirection: "row", flexWrap: "wrap", gap: 16,
    borderTopWidth: 1, borderTopColor: C.line,
    paddingTop: 6, marginTop: 4,
  },
  dayMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dayMetaLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    color: C.ink3, letterSpacing: 0.5,
  },
  dayMetaValue: { fontSize: 8, color: C.ink2 },

  // ── Stay table ─────────────────────────────────────────────────────────────
  tableWrap: {
    borderWidth: 1, borderColor: C.line, borderRadius: 8, overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.gn,
    paddingVertical: 9, paddingHorizontal: 12,
  },
  tableHeadCell: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8, paddingHorizontal: 12,
    borderTopWidth: 1, borderTopColor: C.line,
    backgroundColor: C.white,
  },
  tableRowAlt: { backgroundColor: C.iv },
  tableCell: { fontSize: 8, color: C.ink2 },

  // ── Activity card ──────────────────────────────────────────────────────────
  actCard: {
    backgroundColor: C.iv,
    borderRadius: 8, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 3, borderLeftColor: C.gn3,
  },
  actTitle: {
    fontSize: 10, fontFamily: "Helvetica-Bold", color: C.gn, marginBottom: 3,
  },
  actDuration: {
    fontSize: 8, color: C.cu, fontFamily: "Helvetica-Bold", marginBottom: 5,
  },
  actDesc: { fontSize: 8.5, color: C.ink2, lineHeight: 1.5, marginBottom: 6 },
  actBullet: { fontSize: 8, color: C.ink3, marginBottom: 2, paddingLeft: 8 },

  // ── Transfer card ──────────────────────────────────────────────────────────
  transCard: {
    backgroundColor: C.iv,
    borderRadius: 8, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.line,
    borderLeftWidth: 3, borderLeftColor: C.cu,
  },
  transTitle: {
    fontSize: 10, fontFamily: "Helvetica-Bold", color: C.gn, marginBottom: 3,
  },
  transRoute: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 4,
  },
  transLocation: {
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.line,
    borderRadius: 5, padding: 7, flex: 1,
  },
  transLocLabel: {
    fontSize: 6.5, fontFamily: "Helvetica-Bold",
    color: C.cu, letterSpacing: 1.5, marginBottom: 2,
  },
  transLocText: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.gn },
  transArrow: { fontSize: 11, color: C.ink4 },

  // ── Inclusions / Exclusions ────────────────────────────────────────────────
  incExcRow: { flexDirection: "row", gap: 12 },
  incCol: {
    flex: 1, borderRadius: 8, padding: 14,
    backgroundColor: C.iv,
    borderWidth: 1, borderColor: C.line,
    borderTopWidth: 3, borderTopColor: C.gn3,
  },
  excCol: {
    flex: 1, borderRadius: 8, padding: 14,
    backgroundColor: "#fdf8f0",
    borderWidth: 1, borderColor: "#f5e3c8",
    borderTopWidth: 3, borderTopColor: C.cu,
  },
  incExcHeader: {
    fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 10,
  },
  incItem: { fontSize: 8, color: C.ink2, marginBottom: 5, lineHeight: 1.4 },
  excItem: { fontSize: 8, color: C.ink2, marginBottom: 5, lineHeight: 1.4 },

  // ── Know before you go ─────────────────────────────────────────────────────
  kbygRow: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 10,
  },
  kbygNumBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.gn, justifyContent: "center",
    alignItems: "center", marginRight: 10, flexShrink: 0,
  },
  kbygNumText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  kbygText: { fontSize: 9, color: C.ink2, flex: 1, lineHeight: 1.5 },

  // ── Things to carry ────────────────────────────────────────────────────────
  carryGrid: { flexDirection: "row", flexWrap: "wrap" },
  carryItem: {
    width: "50%", flexDirection: "row",
    alignItems: "flex-start", marginBottom: 7, paddingRight: 10,
  },
  carryDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: C.gn3, marginRight: 8, marginTop: 3, flexShrink: 0,
  },
  carryText: { fontSize: 8.5, color: C.ink2, flex: 1, lineHeight: 1.4 },

  // ── Pricing card ───────────────────────────────────────────────────────────
  priceCard: {
    borderWidth: 1.5, borderColor: C.line,
    borderRadius: 12, overflow: "hidden", marginBottom: 20,
  },
  priceCardTop: {
    backgroundColor: C.gn,
    padding: 24, alignItems: "center",
  },
  priceCardLabel: {
    fontSize: 8, fontFamily: "Helvetica-Bold",
    color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 6,
  },
  priceCardAmount: {
    fontSize: 34, fontFamily: "Helvetica-Bold", color: C.cu,
  },
  priceCardOriginal: {
    fontSize: 12, color: "rgba(255,255,255,0.45)",
    textDecoration: "line-through", marginTop: 4,
  },
  priceCardUnit: {
    fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 5,
  },
  priceCardBottom: {
    backgroundColor: C.iv,
    padding: 16, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: 8,
  },
  priceCardSavings: {
    backgroundColor: C.cuLight,
    borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14,
  },
  priceCardSavingsText: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink2,
  },

  // ── Contact CTA ────────────────────────────────────────────────────────────
  ctaBox: {
    backgroundColor: C.iv2,
    borderRadius: 10, padding: 20,
    borderWidth: 1, borderColor: C.line,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 12, fontFamily: "Helvetica-Bold", color: C.gn, marginBottom: 5,
  },
  ctaSubtitle: {
    fontSize: 8.5, color: C.ink3, marginBottom: 10, textAlign: "center",
  },
  ctaContact: {
    fontSize: 10, fontFamily: "Helvetica-Bold", color: C.cu,
  },
});

// ─── Shared sub-components ────────────────────────────────────────────────────

const PageHeader = ({ section }: { section?: string }) => (
  <View style={s.pageHeader} fixed>
    <View style={s.headerLine} />
    <View style={s.headerInner}>
      <Text style={s.headerBrand}>LETSLIVE TOURS</Text>
      {section ? <Text style={s.headerSection}>{section.toUpperCase()}</Text> : null}
    </View>
  </View>
);

const PageFooter = () => (
  <View style={s.pageFooter} fixed>
    <View style={s.footerLine} />
    <View style={s.footerInner}>
      <Text style={s.footerText}>www.letslivetours.com  ·  info@letslivetours.com</Text>
      <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  </View>
);

const SectionTitle = ({ title }: { title: string }) => (
  <View style={s.sectionBlock}>
    <View style={s.sectionBar} />
    <Text style={s.sectionTitle}>{title}</Text>
  </View>
);

// ─── Cover Page ───────────────────────────────────────────────────────────────
const CoverPage = ({ pkg }: { pkg: PackageData }) => {
  const coverImg = pkg.heroImage || (pkg.images && pkg.images.length > 0 ? pkg.images[0] : undefined);

  return (
    <Page size="A4" style={{ padding: 0 }}>
      <View style={{ width: "100%", height: "100%", position: "relative", backgroundColor: "#08151a" }}>
        {/* Full-bleed hero image with reduced brightness */}
        {coverImg ? (
          <Image
            src={coverImg}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        ) : null}

        {/* Full-page darkening overlay to dim bright areas */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(5, 18, 24, 0.5)",
          }}
        />

        {/* Deep bottom gradient overlay for maximum text contrast */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 460,
            backgroundColor: "rgba(5, 18, 24, 0.85)",
          }}
        />

        {/* Bottom content */}
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: 44, paddingBottom: 36,
        }}>
        {/* Title */}
        <Text style={{
          fontSize: 34, fontFamily: "Helvetica-Bold",
          color: C.white, lineHeight: 1.2, marginBottom: 8,
        }}>
          {pkg.name}
        </Text>

        {/* Reference (use slug as reference) */}
        <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>
          Reference: <Text style={{ fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.85)" }}>
            {pkg.slug?.toUpperCase().replace(/-/g, "").slice(0, 8) || "PKG"}
          </Text>
        </Text>

        {/* Divider line */}
        <View style={{ height: 1.5, backgroundColor: C.cu, marginBottom: 16, width: "100%" }} />

        {/* Meta rows with SVG icons */}
        <View style={{ marginBottom: 6 }}>
          {pkg.destination?.name && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill={C.cu} />
              </Svg>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.white }}>
                {pkg.destination.name}
                {pkg.destination.country ? `, ${pkg.destination.country}` : ""}
                {pkg.duration ? ` - ${pkg.duration.nights}N` : ""}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
              <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill={C.cu} />
            </Svg>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.white }}>
              {pkg.duration.nights} nights / {pkg.duration.days} days
              {pkg.travelDates?.startDate ? ` · ${new Date(pkg.travelDates.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${pkg.travelDates.endDate ? ` – ${new Date(pkg.travelDates.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}` : ""}
            </Text>
          </View>
          {pkg.hotelRating && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <Path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={C.cu} />
              </Svg>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.white }}>
                {pkg.hotelRating}
              </Text>
            </View>
          )}
          {pkg.isInternational && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill={pkg.visaIncluded ? C.gn3 : C.cu} />
              </Svg>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: pkg.visaIncluded ? C.gn3 : C.cu }}>
                {pkg.visaIncluded ? "Visa Included" : "Visa Not Included"}
              </Text>
            </View>
          )}
          {pkg.flightsIncluded !== undefined && (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <Path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill={pkg.flightsIncluded ? C.gn3 : C.cu} />
              </Svg>
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: pkg.flightsIncluded ? C.gn3 : C.cu }}>
                {pkg.flightsIncluded ? "Flights Included" : "Flights Not Included"}
              </Text>
            </View>
          )}
          {/* Price */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: C.cu, justifyContent: "center", alignItems: "center", marginRight: 8 }}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.ink }}>R</Text>
            </View>
            <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.cu }}>
              INR {pkg.price.toLocaleString("en-IN")}
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}> / {pkg.priceUnit || "person"}</Text>
            </Text>
          </View>
        </View>

        {/* Footer: prepared by */}
        <View style={{ marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.gn3 }}>
          {pkg.isCustom && pkg.clientName ? (
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
              Specially prepared for <Text style={{ fontFamily: "Helvetica-Bold", color: C.white }}>{pkg.clientName.toUpperCase()}</Text> by <Text style={{ fontFamily: "Helvetica-Bold", color: C.white }}>LETS LIVE TOURS</Text>
            </Text>
          ) : (
            <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>
              Curated by <Text style={{ fontFamily: "Helvetica-Bold", color: C.white }}>LETS LIVE TOURS</Text>
            </Text>
          )}
        </View>
      </View>
    </View>
    </Page>
  );
};

// ─── Page 2: Package Snapshot & Flight Information ─────────────────────────────
const PackageSnapshotPage = ({ pkg }: { pkg: PackageData }) => {
  // 1. Format dates
  let dateText = "To be confirmed";
  if (pkg.travelDates?.startDate) {
    const sDate = new Date(pkg.travelDates.startDate);
    const sStr = isNaN(sDate.getTime())
      ? String(pkg.travelDates.startDate)
      : sDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (pkg.travelDates.endDate) {
      const eDate = new Date(pkg.travelDates.endDate);
      const eStr = isNaN(eDate.getTime())
        ? String(pkg.travelDates.endDate)
        : eDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      dateText = `${sStr} - ${eStr}`;
    } else {
      dateText = sStr;
    }
  }

  // 2. Format Duration
  const nights = pkg.duration?.nights ?? (typeof (pkg.duration as any) === "number" ? (pkg.duration as any) : 0);
  const days = pkg.duration?.days ?? (nights > 0 ? nights + 1 : 0);
  const durationText = `${nights} Nights / ${days} Days`;

  // 3. Format Travellers
  let travellersText = "To be confirmed";
  if (pkg.adultCount || pkg.childCount) {
    const a = pkg.adultCount || 0;
    const c = pkg.childCount || 0;
    travellersText = `${a} Adult${a === 1 ? "" : "s"}${c ? `, ${c} Child${c === 1 ? "" : "ren"}` : ""}`;
  } else if (pkg.travellerCount) {
    travellersText = pkg.travellerCount;
  }

  // 4. Calculate route sequence / stops
  const routeStops: { city: string; nights: number }[] = [];
  if (pkg.stays && pkg.stays.length > 0) {
    pkg.stays.forEach((stay) => {
      let rawCity = "";
      if (stay.address && stay.address.trim()) {
        rawCity = stay.address.split(",")[0].trim();
      } else if (stay.name) {
        rawCity = stay.name
          .replace(/\b(hotel|resort|palace|inn|villas|villa|suites|suite|spa|houseboat|retreat|grand|the|camp|cottages)\b/gi, "")
          .trim();
      }
      const city = rawCity || pkg.destination?.name || "Destination";
      const n = stay.nights || 1;

      const last = routeStops[routeStops.length - 1];
      if (last && last.city.toLowerCase() === city.toLowerCase()) {
        last.nights += n;
      } else {
        routeStops.push({ city, nights: n });
      }
    });
  }

  // Fallback if no stays provided
  if (routeStops.length === 0) {
    if (pkg.destination?.name) {
      routeStops.push({ city: pkg.destination.name, nights });
    } else {
      routeStops.push({ city: "Main Destination", nights });
    }
  }

  const priceVal = pkg.price || 0;
  const formattedPrice = priceVal > 0 ? priceVal.toLocaleString("en-IN") : "—";

  return (
    <Page size="A4" style={[s.page, { position: "relative" }]}>
      {/* Decorative top-right curved arc */}
      <View
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: "rgba(224, 245, 247, 0.4)",
        }}
      />

      <PageHeader section="Trip Overview" />

      {/* Main Title Section */}
      <View style={{ marginBottom: 20, marginTop: 4 }}>
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#007a96", letterSpacing: 1.5, marginBottom: 4 }}>
          TRIP OVERVIEW
        </Text>
        <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0a2936", letterSpacing: 0.2 }}>
          Package Snapshot & Flight Information
        </Text>
        <View style={{ width: 46, height: 3.5, backgroundColor: "#F5A623", borderRadius: 2, marginTop: 6 }} />
      </View>

      {/* Row 1: 3 Info Cards */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {/* Card 1: Travel Date */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#d4ecf0",
            padding: 12,
            minHeight: 56,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#7a9da6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 }}>
            TRAVEL DATE
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0a2936" }}>
            {dateText}
          </Text>
        </View>

        {/* Card 2: Duration */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#d4ecf0",
            padding: 12,
            minHeight: 56,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#7a9da6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 }}>
            DURATION
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0a2936" }}>
            {durationText}
          </Text>
        </View>

        {/* Card 3: Travellers */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#d4ecf0",
            padding: 12,
            minHeight: 56,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#7a9da6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 }}>
            TRAVELLERS
          </Text>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0a2936" }}>
            {travellersText}
          </Text>
        </View>
      </View>

      {/* Row 2: Flight Arrangements Banner */}
      <View
        style={{
          backgroundColor: "#f0f8fb",
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: "#009bb8",
          paddingVertical: 11,
          paddingHorizontal: 14,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 8.5, color: "#1a3a42", lineHeight: 1.5 }}>
          <Text style={{ fontFamily: "Helvetica-Bold", color: "#00556b" }}>Flight arrangements: </Text>
          Flights will be planned according to your departure city. Final airline and schedule details will be shared during booking.
        </Text>
      </View>

      {/* Row 3: City Route Flow with Arrows */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
        {routeStops.slice(0, 4).map((stop, idx) => (
          <React.Fragment key={idx}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#ffffff",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#d4ecf0",
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: "#004d5e", textAlign: "center", marginBottom: 3 }}>
                {stop.city}
              </Text>
              <Text style={{ fontSize: 8, color: "#6a909b", textAlign: "center" }}>
                {stop.nights} {stop.nights === 1 ? "night" : "nights"}
              </Text>
            </View>
            {idx < Math.min(routeStops.length, 4) - 1 && (
              <View style={{ width: 28, alignItems: "center", justifyContent: "center" }}>
                <Svg width="18" height="12" viewBox="0 0 24 24">
                  <Path
                    d="M4 12h14M13 6l6 6-6 6"
                    stroke="#8ab5be"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </View>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Row 4: Total Cost & Tax Position Banner (Deep Teal Bar) */}
      <View
        style={{
          backgroundColor: "#005570",
          borderRadius: 10,
          paddingVertical: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 7.5,
              fontFamily: "Helvetica-Bold",
              color: "rgba(255,255,255,0.75)",
              letterSpacing: 1,
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            TOTAL COST PER {pkg.priceUnit?.toUpperCase() || "PERSON"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Svg width={14} height={18} viewBox="0 0 24 24" style={{ marginRight: 3 }}>
              <Path
                d="M13.66 7C13.1 5.82 11.9 5 10.5 5L6 5V3H18V5H14.74C15.22 5.58 15.58 6.26 15.79 7H18V9H16C15.73 11.8 13.37 14 10.5 14H9.61L15.89 21H13.21L7 14V12H10.5C12.16 12 13.5 10.66 13.5 9H6V7H13.66Z"
                fill="#ffffff"
              />
            </Svg>
            <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>
              {formattedPrice}/-
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 7.5,
              fontFamily: "Helvetica-Bold",
              color: "rgba(255,255,255,0.75)",
              letterSpacing: 1,
              marginBottom: 3,
              textTransform: "uppercase",
            }}
          >
            TAX POSITION
          </Text>
          <Text style={{ fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "#ffffff" }}>
            5% GST Included
          </Text>
          <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
            5% TCS Excluded
          </Text>
        </View>
      </View>

      {/* Row 5: Two Feature Cards (Airfare & Airport Transfers) */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {/* Card 1: Airfare */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#d4ecf0",
            padding: 14,
            minHeight: 75,
          }}
        >
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#004d5e", marginBottom: 6 }}>
            {pkg.isInternational ? "International + Domestic Airfare" : "Airfare & Transport"}
          </Text>
          <Text style={{ fontSize: 8, color: "#4a7a85", lineHeight: 1.55 }}>
            {pkg.flightsIncluded
              ? "Both international and domestic flights are included in the package as stated in the inclusions."
              : "Flight arrangements will be planned according to your departure city as per airline availability."}
          </Text>
        </View>

        {/* Card 2: Airport Transfers */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#d4ecf0",
            padding: 14,
            minHeight: 75,
          }}
        >
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: "#004d5e", marginBottom: 6 }}>
            Airport Transfers
          </Text>
          <Text style={{ fontSize: 8, color: "#4a7a85", lineHeight: 1.55 }}>
            {pkg.transferSummary
              ? pkg.transferSummary
              : "Two-way airport-to-hotel transfers and sightseeing transportation are included as part of the package."}
          </Text>
        </View>
      </View>

      <PageFooter />
    </Page>
  );
};


// ─── Gallery ──────────────────────────────────────────────────────────────────
const GallerySection = ({ pkg }: { pkg: PackageData }) => {
  const imgs = [
    ...(pkg.heroImage ? [pkg.heroImage] : []),
    ...(pkg.destinationImages || []),
    ...(pkg.stayImages || []),
    ...(pkg.activityImages || []),
    ...(pkg.images || []),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  if (imgs.length === 0) return null;
  return (
    <View style={{ marginBottom: 20 }} wrap={false}>
      <SectionTitle title="Photo Gallery" />
      <View style={s.galleryGrid}>
        {imgs.map((img, i) => (
          <View key={i} style={s.galleryCell}>
            <Image src={img} style={s.galleryImg} />
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Overview ─────────────────────────────────────────────────────────────────
const OverviewSection = ({ pkg }: { pkg: PackageData }) => {
  const hasContent =
    pkg.description || pkg.highlights?.length || pkg.keyPoints?.length;
  if (!hasContent) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      {pkg.description && (
        <View wrap={false} style={{ marginBottom: 14 }}>
          <SectionTitle title="Overview" />
          <Text style={s.descText}>{pkg.description}</Text>
        </View>
      )}
      {pkg.highlights && pkg.highlights.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Trip Highlights" />
            {pkg.highlights.slice(0, 3).map((h, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletDot} />
                <Text style={s.bulletText}>{h}</Text>
              </View>
            ))}
          </View>
          {pkg.highlights.slice(3).map((h, i) => (
            <View key={i + 3} style={s.bulletRow}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{h}</Text>
            </View>
          ))}
        </View>
      )}
      {pkg.keyPoints && pkg.keyPoints.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Key Points" />
            {pkg.keyPoints.slice(0, 3).map((k, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletTealDot} />
                <Text style={s.bulletText}>{k}</Text>
              </View>
            ))}
          </View>
          {pkg.keyPoints.slice(3).map((k, i) => (
            <View key={i + 3} style={s.bulletRow}>
              <View style={s.bulletTealDot} />
              <Text style={s.bulletText}>{k}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Itinerary ────────────────────────────────────────────────────────────────
const ItinerarySection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.itinerary || pkg.itinerary.length === 0) return null;

  // Build lookup maps for transfers and activities by day
  const transfersByDay: Record<number, Transfer[]> = {};
  (pkg.transfers || []).forEach((t) => {
    const d = (t as Transfer & { day?: number }).day || 0;
    if (d > 0) {
      if (!transfersByDay[d]) transfersByDay[d] = [];
      transfersByDay[d].push(t);
    }
  });


  // Collect unassigned transfers (day = 0 or no day)
  const unassignedTransfers = (pkg.transfers || []).filter((t) => !(t as Transfer & { day?: number }).day);

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Title block with minPresenceAhead to prevent orphan section header */}
      <View wrap={false} minPresenceAhead={140}>
        <SectionTitle title="Day-wise Itinerary" />
      </View>

      {pkg.itinerary.map((day) => {
        const dayTransfers = transfersByDay[day.day] || [];
        // Calculate actual date for this day if travelDates provided
        const dayDate = pkg.travelDates?.startDate
          ? new Date(new Date(pkg.travelDates.startDate).getTime() + (day.day - 1) * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : null;
        return (
          <View key={day.day} wrap={false} style={s.dayCard}>
            <View style={s.dayHeader}>
              <View style={s.dayBadge}>
                <Text style={s.dayBadgeText}>DAY {day.day}</Text>
              </View>
              <Text style={s.dayTitle}>{day.title}{dayDate ? ` — ${dayDate}` : ""}</Text>
            </View>
            <View style={s.dayBody}>
              {day.description ? (
                <Text style={s.dayDescription}>{day.description}</Text>
              ) : null}

              {/* Activities from itinerary data */}
              {day.activities && day.activities.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 5 }}>
                    <Icon d={ICONS.activity} color={C.gn3} size={10} />
                    <Text style={s.dayActivitiesLabel}>ACTIVITIES</Text>
                  </View>
                  <View style={s.dayActivitiesRow}>
                    {day.activities.map((act, i) => (
                      <View key={i} style={s.dayActivityChip}>
                        <Text style={s.dayActivityChipText}>
                          {typeof act === "string" ? act : (act.title || "")}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {/* Transfers for this day */}
              {dayTransfers.length > 0 && (
                <View style={{ marginTop: 2, marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 5 }}>
                    <Icon d={ICONS.bus} color={C.cu} size={10} />
                    <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: C.ink3, letterSpacing: 1 }}>TRANSFERS</Text>
                  </View>
                  {dayTransfers.map((t, i) => {
                    const iconData = getVehicleIcon(t.transferType || t.vehicleType);
                    return (
                      <View key={i} style={{ marginBottom: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: C.cu }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 }}>
                          <Icon d={iconData} color={C.cu} size={9} />
                          <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.gn }}>{t.title}</Text>
                        </View>
                        {/* Multi-leg or legacy from/to */}
                        {t.legs && t.legs.length > 0 ? (
                          t.legs.filter(l => l.from || l.to).map((leg, li) => (
                            <View key={li} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3, marginTop: 2 }}>
                              {leg.transferType ? <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: C.ink4, marginRight: 2 }}>[{leg.transferType}{leg.vehicleType ? ` · ${leg.vehicleType}` : ""}]</Text> : null}
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
                                {leg.from ? (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, flex: 1, backgroundColor: C.iv, borderRadius: 3, padding: 3, borderWidth: 1, borderColor: C.line }}>
                                    <Icon d={ICONS.location} color={C.gn3} size={8} />
                                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.gn }}>{leg.from}</Text>
                                  </View>
                                ) : null}
                                {leg.from && leg.to ? <Icon d={ICONS.arrowForward} color={C.cu} size={9} /> : null}
                                {leg.to ? (
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, flex: 1, backgroundColor: C.cuLight, borderRadius: 3, padding: 3, borderWidth: 1, borderColor: "#f5e3c8" }}>
                                    <Icon d={ICONS.location} color={C.cu} size={8} />
                                    <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.gn }}>{leg.to}</Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>
                          ))
                        ) : (t.from || t.to) ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, marginTop: 2 }}>
                            {t.from ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, backgroundColor: C.iv, borderRadius: 4, padding: 5, borderWidth: 1, borderColor: C.line }}>
                                <Icon d={ICONS.location} color={C.gn3} size={9} />
                                <View>
                                  <Text style={{ fontSize: 5.5, fontFamily: "Helvetica-Bold", color: C.ink4, letterSpacing: 1 }}>FROM</Text>
                                  <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.gn }}>{t.from}</Text>
                                </View>
                              </View>
                            ) : null}
                            {t.from && t.to ? <Icon d={ICONS.arrowForward} color={C.cu} size={10} /> : null}
                            {t.to ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, backgroundColor: C.cuLight, borderRadius: 4, padding: 5, borderWidth: 1, borderColor: "#f5e3c8" }}>
                                <Icon d={ICONS.location} color={C.cu} size={9} />
                                <View>
                                  <Text style={{ fontSize: 5.5, fontFamily: "Helvetica-Bold", color: C.ink4, letterSpacing: 1 }}>TO</Text>
                                  <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.gn }}>{t.to}</Text>
                                </View>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                        {t.description ? <Text style={{ fontSize: 7.5, color: C.ink3, marginTop: 2, lineHeight: 1.4 }}>{t.description}</Text> : null}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Meals & Accommodation footer */}
              {(day.meals?.length > 0 || day.accommodation) && (
                <View style={s.dayMeta}>
                  {day.meals && day.meals.length > 0 && (
                    <View style={s.dayMetaItem}>
                      <Icon d={ICONS.restaurant} color={C.cu} size={9} />
                      <Text style={s.dayMetaLabel}>MEALS:</Text>
                      <Text style={s.dayMetaValue}>{day.meals.join(", ")}</Text>
                    </View>
                  )}
                  {day.accommodation ? (
                    <View style={s.dayMetaItem}>
                      <Icon d={ICONS.hotel} color={C.gn3} size={9} />
                      <Text style={s.dayMetaLabel}>STAY:</Text>
                      <Text style={s.dayMetaValue}>{day.accommodation}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        );
      })}

      {/* Unassigned transfers shown at the end */}
      {unassignedTransfers.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <View wrap={false} minPresenceAhead={80}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <Icon d={ICONS.bus} color={C.cu} size={11} />
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.gn }}>General Transfers</Text>
            </View>
          </View>
          {unassignedTransfers.map((t, i) => (
            <View key={i} style={s.transCard} wrap={false}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <Icon d={ICONS.bus} color={C.cu} size={10} />
                <Text style={s.transTitle}>{t.title}</Text>
              </View>
              {(t.from || t.to) && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, marginTop: 2 }}>
                  {t.from ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, backgroundColor: C.iv, borderRadius: 4, padding: 6, borderWidth: 1, borderColor: C.line }}>
                      <Icon d={ICONS.location} color={C.gn3} size={10} />
                      <View>
                        <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: C.ink4, letterSpacing: 1 }}>FROM</Text>
                        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.gn }}>{t.from}</Text>
                      </View>
                    </View>
                  ) : null}
                  {t.from && t.to ? <Icon d={ICONS.arrowForward} color={C.cu} size={12} /> : null}
                  {t.to ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, backgroundColor: C.cuLight, borderRadius: 4, padding: 6, borderWidth: 1, borderColor: "#f5e3c8" }}>
                      <Icon d={ICONS.location} color={C.cu} size={10} />
                      <View>
                        <Text style={{ fontSize: 6, fontFamily: "Helvetica-Bold", color: C.ink4, letterSpacing: 1 }}>TO</Text>
                        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.gn }}>{t.to}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              )}
              {t.description ? <Text style={s.actDesc}>{t.description}</Text> : null}
              {t.details?.map((d, j) => (
                <Text key={j} style={s.actBullet}>• {d}</Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Transfer Summary (shown only when no day-wise transfers exist) ────────────
const TransferSummarySection = ({ pkg }: { pkg: PackageData }) => {
  // Show only if there's a summary AND no day-wise transfer array
  if (!pkg.transferSummary || (pkg.transfers && pkg.transfers.length > 0)) return null;
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Transfer Details" />
      <View
        style={{
          backgroundColor: C.iv,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.line,
          borderLeftWidth: 3,
          borderLeftColor: C.cu,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Icon d={ICONS.bus} color={C.cu} size={12} />
          <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.gn, letterSpacing: 0.3 }}>
            Overall Transfer Arrangements
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: C.ink2, lineHeight: 1.7 }}>
          {pkg.transferSummary}
        </Text>
      </View>
    </View>
  );
};

const FlightsSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.flights || pkg.flights.length === 0) return null;
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Flight / Transport Details" />
      <View style={s.tableWrap}>
        <View style={s.tableHead}>
          <Text style={[s.tableHeadCell, { width: "8%" }]}>Day</Text>
          <Text style={[s.tableHeadCell, { width: "18%" }]}>Airline</Text>
          <Text style={[s.tableHeadCell, { width: "12%" }]}>Flight No.</Text>
          <Text style={[s.tableHeadCell, { width: "17%" }]}>From</Text>
          <Text style={[s.tableHeadCell, { width: "17%" }]}>To</Text>
          <Text style={[s.tableHeadCell, { width: "14%" }]}>Depart</Text>
          <Text style={[s.tableHeadCell, { width: "14%" }]}>Arrive</Text>
        </View>
        {pkg.flights.map((f, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} wrap={false}>
            <Text style={[s.tableCell, { width: "8%" }]}>{f.day || "—"}</Text>
            <Text style={[s.tableCell, { width: "18%", fontFamily: "Helvetica-Bold" }]}>{f.airline}</Text>
            <Text style={[s.tableCell, { width: "12%" }]}>{f.flightNumber}</Text>
            <Text style={[s.tableCell, { width: "17%" }]}>{f.from}</Text>
            <Text style={[s.tableCell, { width: "17%" }]}>{f.to}</Text>
            <Text style={[s.tableCell, { width: "14%" }]}>{f.departure}</Text>
            <Text style={[s.tableCell, { width: "14%" }]}>{f.arrival}</Text>
          </View>
        ))}
      </View>
      {/* PNR / class notes below the table */}
      {pkg.flights.some(f => f.pnr || f.class || f.notes) && (
        <View style={{ marginTop: 8 }}>
          {pkg.flights.filter(f => f.pnr || f.class || f.notes).map((f, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
              <Text style={{ fontSize: 7.5, color: C.ink3 }}>
                {f.airline} {f.flightNumber}:
                {f.class ? ` ${f.class}` : ""}
                {f.pnr ? ` · PNR: ${f.pnr}` : ""}
                {f.notes ? ` · ${f.notes}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Accommodation ────────────────────────────────────────────────────────────
const AccommodationSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.stays || pkg.stays.length === 0) return null;
  const hasDateInfo = pkg.stays.some(s => s.checkIn || s.checkOut);
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Accommodation" />
      <View style={s.tableWrap}>
        <View style={s.tableHead}>
          <Text style={[s.tableHeadCell, { width: hasDateInfo ? "20%" : "25%" }]}>Hotel</Text>
          <Text style={[s.tableHeadCell, { width: hasDateInfo ? "15%" : "20%" }]}>Location</Text>
          <Text style={[s.tableHeadCell, { width: hasDateInfo ? "10%" : "12%" }]}>Rating</Text>
          <Text style={[s.tableHeadCell, { width: hasDateInfo ? "8%" : "10%" }]}>Nights</Text>
          <Text style={[s.tableHeadCell, { width: hasDateInfo ? "21%" : "33%" }]}>Room Type</Text>
          {hasDateInfo && <Text style={[s.tableHeadCell, { width: "13%" }]}>Check-in</Text>}
          {hasDateInfo && <Text style={[s.tableHeadCell, { width: "13%" }]}>Check-out</Text>}
        </View>
        {pkg.stays.map((stay, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} wrap={false}>
            <Text style={[s.tableCell, { width: hasDateInfo ? "20%" : "25%", fontFamily: "Helvetica-Bold" }]}>{stay.name}</Text>
            <Text style={[s.tableCell, { width: hasDateInfo ? "15%" : "20%" }]}>{stay.address || "—"}</Text>
            <Text style={[s.tableCell, { width: hasDateInfo ? "10%" : "12%" }]}>{stay.rating}</Text>
            <Text style={[s.tableCell, { width: hasDateInfo ? "8%" : "10%" }]}>{stay.nights}N</Text>
            <Text style={[s.tableCell, { width: hasDateInfo ? "21%" : "33%" }]}>{stay.rooms ? `${stay.rooms}x ` : ''}{stay.roomType}</Text>
            {hasDateInfo && <Text style={[s.tableCell, { width: "13%" }]}>{stay.checkIn ? new Date(stay.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</Text>}
            {hasDateInfo && <Text style={[s.tableCell, { width: "13%" }]}>{stay.checkOut ? new Date(stay.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</Text>}
          </View>
        ))}
      </View>
      {/* Show confirmation below table if available */}
      {pkg.stays.some(s => s.confirmationNo) && (
        <View style={{ marginTop: 8 }}>
          {pkg.stays.filter(s => s.confirmationNo).map((stay, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 7.5, color: C.ink3 }}>
                {stay.name}: Booking Ref: {stay.confirmationNo}
              </Text>
            </View>
          ))}
        </View>
      )}
      {/* Show customer-visible remarks below table if available */}
      {(() => {
        const remarkStays = (pkg.stays || []).filter(s => s.remark && s.showRemarkToCustomer);
        if (remarkStays.length === 0) return null;
        return (
          <View style={{ marginTop: 6, padding: 6, backgroundColor: C.iv, borderRadius: 4, borderWidth: 1, borderColor: C.line }}>
            {remarkStays.map((stay, i) => (
              <View key={i} style={{ marginBottom: i < remarkStays.length - 1 ? 3 : 0, flexDirection: "row", alignItems: "flex-start", gap: 4 }}>
                <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.gn }}>
                  {stay.name} Remark:
                </Text>
                <Text style={{ fontSize: 7.5, color: C.ink2, flex: 1 }}>
                  {stay.remark}
                </Text>
              </View>
            ))}
          </View>
        );
      })()}
    </View>
  );
};

// ─── Inclusions & Exclusions ──────────────────────────────────────────────────
const InclusionsExclusionsSection = ({ pkg }: { pkg: PackageData }) => {
  let inclusions = [...(pkg.inclusions || [])];
  let exclusions = [...(pkg.exclusions || [])];



  const hasInc = inclusions.length > 0;
  const hasExc = exclusions.length > 0;
  if (!hasInc && !hasExc) return null;
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Inclusions & Exclusions" />
      <View style={s.incExcRow}>
        {hasInc && (
          <View style={s.incCol}>
            <Text style={[s.incExcHeader, { color: C.gn }]}>✓  Inclusions</Text>
            {inclusions.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 5 }}>
                <View style={[s.bulletTealDot, { marginTop: 3 }]} />
                <Text style={s.incItem}>{item}</Text>
              </View>
            ))}
          </View>
        )}
        {hasExc && (
          <View style={s.excCol}>
            <Text style={[s.incExcHeader, { color: C.ink2 }]}>✗  Exclusions</Text>
            {exclusions.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 5 }}>
                <View style={[s.bulletDot, { marginTop: 3 }]} />
                <Text style={s.excItem}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Know Before You Go ───────────────────────────────────────────────────────
const KnowBeforeYouGoSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.knowBeforeYouGo || pkg.knowBeforeYouGo.length === 0) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="Know Before You Go" />
        {pkg.knowBeforeYouGo.slice(0, 3).map((item, i) => (
          <View key={i} style={s.kbygRow} wrap={false}>
            <View style={s.kbygNumBadge}>
              <Text style={s.kbygNumText}>{i + 1}</Text>
            </View>
            <Text style={s.kbygText}>{item}</Text>
          </View>
        ))}
      </View>
      {pkg.knowBeforeYouGo.slice(3).map((item, i) => (
        <View key={i + 3} style={s.kbygRow} wrap={false}>
          <View style={s.kbygNumBadge}>
            <Text style={s.kbygNumText}>{i + 4}</Text>
          </View>
          <Text style={s.kbygText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Things to Carry ──────────────────────────────────────────────────────────
const ThingsToCarrySection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.thingsToCarry || pkg.thingsToCarry.length === 0) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="Things to Carry" />
        <View style={{ flexDirection: "column" }}>
          {pkg.thingsToCarry.slice(0, 4).map((item, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
              <View style={s.carryDot} />
              <Text style={s.carryText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
      {pkg.thingsToCarry.length > 4 && (
        <View style={{ flexDirection: "column", marginTop: 8 }}>
          {pkg.thingsToCarry.slice(4).map((item, i) => (
            <View key={i + 4} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
              <View style={s.carryDot} />
              <Text style={s.carryText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Important Policies Link ──────────────────────────────────────────────────
const PoliciesLinkSection = ({ pkg }: { pkg: PackageData }) => {
  const hasPolicies = (pkg.paymentPolicy && pkg.paymentPolicy.length > 0) ||
                      (pkg.cancellationPolicy && pkg.cancellationPolicy.length > 0) ||
                      (pkg.flightCancellationPolicy && pkg.flightCancellationPolicy.length > 0);
  if (!hasPolicies) return null;

  const url = `https://letslivetours.com/packages/${pkg.slug}`;

  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="Important Policies" />
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
          <View style={s.carryDot} />
          <Text style={s.carryText}>
            For Payment, Cancellation, and Flight Cancellation policies, please refer to the detailed policies section on your package page online:{" "}
            <Link src={url} style={{ color: C.gn3, textDecoration: "none" }}>Click here to view Policies</Link>
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Date Change Notice ───────────────────────────────────────────────────────
const DateChangeNoticeSection = ({ pkg }: { pkg: PackageData }) => {
  const history = pkg.bookingMeta?.dateChangeHistory;
  if (!history || history.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="Date Change Notice" />
        {history.map((h, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
            <View style={[s.carryDot, { backgroundColor: C.cu }]} />
            <Text style={[s.carryText, { color: C.ink }]}>
              Travel date changed from <Text style={{ fontFamily: "Helvetica-Bold" }}>{new Date(h.oldDate).toLocaleDateString("en-IN")}</Text> to <Text style={{ fontFamily: "Helvetica-Bold" }}>{new Date(h.newDate).toLocaleDateString("en-IN")}</Text>.
              {"\n"}Reason: <Text style={{ fontStyle: "italic", color: C.ink3 }}>{h.reason}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Pricing & CTA ────────────────────────────────────────────────────────────
const PricingSection = ({ pkg }: { pkg: PackageData }) => {
  const hasBookingMeta = pkg.bookingMeta && pkg.bookingMeta.totalAmount !== undefined;
  return (
  <View wrap={false} style={{ marginBottom: 20 }}>
    <SectionTitle title={hasBookingMeta ? "Payment Summary" : "Pricing"} />
    <View style={s.priceCard}>
      {hasBookingMeta ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <View style={{ flex: 1, minWidth: "30%" }}>
            <Text style={s.priceCardLabel}>TOTAL AMOUNT</Text>
            <Text style={s.priceCardAmount}>INR {pkg.bookingMeta!.totalAmount!.toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flex: 1, minWidth: "30%" }}>
            <Text style={s.priceCardLabel}>PAID AMOUNT</Text>
            <Text style={[s.priceCardAmount, { color: C.gn2 }]}>INR {(pkg.bookingMeta!.paidAmount || 0).toLocaleString("en-IN")}</Text>
          </View>
          <View style={{ flex: 1, minWidth: "30%" }}>
            <Text style={s.priceCardLabel}>PAYMENT STATUS</Text>
            <Text style={[s.priceCardAmount, { color: pkg.bookingMeta!.paymentStatus === "paid" || pkg.bookingMeta!.paymentStatus === "full" ? C.gn : (pkg.bookingMeta!.paymentStatus === "partial" ? C.cu : "#dc3545"), fontSize: 14 }]}>
              {pkg.bookingMeta!.paymentStatus === "paid" || pkg.bookingMeta!.paymentStatus === "full" ? "FULLY PAID" : (pkg.bookingMeta!.paymentStatus || "PENDING").toUpperCase()}
            </Text>
          </View>
          {pkg.bookingMeta!.paymentStatus === "partial" && (
            <View style={{ flex: 1, minWidth: "30%" }}>
              <Text style={s.priceCardLabel}>PENDING AMOUNT</Text>
              <Text style={[s.priceCardAmount, { color: C.cu }]}>INR {(pkg.bookingMeta!.totalAmount! - (pkg.bookingMeta!.paidAmount || 0)).toLocaleString("en-IN")}</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <View style={s.priceCardTop}>
            <Text style={s.priceCardLabel}>PACKAGE PRICE</Text>
            {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
              <Text style={s.priceCardOriginal}>INR {pkg.originalPrice.toLocaleString("en-IN")}</Text>
            ) : null}
            <Text style={s.priceCardAmount}>INR {pkg.price.toLocaleString("en-IN")}</Text>
            <Text style={s.priceCardUnit}>per {pkg.priceUnit || "person"} (twin sharing)</Text>
          </View>
          {pkg.discount && pkg.discount > 0 ? (
            <View style={s.priceCardBottom}>
              <View style={s.priceCardSavings}>
                <Text style={s.priceCardSavingsText}>
                  You save {pkg.discountType === "percent" || !pkg.discountType ? `${pkg.discount}%` : `INR ${pkg.discount?.toLocaleString("en-IN")}`} on this package
                </Text>
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>

    <View style={s.ctaBox}>
      <Text style={s.ctaTitle}>Ready to Book?</Text>
      <Text style={s.ctaSubtitle}>
        Contact us to customise dates, group size, and confirm your trip.
      </Text>
      {pkg.slug && (
        <Text style={{ fontSize: 9, color: C.gn3, marginTop: 4, marginBottom: 8, textAlign: "center" }}>
          <Link src={`https://letslivetours.com/packages/${pkg.slug}`} style={{ color: C.gn3, textDecoration: "underline" }}>
            View Full Itinerary Online
          </Link>
        </Text>
      )}
      <Text style={s.ctaContact}>+91 77700 88466  ·  info@letslivetours.com</Text>
    </View>
  </View>
)};

// ─── Default Partner Logos (Dummy placeholders - update with real CDN/asset URLs) ──
export const PARTNER_LOGOS_ROWS: { row: PartnerItem[] }[] = [
  {
    row: [
      { name: "Dubai", image: "https://placehold.co/220x90/ffffff/00AECC.png?text=DUBAI" },
      { name: "Marriott", image: "https://placehold.co/220x90/ffffff/8B0000.png?text=MARRIOTT" },
      { name: "Razorpay", image: "https://placehold.co/220x90/ffffff/0C2340.png?text=Razorpay" },
      { name: "Indian Bank", image: "https://placehold.co/220x90/ffffff/004080.png?text=Indian+Bank" },
    ],
  },
  {
    row: [
      { name: "Emirates", image: "https://placehold.co/220x90/ffffff/D71921.png?text=Emirates" },
      { name: "IndiGo", image: "https://placehold.co/220x90/ffffff/002B80.png?text=IndiGo" },
      { name: "Incredible India", image: "https://placehold.co/220x90/ffffff/222222.png?text=Incredible+India" },
    ],
  },
  {
    row: [
      { name: "BHIM", image: "https://placehold.co/220x90/ffffff/333333.png?text=BHIM" },
      { name: "MakeMyTrip", image: "https://placehold.co/220x90/ffffff/E42B26.png?text=MakeMyTrip" },
      { name: "VISA", image: "https://placehold.co/220x90/ffffff/1A1F71.png?text=VISA" },
      { name: "PayU", image: "https://placehold.co/220x90/ffffff/7ABA28.png?text=PayU" },
    ],
  },
  {
    row: [
      { name: "Uber", image: "https://placehold.co/220x90/ffffff/000000.png?text=Uber" },
      { name: "Amazing Thailand", image: "https://placehold.co/220x90/ffffff/D82374.png?text=Amazing+Thailand" },
      { name: "AirAsia", image: "https://placehold.co/220x90/ffffff/ED1C24.png?text=AirAsia" },
      { name: "Oberoi Hotels & Resorts", image: "https://placehold.co/220x90/ffffff/B8860B.png?text=Oberoi" },
    ],
  },
  {
    row: [
      { name: "Tripadvisor", image: "https://placehold.co/220x90/ffffff/00AF87.png?text=Tripadvisor" },
      { name: "Turkey", image: "https://placehold.co/220x90/ffffff/E30A17.png?text=Turkey" },
      { name: "Zoomcar", image: "https://placehold.co/220x90/ffffff/38B449.png?text=Zoomcar" },
    ],
  },
];

// ─── Last Page: Our Partners ──────────────────────────────────────────────────
const PartnersPage = ({ pkg }: { pkg?: PackageData }) => {
  return (
    <Page size="A4" style={[s.page, { position: "relative" }]}>
      {/* Decorative top-right soft curved shape */}
      <View
        style={{
          position: "absolute",
          top: -35,
          right: -35,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: "rgba(224, 245, 247, 0.45)",
        }}
      />
      {/* Decorative bottom-left subtle amber curved shape */}
      <View
        style={{
          position: "absolute",
          bottom: -35,
          left: -35,
          width: 150,
          height: 150,
          borderRadius: 75,
          backgroundColor: "rgba(254, 243, 220, 0.4)",
        }}
      />

      <PageHeader section="Our Partners" />

      {/* Main Title Section */}
      <View style={{ marginBottom: 14, marginTop: 4 }}>
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#007a96", letterSpacing: 1.5, marginBottom: 4 }}>
          TREKTROV TRAVELS
        </Text>
        <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: "#004d5e", letterSpacing: 0.2 }}>
          Our Partners
        </Text>
        <View style={{ width: 48, height: 3.5, backgroundColor: "#F5A623", borderRadius: 2, marginTop: 6, marginBottom: 12 }} />
        <Text style={{ fontSize: 8.5, color: "#4a7a85", lineHeight: 1.4 }}>
          Partner and service-provider logos are presented as listed in the original package brochure.
        </Text>
      </View>

      {/* Main Partners Card Container */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#d4ecf0",
          paddingHorizontal: 20,
          paddingVertical: 24,
          flex: 1,
          maxHeight: 520,
          justifyContent: "space-around",
        }}
      >
        {PARTNER_LOGOS_ROWS.map((rowGroup, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: rowGroup.row.length === 3 ? "space-around" : "space-between",
              paddingHorizontal: rowGroup.row.length === 3 ? 24 : 8,
              marginVertical: 4,
            }}
          >
            {rowGroup.row.map((item, itemIdx) => (
              <View
                key={itemIdx}
                style={{
                  width: rowGroup.row.length === 3 ? "28%" : "21%",
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                }}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    style={{
                      width: "100%",
                      height: 38,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#004d5e", textAlign: "center" }}>
                    {item.name}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <PageFooter />
    </Page>
  );
};

// ─── Document ─────────────────────────────────────────────────────────────────
const PackagePdfDocument = ({ pkg }: { pkg: PackageData }) => (
  <Document
    title={`${pkg.name} — LetsLive Tours`}
    author="LetsLive Tours"
    subject={`Travel Itinerary — ${pkg.name}`}
  >
    {/* Page 1: Cover Page */}
    <CoverPage pkg={pkg} />

    {/* Page 2: Package Snapshot & Flight Information */}
    <PackageSnapshotPage pkg={pkg} />

    {/* Page 3+: Detailed Itinerary & Logistics */}
    <Page size="A4" style={s.page}>
      <PageHeader section="Package Details & Itinerary" />
      
      <OverviewSection pkg={pkg} />
      <FlightsSection pkg={pkg} />
      <TransferSummarySection pkg={pkg} />
      <ItinerarySection pkg={pkg} />
      <AccommodationSection pkg={pkg} />
      <InclusionsExclusionsSection pkg={pkg} />
      <KnowBeforeYouGoSection pkg={pkg} />
      <ThingsToCarrySection pkg={pkg} />
      <DateChangeNoticeSection pkg={pkg} />
      <PoliciesLinkSection pkg={pkg} />
      <PricingSection pkg={pkg} />
      
      <PageFooter />
    </Page>

    {/* Last Page: Our Partners */}
    <PartnersPage pkg={pkg} />
  </Document>
);

// ─── Export ───────────────────────────────────────────────────────────────────
export async function generatePackagePdf(pkg: PackageData): Promise<void> {
  const blob = await pdf(<PackagePdfDocument pkg={pkg} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.slug || "package"}-itinerary.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
