import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

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

// ─── Types ────────────────────────────────────────────────────────────────────
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
    paddingTop: 52, paddingBottom: 56, paddingHorizontal: 44,
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
    marginBottom: 12, borderRadius: 10, overflow: "hidden",
    borderWidth: 1, borderColor: C.line,
  },
  dayHeader: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.iv2,
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: C.line,
  },
  dayBadge: {
    backgroundColor: C.gn,
    borderRadius: 6, paddingVertical: 3, paddingHorizontal: 9,
    marginRight: 12,
  },
  dayBadgeText: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white,
  },
  dayTitle: {
    fontSize: 10.5, fontFamily: "Helvetica-Bold",
    color: C.gn, flex: 1,
  },
  dayBody: {
    backgroundColor: C.white,
    padding: 14,
  },
  dayDescription: {
    fontSize: 9, color: C.ink2, lineHeight: 1.6, marginBottom: 10,
  },
  dayActivitiesLabel: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold",
    color: C.gn2, letterSpacing: 1, marginBottom: 6,
  },
  dayActivitiesRow: {
    flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 10,
  },
  dayActivityChip: {
    backgroundColor: C.iv,
    borderWidth: 1, borderColor: C.line,
    borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8,
  },
  dayActivityChipText: {
    fontSize: 7.5, color: C.ink2,
  },
  dayMeta: {
    flexDirection: "row", gap: 18,
    borderTopWidth: 1, borderTopColor: C.line,
    paddingTop: 8, marginTop: 2,
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
const CoverPage = ({ pkg }: { pkg: PackageData }) => (
  <Page size="A4" style={{ padding: 0 }}>
    <View style={s.coverPage}>
      {pkg.heroImage ? <Image src={pkg.heroImage} style={s.coverHero} /> : null}
      <View style={s.coverOverlay} />
      <View style={s.coverTopStripe} />
      <View style={s.coverSideBar} />

      <View style={s.coverContent}>
        {/* Brand */}
        <View>
          <Text style={s.coverBrand}>LETSLIVE TOURS</Text>
          <Text style={s.coverTagline}>CURATED TRAVEL EXPERIENCES</Text>
        </View>

        {/* Main content */}
        <View style={s.coverMiddle}>
          {(pkg.category || pkg.badge) && (
            <View style={s.coverCategoryPill}>
              <Text style={s.coverCategoryText}>
                {pkg.badge || pkg.category?.toUpperCase() || ""}
              </Text>
            </View>
          )}

          <Text style={s.coverTitle}>{pkg.name}</Text>

          {pkg.destination?.name && (
            <View style={s.coverDestLine}>
              <View style={s.coverDestDot} />
              <Text style={s.coverDestText}>
                {pkg.destination.name}
                {pkg.destination.country ? `, ${pkg.destination.country}` : ""}
              </Text>
            </View>
          )}

          <View style={s.coverPills}>
            <View style={s.coverPillGold}>
              <Text style={s.coverPillGoldText}>
                {pkg.duration.nights}N / {pkg.duration.days}D
              </Text>
            </View>
            {pkg.hotelRating ? (
              <View style={s.coverPillOutline}>
                <Text style={s.coverPillOutlineText}>{pkg.hotelRating}</Text>
              </View>
            ) : null}
            {pkg.rating ? (
              <View style={s.coverPillOutline}>
                <Text style={s.coverPillOutlineText}>★ {pkg.rating}</Text>
              </View>
            ) : null}
          </View>

          {pkg.isCustom && pkg.clientName ? (
            <View style={s.coverClientCard}>
              <Text style={s.coverClientLabel}>PREPARED EXCLUSIVELY FOR</Text>
              <Text style={s.coverClientName}>{pkg.clientName}</Text>
              {pkg.clientEmail ? (
                <Text style={s.coverClientDetail}>{pkg.clientEmail}</Text>
              ) : null}
              {pkg.clientPhone ? (
                <Text style={s.coverClientDetail}>{pkg.clientPhone}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Price footer */}
        <View style={s.coverPriceBox}>
          <View>
            <Text style={s.coverPriceLabel}>STARTING FROM</Text>
            {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
              <Text style={s.coverPriceOriginal}>
                ₹{pkg.originalPrice.toLocaleString("en-IN")}
              </Text>
            ) : null}
            <Text style={s.coverPriceAmount}>
              ₹{pkg.price.toLocaleString("en-IN")}
            </Text>
            <Text style={s.coverPriceUnit}>
              per {pkg.priceUnit || "person"}  ·  {pkg.duration.nights}N / {pkg.duration.days}D
            </Text>
          </View>
          {pkg.discount ? (
            <View style={s.coverDiscountBadge}>
              <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: C.ink }}>
                {pkg.discount}%
              </Text>
              <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: C.ink, letterSpacing: 1 }}>
                OFF
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  </Page>
);

// ─── Trip at a Glance ─────────────────────────────────────────────────────────
const TripSummaryPage = ({ pkg }: { pkg: PackageData }) => (
  <Page size="A4" style={s.page}>
    <PageHeader section="Trip Summary" />
    <SectionTitle title="Trip at a Glance" />

    <View style={s.glanceGrid}>
      <View style={s.glanceCard}>
        <Text style={s.glanceLabel}>DURATION</Text>
        <Text style={s.glanceValue}>{pkg.duration.nights} Nights / {pkg.duration.days} Days</Text>
      </View>
      <View style={s.glanceCard}>
        <Text style={s.glanceLabel}>DESTINATION</Text>
        <Text style={s.glanceValue}>
          {pkg.destination?.name || "—"}{pkg.destination?.country ? `, ${pkg.destination.country}` : ""}
        </Text>
      </View>
      <View style={[s.glanceCard, { borderLeftColor: C.gn2 }]}>
        <Text style={s.glanceLabel}>HOTEL CATEGORY</Text>
        <Text style={s.glanceValue}>{pkg.hotelRating || "Standard"}</Text>
      </View>
      <View style={[s.glanceCard, { borderLeftColor: C.cu }]}>
        <Text style={s.glanceLabel}>PACKAGE PRICE</Text>
        <Text style={s.glanceValueGold}>
          ₹{pkg.price.toLocaleString("en-IN")}
          <Text style={{ fontSize: 8, color: C.ink3 }}> / {pkg.priceUnit || "person"}</Text>
        </Text>
      </View>
    </View>

    {/* Short description */}
    {(pkg.shortDescription || pkg.description) ? (
      <Text style={s.descText}>{pkg.shortDescription || pkg.description}</Text>
    ) : null}

    {/* Quick inclusions preview */}
    {pkg.inclusions && pkg.inclusions.length > 0 ? (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.gn, marginBottom: 8 }}>
          What&apos;s Included
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {pkg.inclusions.slice(0, 8).map((inc, i) => (
            <View key={i} style={{
              backgroundColor: C.iv2,
              borderWidth: 1, borderColor: C.line,
              borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10,
            }}>
              <Text style={{ fontSize: 7.5, color: C.gn2 }}>✓  {inc}</Text>
            </View>
          ))}
        </View>
      </View>
    ) : null}

    {/* Stay overview strip */}
    {pkg.stays && pkg.stays.length > 0 ? (
      <View>
        <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.gn, marginBottom: 8 }}>
          Stay Overview
        </Text>
        {pkg.stays.map((stay, i) => (
          <View key={i} style={{
            flexDirection: "row", paddingVertical: 7,
            borderTopWidth: i === 0 ? 1 : 0,
            borderBottomWidth: 1, borderColor: C.line,
          }}>
            <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.ink2, width: "40%" }}>
              {stay.name}
            </Text>
            <Text style={{ fontSize: 8, color: C.ink3, width: "20%" }}>{stay.rating}</Text>
            <Text style={{ fontSize: 8, color: C.ink3, width: "20%" }}>{stay.nights}N</Text>
            <Text style={{ fontSize: 8, color: C.ink3, flex: 1 }}>{stay.roomType}</Text>
          </View>
        ))}
      </View>
    ) : null}

    <PageFooter />
  </Page>
);

