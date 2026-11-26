import jsPDF from "jspdf";

interface InvoiceData {
  mode: "single" | "summary";
  operationId: string;
  customer: { name: string; email: string; phone: string };
  destination: string;
  travelDates?: { start?: string; end?: string };
  dateChangeHistory?: { oldDate: string; newDate: string; reason: string; changedAt: string }[];
  milestone: string;
  amount: number;
  dueDate?: string;
  paidAmount: number;
  status: string;
  paymentLink?: string;
  sellingPrice: number;
  allPayments: { milestone: string; amount: number; paidAmount: number; status: string }[];
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  } catch {
    return dateStr;
  }
}

function s(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(/[^\x00-\xFF]/g, "").replace(/—/g, " - ").replace(/[""]/g, '"');
}

function fmt(amount: number): string {
  return "Rs. " + new Intl.NumberFormat("en-IN").format(amount);
}

export function generateInvoicePdf(data: InvoiceData): void {
  const doc = new jsPDF("p", "mm", "a4");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  const CW = W - M * 2;

  // Header
  doc.setFillColor(0, 77, 94);
  doc.rect(0, 0, W, 32, "F");
  doc.setFillColor(245, 166, 35);
  doc.rect(0, 32, W, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("LetsLive Tours", M, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 225, 230);
  doc.text("PAYMENT INVOICE", M, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(data.operationId, W - M, 14, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 225, 230);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, W - M, 22, { align: "right" });

  let y = 44;

  // Invoice title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 77, 94);
  doc.text(data.mode === "summary" ? "Payment Statement" : `Payment Request: ${s(data.milestone)}`, M, y);
  y += 12;

  // Customer details
  const hasTravelDates = Boolean(data.travelDates?.start);
  const tripCardH = hasTravelDates ? 36 : 28;
  doc.setFillColor(245, 250, 250);
  doc.roundedRect(M, y, CW, tripCardH, 3, 3, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 130, 140);
  doc.text("BILLED TO", M + 8, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 58, 66);
  doc.text(s(data.customer.name), M + 8, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 130, 140);
  doc.text(`${s(data.customer.email)}  |  ${s(data.customer.phone)}`, M + 8, y + 22);

  doc.setFontSize(8);
  doc.setTextColor(100, 130, 140);
  doc.text("DESTINATION", W - M - 60, y + 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(26, 58, 66);
  doc.text(s(data.destination), W - M - 60, y + 16);

  if (hasTravelDates && data.travelDates?.start) {
    const startFmt = fmtDate(data.travelDates.start);
    const endFmt = data.travelDates.end ? fmtDate(data.travelDates.end) : "";
    const travelLabel = endFmt && endFmt !== startFmt ? `${startFmt} - ${endFmt}` : startFmt;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 130, 140);
    doc.text("TRAVEL DATES", W - M - 60, y + 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 77, 94);
    doc.text(s(travelLabel), W - M - 60, y + 29);
  }

  y += tripCardH + 8;

  // Invoice amount box
  doc.setFillColor(0, 77, 94);
  doc.roundedRect(M, y, CW, 34, 4, 4, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(200, 225, 230);
  doc.text(data.mode === "summary" ? "TOTAL OUTSTANDING" : "AMOUNT DUE", M + 10, y + 10);

  const displayAmount = data.mode === "summary"
    ? data.allPayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0)
    : data.amount - data.paidAmount;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(fmt(displayAmount), M + 10, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 225, 230);
  if (data.dueDate) {
    doc.text(`Due by: ${fmtDate(data.dueDate)}`, M + 10, y + 30);
  }

  // Status badge
  const statusText = data.status.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(245, 166, 35);
  doc.text(statusText, W - M - 10, y + 18, { align: "right" });

  y += 42;

  // Breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 77, 94);
  doc.text("Invoice Breakdown", M, y);
  y += 8;

  doc.setDrawColor(220, 235, 240);
  doc.setLineWidth(0.3);

  // Table header
  doc.setFillColor(245, 250, 250);
  doc.rect(M, y, CW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 130, 140);
  doc.text("MILESTONE", M + 4, y + 5.5);
  doc.text("AMOUNT", M + 80, y + 5.5);
  doc.text("PAID", M + 115, y + 5.5);
  doc.text("STATUS", M + 145, y + 5.5);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  for (const p of data.allPayments) {
    doc.setTextColor(26, 58, 66);
    doc.text(s(p.milestone) || "Payment", M + 4, y + 4);
    doc.text(fmt(p.amount), M + 80, y + 4);
    doc.text(fmt(p.paidAmount), M + 115, y + 4);

    const sc = p.status === "paid" ? [16, 185, 129] : p.status === "overdue" ? [220, 53, 69] : [245, 166, 35];
    doc.setTextColor(sc[0], sc[1], sc[2]);
    doc.setFont("helvetica", "bold");
    doc.text(p.status.toUpperCase(), M + 145, y + 4);
    doc.setFont("helvetica", "normal");

    doc.setDrawColor(240, 245, 245);
    doc.line(M, y + 7, W - M, y + 7);
    y += 9;
  }

  // Total row
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(26, 58, 66);
  doc.text("Total Package Value:", M + 4, y);
  doc.text(fmt(data.sellingPrice), M + 80, y);
  y += 14;

  // Payment link section (only in single mode)
  if (data.mode === "single" && data.paymentLink) {
    doc.setFillColor(245, 166, 35);
    doc.rect(M, y, CW, 1.5, "F");
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 77, 94);
    doc.text("Pay Online", M, y);
    y += 7;

    doc.setFillColor(245, 250, 250);
    doc.roundedRect(M, y, CW, 14, 2, 2, "F");
    doc.setDrawColor(0, 77, 94);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, 14, 2, 2, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 122, 150);
    doc.text(s(data.paymentLink), M + 6, y + 9);
    y += 22;
  }

  // Date change notice (if travel dates were revised)
  if (data.dateChangeHistory && data.dateChangeHistory.length > 0) {
    const latest = data.dateChangeHistory[data.dateChangeHistory.length - 1];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(180, 110, 0);
    doc.text("Date Change Notice:", M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 95, 100);
    const notice = s(`Travel date updated from ${fmtDate(latest.oldDate)} to ${fmtDate(latest.newDate)}${latest.reason ? ` (${latest.reason})` : ""}.`);
    const lines = doc.splitTextToSize(notice, CW - 34);
    doc.text(lines, M + 32, y);
    y += Math.max(6, lines.length * 4.5 + 3);
  }

  // Terms
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(160, 180, 190);
  doc.text("* Please make the payment before the due date to avoid any delays in trip confirmation.", M, y);
  doc.text("* For bank transfer, use the reference: " + data.operationId, M, y + 4);
  doc.text("* This is a system-generated invoice. Contact us for any discrepancies.", M, y + 8);

  // Footer
  doc.setDrawColor(0, 77, 94);
  doc.setLineWidth(0.2);
  doc.line(M, H - 14, W - M, H - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 130, 140);
  doc.text("www.letslivetours.in  |  info@letslivetours.in  |  +91 98765 43210", M, H - 8);
  doc.text("LetsLive Tours | Pune, Maharashtra", W - M, H - 8, { align: "right" });

  // Save
  const fileName = data.mode === "summary"
    ? `Statement_${data.operationId}.pdf`
    : `Invoice_${data.operationId}_${s(data.milestone).replace(/\s+/g, "_") || "Payment"}.pdf`;
  doc.save(fileName);
}
