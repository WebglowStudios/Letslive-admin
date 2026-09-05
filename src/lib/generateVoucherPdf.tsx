import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Svg,
  Path,
  Link,
} from "@react-pdf/renderer";

// ─── Brand palette ────────────────────────────────────────────────────────
const C = {
  gn:      "#004d5e",
  gn2:     "#007a96",
  gn3:     "#00AECC",
  cu:      "#F5A623",
  cuLight: "#FEF3DC",
  ink:     "#0a1a1f",
  ink2:    "#1a3a42",
  ink3:    "#4a7a85",
  ink4:    "#8ab5be",
  iv:      "#f0fafa",
  iv2:     "#e0f5f7",
  line:    "#e2e8f0",
  white:   "#ffffff",
};

// ─── SVG Icon Components ──────────────────────────────────────────────────
const Icon = ({ d, color = C.gn3, size = 12 }: { d: string; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d={d} fill={color} />
  </Svg>
);

const ICONS = {
  flight: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  hotel: "M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z",
  car: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  bus: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
  train: "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm4 0h-5V6h5v4zm1.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  boat: "M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.93V7c0-1.1-.9-2-2-2h-3V3h-2v2h-2V3H9v2H6c-1.1 0-2 .9-2 2v3.93l-1.28.11c-.26.08-.48.26-.6.5s-.14.52-.06.78L3.95 19zM6 7h12v4.22l-6-1.5-6 1.5V7z",
  calendar: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z",
  restaurant: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z",
  arrowForward: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
};

const getVehicleIcon = (type?: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("flight") || t.includes("air")) return ICONS.flight;
  if (t.includes("train") || t.includes("rail")) return ICONS.train;
  if (t.includes("boat") || t.includes("ferry") || t.includes("cruise") || t.includes("speed")) return ICONS.boat;
  if (t.includes("bus") || t.includes("coach")) return ICONS.bus;
  return ICONS.car;
};