// ─── Gallery ──────────────────────────────────────────────────────────────────
const GalleryPage = ({ pkg }: { pkg: PackageData }) => {
  const imgs = [
    ...(pkg.heroImage ? [pkg.heroImage] : []),
    ...(pkg.destinationImages || []),
    ...(pkg.stayImages || []),
    ...(pkg.activityImages || []),
    ...(pkg.images || []),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  if (imgs.length === 0) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Gallery" />
      <SectionTitle title="Photo Gallery" />
      <View style={s.galleryGrid}>
        {imgs.map((img, i) => (
          <View key={i} style={s.galleryCell}>
            <Image src={img} style={s.galleryImg} />
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  );
};

// ─── Overview ─────────────────────────────────────────────────────────────────
const OverviewPage = ({ pkg }: { pkg: PackageData }) => {
  const hasContent =
    pkg.description || pkg.highlights?.length || pkg.keyPoints?.length;
  if (!hasContent) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Overview" />
      {pkg.description && (
        <>
          <SectionTitle title="Overview" />
          <Text style={s.descText}>{pkg.description}</Text>
        </>
      )}
      {pkg.highlights && pkg.highlights.length > 0 && (
        <>
          <SectionTitle title="Trip Highlights" />
          {pkg.highlights.map((h, i) => (
            <View key={i} style={s.bulletRow}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{h}</Text>
            </View>
          ))}
        </>
      )}
      {pkg.keyPoints && pkg.keyPoints.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <SectionTitle title="Key Points" />
          {pkg.keyPoints.map((k, i) => (
            <View key={i} style={s.bulletRow}>
              <View style={s.bulletTealDot} />
              <Text style={s.bulletText}>{k}</Text>
            </View>
          ))}
        </View>
      )}
      <PageFooter />
    </Page>
  );
};

// ─── Itinerary ────────────────────────────────────────────────────────────────
const ItineraryPages = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.itinerary || pkg.itinerary.length === 0) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Itinerary" />
      <SectionTitle title="Day-wise Itinerary" />
      {pkg.itinerary.map((day) => (
        <View key={day.day} style={s.dayCard} wrap={false}>
          <View style={s.dayHeader}>
            <View style={s.dayBadge}>
              <Text style={s.dayBadgeText}>DAY {day.day}</Text>
            </View>
            <Text style={s.dayTitle}>{day.title}</Text>
          </View>
          <View style={s.dayBody}>
            {day.description ? (
              <Text style={s.dayDescription}>{day.description}</Text>
            ) : null}
            {day.activities && day.activities.length > 0 && (
              <>
                <Text style={s.dayActivitiesLabel}>ACTIVITIES</Text>
                <View style={s.dayActivitiesRow}>
                  {day.activities.map((act, i) => (
                    <View key={i} style={s.dayActivityChip}>
                      <Text style={s.dayActivityChipText}>{act}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {(day.meals?.length > 0 || day.accommodation) && (
              <View style={s.dayMeta}>
                {day.meals && day.meals.length > 0 && (
                  <View style={s.dayMetaItem}>
                    <Text style={s.dayMetaLabel}>MEALS:</Text>
                    <Text style={s.dayMetaValue}>{day.meals.join(", ")}</Text>
                  </View>
                )}
                {day.accommodation ? (
                  <View style={s.dayMetaItem}>
                    <Text style={s.dayMetaLabel}>STAY:</Text>
                    <Text style={s.dayMetaValue}>{day.accommodation}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </View>
      ))}
      <PageFooter />
    </Page>
  );
};

// ─── Accommodation ────────────────────────────────────────────────────────────
const AccommodationPage = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.stays || pkg.stays.length === 0) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Accommodation" />
      <SectionTitle title="Accommodation" />
      <View style={s.tableWrap}>
        <View style={s.tableHead}>
          <Text style={[s.tableHeadCell, { width: "30%" }]}>Hotel</Text>
          <Text style={[s.tableHeadCell, { width: "15%" }]}>Rating</Text>
          <Text style={[s.tableHeadCell, { width: "15%" }]}>Nights</Text>
          <Text style={[s.tableHeadCell, { width: "20%" }]}>Room Type</Text>
          <Text style={[s.tableHeadCell, { width: "20%" }]}>Amenities</Text>
        </View>
        {pkg.stays.map((stay, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]} wrap={false}>
            <Text style={[s.tableCell, { width: "30%", fontFamily: "Helvetica-Bold" }]}>{stay.name}</Text>
            <Text style={[s.tableCell, { width: "15%" }]}>{stay.rating}</Text>
            <Text style={[s.tableCell, { width: "15%" }]}>{stay.nights}N</Text>
            <Text style={[s.tableCell, { width: "20%" }]}>{stay.roomType}</Text>
            <Text style={[s.tableCell, { width: "20%" }]}>{stay.amenities.join(", ")}</Text>
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  );
};

// ─── Activities ───────────────────────────────────────────────────────────────
const ActivitiesPage = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.activities || pkg.activities.length === 0) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Activities" />
      <SectionTitle title="Activities" />
      {pkg.activities.map((act, i) => (
        <View key={i} style={s.actCard} wrap={false}>
          <Text style={s.actTitle}>{act.title}</Text>
          {act.duration ? (
            <Text style={s.actDuration}>Duration: {act.duration}</Text>
          ) : null}
          {act.description ? <Text style={s.actDesc}>{act.description}</Text> : null}
          {act.details?.map((d, j) => (
            <Text key={j} style={s.actBullet}>· {d}</Text>
          ))}
        </View>
      ))}
      <PageFooter />
    </Page>
  );
};

// ─── Transfers ────────────────────────────────────────────────────────────────
const TransfersPage = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.transfers || pkg.transfers.length === 0) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Transfers" />
      <SectionTitle title="Transfers" />
      {pkg.transfers.map((t, i) => (
        <View key={i} style={s.transCard} wrap={false}>
          <Text style={s.transTitle}>{t.title}</Text>
          {(t.from || t.to) && (
            <View style={s.transRoute}>
              {t.from ? (
                <View style={s.transLocation}>
                  <Text style={s.transLocLabel}>FROM</Text>
                  <Text style={s.transLocText}>{t.from}</Text>
                </View>
              ) : null}
              {t.from && t.to ? (
                <Text style={s.transArrow}>→</Text>
              ) : null}
              {t.to ? (
                <View style={s.transLocation}>
                  <Text style={s.transLocLabel}>TO</Text>
                  <Text style={s.transLocText}>{t.to}</Text>
                </View>
              ) : null}
            </View>
          )}
          {t.description ? (
            <Text style={s.actDesc}>{t.description}</Text>
          ) : null}
          {t.details?.map((d, j) => (
            <Text key={j} style={s.actBullet}>· {d}</Text>
          ))}
        </View>
      ))}
      <PageFooter />
    </Page>
  );
};

