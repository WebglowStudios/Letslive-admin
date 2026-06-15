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

// ─── Elite Luxury Brand Palette ──────────────────────────────────────────────
const C = {
  bg:           "#f0fafa",   // LetsLive Ivory page bg tint
  primary:      "#004d5e",   // LetsLive Primary Dark Teal
  accent:       "#F5A623",   // LetsLive Accent Gold/Amber
  accentLight:  "#FEF3DC",   // LetsLive Gold/Amber tint
  neutralGray:  "#4a7a85",   // LetsLive Tertiary Ink
  border:       "#d4ecf0",   // LetsLive Light line border
  white:        "#ffffff",
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

// ─── Luxury Style definitions ────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Cover Page (Minimalist Luxury) ─────────────────────────────────────────
  coverPage: {
    backgroundColor: C.bg,
    width: "100%",
    height: "100%",
    padding: 30,
  },
  coverBorder: {
    borderWidth: 1, borderColor: C.border,
    flex: 1,
    padding: 40,
    justifyContent: "space-between",
    position: "relative",
  },
  coverDoubleBorder: {
    position: "absolute", top: 4, left: 4, right: 4, bottom: 4,
    borderWidth: 0.5, borderColor: C.border,
  },
  logoGroup: {
    alignItems: "center",
    marginTop: 10,
  },
  brandText: {
    fontSize: 12, fontFamily: "Helvetica-Bold", color: C.primary,
    letterSpacing: 6, textTransform: "uppercase",
  },
  brandSubtitle: {
    fontSize: 7.5, color: C.neutralGray, letterSpacing: 3, marginTop: 4,
    textTransform: "uppercase",
  },
  coverMiddle: {
    alignItems: "center",
    marginVertical: 40,
  },
  coverHeroFrame: {
    width: 170, height: 170,
    borderRadius: 85, overflow: "hidden",
    borderWidth: 1.5, borderColor: C.accent,
    padding: 3,
    marginBottom: 26,
  },
  coverHeroImg: {
    width: "100%", height: "100%", borderRadius: 82, objectFit: "cover",
  },
  coverCategory: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.accent,
    letterSpacing: 3, textTransform: "uppercase", marginBottom: 12,
  },
  coverTitle: {
    fontSize: 26, fontFamily: "Helvetica-Bold", color: C.primary,
    lineHeight: 1.25, textAlign: "center", marginBottom: 14,
    letterSpacing: 0.5,
  },
  coverDestText: {
    fontSize: 12, color: C.neutralGray, fontFamily: "Helvetica-Bold",
    letterSpacing: 2, textTransform: "uppercase",
  },
  coverPill: {
    borderWidth: 0.8, borderColor: C.border,
    borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 12,
    marginTop: 16,
  },
  coverPillText: {
    fontSize: 8, color: C.neutralGray, letterSpacing: 1,
  },
  coverClientCard: {
    alignItems: "center",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 0.8, borderTopColor: C.border,
    width: "70%",
  },
  coverClientLabel: {
    fontSize: 6.5, fontFamily: "Helvetica-Bold", color: C.accent,
    letterSpacing: 2, marginBottom: 4,
  },
  coverClientName: {
    fontSize: 12, fontFamily: "Helvetica-Bold", color: C.primary,
    letterSpacing: 0.5,
  },
  coverClientDetail: {
    fontSize: 7.5, color: C.neutralGray, marginTop: 3,
  },
  coverFooterText: {
    fontSize: 7, color: C.neutralGray, letterSpacing: 1, textTransform: "uppercase",
    textAlign: "center",
  },

  // ── Content Page Shell ─────────────────────────────────────────────────────
  page: {
    paddingTop: 48, paddingBottom: 44, paddingHorizontal: 48,
    backgroundColor: C.bg,
  },
  pageHeader: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: 48, paddingTop: 18,
  },
  headerLine: {
    height: 1, backgroundColor: C.border, marginBottom: 6,
  },
  headerInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerBrand: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 4,
  },
  headerSection: {
    fontSize: 7, color: C.neutralGray, letterSpacing: 1.5,
  },
  pageFooter: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 48, paddingBottom: 18,
  },
  footerLine: {
    height: 1, backgroundColor: C.border, marginBottom: 6,
  },
  footerInner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  footerText: {
    fontSize: 7, color: C.neutralGray, letterSpacing: 0.5,
  },
  footerPage: {
    fontSize: 7, fontFamily: "Helvetica-Bold", color: C.primary,
  },

  // ── Minimalist Section Headings ────────────────────────────────────────────
  sectionBlock: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11.5, fontFamily: "Helvetica-Bold", color: C.primary,
    letterSpacing: 2.5, textTransform: "uppercase",
  },
  sectionLine: {
    height: 0.8, backgroundColor: C.accent, marginTop: 5, width: "100%",
  },

  // ── Trip Summary / Glance Rows ─────────────────────────────────────────────
  glanceContainer: {
    marginBottom: 20,
  },
  glanceRow: {
    flexDirection: "row",
    borderBottomWidth: 0.8, borderBottomColor: C.border,
    paddingVertical: 10,
    alignItems: "center",
  },
  glanceLabel: {
    width: "30%",
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.accent,
    letterSpacing: 2, textTransform: "uppercase",
  },
  glanceValue: {
    fontSize: 9.5, color: C.primary, fontFamily: "Helvetica-Bold",
  },
  glanceValueGold: {
    fontSize: 10.5, color: C.accent, fontFamily: "Helvetica-Bold",
  },
  descText: {
    fontSize: 9, color: C.ink, lineHeight: 1.65, marginBottom: 16,
  },
  quickInclusions: {
    flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10,
  },
  incPill: {
    borderWidth: 0.8, borderColor: C.border,
    borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10,
    backgroundColor: C.white,
  },
  incPillText: {
    fontSize: 7.5, color: C.neutralGray,
  },

  // ── Three Column Visual Gallery ────────────────────────────────────────────
  galleryRow: {
    flexDirection: "row", gap: 12,
  },
  galleryCol: {
    flex: 1, height: 160,
    borderRadius: 6, overflow: "hidden",
    borderWidth: 0.8, borderColor: C.border,
    padding: 3,
    backgroundColor: C.white,
  },
  galleryImg: {
    width: "100%", height: "100%", borderRadius: 4, objectFit: "cover",
  },

  // ── Highlight Diamond Grid ─────────────────────────────────────────────────
  highlightsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  highlightCard: {
    width: "48%",
    backgroundColor: C.white,
    borderWidth: 0.8, borderColor: C.border,
    borderRadius: 4, padding: 12,
  },
  highlightRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
  },
  diamondDot: {
    width: 4, height: 4, backgroundColor: C.accent,
    transform: "rotate(45deg)", marginTop: 4, flexShrink: 0,
  },
  highlightText: {
    fontSize: 8.5, color: C.neutralGray, lineHeight: 1.45, flex: 1,
  },

  // ── Day Chronicle (Editorial Grid Layout) ──────────────────────────────────
  dayBlock: {
    marginBottom: 16,
    borderBottomWidth: 0.8, borderBottomColor: C.border,
    paddingBottom: 14,
  },
  dayHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 16, fontFamily: "Helvetica-Bold", color: C.accent,
    letterSpacing: 1,
  },
  dayTitle: {
    fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.primary,
    letterSpacing: 0.5,
  },
  dayDescription: {
    fontSize: 9, color: C.ink, lineHeight: 1.6, marginBottom: 8,
  },

  // ── Elegant Day Nesting Blocks ─────────────────────────────────────────────
  nestedHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4, marginTop: 6,
  },
  nestedHeaderLabel: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.neutralGray, letterSpacing: 1.5,
  },
  nestedCard: {
    borderLeftWidth: 1, borderLeftColor: C.accent,
    paddingLeft: 8,
    marginBottom: 6,
    marginLeft: 4,
  },
  nestedTitle: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, marginBottom: 2,
  },
  nestedSub: {
    fontSize: 8, color: C.neutralGray, lineHeight: 1.4,
  },

  // ── Stay Properties cards ──────────────────────────────────────────────────
  stayGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10,
  },
  stayCard: {
    width: "48.5%",
    backgroundColor: C.white,
    borderWidth: 0.8, borderColor: C.border,
    borderLeftWidth: 3, borderLeftColor: C.accent,
    borderRadius: 6, padding: 12,
  },
  stayHeader: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 5,
  },
  stayName: {
    fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.primary, width: "70%",
  },
  stayRating: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent,
  },
  stayNights: {
    fontSize: 8, color: C.neutralGray,
  },
  stayAmenities: {
    fontSize: 7.5, color: C.neutralGray, lineHeight: 1.35, marginTop: 4,
    borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 4,
  },

  // ── Inclusions Exclusions ──────────────────────────────────────────────────
  incExcRow: {
    flexDirection: "row", gap: 16,
  },
  incCol: {
    flex: 1,
  },
  dividerLine: {
    width: 0.8, backgroundColor: C.border,
  },
  excCol: {
    flex: 1,
  },
  incExcTitle: {
    fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 1.5, marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 5, gap: 6,
  },
  bulletDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent, marginTop: 4, flexShrink: 0,
  },
  bulletDotRose: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: C.rose, marginTop: 4, flexShrink: 0,
  },
  incExcText: {
    fontSize: 8, color: C.neutralGray, flex: 1, lineHeight: 1.4,
  },

  // ── Departure Briefings ────────────────────────────────────────────────────
  kbygRow: {
    flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 10,
  },
  kbygNum: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: C.accent, width: 14,
  },
  kbygText: {
    fontSize: 9, color: C.neutralGray, flex: 1, lineHeight: 1.5,
  },
  carryRow: {
    width: "48.5%", flexDirection: "row", alignItems: "flex-start", marginBottom: 6, gap: 6,
  },
  carryDot: {
    width: 3.5, height: 3.5, backgroundColor: C.accent, transform: "rotate(45deg)", marginTop: 4.5, flexShrink: 0,
  },
  carryText: {
    fontSize: 8.5, color: C.neutralGray, flex: 1, lineHeight: 1.4,
  },

  // ── Reservation Stub Pricing ticket ────────────────────────────────────────
  reserveContainer: {
    borderWidth: 0.8, borderColor: C.border,
    borderRadius: 8,
    padding: 18,
    backgroundColor: C.white,
    marginBottom: 16,
    position: "relative",
  },
  reserveInnerBorder: {
    position: "absolute", top: 3, left: 3, right: 3, bottom: 3,
    borderWidth: 0.5, borderColor: C.border,
    borderRadius: 6,
  },
  reserveRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  reserveLabel: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.accent, letterSpacing: 2,
  },
  reserveAmount: {
    fontSize: 26, fontFamily: "Helvetica-Bold", color: C.primary, marginTop: 4,
  },
  reserveSub: {
    fontSize: 8, color: C.neutralGray, marginTop: 2,
  },
  reserveBtn: {
    borderWidth: 0.8, borderColor: C.accent,
    paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 4,
  },
  reserveBtnText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent, letterSpacing: 1,
  },

  // ── Booking Callout ────────────────────────────────────────────────────────
  bookingBox: {
    borderTopWidth: 0.8, borderTopColor: C.border,
    paddingTop: 14,
    alignItems: "center",
  },
  bookingTitle: {
    fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 1, marginBottom: 4,
  },
  bookingSubtitle: {
    fontSize: 8.5, color: C.neutralGray, textAlign: "center", marginBottom: 8, lineHeight: 1.45,
  },
  bookingContact: {
    fontSize: 9, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 0.5,
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
    <View style={s.sectionLine} />
  </View>
);

