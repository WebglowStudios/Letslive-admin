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

// ─── Modern Explorer Palette (Bright Travel Journal Style) ───────────────────
const C = {
  bg:           "#f0fafa",   // LetsLive Ivory page bg tint
  white:        "#FFFFFF",
  primary:      "#004d5e",   // LetsLive Primary Dark Teal
  accent:       "#F5A623",   // LetsLive Accent Gold/Amber
  accentLight:  "#FEF3DC",   // LetsLive Gold/Amber tint
  neutralGray:  "#4a7a85",   // LetsLive Tertiary Ink
  border:       "#d4ecf0",   // LetsLive Light line border
  ink:          "#0a1a1f",   // LetsLive Ink Dark
  teal:         "#007a96",   // LetsLive Secondary Teal
  tealLight:    "#e0f5f7",   
  rose:         "#be123c",   
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
  // ── Cover Page (Modern Explorer - Bright Travel Journal) ────────────────────
  coverPage: {
    backgroundColor: C.bg,
    width: "100%",
    height: "100%",
    padding: 36,
    justifyContent: "space-between",
  },
  coverHeroFrame: {
    width: "100%",
    height: 330,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  coverHeroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  logoGroup: {
    alignItems: "center",
    marginBottom: 6,
  },
  brandText: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 8,
    textTransform: "uppercase",
  },
  brandSubtitle: {
    fontSize: 7.5,
    color: C.neutralGray,
    letterSpacing: 3,
    marginTop: 3,
    textTransform: "uppercase",
  },
  coverTitleBlock: {
    alignItems: "center",
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  coverCategory: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  coverTitle: {
    fontSize: 25,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    lineHeight: 1.2,
    textAlign: "center",
    marginBottom: 12,
  },
  coverDestText: {
    fontSize: 11,
    color: C.neutralGray,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  coverClientCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 3,
    borderTopColor: C.accent,
    borderRadius: 6,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  coverClientInfo: {
    width: "60%",
  },
  coverClientLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.neutralGray,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  coverClientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
  },
  coverClientContact: {
    fontSize: 7.5,
    color: C.neutralGray,
    marginTop: 2,
  },
  coverMetaInfo: {
    width: "35%",
    alignItems: "flex-end",
  },
  coverDurationBadge: {
    backgroundColor: C.accentLight,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  coverDurationText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
  },
  coverRateText: {
    fontSize: 7.5,
    color: C.neutralGray,
  },
  coverFooterText: {
    fontSize: 7,
    color: C.neutralGray,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 10,
  },

  // ── Content Page Shell ─────────────────────────────────────────────────────
  page: {
    paddingTop: 52,
    paddingBottom: 48,
    paddingHorizontal: 44,
    backgroundColor: C.bg,
  },
  pageHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 44,
    paddingTop: 20,
  },
  headerLine: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 6,
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBrand: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    letterSpacing: 4,
  },
  headerSection: {
    fontSize: 7,
    color: C.neutralGray,
    letterSpacing: 1.5,
  },
  pageFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 44,
    paddingBottom: 20,
  },
  footerLine: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 6,
  },
  footerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: C.neutralGray,
    letterSpacing: 0.5,
  },
  footerPage: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
  },

  // ── Section Titles ─────────────────────────────────────────────────────────
  sectionBlock: {
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitleBadge: {
    backgroundColor: C.accentLight,
    width: 6,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionLine: {
    height: 1,
    backgroundColor: C.border,
    marginTop: 6,
  },

  // ── Trip Summary / Glance Panel ────────────────────────────────────────────
  summaryContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 18,
  },
  summaryLeft: {
    flex: 1,
    justifyContent: "center",
  },
  summaryRight: {
    width: 190,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
  },
  glanceItem: {
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  glanceLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.neutralGray,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  glanceValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    marginTop: 2,
  },
  glanceValueAccent: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    marginTop: 2,
  },
  descText: {
    fontSize: 9,
    color: C.ink,
    lineHeight: 1.6,
  },

  // ── Asymmetric Collage Scenic Gallery ──────────────────────────────────────
  galleryGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  galleryLeftCol: {
    width: "58%",
    height: 150,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  galleryRightCol: {
    width: "42%",
    flexDirection: "column",
    gap: 8,
  },
  galleryRightMiniFrame: {
    height: 71,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  galleryImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  // ── Highlights Grid ────────────────────────────────────────────────────────
  highlightsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  highlightCard: {
    width: "48.5%",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 5,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  highlightIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.accentLight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  highlightText: {
    fontSize: 8.5,
    color: C.ink,
    lineHeight: 1.4,
    flex: 1,
  },

  // ── Day Chronicle (Vertical Timeline Style) ───────────────────────────────
  timelineBlock: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineIndicatorColumn: {
    width: 60,
    alignItems: "center",
    position: "relative",
  },
  timelineBadge: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  timelineBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 0.5,
  },
  timelineConnectorLine: {
    position: "absolute",
    top: 18,
    bottom: -18,
    width: 1.5,
    backgroundColor: C.border,
    zIndex: 1,
  },
  timelineContentColumn: {
    flex: 1,
    paddingLeft: 4,
    paddingBottom: 10,
  },
  timelineDayHeader: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    marginBottom: 6,
  },
  timelineDayDesc: {
    fontSize: 8.5,
    color: C.ink,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  timelineChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 6,
  },
  timelineChip: {
    borderWidth: 0.5,
    borderColor: C.border,
    backgroundColor: C.white,
    borderRadius: 4,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
  },
  timelineChipText: {
    fontSize: 7,
    color: C.neutralGray,
  },
  timelineDetailCard: {
    borderLeftWidth: 1.5,
    borderLeftColor: C.accent,
    backgroundColor: C.white,
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  timelineDetailTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
  },
  timelineDetailSub: {
    fontSize: 7.5,
    color: C.neutralGray,
    marginTop: 1.5,
    lineHeight: 1.3,
  },

  // ── Stay Accommodations Cards ──────────────────────────────────────────────
  stayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  stayCard: {
    width: "48.5%",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
  },
  stayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  stayCardName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    width: "70%",
  },
  stayStars: {
    flexDirection: "row",
    gap: 1.5,
    alignItems: "center",
  },
  stayRoomType: {
    fontSize: 8,
    color: C.accent,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  stayNights: {
    fontSize: 7.5,
    color: C.neutralGray,
    marginBottom: 6,
  },
  stayAmenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
    marginTop: 2,
  },
  stayAmenityBadge: {
    backgroundColor: C.accentLight,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  stayAmenityText: {
    fontSize: 6.5,
    color: C.accent,
  },

  // ── Inclusions Exclusions Split ────────────────────────────────────────────
  incExcRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 18,
  },
  incCol: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 3,
    borderTopColor: C.teal,
    borderRadius: 6,
    padding: 12,
  },
  excCol: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 3,
    borderTopColor: C.rose,
    borderRadius: 6,
    padding: 12,
  },
  incExcHeader: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  incExcItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginBottom: 5,
  },
  incCheckIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  excCrossIcon: {
    fontSize: 8,
    color: C.rose,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
    flexShrink: 0,
  },
  incExcText: {
    fontSize: 8,
    color: C.neutralGray,
    lineHeight: 1.35,
    flex: 1,
  },

  // ── Guidelines Checklists ──────────────────────────────────────────────────
  kbygCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  kbygRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  kbygNum: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    width: 14,
  },
  kbygText: {
    fontSize: 8.5,
    color: C.neutralGray,
    lineHeight: 1.4,
    flex: 1,
  },
  carryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  carryCard: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 8,
  },
  carryText: {
    fontSize: 8,
    color: C.neutralGray,
  },

  // ── Pricing Boarding Pass Ticket Receipt ───────────────────────────────────
  ticketContainer: {
    backgroundColor: C.accentLight,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 8,
    padding: 16,
    position: "relative",
    marginBottom: 16,
  },
  ticketTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ticketBadge: {
    backgroundColor: C.accent,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  ticketBadgeText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 1,
  },
  ticketDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 0.8,
    borderColor: C.accent,
    marginVertical: 12,
  },
  ticketBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  ticketPriceLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.neutralGray,
    letterSpacing: 1,
  },
  ticketPriceAmount: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: C.accent,
    marginTop: 3,
  },
  ticketPriceUnit: {
    fontSize: 8,
    color: C.neutralGray,
  },
  ticketBtn: {
    backgroundColor: C.accent,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  ticketBtnText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 1,
  },
  contactBox: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 8,
    color: C.neutralGray,
    textAlign: "center",
    lineHeight: 1.4,
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
    <View style={s.sectionHeaderRow}>
      <View style={s.sectionTitleBadge} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
    <View style={s.sectionLine} />
  </View>
);

