// ============================================================
// Google Sheets Service
// Currently: mock implementation that returns sample data.
// Later: replace fetchSheet() with:
//   FastAPI → POST /integrations/google-sheets/preview
//   FastAPI → POST /integrations/google-sheets/import
// The frontend flow and UX remain unchanged.
// ============================================================

import type { ParsedCandidate } from '../types';

// Validates that the input looks like a Google Sheets URL
export function isValidSheetsUrl(url: string): boolean {
  return /docs\.google\.com\/spreadsheets/.test(url);
}

// Extracts sheet ID from URL for display purposes
export function extractSheetId(url: string): string {
  const match = url.match(/\/d\/([\w-]+)/);
  return match ? match[1].slice(0, 8) + '...' : 'Unknown';
}

// Mock candidate data returned when "connecting" a Google Sheet
const MOCK_SHEET_CANDIDATES: ParsedCandidate[] = [
  { name: 'Amit Verma', phone: '+91 90000 11111', email: 'amit.verma@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '3 years', _valid: true, _errors: [] },
  { name: 'Sneha Joshi', phone: '+91 90000 22222', email: 'sneha.joshi@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '4 years', _valid: true, _errors: [] },
  { name: 'Kiran Desai', phone: '+91 90000 33333', email: 'kiran.desai@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '1 year', _valid: true, _errors: [] },
  { name: 'Pooja Iyer', phone: '+91 90000 44444', email: 'pooja.iyer@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '2 years', _valid: true, _errors: [] },
  { name: 'Suresh Nair', phone: '+91 90000 55555', email: 'suresh.nair@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '5 years', _valid: true, _errors: [] },
  { name: 'Meera Pillai', phone: '+91 90000 66666', email: 'meera.pillai@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '3 years', _valid: true, _errors: [] },
  { name: 'Rajesh Gupta', phone: '+91 90000 77777', email: 'rajesh.gupta@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '7 years', _valid: true, _errors: [] },
  { name: 'Ananya Sharma', phone: '+91 90000 88888', email: 'ananya.s@gmail.com', position: 'Sales Executive', location: 'Pune', experience: '2 years', _valid: true, _errors: [] },
];

// Simulates the async fetch from Google Sheets
// Later replaced by: return await fetch(`/api/integrations/sheets/preview?url=${url}`)
export async function fetchSheetPreview(url: string): Promise<ParsedCandidate[]> {
  if (!isValidSheetsUrl(url)) {
    throw new Error('Please enter a valid Google Sheets URL');
  }
  // Simulate network delay
  await new Promise(r => setTimeout(r, 1200));
  return MOCK_SHEET_CANDIDATES;
}