// ─── Types ──────────────────────────────────────────────────────────────────
export interface VoucherData {
  operationId: string;
  destination: string;
  customerName: string;
  pax: number;
  adults?: number;
  children?: number;
  paymentStatus: string;
  totalAmount?: number;
  paidAmount?: number;
  isInternational?: boolean;
  visaIncluded?: boolean;
  flightsIncluded?: boolean;
  flights: any[];
  accommodations: any[];
  transports: any[];
  itinerary: any[];
  activities?: any[];
  transferSummary?: string;
  packageSlug?: string;
  hasPolicies?: boolean;
  dateChangeHistory?: { oldDate: string; newDate: string; reason: string; changedAt: string }[];
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    paddingTop: 52,
    paddingBottom: 50,
    paddingHorizontal: 0,
  },
  
  // Running Header on Page 2+
  pageHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingTop: 14,
  },
  pageHeaderInner: {
    marginBottom: 8,
  },
  headerLine: {
    height: 2.5,
    backgroundColor: C.gn,
    marginBottom: 6,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBrand: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.gn2,
    letterSpacing: 2.5,
  },
  headerSection: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.ink3,
    letterSpacing: 0.8,
  },

  // Header Cover
  headerBlock: {
    backgroundColor: C.gn,
    paddingTop: 40,
    paddingBottom: 70,
    alignItems: "center",
    marginTop: -52,
  },
  brandTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 4 },
  tagline: { fontSize: 8, color: C.iv2, letterSpacing: 3, marginTop: 4 },
  voucherSubtitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.cu, letterSpacing: 2, marginTop: 16 },

  // Overlapping White Card
  cardWrapper: { paddingHorizontal: 30, marginTop: -40, marginBottom: 20 },
  mainCard: {
    backgroundColor: C.white,
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: C.line,
  },
  destinationTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", color: C.gn, textAlign: "center", letterSpacing: 4, marginBottom: 20, textTransform: "uppercase" },
  cardDivider: { height: 1, backgroundColor: C.line, marginBottom: 16 },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  cardCol: { flex: 1 },
  cardLabel: { fontSize: 8, color: C.ink3, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  cardValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink2, textTransform: "uppercase" },

  // Sections
  sectionWrapper: { paddingHorizontal: 30, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.gn, textTransform: "uppercase", letterSpacing: 1 },

  // Tables
  table: { width: "100%", borderTopWidth: 1, borderTopColor: C.line },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 10 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 },
  th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.ink, textTransform: "uppercase", letterSpacing: 1 },
  td: { fontSize: 8, color: C.ink2 },
  
  // Transport Box
  transportBox: {
    flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 16, gap: 20,
  },
  tBoxCol: { flex: 1 },
  tBoxLabel: { fontSize: 8, color: C.ink3, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  tBoxValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink2 },

  // Itinerary
  dayBlock: { flexDirection: "row", marginBottom: 16 },
  dayLine: { width: 3, backgroundColor: C.gn3, marginRight: 12, borderRadius: 1.5 },
  dayContent: { flex: 1, paddingVertical: 4 },
  dayHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 6 },
  dayTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.gn },
  mealBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.iv, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  mealBadgeText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.gn3, letterSpacing: 1 },
  dayDesc: { fontSize: 9, color: C.ink2, lineHeight: 1.5, textAlign: "justify" },

  // Transfers within Day
  transferSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 8,
  },
  transferHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  transferHeaderTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.ink3,
    letterSpacing: 1,
  },
  transferCard: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2.5,
    borderLeftColor: C.cu,
  },
  transferTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  transferTitleText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.gn,
  },
  vehicleBadge: {
    backgroundColor: C.iv2,
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: C.line,
  },
  vehicleBadgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.gn2,
    letterSpacing: 0.5,
  },
  routeBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    marginTop: 2,
  },
  fromBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    backgroundColor: C.iv,
    borderRadius: 4,
    padding: 5,
    borderWidth: 1,
    borderColor: C.line,
  },
  toBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    backgroundColor: C.cuLight,
    borderRadius: 4,
    padding: 5,
    borderWidth: 1,
    borderColor: "#f5e3c8",
  },
  fromToLabel: {
    fontSize: 5.5,
    fontFamily: "Helvetica-Bold",
    color: C.ink4,
    letterSpacing: 1,
  },
  fromToValue: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.gn,
  },
  metaChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 3,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.iv,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.line,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  metaChipLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: C.ink3,
    letterSpacing: 0.5,
  },
  metaChipValue: {
    fontSize: 7,
    color: C.ink2,
  },
  transferNotes: {
    fontSize: 7,
    color: C.ink3,
    marginTop: 3,
    fontStyle: "italic",
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    position: "absolute", bottom: 20, left: 0, right: 0,
    alignItems: "center", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, marginHorizontal: 30,
  },
  footerText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.ink2 },
  footerSub: { fontSize: 7, color: C.ink3, marginTop: 3 },
  footerPage: { fontSize: 7, color: C.ink3, marginTop: 2 },
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDateSafe = (d: any) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return String(d);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch {
    return String(d);
  }
};

