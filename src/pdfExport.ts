import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }
  
  try {
    const dataUrl = await htmlToImage.toJpeg(element, {
      quality: 1.0,
      pixelRatio: 2,
      backgroundColor: '#020617',
    });
    
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'l' : 'p',
      unit: 'px',
      format: [img.width, img.height]
    });
    
    pdf.addImage(dataUrl, "JPEG", 0, 0, img.width, img.height);
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF", error);
  }
};
