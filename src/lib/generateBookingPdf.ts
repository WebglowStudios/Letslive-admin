import jsPDF from "jspdf";

// ─── Types ───
export interface BookingData {
  _id: string;
  bookingId?: string;
  package?: {
    _id: string;
    name: string;
    slug?: string;
    destination?: { name: string; slug?: string };
    duration?: { nights?: number; days?: number } | number;
    images?: string[];
    hotelRating?: string;
    isInternational?: boolean;
    visaIncluded?: boolean;
    flightsIncluded?: boolean;
    trainsIncluded?: boolean;
    hideTrainInfo?: boolean;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  primaryTraveller?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  travellersDetails?: { name: string; age?: number; dob?: string | Date; phone?: string; type: string }[];
  travelDate: string;
  returnDate?: string;
  status?: string;
  bookingStatus?: string;
  totalAmount: number;
  paidAmount?: number;
  paymentStatus?: string;
  travellers: { adults?: number; children?: number; infants?: number } | number;
  specialRequests?: string;
  contactPhone?: string;
  contactEmail?: string;
  dateChangeHistory?: { oldDate: string; newDate: string; reason: string; changedAt: string }[];
  createdAt: string;
}

// ─── Brand Colors ───
const C = {
  teal: [0, 77, 94] as [number, number, number],
  tealLight: [0, 122, 150] as [number, number, number],
  amber: [245, 166, 35] as [number, number, number],
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

// Sanitize text — strip non-Latin-1 characters that break jsPDF Helvetica
function s(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/₹/g, "Rs.")
    .replace(/—/g, " - ")
    .replace(/–/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/·/g, "-")
    .replace(/×/g, "x")
    .replace(/[^\x00-\xFF]/g, "");
}

function fmt(amount: number): string {
  return "Rs. " + new Intl.NumberFormat("en-IN").format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStatusLabel(status: string): string {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusColor(status: string): [number, number, number] {
  switch (status || "pending") {
    case "confirmed": return C.tealLight;
    case "completed": return C.green;
    case "cancelled": return C.red;
    case "pending": return C.amber;
    default: return C.gray;
  }
}

// ─── Main Export ───
export function generateBookingPdf(booking: BookingData): void {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const M = 16; // margin
  const CW = W - M * 2; // content width

  let y = 38; // Will be initialized after header
  
  const checkPage = (neededSpace: number) => {
    if (y + neededSpace > H - 25) {
      doc.addPage();
      y = 20;
    }
  };

  // ═══════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════
  doc.setFillColor(...C.teal);
  doc.rect(0, 0, W, 28, "F");
  doc.setFillColor(...C.amber);
  doc.rect(0, 28, W, 1.5, "F");

  // Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.white);
  doc.text("LetsLive Tours", M, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 225, 230);
  doc.text("BOOKING CONFIRMATION", M, 19);

  // Booking ID on right
  const displayId = booking.bookingId || `LLT-${booking._id.slice(0, 8).toUpperCase()}`;
  const bookingStatus = booking.status || booking.bookingStatus || "pending";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.white);
  doc.text(displayId, W - M, 12, { align: "right" });

  // Status badge on right
  const statusColor = getStatusColor(bookingStatus);
  const statusText = getStatusLabel(bookingStatus);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...statusColor);
  doc.text(statusText.toUpperCase(), W - M, 20, { align: "right" });

  // Set initial Y after header
  y = 38;

  // ═══════════════════════════════════════════════════════
  // PACKAGE DETAILS CARD
  // ═══════════════════════════════════════════════════════
  const hasBadges = booking.package?.isInternational || booking.package?.flightsIncluded !== undefined || booking.package?.trainsIncluded !== undefined;
  const rectHeight = hasBadges ? 44 : 32;
  doc.setFillColor(...C.bg);
  doc.roundedRect(M, y, CW, rectHeight, 3, 3, "F");
  doc.setDrawColor(220, 235, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, rectHeight, 3, 3, "S");

  // Package name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.teal);
  const pkgName = s(booking.package?.name || "Travel Package");
  const nameLines = doc.splitTextToSize(pkgName, CW - 16);
  doc.text(nameLines, M + 8, y + 10);

  // Destination + Duration row
  const destName = s(booking.package?.destination?.name || "");
  const duration = typeof booking.package?.duration === "object" && booking.package.duration
    ? `${booking.package.duration.nights || 0}N / ${booking.package.duration.days || 0}D`
    : "";
  const hotelRating = s(booking.package?.hotelRating || "");

  const metaParts: string[] = [];
  if (destName) metaParts.push(destName);
  if (duration) metaParts.push(duration);
  if (hotelRating) metaParts.push(hotelRating);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.gray);
  doc.text(metaParts.join("   |   "), M + 8, y + 10 + nameLines.length * 5 + 4);