// ─── Document Component ─────────────────────────────────────────────────────
const VoucherDocument = ({ data }: { data: VoucherData }) => {
  const { operationId, destination, customerName, pax, adults, children, paymentStatus, totalAmount, paidAmount, isInternational, visaIncluded, flightsIncluded, flights, accommodations, transports, itinerary, activities, transferSummary } = data;

  const transfersByDay: Record<number | string, any[]> = {};
  
  // Transfers from transports (flights/trains/cabs)
  transports?.forEach((t: any) => {
    (t.legs || []).forEach((leg: any) => {
      const str = String(leg.tripDay || '').trim();
      const dayMatch = str.match(/\d+/);
      let dayNum = dayMatch ? parseInt(dayMatch[0], 10) : null;

      // Handle common textual days like "Arrival", "Pickup", "Departure", "Drop"
      if (dayNum === null && str) {
        if (/arrival|pickup/i.test(str)) {
          dayNum = 1;
        } else if (/departure|drop|return/i.test(str)) {
          dayNum = itinerary?.length || 1;
        }
      }

      // If no tripDay specified but has driver or vehicle details, assign to Day 1 so driver details are visible
      if (dayNum === null && !str && (leg.driverName || leg.driverContact || leg.vehicleNumber)) {
        dayNum = 1;
      }

      if (dayNum !== null) {
        if (!transfersByDay[dayNum]) transfersByDay[dayNum] = [];
        transfersByDay[dayNum].push({ ...leg, type: t.type, title: t.title });
      }
      if (str) {
        if (!transfersByDay[str]) transfersByDay[str] = [];
        if (dayNum === null) {
          transfersByDay[str].push({ ...leg, type: t.type, title: t.title });
        }
      }
    });
  });

  // Road transfers from activities (itinerary days)
  activities?.forEach((a: any, idx: number) => {
    const dayMatch = String(a.tripDay || '').match(/\d+/);
    const dayNum = dayMatch ? parseInt(dayMatch[0], 10) : (idx + 1);

    (a.transfers || []).forEach((tr: any) => {
      if (!transfersByDay[dayNum]) transfersByDay[dayNum] = [];
      transfersByDay[dayNum].push({
        from: tr.from,
        to: tr.to,
        title: tr.title,
        vehicleType: tr.vehicleType,
        departureTime: tr.departureTime,
        arrivalTime: tr.arrivalTime,
        driverName: tr.driverName,
        driverContact: tr.driverContact,
        vehicleNumber: tr.vehicleNumber,
        notes: tr.notes,
        type: 'road',
      });
    });
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        {/* Running Header on Page 2+ */}
        <View
          fixed
          style={s.pageHeader}
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <View style={s.pageHeaderInner}>
                <View style={s.headerLine} />
                <View style={s.headerRow}>
                  <Text style={s.headerBrand}>LETS LIVE TOURS</Text>
                  <Text style={s.headerSection}>
                    TRIP VOUCHER & ITINERARY — {destination.toUpperCase()}
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Header Block */}
        <View style={s.headerBlock}>
          <Text style={s.brandTitle}>LETS LIVE TOURS</Text>
          <Text style={s.tagline}>EXPLORE THE UNEXPLORED</Text>
          <Text style={s.voucherSubtitle}>OFFICIAL CONFIRMATION VOUCHER</Text>
        </View>

        {/* Overlapping Card */}
        <View style={s.cardWrapper}>
          <View style={s.mainCard}>
            <Text style={s.destinationTitle}>{destination}</Text>
            {(isInternational || flightsIncluded !== undefined) && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: -4, marginBottom: 12 }}>
                  {isInternational && (
                    <View style={{ backgroundColor: visaIncluded ? C.iv2 : "rgba(245,166,35,.1)", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: visaIncluded ? C.gn : C.cu }}>
                        {visaIncluded ? "✓ VISA INCLUDED" : "⚠ VISA NOT INCLUDED"}
                      </Text>
                    </View>
                  )}
                  {flightsIncluded !== undefined && (
                    <View style={{ backgroundColor: flightsIncluded ? C.iv2 : "rgba(245,166,35,.1)", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                      <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: flightsIncluded ? C.gn : C.cu }}>
                        {flightsIncluded ? "✈ FLIGHTS INCLUDED" : "⚠ FLIGHTS NOT INCLUDED"}
                      </Text>
                    </View>
                  )}
              </View>
            )}
            <View style={s.cardDivider} />
            <View style={s.cardRow}>
              <View style={s.cardCol}>
                <Text style={s.cardLabel}>LEAD GUEST</Text>
                <Text style={s.cardValue}>{customerName}</Text>
              </View>
              <View style={s.cardCol}>
                <Text style={s.cardLabel}>PERSONS</Text>
                <Text style={s.cardValue}>
                  {adults || children ? `${adults || 0}A${children ? ` / ${children}C` : ''}` : pax}
                </Text>
              </View>
              <View style={s.cardCol}>
                <Text style={s.cardLabel}>BOOKING ID</Text>
                <Text style={s.cardValue}>{operationId}</Text>
              </View>
            </View>
            
            {/* Payment Status Row */}
            {totalAmount !== undefined && (
              <>
                <View style={[s.cardDivider, { marginTop: 16 }]} />
                <View style={s.cardRow}>
                  <View style={s.cardCol}>
                    <Text style={s.cardLabel}>TOTAL AMOUNT</Text>
                    <Text style={s.cardValue}>₹{totalAmount.toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={s.cardCol}>
                    <Text style={s.cardLabel}>PAID AMOUNT</Text>
                    <Text style={[s.cardValue, { color: C.gn2 }]}>₹{(paidAmount || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={s.cardCol}>
                    <Text style={s.cardLabel}>PAYMENT STATUS</Text>
                    <Text style={[s.cardValue, { color: paymentStatus === "paid" || paymentStatus === "full" ? C.gn : (paymentStatus === "partial" ? C.cu : "#dc3545") }]}>
                      {paymentStatus === "paid" || paymentStatus === "full" ? "FULLY PAID" : paymentStatus.toUpperCase()}
                    </Text>
                  </View>
                  {paymentStatus === "partial" && (
                    <View style={s.cardCol}>
                      <Text style={s.cardLabel}>PENDING AMOUNT</Text>
                      <Text style={[s.cardValue, { color: C.cu }]}>₹{(totalAmount - (paidAmount || 0)).toLocaleString("en-IN")}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>

        {/* FLIGHT SCHEDULE */}
        {flights.length > 0 && (
          <View style={s.sectionWrapper} wrap={false}>
            <View style={s.sectionHeader}>
              <Icon d={ICONS.flight} color={C.gn3} size={14} />
              <Text style={s.sectionTitle}>FLIGHT SCHEDULE</Text>
            </View>
            <View style={s.table}>
              <View style={s.tableHeaderRow}>
                <Text style={[s.th, { width: "20%" }]}>AIRLINE</Text>
                <Text style={[s.th, { width: "20%" }]}>DATE</Text>
                <Text style={[s.th, { width: "30%" }]}>ROUTE</Text>
                <Text style={[s.th, { width: "15%" }]}>DEP.</Text>
                <Text style={[s.th, { width: "15%" }]}>ARR.</Text>
              </View>
              {flights.map((f, i) => (
                <View style={s.tableRow} key={i}>
                  <Text style={[s.td, { width: "20%" }]}>{f.airline || f.name || "—"}</Text>
                  <Text style={[s.td, { width: "20%" }]}>{formatDateSafe(f.date)}</Text>
                  <Text style={[s.td, { width: "30%" }]}>{f.from && f.to ? `${f.from} → ${f.to}` : (f.route || "—")}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{f.departure || f.departureTime || "—"}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{f.arrival || f.arrivalTime || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ACCOMMODATION DETAILS */}
        {accommodations.length > 0 && (
          <View style={s.sectionWrapper} wrap={false}>
            <View style={s.sectionHeader}>
              <Icon d={ICONS.hotel} color={C.cu} size={14} />
              <Text style={s.sectionTitle}>ACCOMMODATION DETAILS</Text>
            </View>
            <View style={s.table}>
              <View style={s.tableHeaderRow}>
                <Text style={[s.th, { width: "15%" }]}>AREA</Text>
                <Text style={[s.th, { width: "20%" }]}>HOTEL NAME</Text>
                <Text style={[s.th, { width: "15%" }]}>ROOM CAT.</Text>
                <Text style={[s.th, { width: "20%" }]}>CONF. NO.</Text>
                <Text style={[s.th, { width: "10%" }]}>MEAL PLAN</Text>
                <Text style={[s.th, { width: "10%" }]}>CHECK-IN</Text>
                <Text style={[s.th, { width: "10%" }]}>CHECK-OUT</Text>
              </View>
              {accommodations.map((a, i) => (
                <View style={s.tableRow} key={i}>
                  <Text style={[s.td, { width: "15%" }]}>{a.area}</Text>
                  <Text style={[s.td, { width: "20%" }]}>{a.name}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{a.roomCategory}</Text>
                  <Text style={[s.td, { width: "20%" }]}>{a.confirmationNumber}</Text>
                  <Text style={[s.td, { width: "10%" }]}>{a.mealPlan}</Text>
                  <Text style={[s.td, { width: "10%" }]}>{formatDateSafe(a.checkIn)}</Text>
                  <Text style={[s.td, { width: "10%" }]}>{formatDateSafe(a.checkOut)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}




        {/* DAY-WISE ITINERARY */}
        {itinerary && itinerary.length > 0 && (
          <View style={s.sectionWrapper}>
            <View style={s.sectionHeader}>
              <Icon d={ICONS.calendar} color={C.gn3} size={14} />
              <Text style={s.sectionTitle}>DAY-WISE ITINERARY</Text>
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 16 }}>
              {itinerary.map((day, i) => (
                <View style={s.dayBlock} key={i} wrap={false}>
                  <View style={s.dayLine} />
                  <View style={s.dayContent}>
                    <View style={s.dayHeader}>
                      <Text style={s.dayTitle}>
                        DAY {day.day}: {day.title}
                      </Text>
                      {day.meals && day.meals.length > 0 && (
                        <View style={s.mealBadge}>
                          <Icon d={ICONS.restaurant} color={C.gn3} size={8} />
                          <Text style={s.mealBadgeText}>{day.meals.join(" & ").toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.dayDesc}>{day.description}</Text>
                    {/* Transfers for this day - Upgraded Card Layout */}
                    {(() => {
                      const dayTransfers: any[] = [];
                      const seen = new Set<string>();

                      const addIfUnique = (leg: any) => {
                        if (!leg) return;
                        const key = `${leg.title || ''}-${leg.from || ''}-${leg.to || ''}-${leg.departureTime || ''}-${leg.pnr || ''}-${leg.vehicleNumber || ''}-${leg.driverName || ''}-${leg.driverContact || ''}`;
                        if (!seen.has(key)) {
                          seen.add(key);
                          dayTransfers.push(leg);
                        }
                      };

                      (transfersByDay[day.day] || []).forEach(addIfUnique);
                      (transfersByDay[String(day.day)] || []).forEach(addIfUnique);
                      if (Array.isArray((day as any).transfers)) {
                        (day as any).transfers.forEach(addIfUnique);
                      }

                      if (dayTransfers.length === 0) return null;
                      return (
                        <View style={s.transferSection}>
                          <View style={s.transferHeaderRow}>
                            <Icon d={ICONS.bus} color={C.cu} size={10} />
                            <Text style={s.transferHeaderTitle}>TRANSFERS & TRANSPORTATION</Text>
                          </View>
                          {dayTransfers.map((leg: any, li: number) => {
                            const iconData = getVehicleIcon(leg.transferType || leg.vehicleType || leg.type);
                            const title = leg.title || (leg.from && leg.to ? `${leg.from} to ${leg.to}` : "Transfer");
                            const hasRoute = Boolean(leg.from || leg.to);
                            const hasDriverOrVeh = Boolean(leg.driverName || leg.driverContact || leg.vehicleNumber);
                            const hasTimings = Boolean(leg.departureTime || leg.arrivalTime || leg.pnr);
                            return (
                              <View key={li} style={s.transferCard}>
                                <View style={s.transferTitleRow}>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                                    <Icon d={iconData} color={C.cu} size={10} />
                                    <Text style={s.transferTitleText}>{title}</Text>
                                  </View>
                                  {(leg.vehicleType || leg.type) && (
                                    <View style={s.vehicleBadge}>
                                      <Text style={s.vehicleBadgeText}>
                                        {(leg.vehicleType || leg.type).toUpperCase()}
                                      </Text>
                                    </View>
                                  )}
                                </View>

                                {/* Route Visualizer (FROM -> TO) */}
                                {hasRoute && (
                                  <View style={s.routeBoxRow}>
                                    {leg.from ? (
                                      <View style={s.fromBox}>
                                        <Icon d={ICONS.location} color={C.gn3} size={9} />
                                        <View style={{ flex: 1 }}>
                                          <Text style={s.fromToLabel}>FROM</Text>
                                          <Text style={s.fromToValue}>{leg.from}</Text>
                                        </View>
                                      </View>
                                    ) : null}

                                    {leg.from && leg.to ? (
                                      <Icon d={ICONS.arrowForward} color={C.cu} size={10} />
                                    ) : null}

                                    {leg.to ? (
                                      <View style={s.toBox}>
                                        <Icon d={ICONS.location} color={C.cu} size={9} />
                                        <View style={{ flex: 1 }}>
                                          <Text style={[s.fromToLabel, { color: C.cu }]}>TO</Text>
                                          <Text style={s.fromToValue}>{leg.to}</Text>
                                        </View>
                                      </View>
                                    ) : null}
                                  </View>
                                )}

                                {/* Logistics & Voucher Chips */}
                                {(hasTimings || hasDriverOrVeh) && (
                                  <View style={s.metaChipsRow}>
                                    {leg.departureTime && (
                                      <View style={s.metaChip}>
                                        <Text style={s.metaChipLabel}>DEP:</Text>
                                        <Text style={s.metaChipValue}>{leg.departureTime}</Text>
                                      </View>
                                    )}
                                    {leg.arrivalTime && (
                                      <View style={s.metaChip}>
                                        <Text style={s.metaChipLabel}>ARR:</Text>
                                        <Text style={s.metaChipValue}>{leg.arrivalTime}</Text>
                                      </View>
                                    )}
                                    {leg.pnr && (
                                      <View style={[s.metaChip, { backgroundColor: C.cuLight, borderColor: "#f5e3c8" }]}>
                                        <Text style={[s.metaChipLabel, { color: C.cu }]}>PNR:</Text>
                                        <Text style={[s.metaChipValue, { fontFamily: "Helvetica-Bold" }]}>{leg.pnr}</Text>
                                      </View>
                                    )}
                                    {leg.driverName && (
                                      <View style={s.metaChip}>
                                        <Text style={s.metaChipLabel}>DRIVER:</Text>
                                        <Text style={s.metaChipValue}>{leg.driverName}</Text>
                                      </View>
                                    )}
                                    {leg.driverContact && (
                                      <View style={s.metaChip}>
                                        <Text style={s.metaChipLabel}>CONTACT:</Text>
                                        <Text style={s.metaChipValue}>{leg.driverContact}</Text>
                                      </View>
                                    )}
                                    {leg.vehicleNumber && (
                                      <View style={s.metaChip}>
                                        <Text style={s.metaChipLabel}>VEHICLE NO:</Text>
                                        <Text style={[s.metaChipValue, { fontFamily: "Helvetica-Bold" }]}>{leg.vehicleNumber}</Text>
                                      </View>
                                    )}
                                  </View>
                                )}

                                {leg.notes ? (
                                  <Text style={s.transferNotes}>{leg.notes}</Text>
                                ) : null}
                              </View>
                            );
                          })}
                        </View>
                      );
                    })()}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* DATE CHANGE NOTICE */}
        {data.dateChangeHistory && data.dateChangeHistory.length > 0 && (
          <View style={s.sectionWrapper} wrap={false}>
            <View style={s.sectionHeader}>
              <Icon d={ICONS.check} color={C.cu} size={14} />
              <Text style={[s.sectionTitle, { color: C.cu }]}>DATE CHANGE NOTICE</Text>
            </View>
            <View style={{ marginBottom: 12, padding: 12, backgroundColor: C.iv, borderLeftWidth: 3, borderLeftColor: C.cu, borderRadius: 4 }}>
              {data.dateChangeHistory.map((h, i) => (
                <Text key={i} style={{ fontSize: 9, color: C.ink, marginBottom: 4 }}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>Travel date changed</Text> from {new Date(h.oldDate).toLocaleDateString()} to {new Date(h.newDate).toLocaleDateString()}.
                  {"\n"}Reason: <Text style={{ fontStyle: "italic", color: C.ink3 }}>{h.reason}</Text>
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* IMPORTANT POLICIES LINK */}
        {data.hasPolicies && data.packageSlug && (
          <View style={s.sectionWrapper} wrap={false}>
            <View style={s.sectionHeader}>
              <Icon d={ICONS.check} color={C.gn3} size={14} />
              <Text style={s.sectionTitle}>IMPORTANT POLICIES</Text>
            </View>
            <View style={[s.transportBox, { paddingVertical: 14 }]}>
              <Text style={{ fontSize: 9, color: C.ink2, lineHeight: 1.6 }}>
                For Payment, Cancellation, and Flight Cancellation policies, please refer to the detailed policies section on your package page online:{" "}
                <Link src={`https://letslivetours.com/packages/${data.packageSlug}`} style={{ color: C.gn3, textDecoration: "none" }}>Click here to view Policies</Link>
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Lets Live Tours | Pune, Maharashtra | Experiences that touch souls.</Text>
          <Text style={s.footerSub}>800+ customers served last year to this unexplored paradise.</Text>
          <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
};

export const generateVoucherPdf = async (data: VoucherData) => {
  const blob = await pdf(<VoucherDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Voucher_${data.operationId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