// ─── Inclusions & Exclusions ──────────────────────────────────────────────────
const InclusionsExclusionsPage = ({ pkg }: { pkg: PackageData }) => {
  const hasInc = pkg.inclusions && pkg.inclusions.length > 0;
  const hasExc = pkg.exclusions && pkg.exclusions.length > 0;
  if (!hasInc && !hasExc) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Inclusions & Exclusions" />
      <SectionTitle title="Inclusions & Exclusions" />
      <View style={s.incExcRow}>
        {hasInc && (
          <View style={s.incCol}>
            <Text style={[s.incExcHeader, { color: C.gn }]}>✓  Inclusions</Text>
            {pkg.inclusions!.map((item, i) => (
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
            {pkg.exclusions!.map((item, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 5 }}>
                <View style={[s.bulletDot, { marginTop: 3 }]} />
                <Text style={s.excItem}>{item}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <PageFooter />
    </Page>
  );
};

// ─── Know Before You Go ───────────────────────────────────────────────────────
const KnowBeforeYouGoPage = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.knowBeforeYouGo || pkg.knowBeforeYouGo.length === 0) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Know Before You Go" />
      <SectionTitle title="Know Before You Go" />
      {pkg.knowBeforeYouGo.map((item, i) => (
        <View key={i} style={s.kbygRow} wrap={false}>
          <View style={s.kbygNumBadge}>
            <Text style={s.kbygNumText}>{i + 1}</Text>
          </View>
          <Text style={s.kbygText}>{item}</Text>
        </View>
      ))}
      <PageFooter />
    </Page>
  );
};

// ─── Things to Carry ──────────────────────────────────────────────────────────
const ThingsToCarryPage = ({ pkg }: { pkg: PackageData }) => {
  if (!pkg.thingsToCarry || pkg.thingsToCarry.length === 0) return null;
  return (
    <Page size="A4" style={s.page}>
      <PageHeader section="Things to Carry" />
      <SectionTitle title="Things to Carry" />
      <View style={s.carryGrid}>
        {pkg.thingsToCarry.map((item, i) => (
          <View key={i} style={s.carryItem}>
            <View style={s.carryDot} />
            <Text style={s.carryText}>{item}</Text>
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  );
};

// ─── Pricing & CTA ────────────────────────────────────────────────────────────
const PricingPage = ({ pkg }: { pkg: PackageData }) => (
  <Page size="A4" style={s.page}>
    <PageHeader section="Pricing" />
    <SectionTitle title="Pricing" />
    <View style={s.priceCard}>
      <View style={s.priceCardTop}>
        <Text style={s.priceCardLabel}>PACKAGE PRICE</Text>
        {pkg.originalPrice && pkg.originalPrice > pkg.price ? (
          <Text style={s.priceCardOriginal}>₹{pkg.originalPrice.toLocaleString("en-IN")}</Text>
        ) : null}
        <Text style={s.priceCardAmount}>₹{pkg.price.toLocaleString("en-IN")}</Text>
        <Text style={s.priceCardUnit}>per {pkg.priceUnit || "person"} (twin sharing)</Text>
      </View>
      {pkg.discount && pkg.discount > 0 ? (
        <View style={s.priceCardBottom}>
          <View style={s.priceCardSavings}>
            <Text style={s.priceCardSavingsText}>You save {pkg.discount}% on this package</Text>
          </View>
        </View>
      ) : null}
    </View>

    <View style={s.ctaBox}>
      <Text style={s.ctaTitle}>Ready to Book?</Text>
      <Text style={s.ctaSubtitle}>
        Contact us to customise dates, group size, and confirm your trip.
      </Text>
      <Text style={s.ctaContact}>+91 9999 999 999  ·  info@letslivetours.com</Text>
    </View>
    <PageFooter />
  </Page>
);

// ─── Document ─────────────────────────────────────────────────────────────────
const PackagePdfDocument = ({ pkg }: { pkg: PackageData }) => (
  <Document
    title={`${pkg.name} — LetsLive Tours`}
    author="LetsLive Tours"
    subject={`Travel Itinerary — ${pkg.name}`}
  >
    <CoverPage pkg={pkg} />
    <TripSummaryPage pkg={pkg} />
    <GalleryPage pkg={pkg} />
    <OverviewPage pkg={pkg} />
    <ItineraryPages pkg={pkg} />
    <AccommodationPage pkg={pkg} />
    <ActivitiesPage pkg={pkg} />
    <TransfersPage pkg={pkg} />
    <InclusionsExclusionsPage pkg={pkg} />
    <KnowBeforeYouGoPage pkg={pkg} />
    <ThingsToCarryPage pkg={pkg} />
    <PricingPage pkg={pkg} />
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
