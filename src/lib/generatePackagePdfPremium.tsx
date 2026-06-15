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
} from "@react-pdf/renderer";

// ─── Premium Brand Palette (Magazine Editorial Style) ────────────────────────
const C = {
  primary:      "#004d5e",   // LetsLive Primary Dark Teal
  primaryLight: "#e0f5f7",   // Light teal tint
  accent:       "#F5A623",   // LetsLive Accent Gold/Amber
  accentLight:  "#FEF3DC",   // LetsLive Gold/Amber tint
  slate:        "#0a1a1f",   // LetsLive Ink Dark
  slateLight:   "#f0fafa",   // LetsLive Ivory page bg tint
  border:       "#d4ecf0",   // LetsLive Light line border
  white:        "#ffffff",
  ink:          "#0a1a1f",   // LetsLive Ink Dark
  ink3:         "#1a3a42",   // LetsLive Secondary Ink
  ink4:         "#4a7a85",   // LetsLive Tertiary Ink
  teal:         "#007a96",   // LetsLive Secondary Teal
  tealLight:    "#e0f5f7",   
  rose:         "#be123c",   // Exclusions red/rose
  roseLight:    "#fff1f2",
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const Icon = ({ d, color = C.accent, size = 11 }: { d: string; color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d={d} fill={color} />
  </Svg>
);

const ICONS = {
  location: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z",
  calendar: "M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  hotel: "M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z",
  restaurant: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z",
  bus: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
  activity: "M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation: string;
}
interface Stay {
  name: string; rating: string; nights: number; roomType: string; amenities: string[];
}
interface Activity {
  title: string; description: string; duration: string; details: string[];
}
interface Transfer {
  title: string; description: string; transferType?: string; vehicleType?: string;
  from?: string; to?: string; stops?: string[]; details: string[];
}
interface PackageData {
  name: string; slug: string;
  destination?: { name: string; slug?: string; country?: string };
  description?: string; shortDescription?: string;
  duration: { nights: number; days: number };
  hotelRating?: string; category?: string;
  price: number; originalPrice?: number; priceUnit?: string; discount?: number;
  badge?: string; rating?: number; reviewCount?: number;
  highlights?: string[]; keyPoints?: string[];
  itinerary?: ItineraryDay[];
  inclusions?: string[]; exclusions?: string[];
  stays?: Stay[]; activities?: Activity[]; transfers?: Transfer[];
  knowBeforeYouGo?: string[]; thingsToCarry?: string[];
  images?: string[]; heroImage?: string;
  destinationImages?: string[]; stayImages?: string[]; activityImages?: string[];
  isCustom?: boolean; clientName?: string; clientEmail?: string; clientPhone?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Cover Page (Asymmetric Vertical Split) ─────────────────────────────────
  coverPage: {
    flexDirection: "column",
    width: "100%",
    height: "100%",
    backgroundColor: C.primary,
    padding: 30,
    justifyContent: "space-between",
  },
  coverTopImgBlock: {
    width: "100%",
    height: 330,
    position: "relative",
    marginBottom: 15,
  },
  coverTopImg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    objectFit: "cover",
  },
  coverTopImgOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 10,
    borderWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.15)",
  },
  coverBottomInfoBlock: {
    flex: 1,
    justifyContent: "space-between",
  },
  logoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  logoBox: {
    width: 24, height: 24,
    backgroundColor: C.accent,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary,
  },
  brandText: {
    fontSize: 10, fontFamily: "Helvetica-Bold", color: C.white,
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 7, color: C.border, letterSpacing: 1.5, marginTop: 2,
  },
  coverMiddle: {
    marginTop: 10,
  },
  coverCategory: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.accent,
    letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8,
  },
  coverTitle: {
    fontSize: 24, fontFamily: "Helvetica-Bold", color: C.white,
    lineHeight: 1.15, marginBottom: 10,
  },
  coverDestLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coverDestText: {
    fontSize: 12, color: C.white, fontFamily: "Helvetica-Bold",
  },
  coverPricePill: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 18,
    paddingVertical: 4, paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  coverPricePillText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent,
  },
  coverClientCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.accent,
    marginTop: 10,
  },
  coverClientLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.accent,
    letterSpacing: 1.5, marginBottom: 4,
  },
  coverClientName: {
    fontSize: 12, fontFamily: "Helvetica-Bold", color: C.white,
  },
  coverClientDetail: {
    fontSize: 7.5, color: "rgba(255, 255, 255, 0.5)", marginTop: 2,
  },
  coverFooter: {
    fontSize: 7.5, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5,
  },

  // ── Content Page Layout (Modern Editorial Pages) ──────────────────────────
  page: {
    paddingTop: 46, paddingBottom: 42, paddingHorizontal: 46,
    backgroundColor: C.white,
  },
  pageHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 46, paddingTop: 16,
  },
  headerLine: {
    height: 2, backgroundColor: C.primary, marginBottom: 6,
  },
  headerInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerBrand: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 3,
  },
  headerSection: {
    fontSize: 7, color: C.ink3, letterSpacing: 1,
  },
  pageFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 46, paddingBottom: 16,
  },
  footerLine: {
    height: 1, backgroundColor: C.primaryLight, marginBottom: 6,
  },
  footerInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerText: {
    fontSize: 7, color: C.ink3,
  },
  footerPage: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.primary,
  },

  // ── Magazine-Style Section Heading ─────────────────────────────────────────
  sectionBlock: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 14, fontFamily: "Helvetica-Bold", color: C.primary,
    letterSpacing: 0.5, textTransform: "uppercase",
  },
  sectionSubtitleLine: {
    height: 1.5, backgroundColor: C.accent, marginTop: 4, width: 28,
  },

  // ── 2-Column Summary Section ───────────────────────────────────────────────
  summaryRow: {
    flexDirection: "row", gap: 18, marginBottom: 18,
  },
  summaryMain: {
    flex: 1,
  },
  summarySidebar: {
    width: "36%",
    backgroundColor: C.slate,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3, borderLeftColor: C.accent,
  },
  sidebarStatBlock: {
    marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.06)",
    paddingBottom: 10,
  },
  sidebarStatLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.accent,
    letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3,
  },
  sidebarStatVal: {
    fontSize: 11.5, fontFamily: "Helvetica-Bold", color: C.white,
  },
  sidebarStatValGold: {
    fontSize: 14, fontFamily: "Helvetica-Bold", color: C.accent,
  },

  // ── Styled Cards Grid (Highlights / stays / checklist) ────────────────────
  descText: {
    fontSize: 9.5, color: C.ink, lineHeight: 1.6, marginBottom: 14,
  },
  chipContainer: {
    flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 10,
  },
  incChip: {
    backgroundColor: C.tealLight,
    borderWidth: 1, borderColor: "rgba(15, 118, 110, 0.12)",
    borderRadius: 5, paddingVertical: 4.5, paddingHorizontal: 10,
  },
  incChipText: {
    fontSize: 8, color: C.teal, fontFamily: "Helvetica-Bold",
  },

  // ── Mosaic Photo Gallery ───────────────────────────────────────────────────
  galleryHeroBox: {
    width: "100%", height: 160,
    borderRadius: 10, overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  galleryHeroImg: {
    width: "100%", height: "100%", objectFit: "cover",
  },
  galleryRow: {
    flexDirection: "row", gap: 10,
  },
  galleryColItem: {
    flex: 1, height: 95,
    borderRadius: 8, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
  },
  galleryColImg: {
    width: "100%", height: "100%", objectFit: "cover",
  },

  // ── Highlight Cards Grid ───────────────────────────────────────────────────
  highlightsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
  highlightCard: {
    width: "48.5%",
    backgroundColor: C.slateLight,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 3, borderLeftColor: C.accent,
    borderRadius: 6, padding: 10,
  },
  highlightCardText: {
    fontSize: 8.5, color: C.ink, lineHeight: 1.45,
  },

  // ── Timeline Day-wise Itinerary ────────────────────────────────────────────
  timelineContainer: {
    position: "relative",
    paddingLeft: 16,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineIndicatorColumn: {
    width: 32,
    alignItems: "center",
    position: "relative",
  },
  timelineBadge: {
    width: 24, height: 24,
    borderRadius: 12,
    backgroundColor: C.primary,
    borderWidth: 2, borderColor: C.accentLight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  timelineBadgeText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white,
  },
  timelineVerticalLine: {
    position: "absolute",
    top: 24, bottom: -16,
    width: 1.5,
    backgroundColor: C.border,
    zIndex: 1,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 8,
    borderWidth: 1, borderColor: C.border,
    padding: 12,
  },
  timelineCardTitle: {
    fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.primary,
    marginBottom: 5,
  },
  timelineCardDesc: {
    fontSize: 8.5, color: C.ink, lineHeight: 1.5, marginBottom: 8,
  },

  // ── Premium Nested Timeline Cards ──────────────────────────────────────────
  actNestedCard: {
    backgroundColor: C.slateLight,
    borderRadius: 6,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 2.5, borderLeftColor: C.accent,
    padding: 10,
    marginBottom: 6,
  },
  transNestedCard: {
    backgroundColor: C.slateLight,
    borderRadius: 6,
    borderWidth: 1, borderColor: C.border,
    borderLeftWidth: 2.5, borderLeftColor: C.rose,
    padding: 10,
    marginBottom: 6,
  },
  timelineCardHeader: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 3,
  },
  timelineSubText: {
    fontSize: 8, color: C.ink3, lineHeight: 1.4,
  },
  timelineBadgeRow: {
    flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3,
  },
  timelineDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.accent,
  },
  dayMeta: {
    flexDirection: "row", gap: 14,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 8, marginTop: 4,
  },
  dayMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  dayMetaLabel: {
    fontSize: 7, fontFamily: "Helvetica-Bold",
    color: C.ink3, letterSpacing: 0.5,
  },
  dayMetaValue: { fontSize: 8, color: C.ink },

  // ── Stays Stacked Cards ────────────────────────────────────────────────────
  stayCardsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  stayCard: {
    width: "48.5%",
    backgroundColor: C.slateLight,
    borderWidth: 1, borderColor: C.border,
    borderTopWidth: 3, borderTopColor: C.primary,
    borderRadius: 8,
    padding: 12,
  },
  stayCardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 5,
  },
  stayName: {
    fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.primary, width: "70%",
  },
  stayRating: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent,
  },
  stayNights: {
    fontSize: 8, color: C.ink3, marginBottom: 3,
  },
  stayAmenities: {
    fontSize: 7.5, color: C.ink, lineHeight: 1.35, marginTop: 4,
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 4,
  },

  // ── Inclusions Exclusions Magazine Cards ───────────────────────────────────
  incExcRow: {
    flexDirection: "row", gap: 12,
  },
  incCol: {
    flex: 1, borderRadius: 8, padding: 14,
    backgroundColor: C.tealLight,
    borderWidth: 1, borderColor: "rgba(15, 118, 110, 0.15)",
    borderLeftWidth: 3, borderLeftColor: C.teal,
  },
  excCol: {
    flex: 1, borderRadius: 8, padding: 14,
    backgroundColor: C.roseLight,
    borderWidth: 1, borderColor: "rgba(190, 18, 60, 0.15)",
    borderLeftWidth: 3, borderLeftColor: C.rose,
  },
  incExcHeading: {
    fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 4,
  },
  incDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: C.teal, marginRight: 6, marginTop: 4, flexShrink: 0,
  },
  excDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: C.rose, marginRight: 6, marginTop: 4, flexShrink: 0,
  },
  incExcText: {
    fontSize: 8, color: C.ink, flex: 1, lineHeight: 1.4,
  },
  bulletTealDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.teal, marginRight: 8, marginTop: 4, flexShrink: 0,
  },
  bulletText: {
    fontSize: 9, color: C.ink, flex: 1, lineHeight: 1.5,
  },
  kbygRow: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 10,
  },
  kbygNumBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.primary, justifyContent: "center",
    alignItems: "center", marginRight: 10, flexShrink: 0,
  },
  kbygNumText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  kbygText: { fontSize: 9, color: C.ink, flex: 1, lineHeight: 1.5 },
  carryDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: C.accent, marginRight: 8, marginTop: 4.5, flexShrink: 0,
  },
  carryText: { fontSize: 9, color: C.ink, flex: 1, lineHeight: 1.45 },

  // ── Boarding Pass Pricing Ticket ───────────────────────────────────────────
  ticketContainer: {
    flexDirection: "row",
    borderWidth: 1.5, borderColor: C.primary,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
  },
  ticketMain: {
    width: "66%",
    backgroundColor: C.primary,
    padding: 18,
    justifyContent: "center",
  },
  ticketStub: {
    flex: 1,
    backgroundColor: C.slateLight,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  ticketDottedDivider: {
    width: 1,
    borderStyle: "dashed",
    borderLeftWidth: 1.5,
    borderLeftColor: C.white,
    backgroundColor: C.primary,
  },
  ticketLabel: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.6)",
    letterSpacing: 2, marginBottom: 4,
  },
  ticketAmount: {
    fontSize: 28, fontFamily: "Helvetica-Bold", color: C.accent,
  },
  ticketSub: {
    fontSize: 8, color: "rgba(255,255,255,0.5)", marginTop: 2,
  },
  ticketDiscountBadge: {
    backgroundColor: C.accentLight,
    borderRadius: 12,
    paddingVertical: 3, paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  ticketDiscountText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent,
  },
  ticketStubHeader: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 0.5, marginBottom: 4,
  },
  ticketStubText: {
    fontSize: 7.5, color: C.ink3, textAlign: "center", marginBottom: 6,
  },
  ticketStubContact: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent,
    backgroundColor: C.white, borderHeight: 1, borderColor: C.accent,
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 5,
  },

  // ── Contact Callout ────────────────────────────────────────────────────────
  bookingBox: {
    backgroundColor: C.slateLight,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 8, padding: 16,
    alignItems: "center",
  },
  bookingTitle: {
    fontSize: 11, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 8.5, color: C.ink3, textAlign: "center", marginBottom: 8, lineHeight: 1.4,
  },
  bookingContact: {
    fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.accent,
  },
});

