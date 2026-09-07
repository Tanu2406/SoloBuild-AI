export type HiringStatus = 'draft' | 'calling' | 'paused' | 'completed';
export type CandidateStatus = 'added' | 'contacted' | 'connected' | 'interested' | 'shortlisted' | 'not_interested' | 'no_answer';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ActivityType = 'call_completed' | 'call_failed' | 'call_no_answer' | 'candidate_shortlisted' | 'hiring_created' | 'hiring_launched' | 'candidate_interested';

export interface Hiring {
  id: string;
  title: string;
  location: string;
  employmentType: EmploymentType;
  description?: string;
  status: HiringStatus;
  candidateCount: number;
  contacted: number;
  connected: number;
  interested: number;
  shortlisted: number;
  aiRecruiterId?: string;
  createdAt: string;
  updatedAt: string;
}

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
  callDuration?: string;
  callOutcome?: string;
  aiSummary?: string;
  notes?: string;
}

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

export interface ActivityItem {
  id: string;
  type: ActivityType;
  candidateName?: string;
  hiringTitle?: string;
  description: string;
  timestamp: string;
  timeAgo: string;
}

export interface CreateHiringForm {
  title: string;
  location: string;
  employmentType: EmploymentType;
  description: string;
}
