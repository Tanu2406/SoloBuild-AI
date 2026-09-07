// ============================================================
// Seed data — used as the initial state on first launch.
// This is NOT imported in pages. Pages read from the store.
// ============================================================

import type { AppState } from './appStore';
import type { Hiring, Candidate, AIRecruiter, Call, ActivityItem } from '../types';

const recruiters: AIRecruiter[] = [
  {
    id: 'ar1',
    name: 'Ava',
    description: 'Friendly, warm tone. Great for first conversations.',
    languages: ['English', 'Hindi'],
    voice: 'Warm & Clear',
    conversationStyle: 'Friendly Professional',
    interviewInstructions: 'Introduce yourself as Ava from the hiring team. Screen candidates professionally, ask about their experience, current role, availability, and expected salary. Be warm and encouraging.',
    avatarInitial: 'A',
    avatarColor: '#2563eb',
  },
  {
    id: 'ar2',
    name: 'Aria',
    description: 'Professional, structured. Ideal for senior roles.',
    languages: ['English'],
    voice: 'Clear & Confident',
    conversationStyle: 'Professional',
    interviewInstructions: 'Introduce yourself as Aria from the recruitment team. Follow a structured interview process. Ask about technical experience, leadership, and decision-making.',
    avatarInitial: 'A',
    avatarColor: '#0891b2',
  },
  {
    id: 'ar3',
    name: 'Riya',
    description: 'Multilingual, conversational. For diverse candidate pools.',
    languages: ['English', 'Hindi', 'Marathi'],
    voice: 'Natural & Clear',
    conversationStyle: 'Conversational',
    interviewInstructions: 'Introduce yourself and make candidates feel comfortable. Ask questions naturally. Switch languages if needed.',
    avatarInitial: 'R',
    avatarColor: '#7c3aed',
  },
];