// ─── Cover Page (Travel Journal style) ───────────────────────────────────────
const CoverPage = ({ pkg }: { pkg: PackageData }) => (
  <Page size="A4" style={{ padding: 0 }}>
    <View style={s.coverPage}>
      
      {/* Top Half: Scenic Landscape Hero Cover */}
      <View style={s.coverHeroFrame}>
        {pkg.heroImage ? (
          <Image src={pkg.heroImage} style={s.coverHeroImg} />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: C.border }} />
        )}
      </View>

      {/* Middle: Brand and Typography */}
      <View style={s.coverTitleBlock}>
        <View style={s.logoGroup}>
          <Text style={s.brandText}>LETSLIVE TOURS</Text>
          <Text style={s.brandSubtitle}>Modern Explorations</Text>
        </View>
        <View style={{ width: 40, height: 1, backgroundColor: C.accent, marginVertical: 8 }} />
        {pkg.category && <Text style={s.coverCategory}>{pkg.category}</Text>}
        <Text style={s.coverTitle}>{pkg.name}</Text>
        {pkg.destination?.name && (
          <Text style={s.coverDestText}>{pkg.destination.name.toUpperCase()}</Text>
        )}
      </View>

      {/* Bottom: Elegant Curated Card */}
      {pkg.isCustom && pkg.clientName ? (
        <View style={s.coverClientCard}>
          <View style={s.coverClientInfo}>
            <Text style={s.coverClientLabel}>CURATED SPECIFICALLY FOR</Text>
            <Text style={s.coverClientName}>{pkg.clientName.toUpperCase()}</Text>
            {pkg.clientEmail || pkg.clientPhone ? (
              <Text style={s.coverClientContact}>
                {pkg.clientEmail} {pkg.clientPhone ? ` · ${pkg.clientPhone}` : ""}
              </Text>
            ) : null}
          </View>
          <View style={s.coverMetaInfo}>
            <View style={s.coverDurationBadge}>
              <Text style={s.coverDurationText}>
                {pkg.duration.nights} Nights / {pkg.duration.days} Days
              </Text>
            </View>
            <Text style={s.coverRateText}>Official Custom Curation</Text>
          </View>
        </View>
      ) : (
        <View style={s.coverClientCard}>
          <View style={s.coverClientInfo}>
            <Text style={s.coverClientLabel}>OFFICIAL SIGNATURE ITINERARY</Text>
            <Text style={s.coverClientName}>CONFIDENTIAL PATHFINDER</Text>
            <Text style={s.coverClientContact}>Detailed stay logistics, guides, and routing.</Text>
          </View>
          <View style={s.coverMetaInfo}>
            <View style={s.coverDurationBadge}>
              <Text style={s.coverDurationText}>
                {pkg.duration.nights} Nights / {pkg.duration.days} Days
              </Text>
            </View>
            <Text style={s.coverRateText}>Official Curation</Text>
          </View>
        </View>
      )}

      <Text style={s.coverFooterText}>CONFIDENTIAL  ·  © LETSLIVE TOURS</Text>
    </View>
  </Page>
);

