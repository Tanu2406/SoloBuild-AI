// ============================================================
// SoloBuildAI — Core Domain Types
// These types map cleanly to future FastAPI/Pydantic models.
// ============================================================

export type HiringStatus = 'draft' | 'ready' | 'calling' | 'paused' | 'completed';
export type CandidateStatus =
  | 'added'
  | 'calling'
  | 'contacted'
  | 'connected'
  | 'interested'
  | 'shortlisted'
  | 'not_interested'
  | 'no_answer'
  | 'busy'
  | 'call_failed';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ActivityType =
  | 'call_completed'
  | 'call_failed'
  | 'call_no_answer'
  | 'candidate_shortlisted'
  | 'hiring_created'
  | 'hiring_launched'
  | 'hiring_paused'
  | 'hiring_resumed'
  | 'hiring_completed'
  | 'candidate_interested'
  | 'direct_call_completed'
  | 'direct_call_failed'
  | 'direct_call_no_answer';

// ——— Hiring ———
export interface Hiring {
  id: string;
  title: string;
  location: string;
  employmentType: EmploymentType;
  description?: string;
  status: HiringStatus;
  aiRecruiterId?: string;
  interviewInstructions?: string;
  candidateCount: number;  // derived: candidateIds.length
  contacted: number;       // derived from candidates
  connected: number;
  interested: number;
  shortlisted: number;
  candidateIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ——— Candidate ———
export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email?: string;
  position?: string;
  location?: string;
  experience?: string;
  hiringId?: string;
  hiringTitle?: string;
  status: CandidateStatus;
  lastActivity?: string;
  lastActivityAt?: string; // ISO
  callDuration?: string;
  callOutcome?: string;
  aiSummary?: string;
  notes?: string;
}

// ——— AI Recruiter ———
export interface AIRecruiter {
  id: string;
  name: string;
  description: string;
  languages: string[];
  voice: string;
  conversationStyle: string;
  interviewInstructions?: string;
  avatarInitial: string;
  avatarColor: string;
}

// ——— Call ———
export interface Call {
  id: string;
  candidateId: string;
  candidateName: string;
  hiringId: string;
  hiringTitle: string;
  status: 'completed' | 'no_answer' | 'busy' | 'failed';
  duration?: string; // "4m 22s"
  outcome?: CandidateStatus;
  aiSummary?: string;
  startedAt: string;  // ISO
  completedAt?: string; // ISO
  timeAgo: string;
}

// ——— Activity ———
export interface ActivityItem {
  id: string;
  type: ActivityType;
  candidateName?: string;
  hiringTitle?: string;
  description: string;
  timestamp: string; // ISO
  timeAgo: string;
}

// ——— Import ———
export interface ParsedCandidate {
  name: string;
  phone: string;
  email?: string;
  position?: string;
  location?: string;
  experience?: string;
  _valid: boolean;
  _errors: string[];
}

// ——— Direct Call (Dial a Number) ———
// Maps to future FastAPI: POST /calls
export type DirectCallStatus =
  | 'preparing'   // system setting up
  | 'ringing'     // phone is ringing
  | 'connected'   // candidate picked up
  | 'in_progress' // conversation ongoing
  | 'completed'   // call ended normally
  | 'no_answer'   // rang out
  | 'busy'        // line busy
  | 'failed';     // technical failure

export type CallPurpose = 'initial_screening' | 'follow_up' | 'offer_discussion' | 'general';

export interface DirectCall {
  id: string;
  candidateName?: string;
  phoneNumber: string;
  aiRecruiterId: string;
  purpose: CallPurpose;
  status: DirectCallStatus;
  duration?: string;
  aiSummary?: string;
  startedAt: string;
  endedAt?: string;
  timeAgo: string;
}
export interface CreateHiringForm {
  title: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
}

export interface CreateRecruiterForm {
  name: string;
  conversationStyle: string;
  languages: string;
  voice: string;
  interviewInstructions: string;
}