const candidates: Candidate[] = [
  { id: 'c1', name: 'Aarav Sharma', phone: '+91 98765 43210', email: 'aarav.sharma@email.com', position: 'Sales Executive', location: 'Pune', experience: '3 years', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'interested', lastActivity: '2 min ago', lastActivityAt: new Date(Date.now() - 2 * 60000).toISOString(), callDuration: '6m 24s', callOutcome: 'Interested', aiSummary: 'Candidate has 3 years of sales experience and is available to join within 30 days. Strong communication skills, currently earning ₹5.5L. Open to negotiation.' },
  { id: 'c2', name: 'Priya Patil', phone: '+91 87654 32109', email: 'priya.patil@email.com', position: 'Sales Executive', location: 'Pune', experience: '2 years', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'no_answer', lastActivity: '8 min ago', lastActivityAt: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: 'c3', name: 'Rahul Mehta', phone: '+91 76543 21098', email: 'rahul.mehta@email.com', position: 'Sales Executive', location: 'Pune', experience: '5 years', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'shortlisted', lastActivity: '14 min ago', lastActivityAt: new Date(Date.now() - 14 * 60000).toISOString(), callDuration: '8m 12s', callOutcome: 'Shortlisted', aiSummary: 'Highly experienced candidate with 5 years in B2B sales. Currently at ₹8L, targeting ₹10L. Available immediately. Excellent fit for the role.' },
  { id: 'c4', name: 'Neha Singh', phone: '+91 65432 10987', email: 'neha.singh@email.com', position: 'Frontend Developer', location: 'Bangalore', experience: '4 years', hiringId: 'h2', hiringTitle: 'Frontend Developer', status: 'interested', lastActivity: '32 min ago', lastActivityAt: new Date(Date.now() - 32 * 60000).toISOString(), callDuration: '5m 40s', callOutcome: 'Interested', aiSummary: '4 years React experience with strong TypeScript skills. Currently working remotely. Open to hybrid work. Available in 2 months.' },
  { id: 'c5', name: 'Vikram Joshi', phone: '+91 54321 09876', email: 'vikram.joshi@email.com', position: 'Frontend Developer', location: 'Bangalore', experience: '6 years', hiringId: 'h2', hiringTitle: 'Frontend Developer', status: 'shortlisted', lastActivity: '1 hr ago', lastActivityAt: new Date(Date.now() - 60 * 60000).toISOString(), callDuration: '9m 05s', callOutcome: 'Shortlisted', aiSummary: 'Senior developer with 6 years experience, strong portfolio. Has led teams of 3–4. Salary expectation ₹18L. Immediate joiner.' },
  { id: 'c6', name: 'Sunita Reddy', phone: '+91 43210 98765', email: 'sunita.reddy@email.com', position: 'HR Manager', location: 'Mumbai', experience: '8 years', hiringId: 'h3', hiringTitle: 'HR Manager', status: 'contacted', lastActivity: '2 hr ago', lastActivityAt: new Date(Date.now() - 120 * 60000).toISOString(), callDuration: '3m 12s', callOutcome: 'Callback requested' },
  { id: 'c7', name: 'Arjun Kapoor', phone: '+91 32109 87654', email: 'arjun.kapoor@email.com', position: 'Sales Executive', location: 'Pune', experience: '1 year', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'not_interested', lastActivity: '3 hr ago', lastActivityAt: new Date(Date.now() - 180 * 60000).toISOString(), callDuration: '2m 45s', callOutcome: 'Not interested', aiSummary: 'Candidate is not looking to switch currently. May reconsider in 6 months.' },
  { id: 'c8', name: 'Deepika Nair', phone: '+91 21098 76543', email: 'deepika.nair@email.com', position: 'Frontend Developer', location: 'Bangalore', experience: '3 years', hiringId: 'h2', hiringTitle: 'Frontend Developer', status: 'connected', lastActivity: '4 hr ago', lastActivityAt: new Date(Date.now() - 240 * 60000).toISOString(), callDuration: '4m 18s', callOutcome: 'Awaiting decision' },
  { id: 'c9', name: 'Manish Kumar', phone: '+91 99887 76655', email: 'manish.k@email.com', position: 'Sales Executive', location: 'Pune', experience: '4 years', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'contacted', lastActivity: '5 hr ago', lastActivityAt: new Date(Date.now() - 300 * 60000).toISOString(), callDuration: '1m 50s', callOutcome: 'Will call back' },
  { id: 'c10', name: 'Kavya Menon', phone: '+91 88776 65544', email: 'kavya.m@email.com', position: 'Sales Executive', location: 'Pune', experience: '2 years', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'added', lastActivity: '—' },
  { id: 'c11', name: 'Rohan Desai', phone: '+91 77665 54433', email: 'rohan.d@email.com', position: 'Frontend Developer', location: 'Bangalore', experience: '2 years', hiringId: 'h2', hiringTitle: 'Frontend Developer', status: 'no_answer', lastActivity: '6 hr ago', lastActivityAt: new Date(Date.now() - 360 * 60000).toISOString() },
  { id: 'c12', name: 'Anita Bose', phone: '+91 66554 43322', email: 'anita.b@email.com', position: 'HR Manager', location: 'Mumbai', experience: '6 years', hiringId: 'h3', hiringTitle: 'HR Manager', status: 'interested', lastActivity: '7 hr ago', lastActivityAt: new Date(Date.now() - 420 * 60000).toISOString(), callDuration: '7m 30s', callOutcome: 'Interested', aiSummary: 'Experienced HR professional with 6 years in talent acquisition. Available within 45 days. Salary expectations within budget.' },
];

