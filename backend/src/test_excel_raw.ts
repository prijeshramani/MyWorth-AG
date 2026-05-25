import * as XLSX from 'xlsx';
import * as path from 'path';

function inspectExcel() {
  const filePath = path.resolve(__dirname, '../../data/holdings-YZ6485.xlsx');
  console.log('Inspecting Excel file at:', filePath);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
  
  console.log('--- ALL ROWS ---');
  rows.forEach((row, i) => {
    console.log(`Row ${i}:`, Object.values(row).map(v => typeof v === 'string' ? `"${v}"` : v).join(' | '));
  });
}

inspectExcel();