// ─── Shared Subcomponents ────────────────────────────────────────────────────

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
    <Text style={s.sectionTitle}>{title}</Text>
    <View style={s.sectionSubtitleLine} />
  </View>
);

// ─── Cover Page (Asymmetric Vertical Split) ─────────────────────────────────
const CoverPage = ({ pkg }: { pkg: PackageData }) => (
  <Page size="A4" style={{ padding: 0 }}>
    <View style={s.coverPage}>
      {/* Top Section - Large Scenic Hero Cover */}
      <View style={s.coverTopImgBlock}>
        {pkg.heroImage ? (
          <Image src={pkg.heroImage} style={s.coverTopImg} />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: "#0a1a1f", borderRadius: 10 }} />
        )}
        <View style={s.coverTopImgOverlay} />
      </View>

      {/* Bottom Section - Metadata Details */}
      <View style={s.coverBottomInfoBlock}>
        <View style={s.logoGroup}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>L</Text>
          </View>
          <View>
            <Text style={s.brandText}>LETSLIVE</Text>
            <Text style={s.brandSubtitle}>EXQUISITE EXPEDITIONS</Text>
          </View>
        </View>

        <View style={s.coverMiddle}>
          {pkg.category && (
            <Text style={s.coverCategory}>{pkg.category}</Text>
          )}
          <Text style={s.coverTitle}>{pkg.name}</Text>
          
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
            {pkg.destination?.name && (
              <View style={s.coverDestLine}>
                <Icon d={ICONS.location} color={C.accent} size={12} />
                <Text style={s.coverDestText}>
                  {pkg.destination.name}
                </Text>
              </View>
            )}

            <View style={s.coverPricePill}>
              <Text style={s.coverPricePillText}>
                {pkg.duration.nights}N / {pkg.duration.days}D  ·  INR {pkg.price.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Client Details Box */}
          {pkg.isCustom && pkg.clientName ? (
            <View style={s.coverClientCard}>
              <Text style={s.coverClientLabel}>CURATED FOR</Text>
              <Text style={s.coverClientName}>{pkg.clientName.toUpperCase()}</Text>
              {pkg.clientEmail || pkg.clientPhone ? (
                <Text style={s.coverClientDetail}>
                  {pkg.clientEmail} {pkg.clientPhone ? ` · ${pkg.clientPhone}` : ""}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={s.coverClientCard}>
              <Text style={s.coverClientLabel}>VERIFIED ITINERARY</Text>
              <Text style={s.coverClientName}>LETSLIVE SELECT</Text>
              <Text style={s.coverClientDetail}>Explore hotels, daily itineraries & flight transfers inside.</Text>
            </View>
          )}
        </View>

        <Text style={s.coverFooter}>CONFIDENTIAL  ·  © LETSLIVE TOURS</Text>
      </View>
    </View>
  </Page>
);

// ─── Trip Summary & Glance (2-Column Magazine Row) ───────────────────────────
const TripSummarySection = ({ pkg }: { pkg: PackageData }) => (
  <View style={{ marginBottom: 18 }}>
    <View style={s.summaryRow}>
      {/* Left content: details and description */}
      <View style={s.summaryMain}>
        <SectionTitle title="The Voyage Overview" />
        {(pkg.shortDescription || pkg.description) ? (
          <Text style={s.descText}>{pkg.shortDescription || pkg.description}</Text>
        ) : null}

        {/* Quick Inclusions */}
        {pkg.inclusions && pkg.inclusions.length > 0 ? (
          <View wrap={false}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 6 }}>
              Key Inclusions Preview
            </Text>
            <View style={s.chipContainer}>
              {pkg.inclusions.slice(0, 6).map((inc, i) => (
                <View key={i} style={s.incChip}>
                  <Text style={s.incChipText}>{inc}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Right Content: Stats box */}
      <View style={s.summarySidebar} wrap={false}>
        <View style={s.sidebarStatBlock}>
          <Text style={s.sidebarStatLabel}>DESTINATION</Text>
          <Text style={s.sidebarStatVal}>
            {pkg.destination?.name || "—"}{pkg.destination?.country ? `, ${pkg.destination.country}` : ""}
          </Text>
        </View>
        <View style={s.sidebarStatBlock}>
          <Text style={s.sidebarStatLabel}>DURATION</Text>
          <Text style={s.sidebarStatVal}>{pkg.duration.nights} Nights / {pkg.duration.days} Days</Text>
        </View>
        <View style={s.sidebarStatBlock}>
          <Text style={s.sidebarStatLabel}>STAY CATEGORY</Text>
          <Text style={s.sidebarStatVal}>{pkg.hotelRating || "Standard"}</Text>
        </View>
        <View style={[s.sidebarStatBlock, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
          <Text style={s.sidebarStatLabel}>INVESTMENT</Text>
          <Text style={s.sidebarStatValGold}>
            INR {pkg.price.toLocaleString("en-IN")}
            <Text style={{ fontSize: 7.5, color: C.border }}> / {pkg.priceUnit || "person"}</Text>
          </Text>
        </View>
      </View>
    </View>

    {/* Stay overview list */}
    {pkg.stays && pkg.stays.length > 0 ? (
      <View wrap={false} style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 6 }}>
          Hotel Night Breakdown
        </Text>
        {pkg.stays.map((stay, i) => (
          <View key={i} style={{
            flexDirection: "row", paddingVertical: 7,
            borderTopWidth: i === 0 ? 1 : 0,
            borderBottomWidth: 1, borderColor: C.border,
            alignItems: "center",
          }}>
            <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.slate, width: "45%" }}>
              {stay.name}
            </Text>
            <Text style={{ fontSize: 8, color: C.accent, fontFamily: "Helvetica-Bold", width: "15%" }}>{stay.rating}</Text>
            <Text style={{ fontSize: 8, color: C.ink3, width: "15%" }}>{stay.nights} Nights</Text>
            <Text style={{ fontSize: 8, color: C.ink3, flex: 1 }}>{stay.roomType}</Text>
          </View>
        ))}
      </View>
    ) : null}
  </View>
);

// ─── Photo Gallery (Hero + Trio Mosaic Page) ────────────────────────────────
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
    <View style={{ marginBottom: 20 }} break wrap={false}>
      <SectionTitle title="Visual Inspiration" />
      {/* Large Hero Image */}
      <View style={s.galleryHeroBox}>
        <Image src={imgs[0]} style={s.galleryHeroImg} />
      </View>
      {/* 3 smaller images side-by-side */}
      {imgs.length > 1 && (
        <View style={s.galleryRow}>
          {imgs.slice(1).map((img, i) => (
            <View key={i} style={s.galleryColItem}>
              <Image src={img} style={s.galleryColImg} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Overview & Details (Starts fresh page) ──────────────────────────────────
const OverviewSection = ({ pkg }: { pkg: PackageData }) => {
  const hasContent =
    pkg.description || pkg.highlights?.length || pkg.keyPoints?.length;
  if (!hasContent) return null;
  return (
    <View style={{ marginBottom: 20 }} break>
      {pkg.description && (
        <View wrap={false} style={{ marginBottom: 14 }}>
          <SectionTitle title="The Travel Narrative" />
          <Text style={s.descText}>{pkg.description}</Text>
        </View>
      )}
      {pkg.highlights && pkg.highlights.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Itinerary Highlights" />
            <View style={s.highlightsGrid}>
              {pkg.highlights.slice(0, 4).map((h, i) => (
                <View key={i} style={s.highlightCard}>
                  <Text style={s.highlightCardText}>{h}</Text>
                </View>
              ))}
            </View>
          </View>
          {pkg.highlights.length > 4 && (
            <View style={[s.highlightsGrid, { marginTop: 8 }]}>
              {pkg.highlights.slice(4).map((h, i) => (
                <View key={i + 4} style={s.highlightCard} wrap={false}>
                  <Text style={s.highlightCardText}>{h}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      {pkg.keyPoints && pkg.keyPoints.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Essential Briefings" />
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

// ─── Day-wise Itinerary (Timeline Layout) ────────────────────────────────────
const ItinerarySection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.itinerary || pkg.itinerary.length === 0) return null;

  const transfersByDay: Record<number, Transfer[]> = {};
  (pkg.transfers || []).forEach((t) => {
    const d = (t as Transfer & { day?: number }).day || 0;
    if (d > 0) {
      if (!transfersByDay[d]) transfersByDay[d] = [];
      transfersByDay[d].push(t);
    }
  });

  const allActivities = pkg.activities || [];
  const activitiesByDay: Record<number, Activity[]> = {};
  if (allActivities.length > 0 && pkg.itinerary.length > 0) {
    allActivities.forEach((act, i) => {
      const dayNum = (i % pkg.itinerary!.length) + 1;
      if (!activitiesByDay[dayNum]) activitiesByDay[dayNum] = [];
      activitiesByDay[dayNum].push(act);
    });
  }

  const unassignedTransfers = (pkg.transfers || []).filter((t) => !(t as Transfer & { day?: number }).day);

  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="Day-by-Day Chronicle" />
      </View>

      <View style={s.timelineContainer}>
        {pkg.itinerary.map((day, idx) => {
          const dayTransfers = transfersByDay[day.day] || [];
          const dayActivities = activitiesByDay[day.day] || [];
          return (
            <View key={day.day} style={s.timelineRow}>
              {/* Left timeline bubble & connection bar */}
              <View style={s.timelineIndicatorColumn}>
                <View style={s.timelineBadge}>
                  <Text style={s.timelineBadgeText}>{day.day}</Text>
                </View>
                {idx < pkg.itinerary!.length - 1 && <View style={s.timelineVerticalLine} />}
              </View>

              {/* Right timeline description card */}
              <View style={s.timelineContentCard}>
                <Text style={s.timelineCardTitle}>{day.title}</Text>
                {day.description ? (
                  <View wrap={false}>
                    <Text style={s.timelineCardDesc}>{day.description}</Text>
                  </View>
                ) : null}

                {/* Quick Activities chips */}
                {day.activities && day.activities.length > 0 && (
                  <View style={{ marginBottom: 6 }}>
                    <View wrap={false}>
                      <View style={s.timelineBadgeRow}>
                        <Icon d={ICONS.activity} color={C.accent} size={10} />
                        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.accent, letterSpacing: 0.5 }}>DAILY ACTIVITY SCHEDULING</Text>
                      </View>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        {day.activities.slice(0, 3).map((act, i) => (
                          <View key={i} style={{ backgroundColor: C.slateLight, borderRadius: 4, paddingVertical: 2.5, paddingHorizontal: 7, borderWidth: 0.5, borderColor: C.border }}>
                            <Text style={{ fontSize: 7.5, color: C.ink }}>{act}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {day.activities.length > 3 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {day.activities.slice(3).map((act, i) => (
                          <View key={i + 3} style={{ backgroundColor: C.slateLight, borderRadius: 4, paddingVertical: 2.5, paddingHorizontal: 7, borderWidth: 0.5, borderColor: C.border }} wrap={false}>
                            <Text style={{ fontSize: 7.5, color: C.ink }}>{act}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Detailed Activities blocks */}
                {dayActivities.length > 0 && (
                  <View style={{ marginTop: 4, marginBottom: 4 }}>
                    {dayActivities.map((act, i) => (
                      <View key={i} style={s.actNestedCard} wrap={false}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <Icon d={ICONS.activity} color={C.accent} size={9} />
                          <Text style={s.timelineCardHeader}>{act.title}</Text>
                        </View>
                        {act.duration && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 }}>
                            <Icon d={ICONS.calendar} color={C.accent} size={7} />
                            <Text style={{ fontSize: 7.5, color: C.accent, fontFamily: "Helvetica-Bold" }}>{act.duration}</Text>
                          </View>
                        )}
                        {act.description ? <Text style={s.timelineSubText}>{act.description}</Text> : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Detailed Transfers blocks */}
                {dayTransfers.length > 0 && (
                  <View style={{ marginTop: 4, marginBottom: 4 }}>
                    <View wrap={false}>
                      {dayTransfers.slice(0, 1).map((t, i) => (
                        <View key={i} style={s.transNestedCard}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                            <Icon d={ICONS.bus} color={C.rose} size={9} />
                            <Text style={s.timelineCardHeader}>{t.title}</Text>
                          </View>
                          {(t.from || t.to) && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <Icon d={ICONS.location} color={C.rose} size={8} />
                              <Text style={{ fontSize: 7.5, color: C.rose, fontFamily: "Helvetica-Bold" }}>
                                {t.from ? t.from : "Start"} ➔ {t.to ? t.to : "End"}
                              </Text>
                            </View>
                          )}
                          {t.description ? <Text style={s.timelineSubText}>{t.description}</Text> : null}
                        </View>
                      ))}
                    </View>
                    {dayTransfers.length > 1 && (
                      <View>
                        {dayTransfers.slice(1).map((t, i) => (
                          <View key={i + 1} style={s.transNestedCard} wrap={false}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <Icon d={ICONS.bus} color={C.rose} size={9} />
                              <Text style={s.timelineCardHeader}>{t.title}</Text>
                            </View>
                            {(t.from || t.to) && (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                <Icon d={ICONS.location} color={C.rose} size={8} />
                                <Text style={{ fontSize: 7.5, color: C.rose, fontFamily: "Helvetica-Bold" }}>
                                  {t.from ? t.from : "Start"} ➔ {t.to ? t.to : "End"}
                                </Text>
                              </View>
                            )}
                            {t.description ? <Text style={s.timelineSubText}>{t.description}</Text> : null}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Meals and Accommodation bar */}
                {(day.meals?.length > 0 || day.accommodation) && (
                  <View style={s.dayMeta} wrap={false}>
                    {day.meals && day.meals.length > 0 && (
                      <View style={s.dayMetaItem}>
                        <Icon d={ICONS.restaurant} color={C.accent} size={9} />
                        <Text style={s.dayMetaLabel}>MEALS:</Text>
                        <Text style={s.dayMetaValue}>{day.meals.join(", ")}</Text>
                      </View>
                    )}
                    {day.accommodation ? (
                      <View style={s.dayMetaItem}>
                        <Icon d={ICONS.hotel} color={C.primary} size={9} />
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
      </View>

      {/* Unassigned general transfers */}
      {unassignedTransfers.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <View wrap={false} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Icon d={ICONS.bus} color={C.primary} size={11} />
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.primary }}>General Connections</Text>
            </View>
            {unassignedTransfers.map((t, i) => (
              <View key={i} style={s.transNestedCard} wrap={false}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <Icon d={ICONS.bus} color={C.rose} size={9} />
                  <Text style={s.timelineCardHeader}>{t.title}</Text>
                </View>
                {(t.from || t.to) && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <Icon d={ICONS.location} color={C.rose} size={8} />
                    <Text style={{ fontSize: 7.5, color: C.rose, fontFamily: "Helvetica-Bold" }}>
                      {t.from ? t.from : "Start"} ➔ {t.to ? t.to : "End"}
                    </Text>
                  </View>
                )}
                {t.description ? <Text style={s.timelineSubText}>{t.description}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Accommodation Stays (Cards Layout instead of Table) ───────────────────
const AccommodationSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.stays || pkg.stays.length === 0) return null;
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Lodging Properties" />
      <View style={s.stayCardsGrid}>
        {pkg.stays.map((stay, i) => (
          <View key={i} style={s.stayCard}>
            <View style={s.stayCardHeader}>
              <Text style={s.stayName}>{stay.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Icon d={ICONS.star} color={C.accent} size={9} />
                <Text style={s.stayRating}>{stay.rating}</Text>
              </View>
            </View>
            <Text style={s.stayNights}>{stay.nights} Nights  ·  {stay.roomType}</Text>
            {stay.amenities && stay.amenities.length > 0 && (
              <Text style={s.stayAmenities}>
                Amenities: {stay.amenities.join(", ")}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Inclusions & Exclusions ──────────────────────────────────────────────────
const InclusionsExclusionsSection = ({ pkg }: { pkg: PackageData }) => {
  const hasInc = pkg.inclusions && pkg.inclusions.length > 0;
  const hasExc = pkg.exclusions && pkg.exclusions.length > 0;
  if (!hasInc && !hasExc) return null;
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Terms & Details" />
      <View style={s.incExcRow}>
        {hasInc && (
          <View style={s.incCol}>
            <Text style={[s.incExcHeading, { color: C.teal }]}>✓  INCLUDED IN RATE</Text>
            {pkg.inclusions!.map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.incDot} />
                <Text style={s.incExcText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
        {hasExc && (
          <View style={s.excCol}>
            <Text style={[s.incExcHeading, { color: C.rose }]}>✗  EXCLUDED FROM RATE</Text>
            {pkg.exclusions!.map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.excDot} />
                <Text style={s.incExcText}>{item}</Text>
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
        <SectionTitle title="Departure Briefings" />
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
        <SectionTitle title="Packing Checklist" />
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

// ─── Pricing (Boarding Pass Ticket Stub Layout) ──────────────────────────────
const PricingSection = ({ pkg }: { pkg: PackageData }) => (
  <View wrap={false} style={{ marginBottom: 20 }}>
    <SectionTitle title="Investment Summary" />
    <View style={s.ticketContainer}>
      {/* Ticket Main Portion */}
      <View style={s.ticketMain}>
        <Text style={s.ticketLabel}>RATE SPECIFICATION</Text>
        <Text style={s.ticketAmount}>INR {pkg.price.toLocaleString("en-IN")}</Text>
        <Text style={s.ticketSub}>per {pkg.priceUnit || "person"} (Twin sharing configuration)</Text>
        {pkg.discount && pkg.discount > 0 ? (
          <View style={s.ticketDiscountBadge}>
            <Text style={s.ticketDiscountText}>Save {pkg.discount}% Special Promo Code Applied</Text>
          </View>
        ) : null}
      </View>

      {/* Dashed Border Line */}
      <View style={s.ticketDottedDivider} />

      {/* Ticket Stub Portion */}
      <View style={s.ticketStub}>
        <Text style={s.ticketStubHeader}>CONFIRM RATE</Text>
        <Text style={s.ticketStubText}>Ready to reserve? Connect below to secure package prices.</Text>
        <Text style={s.ticketStubContact}>+91 9999 999 999</Text>
      </View>
    </View>

    {/* Contact backup card */}
    <View style={s.bookingBox}>
      <Text style={s.bookingTitle}>Customization Requests</Text>
      <Text style={s.bookingSubtitle}>
        Need to change flights, upgrade hotels, or invite more travelers? Speak to our package curator.
      </Text>
      <Text style={s.bookingContact}>Email: info@letslivetours.com  ·  Phone: +91 9999 999 999</Text>
    </View>
  </View>
);

// ─── Document Root ───────────────────────────────────────────────────────────
const PackagePdfDocumentPremium = ({ pkg }: { pkg: PackageData }) => (
  <Document
    title={`${pkg.name} — LetsLive Tours`}
    author="LetsLive Tours"
    subject={`Travel Itinerary — ${pkg.name}`}
  >
    <CoverPage pkg={pkg} />
    <Page size="A4" style={s.page}>
      <PageHeader section="Package Details & Itinerary" />
      
      <TripSummarySection pkg={pkg} />
      <GallerySection pkg={pkg} />
      <OverviewSection pkg={pkg} />
      <ItinerarySection pkg={pkg} />
      <AccommodationSection pkg={pkg} />
      <InclusionsExclusionsSection pkg={pkg} />
      <KnowBeforeYouGoSection pkg={pkg} />
      <ThingsToCarrySection pkg={pkg} />
      <PricingSection pkg={pkg} />
      
      <PageFooter />
    </Page>
  </Document>
);

// ─── Export ───────────────────────────────────────────────────────────────────
export async function generatePackagePdfPremium(pkg: PackageData): Promise<void> {
  const blob = await pdf(<PackagePdfDocumentPremium pkg={pkg} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.slug || "package"}-itinerary-premium.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