const hirings: Hiring[] = [
  {
    id: 'h1',
    title: 'Sales Executive',
    location: 'Pune',
    employmentType: 'full_time',
    description: 'We are looking for a dynamic Sales Executive to join our growing team in Pune.',
    status: 'calling',
    aiRecruiterId: 'ar1',
    candidateIds: candidates.filter(c => c.hiringId === 'h1').map(c => c.id),
    candidateCount: candidates.filter(c => c.hiringId === 'h1').length,
    contacted: candidates.filter(c => c.hiringId === 'h1' && ['contacted', 'connected', 'interested', 'shortlisted', 'not_interested', 'no_answer'].includes(c.status)).length,
    connected: candidates.filter(c => c.hiringId === 'h1' && ['connected', 'interested', 'shortlisted'].includes(c.status)).length,
    interested: candidates.filter(c => c.hiringId === 'h1' && ['interested', 'shortlisted'].includes(c.status)).length,
    shortlisted: candidates.filter(c => c.hiringId === 'h1' && c.status === 'shortlisted').length,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-07T09:30:00Z',
  },
  {
    id: 'h2',
    title: 'Frontend Developer',
    location: 'Bangalore',
    employmentType: 'full_time',
    description: 'Hiring a skilled Frontend Developer with React experience.',
    status: 'calling',
    aiRecruiterId: 'ar2',
    candidateIds: candidates.filter(c => c.hiringId === 'h2').map(c => c.id),
    candidateCount: candidates.filter(c => c.hiringId === 'h2').length,
    contacted: candidates.filter(c => c.hiringId === 'h2' && ['contacted', 'connected', 'interested', 'shortlisted', 'not_interested', 'no_answer'].includes(c.status)).length,
    connected: candidates.filter(c => c.hiringId === 'h2' && ['connected', 'interested', 'shortlisted'].includes(c.status)).length,
    interested: candidates.filter(c => c.hiringId === 'h2' && ['interested', 'shortlisted'].includes(c.status)).length,
    shortlisted: candidates.filter(c => c.hiringId === 'h2' && c.status === 'shortlisted').length,
    createdAt: '2026-09-03T10:00:00Z',
    updatedAt: '2026-09-07T08:45:00Z',
  },
  {
    id: 'h3',
    title: 'HR Manager',
    location: 'Mumbai',
    employmentType: 'full_time',
    description: 'Senior HR Manager for our Mumbai office.',
    status: 'paused',
    aiRecruiterId: 'ar1',
    candidateIds: candidates.filter(c => c.hiringId === 'h3').map(c => c.id),
    candidateCount: candidates.filter(c => c.hiringId === 'h3').length,
    contacted: candidates.filter(c => c.hiringId === 'h3' && ['contacted', 'connected', 'interested', 'shortlisted', 'not_interested', 'no_answer'].includes(c.status)).length,
    connected: candidates.filter(c => c.hiringId === 'h3' && ['connected', 'interested', 'shortlisted'].includes(c.status)).length,
    interested: candidates.filter(c => c.hiringId === 'h3' && ['interested', 'shortlisted'].includes(c.status)).length,
    shortlisted: candidates.filter(c => c.hiringId === 'h3' && c.status === 'shortlisted').length,
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-09-06T14:00:00Z',
  },
  {
    id: 'h4',
    title: 'Operations Analyst',
    location: 'Delhi',
    employmentType: 'full_time',
    description: 'Operations Analyst for our Delhi operations center.',
    status: 'draft',
    candidateIds: [],
    candidateCount: 0,
    contacted: 0,
    connected: 0,
    interested: 0,
    shortlisted: 0,
    createdAt: '2026-09-06T10:00:00Z',
    updatedAt: '2026-09-06T10:00:00Z',
  },
];