// ─── Cover Page (Minimalist Luxury) ──────────────────────────────────────────
const CoverPage = ({ pkg }: { pkg: PackageData }) => (
  <Page size="A4" style={{ padding: 0 }}>
    <View style={s.coverPage}>
      <View style={s.coverBorder}>
        <View style={s.coverDoubleBorder} />
        
        {/* Brand Logo Header */}
        <View style={s.logoGroup}>
          <Text style={s.brandText}>LETSLIVE TOURS</Text>
          <Text style={s.brandSubtitle}>Private Journeys</Text>
        </View>

        {/* Center Title and Circular Image */}
        <View style={s.coverMiddle}>
          <View style={s.coverHeroFrame}>
            {pkg.heroImage ? (
              <Image src={pkg.heroImage} style={s.coverHeroImg} />
            ) : (
              <View style={{ width: "100%", height: "100%", backgroundColor: C.border }} />
            )}
          </View>

          {pkg.category && <Text style={s.coverCategory}>{pkg.category}</Text>}
          <Text style={s.coverTitle}>{pkg.name}</Text>
          
          {pkg.destination?.name && (
            <Text style={s.coverDestText}>
              {pkg.destination.name.toUpperCase()}
            </Text>
          )}

          <View style={s.coverPill}>
            <Text style={s.coverPillText}>
              {pkg.duration.nights} Nights / {pkg.duration.days} Days
            </Text>
          </View>

          {/* Client Card */}
          {pkg.isCustom && pkg.clientName ? (
            <View style={s.coverClientCard}>
              <Text style={s.coverClientLabel}>CURATED EXCLUSIVELY FOR</Text>
              <Text style={s.coverClientName}>{pkg.clientName.toUpperCase()}</Text>
              {pkg.clientEmail || pkg.clientPhone ? (
                <Text style={s.coverClientDetail}>
                  {pkg.clientEmail} {pkg.clientPhone ? ` · ${pkg.clientPhone}` : ""}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={s.coverClientCard}>
              <Text style={s.coverClientLabel}>SELECT ITINERARY</Text>
              <Text style={s.coverClientName}>OFFICIAL CURATION</Text>
              <Text style={s.coverClientDetail}>Detailed package itineraries, accommodations & stays.</Text>
            </View>
          )}
        </View>

        <Text style={s.coverFooterText}>CONFIDENTIAL  ·  © LETSLIVE TOURS</Text>
      </View>
    </View>
  </Page>
);

// ─── Trip Summary & Glance ───────────────────────────────────────────────────
const TripSummarySection = ({ pkg }: { pkg: PackageData }) => (
  <View style={{ marginBottom: 18 }}>
    <SectionTitle title="The Travel Curation" />
    
    <View style={s.glanceContainer}>
      <View style={s.glanceRow}>
        <Text style={s.glanceLabel}>Destination</Text>
        <Text style={s.glanceValue}>
          {pkg.destination?.name || "—"}{pkg.destination?.country ? `, ${pkg.destination.country}` : ""}
        </Text>
      </View>
      <View style={s.glanceRow}>
        <Text style={s.glanceLabel}>Duration</Text>
        <Text style={s.glanceValue}>{pkg.duration.nights} Nights / {pkg.duration.days} Days</Text>
      </View>
      <View style={s.glanceRow}>
        <Text style={s.glanceLabel}>Hotels Rating</Text>
        <Text style={s.glanceValue}>{pkg.hotelRating || "Select Luxury"}</Text>
      </View>
      <View style={[s.glanceRow, { borderBottomWidth: 0 }]}>
        <Text style={s.glanceLabel}>Est. Rate</Text>
        <Text style={s.glanceValueGold}>
          INR {pkg.price.toLocaleString("en-IN")}
          <Text style={{ fontSize: 8, color: C.neutralGray }}> / {pkg.priceUnit || "person"}</Text>
        </Text>
      </View>
    </View>

    {(pkg.shortDescription || pkg.description) ? (
      <Text style={s.descText}>{pkg.shortDescription || pkg.description}</Text>
    ) : null}

    {/* Inclusions Chips */}
    {pkg.inclusions && pkg.inclusions.length > 0 ? (
      <View wrap={false} style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.primary, letterSpacing: 1, marginBottom: 6 }}>
          Included Conveniences
        </Text>
        <View style={s.quickInclusions}>
          {pkg.inclusions.slice(0, 6).map((inc, i) => (
            <View key={i} style={s.incPill}>
              <Text style={s.incPillText}>{inc}</Text>
            </View>
          ))}
        </View>
      </View>
    ) : null}
  </View>
);

