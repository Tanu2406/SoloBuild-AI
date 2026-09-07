// ============================================================
// Import Service — Real CSV/XLSX parsing
// Uses SheetJS (xlsx) for Excel, manual parsing for CSV.
// Returns ParsedCandidate[] ready for store insertion.
// Later: send to FastAPI for server-side processing.
// ============================================================

import * as XLSX from 'xlsx';
import type { ParsedCandidate } from '../types';

// Column name aliases — maps flexible header names to canonical fields
const COLUMN_MAP: Record<string, keyof ParsedCandidate> = {
  // name
  name: 'name',
  'full name': 'name',
  'candidate name': 'name',
  'full_name': 'name',
  candidate: 'name',
  // phone
  phone: 'phone',
  mobile: 'phone',
  'mobile number': 'phone',
  'phone number': 'phone',
  'contact number': 'phone',
  'contact': 'phone',
  'mobile_number': 'phone',
  'phone_number': 'phone',
  // email
  email: 'email',
  'email address': 'email',
  'email_address': 'email',
  // position
  position: 'position',
  role: 'position',
  designation: 'position',
  title: 'position',
  'job title': 'position',
  'job_title': 'position',
  // location
  location: 'location',
  city: 'location',
  place: 'location',
  // experience
  experience: 'experience',
  exp: 'experience',
  'years of experience': 'experience',
  'years_of_experience': 'experience',
  'work experience': 'experience',
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[^a-z0-9 _]/g, '');
}

function mapRow(headers: string[], row: (string | number | null | undefined)[]): ParsedCandidate {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => {
    const normalized = normalizeHeader(h);
    const field = COLUMN_MAP[normalized];
    if (field && row[i] != null && row[i] !== '') {
      obj[field] = String(row[i]).trim();
    }
  });

  const errors: string[] = [];
  if (!obj.name) errors.push('Missing name');
  if (!obj.phone) errors.push('Missing phone');
  if (obj.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)) {
    errors.push('Invalid email format');
  }

  return {
    name: obj.name || '',
    phone: obj.phone || '',
    email: obj.email,
    position: obj.position,
    location: obj.location,
    experience: obj.experience,
    _valid: errors.length === 0,
    _errors: errors,
  };
}

export async function parseFile(file: File): Promise<ParsedCandidate[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file type. Please upload .csv, .xlsx, or .xls');
  }
}

async function parseCSV(file: File): Promise<ParsedCandidate[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('File is empty or has no data rows');

  const headers = parseCSVLine(lines[0]);
  const results: ParsedCandidate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.every(cell => !cell)) continue; // skip blank rows
    results.push(mapRow(headers, row));
  }

  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function parseExcel(file: File): Promise<ParsedCandidate[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1 });

  if (rows.length < 2) throw new Error('Spreadsheet has no data rows');

  const headers = (rows[0] as (string | number)[]).map(h => String(h ?? ''));
  const results: ParsedCandidate[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as (string | number | null | undefined)[];
    if (!row || row.every(cell => cell == null || cell === '')) continue;
    results.push(mapRow(headers, row));
  }

  return results;
}
