import fs from "fs";

let code = fs.readFileSync("src/pdfExport.ts", "utf8");

const oldCode = `    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(filename);`;

const newCode = `    // Create a custom-sized PDF that perfectly fits the canvas, no page breaks to cut through charts
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
    pdf.save(filename);`;

code = code.replace(oldCode, newCode);
code = code.replace(/const pdf = new jsPDF\("p", "pt", "a4"\);\n\s+/, "");

fs.writeFileSync("src/pdfExport.ts", code);
