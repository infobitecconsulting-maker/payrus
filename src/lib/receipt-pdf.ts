import jsPDF from "jspdf";

// Receipt PDF (jsPDF is already a dependency). Everything is passed in as ready-to-print text so the caller controls the language.
export interface ReceiptPdfData {
  title: string;
  brandLine: string;
  amount: string;
  currency: string;
  converted?: string;
  rows: [label: string, value: string][];
  statusLabel: string;
  disclaimer: string;
  reference: string;
}

// jsPDF's built-in fonts do not draw the narrow / non-breaking spaces that toLocaleString produces.
const clean = (s: string) => s.replace(new RegExp("[\u00A0\u202F\u2009\u2007]", "g"), " ");

export function buildReceiptPdf(d: ReceiptPdfData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const w = doc.internal.pageSize.getWidth();
  const m = 14;

  // Brand band
  doc.setFillColor(11, 42, 74);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PayRus", m, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(clean(d.brandLine), m, 20);
  doc.setFontSize(10);
  doc.text(clean(d.title), w - m, 13, { align: "right" });

  // Amount
  let y = 44;
  doc.setTextColor(11, 42, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(clean(`${d.amount} ${d.currency}`), w / 2, y, { align: "center" });
  if (d.converted) {
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 105, 120);
    doc.text(clean(`≈ ${d.converted}`), w / 2, y, { align: "center" });
  }

  // Status pill
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  const sw = doc.getTextWidth(clean(d.statusLabel)) + 10;
  doc.setFillColor(220, 245, 230);
  doc.roundedRect(w / 2 - sw / 2, y - 5, sw, 8, 4, 4, "F");
  doc.setTextColor(27, 107, 69);
  doc.text(clean(d.statusLabel), w / 2, y, { align: "center" });

  // Rows
  y += 14;
  doc.setFontSize(10);
  for (const [label, value] of d.rows) {
    doc.setDrawColor(228, 234, 240);
    doc.line(m, y + 3, w - m, y + 3);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 135, 150);
    doc.text(clean(label), m, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 42, 74);
    const lines = doc.splitTextToSize(clean(value), w - m * 2 - 45) as string[];
    doc.text(lines, w - m, y, { align: "right" });
    y += 8 + (lines.length - 1) * 4.5;
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 150, 160);
  const foot = doc.splitTextToSize(clean(d.disclaimer), w - m * 2) as string[];
  doc.text(foot, w / 2, doc.internal.pageSize.getHeight() - 14, { align: "center" });
  return doc;
}

export const receiptFileName = (reference: string) => `PayRus-Receipt-${reference.replace(/[^A-Za-z0-9_-]/g, "")}.pdf`;

export function downloadReceiptPdf(d: ReceiptPdfData) {
  buildReceiptPdf(d).save(receiptFileName(d.reference));
}

// Prints the PDF through a hidden frame, so no pop-up window is needed (pop-up blockers made the old print button do nothing).
// If the browser will not print a frame, the PDF opens in a new tab instead.
export function printReceiptPdf(d: ReceiptPdfData): Promise<void> {
  const url = URL.createObjectURL(buildReceiptPdf(d).output("blob"));
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    frame.src = url;
    const done = () => { setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 60_000); };
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        done();
        resolve();
      } catch {
        const tab = window.open(url, "_blank");
        done();
        if (tab) resolve(); else reject(new Error("print_blocked"));
      }
    };
    document.body.appendChild(frame);
  });
}