// ─── Photo Gallery (3 Portrait Columns Page) ────────────────────────────────
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
      <SectionTitle title="Visual Chronicle" />
      <View style={s.galleryRow}>
        {imgs.map((img, i) => (
          <View key={i} style={s.galleryCol}>
            <Image src={img} style={s.galleryImg} />
          </View>
        ))}
      </View>
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
          <SectionTitle title="The Overview" />
          <Text style={s.descText}>{pkg.description}</Text>
        </View>
      )}
      {pkg.highlights && pkg.highlights.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Highlights" />
            <View style={s.highlightsGrid}>
              {pkg.highlights.slice(0, 4).map((h, i) => (
                <View key={i} style={s.highlightCard}>
                  <View style={s.highlightRow}>
                    <View style={s.diamondDot} />
                    <Text style={s.highlightText}>{h}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          {pkg.highlights.length > 4 && (
            <View style={[s.highlightsGrid, { marginTop: 8 }]}>
              {pkg.highlights.slice(4).map((h, i) => (
                <View key={i + 4} style={s.highlightCard} wrap={false}>
                  <View style={s.highlightRow}>
                    <View style={s.diamondDot} />
                    <Text style={s.highlightText}>{h}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      {pkg.keyPoints && pkg.keyPoints.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <View wrap={false}>
            <SectionTitle title="Important Covenants" />
            {pkg.keyPoints.slice(0, 3).map((k, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletDot} />
                <Text style={s.incExcText}>{k}</Text>
              </View>
            ))}
          </View>
          {pkg.keyPoints.slice(3).map((k, i) => (
            <View key={i + 3} style={s.bulletRow} wrap={false}>
              <View style={s.bulletDot} />
              <Text style={s.incExcText}>{k}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Day-wise Itinerary (Editorial Grid Layout) ──────────────────────────────
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
        <SectionTitle title="The Day-Wise Journey" />
      </View>

      {pkg.itinerary.map((day) => {
        const dayTransfers = transfersByDay[day.day] || [];
        const dayActivities = activitiesByDay[day.day] || [];
        return (
          <View key={day.day} style={s.dayBlock}>
            {/* Elegant Header */}
            <View wrap={false} style={s.dayHeaderRow}>
              <Text style={s.dayNumber}>DAY {day.day < 10 ? `0${day.day}` : day.day}</Text>
              <Text style={s.dayTitle}>{day.title}</Text>
            </View>
            
            {day.description ? (
              <View wrap={false}>
                <Text style={s.dayDescription}>{day.description}</Text>
              </View>
            ) : null}

            {/* Quick list chips */}
            {day.activities && day.activities.length > 0 && (
              <View style={{ marginBottom: 6 }}>
                <View wrap={false}>
                  <View style={s.nestedHeaderRow}>
                    <Icon d={ICONS.activity} color={C.accent} size={10} />
                    <Text style={s.nestedHeaderLabel}>ACTIVITY SCHEDULE</Text>
                  </View>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                    {day.activities.slice(0, 3).map((act, i) => (
                      <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 2 }}>
                        <Text style={{ fontSize: 7.5, color: C.neutralGray }}>{act}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {day.activities.length > 3 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                    {day.activities.slice(3).map((act, i) => (
                      <View key={i + 3} style={{ borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 2 }} wrap={false}>
                        <Text style={{ fontSize: 7.5, color: C.neutralGray }}>{act}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Nested activities */}
            {dayActivities.length > 0 && (
              <View style={{ marginTop: 4, marginBottom: 4 }}>
                {dayActivities.map((act, i) => (
                  <View key={i} style={s.nestedCard} wrap={false}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                      <Icon d={ICONS.activity} color={C.accent} size={9} />
                      <Text style={s.nestedTitle}>{act.title}</Text>
                    </View>
                    {act.duration && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 }}>
                        <Icon d={ICONS.calendar} color={C.accent} size={7} />
                        <Text style={{ fontSize: 7.5, color: C.accent, fontFamily: "Helvetica-Bold" }}>{act.duration}</Text>
                      </View>
                    )}
                    {act.description ? <Text style={s.nestedSub}>{act.description}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {/* Nested transfers */}
            {dayTransfers.length > 0 && (
              <View style={{ marginTop: 4, marginBottom: 4 }}>
                <View wrap={false}>
                  {dayTransfers.slice(0, 1).map((t, i) => (
                    <View key={i} style={[s.nestedCard, { borderLeftColor: C.neutralGray }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <Icon d={ICONS.bus} color={C.neutralGray} size={9} />
                        <Text style={s.nestedTitle}>Transfer: {t.title}</Text>
                      </View>
                      {(t.from || t.to) && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <Icon d={ICONS.location} color={C.neutralGray} size={8} />
                          <Text style={{ fontSize: 7.5, color: C.neutralGray, fontFamily: "Helvetica-Bold" }}>
                            {t.from ? t.from : "Start"} ➔ {t.to ? t.to : "End"}
                          </Text>
                        </View>
                      )}
                      {t.description ? <Text style={s.nestedSub}>{t.description}</Text> : null}
                    </View>
                  ))}
                </View>
                {dayTransfers.length > 1 && (
                  <View>
                    {dayTransfers.slice(1).map((t, i) => (
                      <View key={i + 1} style={[s.nestedCard, { borderLeftColor: C.neutralGray }]} wrap={false}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                          <Icon d={ICONS.bus} color={C.neutralGray} size={9} />
                          <Text style={s.nestedTitle}>Transfer: {t.title}</Text>
                        </View>
                        {(t.from || t.to) && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                            <Icon d={ICONS.location} color={C.neutralGray} size={8} />
                            <Text style={{ fontSize: 7.5, color: C.neutralGray, fontFamily: "Helvetica-Bold" }}>
                              {t.from ? t.from : "Start"} ➔ {t.to ? t.to : "End"}
                            </Text>
                          </View>
                        )}
                        {t.description ? <Text style={s.nestedSub}>{t.description}</Text> : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Stays & meals brief bar */}
            {(day.meals?.length > 0 || day.accommodation) && (
              <View style={{ flexDirection: "row", gap: 14, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 6, marginTop: 4 }} wrap={false}>
                {day.meals && day.meals.length > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Icon d={ICONS.restaurant} color={C.accent} size={9} />
                    <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: C.accent }}>MEALS:</Text>
                    <Text style={{ fontSize: 7.5, color: C.neutralGray }}>{day.meals.join(", ")}</Text>
                  </View>
                )}
                {day.accommodation ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Icon d={ICONS.hotel} color={C.primary} size={9} />
                    <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: C.accent }}>STAY:</Text>
                    <Text style={{ fontSize: 7.5, color: C.neutralGray }}>{day.accommodation}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        );
      })}

      {unassignedTransfers.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <View wrap={false} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
              <Icon d={ICONS.bus} color={C.primary} size={11} />
              <Text style={{ fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.primary }}>General Connections</Text>
            </View>
            {unassignedTransfers.map((t, i) => (
              <View key={i} style={[s.nestedCard, { borderLeftColor: C.neutralGray }]} wrap={false}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <Icon d={ICONS.bus} color={C.neutralGray} size={9} />
                  <Text style={s.nestedTitle}>{t.title}</Text>
                </View>
                {(t.from || t.to) && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
                    <Icon d={ICONS.location} color={C.neutralGray} size={8} />
                    <Text style={{ fontSize: 7.5, color: C.neutralGray, fontFamily: "Helvetica-Bold" }}>
                      {t.from ? t.from : "Start"} ➔ {t.to ? t.to : "End"}
                    </Text>
                  </View>
                )}
                {t.description ? <Text style={s.nestedSub}>{t.description}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Accommodation Stays (Sand Left-Border Cards) ───────────────────────────
const AccommodationSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.stays || pkg.stays.length === 0) return null;
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Lodgings & Stays" />
      <View style={s.stayGrid}>
        {pkg.stays.map((stay, i) => (
          <View key={i} style={s.stayCard}>
            <View style={s.stayHeader}>
              <Text style={s.stayName}>{stay.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Icon d={ICONS.star} color={C.accent} size={9} />
                <Text style={s.stayRating}>{stay.rating}</Text>
              </View>
            </View>
            <Text style={s.stayNights}>{stay.nights} Nights  ·  {stay.roomType}</Text>
            {stay.amenities && stay.amenities.length > 0 && (
              <Text style={s.stayAmenities}>
                Includes: {stay.amenities.join(", ")}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── Inclusions Exclusions (Vertical Gold Line Split) ────────────────────────
const InclusionsExclusionsSection = ({ pkg }: { pkg: PackageData }) => {
  const hasInc = pkg.inclusions && pkg.inclusions.length > 0;
  const hasExc = pkg.exclusions && pkg.exclusions.length > 0;
  if (!hasInc && !hasExc) return null;
  return (
    <View wrap={false} style={{ marginBottom: 20 }}>
      <SectionTitle title="Curation Terms" />
      <View style={s.incExcRow}>
        {hasInc && (
          <View style={s.incCol}>
            <Text style={s.incExcTitle}>✓  INCLUDED BENEFITS</Text>
            {pkg.inclusions!.map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletDot} />
                <Text style={s.incExcText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
        
        {hasInc && hasExc && <View style={s.dividerLine} />}
        
        {hasExc && (
          <View style={s.excCol}>
            <Text style={s.incExcTitle}>✗  EXCLUDED ITEMS</Text>
            {pkg.exclusions!.map((item, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bulletDotRose} />
                <Text style={s.incExcText}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Know Before You Go (Departure Briefings) ────────────────────────────────
const KnowBeforeYouGoSection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.knowBeforeYouGo || pkg.knowBeforeYouGo.length === 0) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="Departure Briefings" />
        {pkg.knowBeforeYouGo.slice(0, 3).map((item, i) => (
          <View key={i} style={s.kbygRow} wrap={false}>
            <Text style={s.kbygNum}>0{i + 1}</Text>
            <Text style={s.kbygText}>{item}</Text>
          </View>
        ))}
      </View>
      {pkg.knowBeforeYouGo.slice(3).map((item, i) => (
        <View key={i + 3} style={s.kbygRow} wrap={false}>
          <Text style={s.kbygNum}>{i + 4 < 10 ? `0${i + 4}` : i + 4}</Text>
          <Text style={s.kbygText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Things to Carry (Packing Checklist) ─────────────────────────────────────
const ThingsToCarrySection = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.thingsToCarry || pkg.thingsToCarry.length === 0) return null;
  return (
    <View style={{ marginBottom: 20 }}>
      <View wrap={false}>
        <SectionTitle title="Packing Essentials" />
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {pkg.thingsToCarry.slice(0, 4).map((item, i) => (
            <View key={i} style={s.carryRow}>
              <View style={s.carryDot} />
              <Text style={s.carryText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
      {pkg.thingsToCarry.length > 4 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
          {pkg.thingsToCarry.slice(4).map((item, i) => (
            <View key={i + 4} style={s.carryRow} wrap={false}>
              <View style={s.carryDot} />
              <Text style={s.carryText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Pricing (Double Border Ticket Receipt) ──────────────────────────────────
const PricingSection = ({ pkg }: { pkg: PackageData }) => (
  <View wrap={false} style={{ marginBottom: 20 }}>
    <SectionTitle title="Investment Brief" />
    <View style={s.reserveContainer}>
      <View style={s.reserveInnerBorder} />
      <View style={s.reserveRow}>
        <View>
          <Text style={s.reserveLabel}>ESTIMATED INVESTMENT</Text>
          <Text style={s.reserveAmount}>INR {pkg.price.toLocaleString("en-IN")}</Text>
          <Text style={s.reserveSub}>per {pkg.priceUnit || "person"} (Twin sharing configuration)</Text>
        </View>
        <View style={s.reserveBtn}>
          <Text style={s.reserveBtnText}>BOOK SELECT</Text>
        </View>
      </View>
    </View>

    <View style={s.bookingBox}>
      <Text style={s.bookingTitle}>Curator Consultations</Text>
      <Text style={s.bookingSubtitle}>
        Our travel specialists are available to adjust properties, add nights, or tailor inclusions to your preferences.
      </Text>
      <Text style={s.bookingContact}>Reservations: +91 9999 999 999  ·  info@letslivetours.com</Text>
    </View>
  </View>
);

// ─── Document Root ───────────────────────────────────────────────────────────
const PackagePdfDocumentLuxury = ({ pkg }: { pkg: PackageData }) => (
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
export async function generatePackagePdfLuxury(pkg: PackageData): Promise<void> {
  const blob = await pdf(<PackagePdfDocumentLuxury pkg={pkg} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${pkg.slug || "package"}-itinerary-luxury.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
