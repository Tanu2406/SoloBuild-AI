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
  // Call assessment fields (post-call)
  callAssessmentScore?: number;          // 0-10
  callAssessmentLabel?: AIHireLabel;     // overall recommendation label
  callAssessmentConfidence?: 'high' | 'medium' | 'low';
  callAssessmentComplete?: boolean;      // true only after call + analysis done
  isFavorite?: boolean;                  // HR-starred candidate
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

// ============================================================
// Screening Report Domain Types
// ============================================================

export type AIHireLabel = 'strong_hire' | 'hire' | 'consider' | 'no_hire';
export type StrengthLevel = 'strong' | 'moderate' | 'weak' | 'not_evaluated';
export type CompetencyImportance = 'core' | 'nice_to_have';
export type EvidenceSource = 'resume' | 'call';

// ——— Competency (for Capability Map) ———
export interface Competency {
  name: string;
  score: number;               // 0-100
  importance: CompetencyImportance;
  strength: StrengthLevel;
  notes?: string;
}

// ——— Skill Assessment (for Skills Breakdown) ———
export interface SkillAssessment {
  name: string;
  score: number;               // 0-10
  strength: StrengthLevel;
  source: EvidenceSource;      // resume = inferred, call = demonstrated
}

// ——— Skill Group (for Skills Breakdown) ———
export interface SkillGroup {
  category: string;            // e.g. "Interpersonal", "Cognitive", "Technical"
  skills: SkillAssessment[];
}

// ——— Call Dimension (for Dimension Scorecard) ———
export interface CallDimension {
  name: string;
  score: number;               // 0-10
  maxScore: number;            // always 10
  notes?: string;
  verifiedGap?: string;        // evidence of a specific gap found
}

// ——— Evidence Item ———
export interface EvidenceItem {
  source: EvidenceSource;
  label: string;
  detail: string;
}

// ——— Resume Screening Report (Section 1) ———
export interface ResumeScreeningReport {
  matchScore: number;                  // 0-100
  compatibility: 'compatible' | 'not_compatible';
  resumeLabel: string;                 // "Strong Match" | "Moderate Match" | "Not a Match"
  strongMatches: string[];
  missingRequirements: string[];
  resumeSummary: string;               // one-paragraph narrative
  evidence: EvidenceItem[];
}

// ——— Call Assessment Report (Section 2) ———
export interface CallAssessmentReport {
  complete: boolean;                   // false = call hasn't happened or analysis pending
  overallScore: number;                // 0-10
  label: AIHireLabel;
  confidence: 'high' | 'medium' | 'low';
  signalCount: number;                 // number of signals extracted from conversation
  callDuration: string;
  strengths: string[];
  concerns: string[];
  recommendedNextStep: string;
  dimensions: CallDimension[];
  evidence: EvidenceItem[];
}

// ——— Capability Analysis ———
export interface CapabilityAnalysis {
  competencies: Competency[];
  totalWeighted: number;               // e.g. "6 / 6 weighted competencies"
  radarSummary: string;                // AI narrative of radar chart
  skillGroups: SkillGroup[];
}

// ——— Full Screening Report (aggregated) ———
export interface CandidateScreeningReportData {
  candidateId: string;
  generatedAt: string;                 // ISO
  resumeScreening: ResumeScreeningReport;
  callAssessment: CallAssessmentReport;
  capabilityAnalysis: CapabilityAnalysis;
  overallRecommendation: {
    label: AIHireLabel;
    score: number;                     // 0-10
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendedNextStep: string;
  };
}