const calls: Call[] = [
  { id: 'cl1', candidateId: 'c1', candidateName: 'Aarav Sharma', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'completed', duration: '6m 24s', outcome: 'interested', aiSummary: 'Candidate has 3 years of sales experience. Available within 30 days. Currently earning ₹5.5L.', startedAt: new Date(Date.now() - 2 * 60000).toISOString(), completedAt: new Date(Date.now() - 2 * 60000).toISOString(), timeAgo: '2 min ago' },
  { id: 'cl2', candidateId: 'c2', candidateName: 'Priya Patil', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'no_answer', startedAt: new Date(Date.now() - 8 * 60000).toISOString(), completedAt: new Date(Date.now() - 8 * 60000).toISOString(), timeAgo: '8 min ago' },
  { id: 'cl3', candidateId: 'c3', candidateName: 'Rahul Mehta', hiringId: 'h1', hiringTitle: 'Sales Executive', status: 'completed', duration: '8m 12s', outcome: 'shortlisted', aiSummary: 'Highly experienced candidate with 5 years in B2B sales. Excellent fit. Available immediately.', startedAt: new Date(Date.now() - 14 * 60000).toISOString(), completedAt: new Date(Date.now() - 14 * 60000).toISOString(), timeAgo: '14 min ago' },
  { id: 'cl4', candidateId: 'c4', candidateName: 'Neha Singh', hiringId: 'h2', hiringTitle: 'Frontend Developer', status: 'completed', duration: '5m 40s', outcome: 'interested', aiSummary: '4 years React experience. Open to hybrid. Available in 2 months.', startedAt: new Date(Date.now() - 32 * 60000).toISOString(), completedAt: new Date(Date.now() - 32 * 60000).toISOString(), timeAgo: '32 min ago' },
  { id: 'cl5', candidateId: 'c5', candidateName: 'Vikram Joshi', hiringId: 'h2', hiringTitle: 'Frontend Developer', status: 'completed', duration: '9m 05s', outcome: 'shortlisted', aiSummary: 'Senior developer. Has led teams. Immediate joiner. Strong portfolio.', startedAt: new Date(Date.now() - 60 * 60000).toISOString(), completedAt: new Date(Date.now() - 60 * 60000).toISOString(), timeAgo: '1 hr ago' },
];

const activity: ActivityItem[] = [
  { id: 'act1', type: 'candidate_interested', candidateName: 'Aarav Sharma', hiringTitle: 'Sales Executive', description: 'Candidate expressed interest in Sales Executive role', timestamp: new Date(Date.now() - 2 * 60000).toISOString(), timeAgo: '2 min ago' },
  { id: 'act2', type: 'call_no_answer', candidateName: 'Priya Patil', hiringTitle: 'Sales Executive', description: 'Call attempt — no answer', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), timeAgo: '8 min ago' },
  { id: 'act3', type: 'candidate_shortlisted', candidateName: 'Rahul Mehta', hiringTitle: 'Sales Executive', description: 'Candidate shortlisted after screening call', timestamp: new Date(Date.now() - 14 * 60000).toISOString(), timeAgo: '14 min ago' },
  { id: 'act4', type: 'call_completed', candidateName: 'Neha Singh', hiringTitle: 'Frontend Developer', description: 'Screening call completed — 5m 40s', timestamp: new Date(Date.now() - 32 * 60000).toISOString(), timeAgo: '32 min ago' },
  { id: 'act5', type: 'candidate_shortlisted', candidateName: 'Vikram Joshi', hiringTitle: 'Frontend Developer', description: 'Candidate shortlisted for senior role', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), timeAgo: '1 hr ago' },
  { id: 'act6', type: 'call_completed', candidateName: 'Sunita Reddy', hiringTitle: 'HR Manager', description: 'Call completed — callback requested', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), timeAgo: '2 hr ago' },
  { id: 'act7', type: 'call_failed', candidateName: 'Arjun Kapoor', hiringTitle: 'Sales Executive', description: 'Candidate not interested at this time', timestamp: new Date(Date.now() - 180 * 60000).toISOString(), timeAgo: '3 hr ago' },
  { id: 'act8', type: 'hiring_launched', hiringTitle: 'Frontend Developer', description: 'Hiring launched — AI Recruiter Aria started calling', timestamp: new Date(Date.now() - 240 * 60000).toISOString(), timeAgo: '4 hr ago' },
];

export const seedData: AppState = {
  hirings,
  candidates,
  recruiters,
  calls,
  directCalls: [],
  activity,
  initialized: true,
};
