import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ───
interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation: string;
}

interface Stay {
  name: string;
  rating: string;
  nights: number;
  roomType: string;
  amenities: string[];
}

interface Activity {
  title: string;
  description: string;
  duration: string;
  details: string[];
}

interface Transfer {
  title: string;
  description: string;
  details: string[];
}

interface PackageData {
  name: string;
  slug: string;
  destination?: { name: string; slug?: string; country?: string };
  description?: string;
  shortDescription?: string;
  duration: { nights: number; days: number };
  hotelRating?: string;
  category?: string;
  price: number;
  originalPrice?: number;
  priceUnit?: string;
  discount?: number;
  badge?: string;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  keyPoints?: string[];
  itinerary?: ItineraryDay[];
  inclusions?: string[];
  exclusions?: string[];
  stays?: Stay[];
  activities?: Activity[];
  transfers?: Transfer[];
  knowBeforeYouGo?: string[];
  thingsToCarry?: string[];
  images?: string[];
  heroImage?: string;
  destinationImages?: string[];
  stayImages?: string[];
  activityImages?: string[];
}

// ─── Brand Colors ───
const C = {
  teal: [0, 77, 94] as [number, number, number],
  tealLight: [0, 122, 150] as [number, number, number],
  tealDark: [0, 50, 62] as [number, number, number],
  amber: [245, 166, 35] as [number, number, number],
  amberDark: [192, 125, 16] as [number, number, number],
  dark: [10, 26, 31] as [number, number, number],
  ink: [26, 58, 66] as [number, number, number],
  gray: [100, 130, 140] as [number, number, number],
  grayLight: [160, 180, 190] as [number, number, number],
  bg: [245, 250, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [16, 185, 129] as [number, number, number],
  red: [220, 53, 69] as [number, number, number],
};

// ─── Helpers ───

// Sanitize text to only contain characters jsPDF Helvetica can render.
// Replaces common Unicode chars with ASCII equivalents, strips the rest.
function sanitize(text: string): string {
  if (!text) return "";
  return text
    // Currency
    .replace(/₹/g, "Rs.")
    // Dashes
    .replace(/—/g, " - ")
    .replace(/–/g, "-")
    // Quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Ellipsis
    .replace(/…/g, "...")
    // Degree symbol (keep, it's in Latin-1)
    // Multiplication
    .replace(/×/g, "x")
    // Bullet chars
    .replace(/•/g, "-")
    .replace(/·/g, "-")
    // Remove any remaining non-Latin-1 characters (codepoint > 255)
    // but keep standard ASCII + Latin-1 supplement (0-255)
    .replace(/[^\x00-\xFF]/g, "");
}

// Sanitize an array of strings
function sanitizeArr(arr: string[] | undefined): string[] {
  if (!arr) return [];
  return arr.map(sanitize);
}

function fmt(amount: number): string {
  return "Rs. " + new Intl.NumberFormat("en-IN").format(amount);
}

function bullet(doc: jsPDF, x: number, y: number, color: [number, number, number], size = 1.2) {
  doc.setFillColor(...color);
  doc.circle(x, y - 1, size, "F");
}

function header(doc: jsPDF, w: number) {
  doc.setFillColor(...C.teal);
  doc.rect(0, 0, w, 16, "F");
  doc.setFillColor(...C.amber);
  doc.rect(0, 16, w, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  doc.text("LetsLive Tours", 14, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Premium Travel Experiences", w - 14, 11, { align: "right" });
}

function footer(doc: jsPDF, w: number, h: number, pg: number) {
  doc.setDrawColor(...C.teal);
  doc.setLineWidth(0.2);
  doc.line(14, h - 12, w - 14, h - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.gray);
  doc.text("www.letslivetours.in  |  info@letslivetours.in  |  +91 98765 43210", 14, h - 7);
  doc.text(`Page ${pg}`, w - 14, h - 7, { align: "right" });
}

function section(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...C.amber);
  doc.rect(14, y, 24, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.teal);
  doc.text(title, 14, y + 9);
  return y + 14;
}

function pageBreak(doc: jsPDF, y: number, need: number, h: number, w: number, pg: { n: number }): number {
  if (y + need > h - 18) {
    footer(doc, w, h, pg.n);
    doc.addPage();
    pg.n++;
    header(doc, w);
    return 24;
  }
  return y;
}

// Load an image URL as base64 data URL for embedding in PDF
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Main Export ───
export async function generatePackagePdf(pkg: PackageData): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const M = 14; // margin
  const CW = W - M * 2; // content width
  const pg = { n: 1 };

  // ═══════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════

  // Try to load hero image for cover
  const heroUrl = pkg.heroImage || pkg.images?.[0] || pkg.destinationImages?.[0];
  let heroBase64: string | null = null;
  if (heroUrl) {
    heroBase64 = await loadImageAsBase64(heroUrl);
  }

  if (heroBase64) {
    // Full-bleed hero image as cover background
    try {
      doc.addImage(heroBase64, "JPEG", 0, 0, W, H);
    } catch {
      // fallback to solid color if image fails
      doc.setFillColor(...C.teal);
      doc.rect(0, 0, W, H, "F");
    }
    // Dark overlay for text readability
    doc.setFillColor(0, 30, 40);
    doc.setGState(new (doc as any).GState({ opacity: 0.65 })); // eslint-disable-line @typescript-eslint/no-explicit-any
    doc.rect(0, 0, W, H, "F");
    doc.setGState(new (doc as any).GState({ opacity: 1 })); // eslint-disable-line @typescript-eslint/no-explicit-any
  } else {
    // Solid teal cover fallback
    doc.setFillColor(...C.teal);
    doc.rect(0, 0, W, H, "F");
  }

  // Amber top accent
  doc.setFillColor(...C.amber);
  doc.rect(0, 0, W, 3.5, "F");

  // Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text("LetsLive Tours", M, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 225, 230);
  doc.text("PREMIUM TRAVEL EXPERIENCES", M, 29);

  // Package name
  let cy = 70;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.white);
  const nameLines = doc.splitTextToSize(sanitize(pkg.name), CW - 10);
  doc.text(nameLines, M, cy);
  cy += nameLines.length * 11 + 8;

  // Destination
  if (pkg.destination?.name) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(...C.amber);
    doc.text(sanitize(pkg.destination.name + (pkg.destination.country ? ` | ${pkg.destination.country}` : "")), M, cy);
    cy += 12;
  }

  // Quick info chips
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(210, 235, 240);
  const chips: string[] = [];
  chips.push(`${pkg.duration.nights}N / ${pkg.duration.days}D`);
  if (pkg.hotelRating) chips.push(sanitize(pkg.hotelRating));
  if (pkg.category) chips.push(pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1));
  if (pkg.rating) chips.push(`${pkg.rating}/5 rating`);
  doc.text(chips.join("   |   "), M, cy);
  cy += 10;

  // Badge
  if (pkg.badge) {
    doc.setFillColor(...C.amber);
    const badgeTxt = sanitize(pkg.badge).toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    const bw = doc.getTextWidth(badgeTxt) + 10;
    doc.roundedRect(M, cy - 4.5, bw, 7, 2, 2, "F");
    doc.setTextColor(...C.dark);
    doc.text(badgeTxt, M + 5, cy);
    cy += 12;
  }

  // Price card at bottom of cover
  const pcY = H - 75;
  doc.setFillColor(0, 40, 50);
  doc.setGState(new (doc as any).GState({ opacity: 0.85 })); // eslint-disable-line @typescript-eslint/no-explicit-any
  doc.roundedRect(M, pcY, CW, 52, 4, 4, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 })); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Price card border accent
  doc.setDrawColor(...C.amber);
  doc.setLineWidth(0.8);
  doc.line(M, pcY, M + 40, pcY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 210, 220);
  doc.text("STARTING FROM", M + 12, pcY + 10);

  if (pkg.originalPrice && pkg.originalPrice > pkg.price) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150, 175, 185);
    const origTxt = fmt(pkg.originalPrice);
    doc.text(origTxt, M + 12, pcY + 20);
    const ow = doc.getTextWidth(origTxt);
    doc.setDrawColor(150, 175, 185);
    doc.setLineWidth(0.4);
    doc.line(M + 12, pcY + 18.5, M + 12 + ow, pcY + 18.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...C.white);
  doc.text(fmt(pkg.price), M + 12, pcY + 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 210, 220);
  doc.text(`per ${pkg.priceUnit || "person"}`, M + 12, pcY + 44);

  // Discount badge
  if (pkg.discount) {
    doc.setFillColor(...C.amber);
    doc.roundedRect(W - M - 34, pcY + 10, 22, 30, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...C.dark);
    doc.text(`${pkg.discount}%`, W - M - 30, pcY + 24);
    doc.setFontSize(8);
    doc.text("OFF", W - M - 28, pcY + 33);
  }

  // Cover footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 160, 170);
  doc.text("System-generated itinerary document  |  www.letslivetours.in", M, H - 10);

  // ═══════════════════════════════════════════════════════
  // PAGE 2: PHOTO GALLERY (if images available)
  // ═══════════════════════════════════════════════════════
  const galleryImages: string[] = [];
  if (pkg.destinationImages?.[0]) galleryImages.push(pkg.destinationImages[0]);
  if (pkg.stayImages?.[0]) galleryImages.push(pkg.stayImages[0]);
  if (pkg.activityImages?.[0]) galleryImages.push(pkg.activityImages[0]);
  if (pkg.images?.[0] && galleryImages.length < 4) galleryImages.push(pkg.images[0]);
  if (pkg.images?.[1] && galleryImages.length < 4) galleryImages.push(pkg.images[1]);
  if (pkg.images?.[2] && galleryImages.length < 4) galleryImages.push(pkg.images[2]);

  if (galleryImages.length > 0) {
    doc.addPage();
    pg.n++;
    header(doc, W);
    let gy = 24;
    gy = section(doc, "Gallery", gy);

    // Load up to 4 images and place in a 2x2 grid
    const loaded: (string | null)[] = await Promise.all(
      galleryImages.slice(0, 4).map((url) => loadImageAsBase64(url))
    );

    const validImages = loaded.filter((img): img is string => img !== null);
    if (validImages.length > 0) {
      const imgW = (CW - 4) / 2; // ~89mm each
      const imgH = 62;
      let ix = 0;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          if (ix >= validImages.length) break;
          const x = M + col * (imgW + 4);
          const y2 = gy + row * (imgH + 4);
          try {
            // Rounded clip effect: draw image then overlay rounded border
            doc.addImage(validImages[ix], "JPEG", x, y2, imgW, imgH);
            doc.setDrawColor(...C.teal);
            doc.setLineWidth(0.5);
            doc.roundedRect(x, y2, imgW, imgH, 3, 3, "S");
          } catch {
            // Skip failed image
          }
          ix++;
        }
      }
    }
    footer(doc, W, H, pg.n);
  }

  // ═══════════════════════════════════════════════════════
  // CONTENT PAGES
  // ═══════════════════════════════════════════════════════
  doc.addPage();
  pg.n++;
  header(doc, W);
  let y = 24;

  // ─── Overview ───
  if (pkg.description || pkg.shortDescription) {
    y = section(doc, "Overview", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.ink);
    const desc = sanitize(pkg.description || pkg.shortDescription || "");
    const dLines = doc.splitTextToSize(desc, CW);
    doc.text(dLines, M, y);
    y += dLines.length * 4.5 + 8;
  }

  // ─── Highlights (compact 2-column) ───
  if (pkg.highlights && pkg.highlights.length > 0) {
    y = pageBreak(doc, y, 30, H, W, pg);
    y = section(doc, "Highlights", y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.ink);

    const half = Math.ceil(pkg.highlights.length / 2);
    const col1 = sanitizeArr(pkg.highlights).slice(0, half);
    const col2 = sanitizeArr(pkg.highlights).slice(half);
    const colW = (CW - 8) / 2;
    const startY = y;

    // Column 1
    let y1 = startY;
    for (const h of col1) {
      y1 = pageBreak(doc, y1, 7, H, W, pg);
      bullet(doc, M + 3, y1, C.amber);
      const lines = doc.splitTextToSize(h, colW - 8);
      doc.text(lines, M + 8, y1);
      y1 += lines.length * 4 + 2.5;
    }

    // Column 2
    let y2c = startY;
    const col2X = M + colW + 8;
    for (const h of col2) {
      bullet(doc, col2X + 3, y2c, C.amber);
      const lines = doc.splitTextToSize(h, colW - 8);
      doc.text(lines, col2X + 8, y2c);
      y2c += lines.length * 4 + 2.5;
    }

    y = Math.max(y1, y2c) + 6;
  }

  // ─── Key Points (if different from highlights) ───
  if (pkg.keyPoints && pkg.keyPoints.length > 0) {
    y = pageBreak(doc, y, 25, H, W, pg);
    y = section(doc, "Key Points", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...C.ink);

    for (const pt of sanitizeArr(pkg.keyPoints)) {
      y = pageBreak(doc, y, 7, H, W, pg);
      bullet(doc, M + 3, y, C.tealLight);
      const lines = doc.splitTextToSize(pt, CW - 12);
      doc.text(lines, M + 9, y);
      y += lines.length * 4 + 2.5;
    }
    y += 5;
  }

  // ─── Itinerary ───
  if (pkg.itinerary && pkg.itinerary.length > 0) {
    y = pageBreak(doc, y, 35, H, W, pg);
    y = section(doc, "Day-by-Day Itinerary", y);

    // Use a smarter card-style layout instead of cramped table
    for (const day of pkg.itinerary) {
      y = pageBreak(doc, y, 32, H, W, pg);

      // Day header bar
      doc.setFillColor(...C.teal);
      doc.roundedRect(M, y, CW, 7, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...C.white);
      doc.text(`DAY ${day.day}`, M + 4, y + 5);
      if (day.title) {
        doc.setFont("helvetica", "normal");
        doc.text(sanitize(day.title), M + 22, y + 5);
      }
      y += 11;

      // Description
      if (day.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C.ink);
        const dLines = doc.splitTextToSize(sanitize(day.description), CW - 8);
        doc.text(dLines, M + 4, y);
        y += dLines.length * 3.8 + 3;
      }

      // Activities + Meals + Accommodation in a compact row
      const details: string[] = [];
      if (day.activities?.length) details.push("Activities: " + sanitizeArr(day.activities).join(", "));
      if (day.meals?.length) details.push("Meals: " + sanitizeArr(day.meals).join(", "));
      if (day.accommodation) details.push("Stay: " + sanitize(day.accommodation));

      if (details.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...C.gray);
        for (const d of details) {
          y = pageBreak(doc, y, 6, H, W, pg);
          const lines = doc.splitTextToSize(d, CW - 12);
          doc.text(lines, M + 6, y);
          y += lines.length * 3.5 + 1.5;
        }
      }

      y += 4;
    }
    y += 4;
  }

  // ─── Stays ───
  if (pkg.stays && pkg.stays.length > 0) {
    y = pageBreak(doc, y, 35, H, W, pg);
    y = section(doc, "Accommodation", y);

    autoTable(doc, {
      startY: y,
      head: [["Hotel / Resort", "Rating", "Nights", "Room Type", "Amenities"]],
      body: pkg.stays.map((s) => [
        sanitize(s.name), sanitize(s.rating) || "-", s.nights ? `${s.nights}N` : "-", sanitize(s.roomType) || "-",
        sanitizeArr(s.amenities).join(", ") || "-",
      ]),
      margin: { left: M, right: M },
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: C.ink, lineColor: [220, 235, 240], lineWidth: 0.15 },
      headStyles: { fillColor: C.teal, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: C.bg },
      didDrawPage: () => { pg.n++; header(doc, W); },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Activities ───
  if (pkg.activities && pkg.activities.length > 0) {
    y = pageBreak(doc, y, 35, H, W, pg);
    y = section(doc, "Activities & Experiences", y);

    for (const act of pkg.activities) {
      y = pageBreak(doc, y, 18, H, W, pg);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C.teal);
      doc.text(sanitize(act.title), M + 2, y);
      if (act.duration) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...C.gray);
        doc.text(`(${sanitize(act.duration)})`, M + 2 + doc.getTextWidth(sanitize(act.title) + "  "), y);
      }
      y += 5;

      if (act.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C.ink);
        const lines = doc.splitTextToSize(sanitize(act.description), CW - 8);
        doc.text(lines, M + 4, y);
        y += lines.length * 3.8 + 2;
      }

      if (act.details?.length) {
        doc.setFontSize(7.5);
        doc.setTextColor(...C.gray);
        for (const d of sanitizeArr(act.details)) {
          y = pageBreak(doc, y, 5, H, W, pg);
          doc.text("- " + d, M + 6, y);
          y += 3.8;
        }
      }
      y += 4;
    }
  }

  // ─── Transfers ───
  if (pkg.transfers && pkg.transfers.length > 0) {
    y = pageBreak(doc, y, 30, H, W, pg);
    y = section(doc, "Transfers", y);

    for (const t of pkg.transfers) {
      y = pageBreak(doc, y, 14, H, W, pg);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.teal);
      doc.text(sanitize(t.title), M + 2, y);
      y += 5;
      if (t.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C.ink);
        const lines = doc.splitTextToSize(sanitize(t.description), CW - 8);
        doc.text(lines, M + 4, y);
        y += lines.length * 3.8 + 2;
      }
      if (t.details?.length) {
        doc.setFontSize(7.5);
        doc.setTextColor(...C.gray);
        doc.text(sanitizeArr(t.details).join(" | "), M + 4, y);
        y += 5;
      }
      y += 3;
    }
  }

  // ─── Inclusions & Exclusions (side-by-side table) ───
  if ((pkg.inclusions?.length || 0) > 0 || (pkg.exclusions?.length || 0) > 0) {
    y = pageBreak(doc, y, 40, H, W, pg);
    y = section(doc, "Inclusions & Exclusions", y);

    const maxRows = Math.max(pkg.inclusions?.length || 0, pkg.exclusions?.length || 0);
    const tableData: string[][] = [];
    for (let i = 0; i < maxRows; i++) {
      tableData.push([
        pkg.inclusions?.[i] ? "+ " + sanitize(pkg.inclusions[i]) : "",
        pkg.exclusions?.[i] ? "- " + sanitize(pkg.exclusions[i]) : "",
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["INCLUDED", "NOT INCLUDED"]],
      body: tableData,
      margin: { left: M, right: M },
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: C.ink, lineColor: [230, 240, 242], lineWidth: 0.1 },
      headStyles: { fillColor: C.teal, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: CW / 2 },
        1: { cellWidth: CW / 2 },
      },
      didParseCell: (data) => {
        if (data.section === "body") {
          const text = data.cell.raw as string;
          if (text.startsWith("+ ")) {
            data.cell.styles.textColor = C.green;
          } else if (text.startsWith("- ")) {
            data.cell.styles.textColor = C.red;
          }
        }
      },
      didDrawPage: () => { pg.n++; header(doc, W); },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ─── Know Before You Go ───
  if (pkg.knowBeforeYouGo && pkg.knowBeforeYouGo.length > 0) {
    y = pageBreak(doc, y, 25, H, W, pg);
    y = section(doc, "Know Before You Go", y);

    // Light background card
    const cardH = pkg.knowBeforeYouGo.length * 6 + 8;
    doc.setFillColor(...C.bg);
    doc.roundedRect(M, y - 3, CW, Math.min(cardH, 80), 3, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.ink);

    for (const item of sanitizeArr(pkg.knowBeforeYouGo)) {
      y = pageBreak(doc, y, 6, H, W, pg);
      bullet(doc, M + 5, y, C.amber, 1);
      const lines = doc.splitTextToSize(item, CW - 16);
      doc.text(lines, M + 10, y);
      y += lines.length * 4 + 2;
    }
    y += 6;
  }

  // ─── Things to Carry ───
  if (pkg.thingsToCarry && pkg.thingsToCarry.length > 0) {
    y = pageBreak(doc, y, 25, H, W, pg);
    y = section(doc, "Things to Carry", y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.ink);

    // 2-column layout for compactness
    const half = Math.ceil(pkg.thingsToCarry.length / 2);
    const colW = (CW - 8) / 2;
    const startY2 = y;

    let yL = startY2;
    for (let i = 0; i < half; i++) {
      bullet(doc, M + 3, yL, C.tealLight, 1);
      doc.text(sanitize(pkg.thingsToCarry[i]), M + 8, yL);
      yL += 5;
    }

    let yR = startY2;
    for (let i = half; i < pkg.thingsToCarry.length; i++) {
      bullet(doc, M + colW + 7, yR, C.tealLight, 1);
      doc.text(sanitize(pkg.thingsToCarry[i]), M + colW + 12, yR);
      yR += 5;
    }

    y = Math.max(yL, yR) + 6;
  }

  // ─── Pricing Summary ───
  y = pageBreak(doc, y, 50, H, W, pg);
  y = section(doc, "Pricing", y);

  // Elegant price card
  doc.setFillColor(...C.bg);
  doc.roundedRect(M, y, CW, 36, 4, 4, "F");
  doc.setDrawColor(...C.teal);
  doc.setLineWidth(0.6);
  doc.roundedRect(M, y, CW, 36, 4, 4, "S");

  // Left: price
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.text("Package Price", M + 10, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...C.teal);
  doc.text(fmt(pkg.price), M + 10, y + 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.gray);
  doc.text(`per ${pkg.priceUnit || "person"}`, M + 10, y + 28);

  // Right: original + discount
  if (pkg.originalPrice && pkg.originalPrice > pkg.price) {
    const rx = W - M - 55;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.grayLight);
    const origStr = fmt(pkg.originalPrice);
    doc.text(origStr, rx, y + 12);
    doc.setDrawColor(...C.red);
    doc.setLineWidth(0.4);
    doc.line(rx, y + 10.5, rx + doc.getTextWidth(origStr), y + 10.5);

    if (pkg.discount) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...C.amber);
      doc.text(`SAVE ${pkg.discount}%`, rx, y + 24);
    }
  }

  y += 44;

  // ─── Disclaimer ───
  y = pageBreak(doc, y, 16, H, W, pg);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.grayLight);
  doc.text("* Prices subject to availability and seasonal changes. T&C apply.", M, y);
  doc.text("* System-generated by LetsLive Tours Admin.", M, y + 3.5);
  doc.text(`* Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, M, y + 7);

  // ─── Add footers to all pages (except cover) ───
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    footer(doc, W, H, i);
  }

  // ─── Save ───
  const fileName = `LetsLive_${pkg.slug || pkg.name.replace(/\s+/g, "-").toLowerCase()}_Package.pdf`;
  doc.save(fileName);
}