  if (hasBadges) {
    let badgeX = M + 8;
    const badgeY = y + 10 + nameLines.length * 5 + 14;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    
    if (booking.package?.isInternational) {
      const vInc = booking.package.visaIncluded;
      const vText = vInc ? "VISA INCLUDED" : "VISA NOT INCLUDED";
      doc.setTextColor(...(vInc ? C.green : C.amber));
      doc.text(vText, badgeX, badgeY);
      badgeX += doc.getTextWidth(vText) + 12;
    }
    
    if (booking.package?.flightsIncluded !== undefined) {
      const fInc = booking.package.flightsIncluded;
      const fText = fInc ? "FLIGHTS INCLUDED" : "FLIGHTS NOT INCLUDED";
      doc.setTextColor(...(fInc ? C.green : C.amber));
      doc.text(fText, badgeX, badgeY);
      badgeX += doc.getTextWidth(fText) + 12;
    }

    if (!booking.package?.hideTrainInfo && booking.package?.trainsIncluded !== undefined && (!booking.package?.isInternational || booking.package?.trainsIncluded)) {
      const tInc = booking.package.trainsIncluded;
      const tText = tInc ? "TRAINS INCLUDED" : "TRAINS NOT INCLUDED";
      doc.setTextColor(...(tInc ? C.green : C.amber));
      doc.text(tText, badgeX, badgeY);
    }
  }

  y += rectHeight + 8;

  // ═══════════════════════════════════════════════════════
  // BOOKING INFO GRID
  // ═══════════════════════════════════════════════════════
  const colW = CW / 2;

