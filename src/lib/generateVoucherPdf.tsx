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
  ink:     "#0a1a1f",
  ink2:    "#1a3a42",
  ink3:    "#4a7a85",
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
  calendar: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z",
  restaurant: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
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
  flights: any[];
  accommodations: any[];
  transports: any[];
  itinerary: any[];
  transferSummary?: string;
  packageSlug?: string;
  hasPolicies?: boolean;
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { backgroundColor: C.white, fontFamily: "Helvetica", paddingBottom: 60 },
  
  // Header Cover
  headerBlock: {
    backgroundColor: C.gn,
    paddingTop: 40,
    paddingBottom: 70,
    alignItems: "center",
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
  dayLine: { width: 3, backgroundColor: C.gn3, marginRight: 12 },
  dayContent: { flex: 1, paddingVertical: 4 },
  dayHeader: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 6 },
  dayTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.gn },
  mealBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.iv, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  mealBadgeText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.gn3, letterSpacing: 1 },
  dayDesc: { fontSize: 9, color: C.ink2, lineHeight: 1.5, textAlign: "justify" },

  // Footer
  footer: {
    position: "absolute", bottom: 20, left: 0, right: 0,
    alignItems: "center", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, marginHorizontal: 30,
  },
  footerText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.ink2 },
  footerSub: { fontSize: 7, color: C.ink3, marginTop: 3 },
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
  const { operationId, destination, customerName, pax, adults, children, paymentStatus, flights, accommodations, transports, itinerary, transferSummary } = data;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        
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
              <View style={s.cardCol}>
                <Text style={s.cardLabel}>PAYMENT STATUS</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={[s.cardValue, { color: paymentStatus === 'paid' || paymentStatus === 'partial' ? C.gn : C.cu }]}>
                    {paymentStatus === 'paid' ? 'FULL PAID' : paymentStatus === 'partial' ? 'PARTIALLY PAID' : 'PENDING'}
                  </Text>
                  {(paymentStatus === 'paid' || paymentStatus === 'partial') && (
                    <Icon d={ICONS.check} color={C.gn} size={12} />
                  )}
                </View>
              </View>
            </View>
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
                  <Text style={[s.td, { width: "20%" }]}>{f.name}</Text>
                  <Text style={[s.td, { width: "20%" }]}>{formatDateSafe(f.date)}</Text>
                  <Text style={[s.td, { width: "30%" }]}>{f.route}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{f.departureTime || "—"}</Text>
                  <Text style={[s.td, { width: "15%" }]}>{f.arrivalTime || "—"}</Text>
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

        {/* TRANSFER ARRANGEMENTS */}
        {transports.length > 0 && (
          <View style={s.sectionWrapper}>
            <View style={s.sectionHeader}>
              <Icon d={ICONS.car} color={C.gn3} size={14} />
              <Text style={s.sectionTitle}>TRANSFER ARRANGEMENTS</Text>
            </View>
            {transports.map((t: any, i: number) => {
              const legs: any[] = t.legs || [];
              const hasLegData = legs.some((l: any) => l.from || l.to);
              return (
                <View key={i} style={[s.transportBox, { marginTop: i > 0 ? 10 : 0, flexDirection: "column", gap: 0, padding: 14 }]}>
                  {/* Vendor header row */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: hasLegData ? 10 : 0 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={s.tBoxLabel}>OPERATOR / VENDOR</Text>
                      <Text style={s.tBoxValue}>{t.vendorName || "To be updated"}</Text>
                    </View>
                    {(t.vendorContact || t.vendorEmail) && (
                      <View style={{ flex: 2 }}>
                        <Text style={s.tBoxLabel}>CONTACT</Text>
                        {t.vendorContact ? <Text style={s.tBoxValue}>{t.vendorContact}</Text> : null}
                        {t.vendorEmail ? <Text style={{ fontSize: 8, color: C.ink3 }}>{t.vendorEmail}</Text> : null}
                      </View>
                    )}
                    {t.remarks ? (
                      <View style={{ flex: 3 }}>
                        <Text style={s.tBoxLabel}>NOTES</Text>
                        <Text style={{ fontSize: 8, color: C.ink2, lineHeight: 1.4 }}>{t.remarks}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Legs table */}
                  {hasLegData && (
                    <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 }}>
                      {/* Table header */}
                      <View style={{ flexDirection: "row", paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: C.iv2 }}>
                        <Text style={[s.th, { width: "15%" }]}>DAY</Text>
                        <Text style={[s.th, { width: "50%" }]}>ROUTE</Text>
                        <Text style={[s.th, { width: "20%" }]}>VEHICLE</Text>
                        <Text style={[s.th, { width: "15%" }]}>DATE</Text>
                      </View>
                      {legs.filter((l: any) => l.from || l.to).map((leg: any, li: number) => (
                        <View key={li}>
                          <View style={{ flexDirection: "row", paddingVertical: 5, borderBottomWidth: li < legs.length - 1 ? 1 : 0, borderBottomColor: C.iv2 }}>
                            <Text style={[s.td, { width: "15%" }]}>{leg.tripDay || "—"}</Text>
                            <Text style={[s.td, { width: "50%" }]}>
                              {leg.from && leg.to ? `${leg.from}  →  ${leg.to}` : leg.from || leg.to || "—"}
                            </Text>
                            <Text style={[s.td, { width: "20%" }]}>{leg.vehicleType || "—"}</Text>
                            <Text style={[s.td, { width: "15%", color: C.ink3 }]}>{formatDateSafe(leg.date)}</Text>
                          </View>
                          {leg.notes ? (
                            <View style={{ paddingLeft: "15%", paddingBottom: 4 }}>
                              <Text style={{ fontSize: 7, color: C.ink3, fontStyle: "italic" }}>{leg.notes}</Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* OVERALL TRANSFER SUMMARY (fallback if no transport records at all) */}
        {transports.length === 0 && transferSummary && (
          <View style={s.sectionWrapper} wrap={false}>
            <View style={s.sectionHeader}>
              <Icon d={ICONS.car} color={C.gn3} size={14} />
              <Text style={s.sectionTitle}>OVERALL TRANSFER ARRANGEMENTS</Text>
            </View>
            <View style={[s.transportBox, { paddingVertical: 14 }]}>
              <Text style={{ fontSize: 9, color: C.ink2, lineHeight: 1.6 }}>{transferSummary}</Text>
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
                  </View>
                </View>
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
