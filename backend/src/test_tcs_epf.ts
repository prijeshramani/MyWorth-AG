import * as fs from 'fs';
import * as path from 'path';

async function dumpEpfPdf() {
  console.log('--- TCS EPF PDF TS DUMPER ---');
  const pdfPath = 'c:\\Users\\prije\\Downloads\\Payslips-EPF\\TCS-EPF\\2025-2026.pdf';
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File does not exist at: ${pdfPath}`);
    return;
  }

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`Loaded PDF: ${pdfPath} (${pdfBuffer.length} bytes)`);
    
    // Dynamic import of modern ES Module pdfjs-dist in CommonJS/TS environment
    const pdfjsLib = await (eval('import("pdfjs-dist/legacy/build/pdf.mjs")') as Promise<any>);

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdfDoc = await loadingTask.promise;
    console.log(`Document loaded successfully. Total pages: ${pdfDoc.numPages}`);
    
    let rawText = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContentObj = await page.getTextContent();
      const pageText = textContentObj.items
        .map((item: any) => item.str)
        .join(' ');
      rawText += `--- PAGE ${i} ---\n${pageText}\n\n`;
    }
    
    const outputPath = path.resolve(__dirname, '../../scratch/tcs_epf_raw.txt');
    fs.writeFileSync(outputPath, rawText, 'utf8');
    console.log(`Successfully extracted and saved plain text representation to: ${outputPath}`);
    console.log('\n--- FIRST 2000 CHARACTERS PREVIEW ---');
    console.log(rawText.slice(0, 2000));
    console.log('---------------------------------------');
    
  } catch (err) {
    console.error('Failed to parse EPF PDF:', err);
  }
}

dumpEpfPdf();