  // Section label
  doc.setFillColor(...C.amber);
  doc.rect(M, y, 20, 1.5, "F");
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.teal);
  doc.text("Booking Details", M, y);
  y += 8;

  // Helper to render a label-value pair
  function field(label: string, value: string, x: number, fy: number): number {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.gray);
    doc.text(label.toUpperCase(), x, fy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...C.ink);
    const valLines = doc.splitTextToSize(s(value), colW - 12);
    doc.text(valLines, x, fy + 5);
    return fy + 5 + valLines.length * 4.5 + 6;
  }

  // Left column
  let yL = y;
  yL = field("Travel Date", formatDate(booking.travelDate), M, yL);

  // Travellers
  let travText = "1 Adult";
  if (typeof booking.travellers === "object" && booking.travellers) {
    const parts: string[] = [];
    if (booking.travellers.adults) parts.push(`${booking.travellers.adults} Adult${booking.travellers.adults > 1 ? "s" : ""}`);
    if (booking.travellers.children) parts.push(`${booking.travellers.children} Child${booking.travellers.children > 1 ? "ren" : ""}`);
    if (booking.travellers.infants) parts.push(`${booking.travellers.infants} Infant${booking.travellers.infants > 1 ? "s" : ""}`);
    travText = parts.join(", ") || "1 Adult";
  } else if (typeof booking.travellers === "number") {
    travText = `${booking.travellers} Traveller${booking.travellers > 1 ? "s" : ""}`;
  }
  yL = field("Travellers", travText, M, yL);
  yL = field("Booking Status", getStatusLabel(bookingStatus), M, yL);
  yL = field("Booked On", formatShortDate(booking.createdAt), M, yL);

  // Right column
  let yR = y;
  yR = field("Total Amount", fmt(booking.totalAmount), M + colW, yR);
  
  const paymentStatus = booking.paymentStatus || "pending";
  let paymentLabel = getStatusLabel(paymentStatus);
  if (paymentStatus === "full" || paymentStatus === "paid") paymentLabel = "Fully Paid";
  
  if (paymentStatus === "partial" || paymentStatus === "full" || paymentStatus === "paid") {
    yR = field("Paid Amount", fmt(booking.paidAmount || 0), M + colW, yR);
  }
  if (paymentStatus === "partial") {
    yR = field("Pending Amount", fmt(booking.totalAmount - (booking.paidAmount || 0)), M + colW, yR);
  }
  
  yR = field("Payment Status", paymentLabel, M + colW, yR);
  if (booking.contactEmail) {
    yR = field("Contact Email", booking.contactEmail, M + colW, yR);
  }
  if (booking.contactPhone) {
    yR = field("Contact Phone", booking.contactPhone, M + colW, yR);
  }

  y = Math.max(yL, yR) + 4;

  // ═══════════════════════════════════════════════════════
  // TRAVELLER INFO
  // ═══════════════════════════════════════════════════════
  const pt = booking.primaryTraveller;
  const usr = booking.user;
  const travFirstName = pt?.firstName || usr?.firstName || "";
  const travLastName = pt?.lastName || usr?.lastName || "";
  const travEmail = pt?.email || usr?.email || booking.contactEmail || "";
  const travPhone = pt?.phone || usr?.phone || booking.contactPhone || "";

  if (travFirstName || travEmail) {
    doc.setFillColor(...C.amber);
    doc.rect(M, y, 20, 1.5, "F");
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.teal);
    doc.text("Primary Traveller", M, y);
    y += 8;

    const fullName = s(`${travFirstName} ${travLastName}`.trim());
    if (fullName) yL = field("Name", fullName, M, y);
    else yL = y;
    if (travEmail) yR = field("Email", s(travEmail), M + colW, y);
    else yR = y;
    y = Math.max(yL, yR);

    if (travPhone) {
      y = field("Phone", s(travPhone), M, y);
    }
  }

  // ═══════════════════════════════════════════════════════
  // GUEST DETAILS
  // ═══════════════════════════════════════════════════════
  checkPage(30);
  if (booking.travellersDetails && booking.travellersDetails.length > 0) {
    doc.setFillColor(...C.amber);
    doc.rect(M, y, 20, 1.5, "F");
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.teal);
    doc.text("Co-Travellers", M, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    for (let i = 0; i < booking.travellersDetails.length; i++) {
      const t = booking.travellersDetails[i];
      const typeLabel = t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : "Adult";
      const dobFormatted = t.dob ? new Date(t.dob).toLocaleDateString("en-GB") : "";
      const dobStr = dobFormatted ? `, DOB: ${dobFormatted}` : "";
      let ageNum = t.age;
      if (ageNum === undefined && t.dob) {
        const birthDate = new Date(t.dob);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let a = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) a--;
          if (a >= 0) ageNum = a;
        }
      }
      const ageStr = ageNum !== undefined ? `, Age: ${ageNum}` : "";
      const phoneStr = t.phone ? ` | Ph: ${s(t.phone)}` : "";

      doc.setTextColor(...C.teal);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}.`, M, y);
      doc.setTextColor(...C.ink);
      doc.setFont("helvetica", "normal");

      // Wrap infoText to content width minus index prefix (8) and badge space (20)
      const infoText = `${s(t.name || "—")}${dobStr}${ageStr}${phoneStr}`;
      const maxInfoW = CW - 8 - 22;
      const infoLines = doc.splitTextToSize(infoText, maxInfoW);
      doc.text(infoLines, M + 8, y);

      // Type badge — fixed right-column position, aligned to first line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...C.gray);
      doc.text(`[${typeLabel}]`, M + CW - doc.getTextWidth(`[${typeLabel}]`), y);
      doc.setFontSize(8.5);

      y += infoLines.length * 5.5 + 1;
    }
    y += 6;
  }

  // ═══════════════════════════════════════════════════════
  // SPECIAL REQUESTS
  // ═══════════════════════════════════════════════════════
  if (booking.specialRequests) {
    checkPage(40);
    doc.setFillColor(...C.amber);
    doc.rect(M, y, 20, 1.5, "F");
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.teal);
    doc.text("Special Requests", M, y);
    y += 7;

    doc.setFillColor(...C.bg);
    const reqText = s(booking.specialRequests);
    const reqLines = doc.splitTextToSize(reqText, CW - 16);
    const boxH = reqLines.length * 4.5 + 10;
    doc.roundedRect(M, y, CW, boxH, 2, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.ink);
    doc.text(reqLines, M + 8, y + 7);
    y += boxH + 6;
  }

  // ═══════════════════════════════════════════════════════
  // PAYMENT SUMMARY BOX
  // ═══════════════════════════════════════════════════════
  y += 4;
  const payBoxH = 30;
  checkPage(payBoxH + 10);
  doc.setFillColor(...C.teal);
  doc.roundedRect(M, y, CW, payBoxH, 4, 4, "F");

  // Left: total
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 225, 230);
  doc.text("TOTAL AMOUNT", M + 10, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...C.white);
  doc.text(fmt(booking.totalAmount), M + 10, y + 22);

  // Right: payment status badge
  const pStatus = getStatusLabel(booking.paymentStatus || "pending");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.amber);
  doc.text("PAYMENT: " + pStatus.toUpperCase(), W - M - 10, y + 16, { align: "right" });

  y += payBoxH + 10;

  // ═══════════════════════════════════════════════════════
  // DATE CHANGE HISTORY
  // ═══════════════════════════════════════════════════════
  if (booking.dateChangeHistory && booking.dateChangeHistory.length > 0) {
    checkPage(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.amber);
    doc.text("Date Change Notice", M, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.ink);
    
    for (const h of booking.dateChangeHistory) {
      const txt = `Travel date changed from ${formatDate(h.oldDate)} to ${formatDate(h.newDate)}. Reason: ${s(h.reason)}`;
      const lines = doc.splitTextToSize(txt, CW - 4);
      doc.text(lines, M, y);
      y += lines.length * 4.5 + 2;
    }
    y += 4;
  }

  // ═══════════════════════════════════════════════════════
  // IMPORTANT NOTES
  // ═══════════════════════════════════════════════════════
  checkPage(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.teal);
  doc.text("Important Information", M, y);
  y += 6;

  const notes = [
    "Please carry a valid photo ID and this booking confirmation.",
    "Report at the pickup point at least 30 minutes before departure.",
    "For cancellations, please contact us at least 48 hours in advance.",
    "This is a system-generated document and does not require a signature.",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.ink);

  for (const note of notes) {
    doc.setFillColor(...C.amber);
    doc.circle(M + 2, y - 0.8, 0.8, "F");
    doc.text(note, M + 6, y);
    y += 5;
  }

  // ═══════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════
  const footY = H - 18;
  doc.setDrawColor(...C.teal);
  doc.setLineWidth(0.2);
  doc.line(M, footY, W - M, footY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.gray);
  doc.text("www.letslivetours.in  |  info@letslivetours.in  |  +91 98765 43210", M, footY + 5);
  doc.text(`Generated: ${formatShortDate(new Date().toISOString())}`, W - M, footY + 5, { align: "right" });

  doc.setFontSize(6.5);
  doc.setTextColor(...C.grayLight);
  doc.text("This is a computer-generated booking confirmation. No signature required.", M, footY + 10);

  // ─── Save ───
  const fileName = `LetsLive_Booking_${displayId}.pdf`;
  doc.save(fileName);
}