// ─── Trip Summary Section ────────────────────────────────────────────────────
const TripSummarySection = ({ pkg }: { pkg: PackageData }) => (
  <View style={{ marginBottom: 18 }}>
    <SectionTitle title="The Expedition Curation" />
    
    <View style={s.summaryContainer}>
      {/* Left Column: Narrative description */}
      <View style={s.summaryLeft}>
        {(pkg.shortDescription || pkg.description) ? (
          <Text style={s.descText}>
            {pkg.shortDescription || pkg.description}
          </Text>
        ) : (
          <Text style={s.descText}>
            Embark on a customized itinerary designed specifically to cover scenic pathways, premium stays, and seamless transfers. Detail-oriented planning ensures a fully organized journey.
          </Text>
        )}
      </View>
      
      {/* Right Column: Key details stack */}
      <View style={s.summaryRight}>
        <View style={s.glanceItem}>
          <Text style={s.glanceLabel}>Destination</Text>
          <Text style={s.glanceValue}>
            {pkg.destination?.name || "—"}{pkg.destination?.country ? `, ${pkg.destination.country}` : ""}
          </Text>
        </View>
        <View style={s.glanceItem}>
          <Text style={s.glanceLabel}>Trip Duration</Text>
          <Text style={s.glanceValue}>{pkg.duration.nights} Nights / {pkg.duration.days} Days</Text>
        </View>
        <View style={s.glanceItem}>
          <Text style={s.glanceLabel}>Standard Hotels</Text>
          <Text style={s.glanceValue}>{pkg.hotelRating || "Premium Selected"}</Text>
        </View>
        <View style={[s.glanceItem, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
          <Text style={s.glanceLabel}>Estimated Value</Text>
          <Text style={s.glanceValueAccent}>
            INR {pkg.price.toLocaleString("en-IN")}
            <Text style={{ fontSize: 7, color: C.neutralGray }}> / {pkg.priceUnit || "person"}</Text>
          </Text>
        </View>
      </View>
    </View>
  </View>
);

// ─── Scenic Asymmetric Collage Gallery ───────────────────────────────────────
const GallerySection = ({ pkg }: { pkg: PackageData }) => {
  const imgs = [
    ...(pkg.heroImage ? [pkg.heroImage] : []),
    ...(pkg.destinationImages || []),
    ...(pkg.stayImages || []),
    ...(pkg.activityImages || []),
    ...(pkg.images || []),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);

  if (imgs.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }} break wrap={false}>
      <SectionTitle title="Scenic Visuals" />
      <View style={s.galleryGrid}>
        
        {/* Left main landscape column */}
        <View style={s.galleryLeftCol}>
          <Image src={imgs[0]} style={s.galleryImg} />
        </View>
        
        {/* Right stacked columns */}
        {imgs.length > 1 && (
          <View style={s.galleryRightCol}>
            <View style={s.galleryRightMiniFrame}>
              <Image src={imgs[1]} style={s.galleryImg} />
            </View>
            {imgs.length > 2 ? (
              <View style={s.galleryRightMiniFrame}>
                <Image src={imgs[2]} style={s.galleryImg} />
              </View>
            ) : (
              <View style={[s.galleryRightMiniFrame, { backgroundColor: C.border }]} />
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Overview & Highlights Section ───────────────────────────────────────────
const OverviewSection = ({ pkg }: { pkg: PackageData }) => {
  const hasHighlights = pkg.highlights && pkg.highlights.length > 0;
  const hasKeyPoints = pkg.keyPoints && pkg.keyPoints.length > 0;
  
  if (!hasHighlights && !hasKeyPoints) return null;

  return (
    <View style={{ marginBottom: 20 }} break>
      {hasHighlights && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Highlights & Experiences" />
          </View>
          <View style={s.highlightsContainer}>
            {pkg.highlights!.map((h, i) => (
              <View key={i} style={s.highlightCard} wrap={false}>
                <View style={s.highlightIconCircle}>
                  <Icon d={ICONS.check} color={C.accent} size={8} />
                </View>
                <Text style={s.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {hasKeyPoints && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Trip Covenants" />
            {pkg.keyPoints!.slice(0, 4).map((k, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6, gap: 6 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent, marginTop: 4 }} />
                <Text style={{ fontSize: 8.5, color: C.neutralGray, lineHeight: 1.4 }}>{k}</Text>
              </View>
            ))}
          </View>
          {pkg.keyPoints!.length > 4 && pkg.keyPoints!.slice(4).map((k, i) => (
            <View key={i + 4} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6, gap: 6 }} wrap={false}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent, marginTop: 4 }} />
              <Text style={{ fontSize: 8.5, color: C.neutralGray, lineHeight: 1.4 }}>{k}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Day-Wise Journey Timeline ───────────────────────────────────────────────
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

  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="The Chronological Route" />
      </View>

      {pkg.itinerary.map((day, idx) => {
        const dayTransfers = transfersByDay[day.day] || [];
        const dayActivities = activitiesByDay[day.day] || [];
        const isLast = idx === pkg.itinerary!.length - 1;

        return (
          <View key={day.day} style={s.timelineBlock}>
            
            {/* Timeline Left Rail */}
            <View style={s.timelineIndicatorColumn}>
              <View style={s.timelineBadge}>
                <Text style={s.timelineBadgeText}>
                  {day.day < 10 ? `0${day.day}` : day.day}
                </Text>
              </View>
              {!isLast && <View style={s.timelineConnectorLine} />}
            </View>

            {/* Timeline Right Content */}
            <View style={s.timelineContentColumn}>
              <View wrap={false}>
                <Text style={s.timelineDayHeader}>{day.title}</Text>
                {day.description ? (
                  <Text style={s.timelineDayDesc}>{day.description}</Text>
                ) : null}
              </View>

              {/* Day Meals/Activity Chips */}
              {(day.meals?.length > 0 || day.activities?.length > 0) && (
                <View style={s.timelineChipsRow} wrap={false}>
                  {day.meals?.map((m, i) => (
                    <View key={`meal-${i}`} style={[s.timelineChip, { backgroundColor: C.accentLight, borderColor: C.accent, flexDirection: "row", alignItems: "center", gap: 3 }]}>
                      <Icon d={ICONS.restaurant} color={C.accent} size={9} />
                      <Text style={[s.timelineChipText, { color: C.accent, fontFamily: "Helvetica-Bold" }]}>{m}</Text>
                    </View>
                  ))}
                  {day.activities?.slice(0, 3).map((act, i) => (
                    <View key={`act-${i}`} style={[s.timelineChip, { flexDirection: "row", alignItems: "center", gap: 3 }]}>
                      <Icon d={ICONS.activity} color={C.teal} size={8} />
                      <Text style={s.timelineChipText}>{act}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Detail Activities */}
              {dayActivities.map((act, i) => (
                <View key={`act-det-${i}`} style={s.timelineDetailCard} wrap={false}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <Icon d={ICONS.activity} color={C.teal} size={9} />
                    <Text style={s.timelineDetailTitle}>{act.title}</Text>
                  </View>
                  {act.duration && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <Icon d={ICONS.calendar} color={C.accent} size={8} />
                      <Text style={{ fontSize: 7, color: C.accent, fontFamily: "Helvetica-Bold" }}>
                        Duration: {act.duration}
                      </Text>
                    </View>
                  )}
                  {act.description ? (
                    <Text style={s.timelineDetailSub}>{act.description}</Text>
                  ) : null}
                </View>
              ))}

              {/* Detail Transfers */}
              {dayTransfers.map((tr, i) => (
                <View key={`tr-det-${i}`} style={[s.timelineDetailCard, { borderLeftColor: C.neutralGray }]} wrap={false}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <Icon d={ICONS.bus} color={C.neutralGray} size={9} />
                    <Text style={s.timelineDetailTitle}>{tr.title}</Text>
                  </View>
                  {(tr.from || tr.to) && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Icon d={ICONS.location} color={C.neutralGray} size={8} />
                      <Text style={{ fontSize: 7, color: C.neutralGray, fontFamily: "Helvetica-Bold" }}>
                        {tr.from} ➔ {tr.to}
                      </Text>
                    </View>
                  )}
                  {tr.description ? (
                    <Text style={s.timelineDetailSub}>{tr.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>

          </View>
        );
      })}
    </View>
  );
};

// ─── Accommodation Properties Grid ───────────────────────────────────────────
const AccommodationSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.stays || pkg.stays.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }} break wrap={false}>
      <SectionTitle title="Stay Properties" />
      <View style={s.stayContainer}>
        {pkg.stays.map((stay, i) => (
          <View key={i} style={s.stayCard}>
            <View style={s.stayCardHeader}>
              <Text style={s.stayCardName}>{stay.name}</Text>
              <View style={s.stayStars}>
                {Array.from({ length: Math.min(parseInt(stay.rating) || 5, 5) }).map((_, idx) => (
                  <Icon key={idx} d={ICONS.star} color={C.accent} size={8} />
                ))}
              </View>
            </View>

            {stay.roomType ? <Text style={s.stayRoomType}>{stay.roomType}</Text> : null}
            <Text style={s.stayNights}>{stay.nights} Nights Stay</Text>

            {stay.amenities && stay.amenities.length > 0 && (
              <View style={s.stayAmenitiesRow}>
                {stay.amenities.slice(0, 3).map((am, idx) => (
                  <View key={idx} style={s.stayAmenityBadge}>
                    <Text style={s.stayAmenityText}>{am}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Inclusions Exclusions Split Cards ───────────────────────────────────────
const InclusionsExclusionsSection = ({ pkg }: { pkg: PackageData }) => {
  const hasInc = pkg.inclusions && pkg.inclusions.length > 0;
  const hasExc = pkg.exclusions && pkg.exclusions.length > 0;

  if (!hasInc && !hasExc) return null;

  return (
    <View style={s.incExcRow} break wrap={false}>
      {/* Inclusions */}
      {hasInc ? (
        <View style={s.incCol}>
          <Text style={s.incExcHeader}>Inclusions</Text>
          {pkg.inclusions!.map((inc, i) => (
            <View key={i} style={s.incExcItem}>
              <View style={s.incCheckIcon}>
                <Icon d={ICONS.check} color={C.teal} size={8} />
              </View>
              <Text style={s.incExcText}>{inc}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Exclusions */}
      {hasExc ? (
        <View style={s.excCol}>
          <Text style={s.incExcHeader}>Exclusions</Text>
          {pkg.exclusions!.map((exc, i) => (
            <View key={i} style={s.incExcItem}>
              <Text style={s.excCrossIcon}>✕</Text>
              <Text style={s.incExcText}>{exc}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

// ─── Know Before You Go ──────────────────────────────────────────────────────
const KnowBeforeYouGoSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.knowBeforeYouGo || pkg.knowBeforeYouGo.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }} break wrap={false}>
      <SectionTitle title="Expedition Briefings" />
      <View style={s.kbygCard}>
        {pkg.knowBeforeYouGo.map((item, i) => (
          <View key={i} style={s.kbygRow}>
            <Text style={s.kbygNum}>{(i + 1) < 10 ? `0${i + 1}` : i + 1}.</Text>
            <Text style={s.kbygText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Things to Carry ─────────────────────────────────────────────────────────
const ThingsToCarrySection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.thingsToCarry || pkg.thingsToCarry.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }} break wrap={false}>
      <SectionTitle title="Packing Checklist" />
      <View style={s.carryGrid}>
        {pkg.thingsToCarry.map((item, i) => (
          <View key={i} style={s.carryCard}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent }} />
            <Text style={s.carryText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Pricing / Booking Boarding Pass ─────────────────────────────────────────
const PricingSection = ({ pkg }: { pkg: PackageData }) => (
  <View style={{ marginBottom: 20 }} break wrap={false}>
    <SectionTitle title="Pricing Curation" />
    
    <View style={s.ticketContainer}>
      <View style={s.ticketTopRow}>
        <View>
          <View style={s.ticketBadge}>
            <Text style={s.ticketBadgeText}>BOARDING PASS / EXPEDITION INVOICE</Text>
          </View>
          <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.primary }}>
            {pkg.name}
          </Text>
        </View>
        <Text style={{ fontSize: 9, color: C.neutralGray }}>
          ID: {pkg.slug?.toUpperCase() || "CUR-LP"}
        </Text>
      </View>

      <View style={s.ticketDivider} />

      <View style={s.ticketBottomRow}>
        <View>
          <Text style={s.ticketPriceLabel}>ESTIMATED INVESTMENT</Text>
          <Text style={s.ticketPriceAmount}>
            INR {pkg.price.toLocaleString("en-IN")}
            <Text style={s.ticketPriceUnit}> / {pkg.priceUnit || "person"}</Text>
          </Text>
        </View>
        <View style={s.ticketBtn}>
          <Text style={s.ticketBtnText}>REQUEST BOOKING</Text>
        </View>
      </View>
    </View>

    <View style={s.contactBox}>
      <Text style={s.contactTitle}>Adventure Specialist Consultations</Text>
      <Text style={s.contactText}>
        We are happy to customize stay properties, add specific day activities, or tweak transfers.
      </Text>
      <Text style={[s.contactText, { fontFamily: "Helvetica-Bold", color: C.primary, marginTop: 4 }]}>
        Contact: +91 9999 999 999  ·  info@letslivetours.com
      </Text>
    </View>
  </View>
);

// ─── Document Root ───────────────────────────────────────────────────────────
const PackagePdfDocumentExplorer = ({ pkg }: { pkg: PackageData }) => (
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
export async function generatePackagePdfExplorer(pkg: PackageData): Promise<void> {
  const blob = await pdf(<PackagePdfDocumentExplorer pkg={pkg} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.slug || "package"}-itinerary-explorer.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
