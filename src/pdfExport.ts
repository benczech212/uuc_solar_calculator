import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";

// Letter pages in points, with a margin. Every block marked data-pdf-block is captured on
// its own and placed on the page; a block that doesn't fit starts a new page, and one taller
// than a page is cut between its data-pdf-row children rather than through a line of text.
// data-pdf-page-break forces a new page, and links marked data-pdf-link stay clickable.
const PAGE_W = 612, PAGE_H = 792, MARGIN = 28, GAP = 12, FOOTER = 18;
const BG: [number, number, number] = [2, 6, 23];
const PIXEL_RATIO = 2;

export const exportToPDF = async (elementId: string, filename: string) => {
  const root = document.getElementById(elementId);
  if (!root) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const blocks = [...root.querySelectorAll<HTMLElement>('[data-pdf-block]')]
      .filter(b => !b.parentElement?.closest('[data-pdf-block]'));
    const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
    const contentW = PAGE_W - MARGIN * 2;
    const bottom = PAGE_H - MARGIN - FOOTER;
    const paint = () => { pdf.setFillColor(...BG); pdf.rect(0, 0, PAGE_W, PAGE_H, 'F'); };
    paint();
    let y = MARGIN;
    const newPage = () => { pdf.addPage(); paint(); y = MARGIN; };

    for (const block of blocks) {
      const box = block.getBoundingClientRect();
      const scale = contentW / box.width; // points per CSS pixel
      const fullH = box.height * scale;
      if (block.hasAttribute('data-pdf-page-break') && y > MARGIN) newPage();
      if (fullH > bottom - y && (fullH <= bottom - MARGIN || bottom - y < 120)) newPage();

      const canvas = await htmlToImage.toCanvas(block, { pixelRatio: PIXEL_RATIO, backgroundColor: '#020617' });
      // Cut points: the bottoms of rows inside the block, in CSS pixels from its top.
      const cuts = [...block.querySelectorAll<HTMLElement>('[data-pdf-row]')]
        .map(r => r.getBoundingClientRect().bottom - box.top)
        .sort((a, b) => a - b);
      const links = [...block.querySelectorAll<HTMLAnchorElement>('a[data-pdf-link]')].map(a => {
        const r = a.getBoundingClientRect();
        return { url: a.dataset.pdfLink!, x: r.left - box.left, top: r.top - box.top, w: r.width, h: r.height };
      });

      let start = 0;
      while (start < box.height - 0.5) {
        const room = (bottom - y) / scale;
        let end = Math.min(box.height, start + room);
        if (end < box.height) {
          const fit = cuts.filter(c => c > start + 40 && c <= end);
          if (fit.length) end = fit[fit.length - 1];
        }
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.max(1, Math.round((end - start) * PIXEL_RATIO));
        slice.getContext('2d')!.drawImage(canvas, 0, start * PIXEL_RATIO, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        const h = (end - start) * scale;
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', MARGIN, y, contentW, h);
        for (const l of links) {
          if (l.top >= start && l.top + l.h <= end) pdf.link(MARGIN + l.x * scale, y + (l.top - start) * scale, l.w * scale, l.h * scale, { url: l.url });
        }
        y += h + GAP;
        start = end;
        if (start < box.height - 0.5) newPage();
      }
    }

    const pages = pdf.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.text(`UUC Solar Report  ·  page ${i} of ${pages}`, PAGE_W / 2, PAGE_H - MARGIN / 2 - 2, { align: 'center' });
    }
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF", error);
  }
};
