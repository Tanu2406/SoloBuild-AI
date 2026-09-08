// ============================================================
// SoloBuildAI — Core Domain Types
// These types map cleanly to future FastAPI/Pydantic models.
// ============================================================

export type HiringStatus = 'draft' | 'screening' | 'screened' | 'ready' | 'calling' | 'paused' | 'completed';
export type CandidateStatus =
  | 'added'
  | 'calling'
  | 'contacted'
  | 'connected'
  | 'interested'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'hired'
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
  | 'direct_call_no_answer'
  | 'screening_started'
  | 'screening_completed'
  | 'candidate_compatible'
  | 'candidate_incompatible'
  | 'candidate_included'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'interview_cancelled';

export type InterviewStatus = 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
export type InterviewType = 'technical' | 'hr' | 'managerial' | 'final' | 'panel';

// ——— Hiring ———
export interface Hiring {
  id: string;
  title: string;
  location: string;
  employmentType: EmploymentType;
  description?: string;
  jdText?: string;           // pasted JD
  jdFileName?: string;       // uploaded JD file name
  resumeCount?: number;      // number of resumes uploaded
  status: HiringStatus;
  aiRecruiterId?: string;
  interviewInstructions?: string;
  candidateCount: number;    // derived: candidateIds.length
  contacted: number;         // derived from candidates
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
  skills?: string[];
  education?: string;
  hiringId?: string;
  hiringTitle?: string;
  status: CandidateStatus;
  lastActivity?: string;
  lastActivityAt?: string;   // ISO
  callDuration?: string;
  callOutcome?: string;
  aiSummary?: string;
  notes?: string;
  // Resume screening fields
  matchScore?: number;         // 0-100
  compatibility?: 'compatible' | 'not_compatible';
  strongMatches?: string[];
  missingRequirements?: string[];
  aiRecommendation?: string;
  includedInCallList?: boolean;
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
  duration?: string;           // "4m 22s"
  outcome?: CandidateStatus;
  aiSummary?: string;
  startedAt: string;           // ISO
  completedAt?: string;        // ISO
  timeAgo: string;
}

// ——— Interview ———
export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  hiringId: string;
  hiringTitle: string;
  interviewType: InterviewType;
  status: InterviewStatus;
  scheduledDate: string;       // ISO date string "2026-09-15"
  scheduledTime: string;       // "10:00 AM"
  interviewer: string;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ——— Activity ———
export interface ActivityItem {
  id: string;
  type: ActivityType;
  candidateName?: string;
  hiringTitle?: string;
  description: string;
  timestamp: string;           // ISO
  timeAgo: string;
}

// ——— Screening Result (per-candidate resume eval) ———
export interface ScreeningResult {
  candidateId: string;
  name: string;
  experience?: string;
  skills?: string[];
  education?: string;
  matchScore: number;
  compatibility: 'compatible' | 'not_compatible';
  strongMatches: string[];
  missingRequirements: string[];
  aiRecommendation: string;
  includedInCallList: boolean;
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
export type DirectCallStatus =
  | 'preparing'
  | 'ringing'
  | 'connected'
  | 'in_progress'
  | 'completed'
  | 'no_answer'
  | 'busy'
  | 'failed';

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
