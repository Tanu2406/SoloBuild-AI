// ============================================================
// Dialer Service — abstracts direct outbound call logic
// Current implementation: mock simulation with timeouts
// Future: replace simulateCall() body with:
//   const res = await fetch('/api/calls', { method: 'POST', body: JSON.stringify(payload) })
//   return res.json()
//
// The UI never needs to know this change happened.
// Technical fields (Vobiz, Pipecat, Gemini, codec, SIP) stay
// entirely on the backend side of this boundary.
// ============================================================

import type { DirectCall, DirectCallStatus, CallPurpose } from '../types';

export interface StartCallPayload {
  phoneNumber: string;
  aiRecruiterId: string;
  recruiterName: string;
  purpose: CallPurpose;
  candidateName?: string;
}

export interface CallProgressEvent {
  callId: string;
  status: DirectCallStatus;
  duration?: string;
  aiSummary?: string;
}

type ProgressCallback = (event: CallProgressEvent) => void;

// Possible outcomes weighted realistically
const OUTCOMES: { status: Extract<DirectCallStatus, 'completed' | 'no_answer' | 'busy' | 'failed'>; weight: number }[] = [
  { status: 'completed', weight: 55 },
  { status: 'no_answer', weight: 28 },
  { status: 'busy', weight: 12 },
  { status: 'failed', weight: 5 },
];

function pickOutcome() {
  const total = OUTCOMES.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of OUTCOMES) { r -= o.weight; if (r <= 0) return o.status; }
  return 'completed' as const;
}

function randomDuration(): string {
  const m = 1 + Math.floor(Math.random() * 7);
  const s = Math.floor(Math.random() * 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

const SUMMARIES = [
  'Candidate expressed interest in the role. Available to join in 30 days. Salary expectations are within budget.',
  'Candidate asked for more details about the role and team. Will consider and call back within 2 days.',
  'Strong candidate. 4+ years of relevant experience. Eager to explore the opportunity.',
  'Candidate is currently employed and looking for better growth opportunities. Open to discussions.',
  'Candidate confirmed availability for a video interview next week.',
];

// Active call timers keyed by callId — allows cancel on unmount
const activeCallTimers: Map<string, ReturnType<typeof setTimeout>[]> = new Map();

export const dialerService = {
  /**
   * Initiates a call. Progresses through states via the callback.
   * Replace the setTimeout chain with a WebSocket subscription for real backend.
   */
  startCall(payload: StartCallPayload, onProgress: ProgressCallback): DirectCall {
    const callId = `dc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    const call: DirectCall = {
      id: callId,
      candidateName: payload.candidateName,
      phoneNumber: payload.phoneNumber,
      aiRecruiterId: payload.aiRecruiterId,
      purpose: payload.purpose,
      status: 'preparing',
      startedAt: now,
      timeAgo: 'just now',
    };

    const timers: ReturnType<typeof setTimeout>[] = [];

    // preparing → ringing (1.2s)
    timers.push(setTimeout(() => {
      onProgress({ callId, status: 'ringing' });
    }, 1200));

    const outcome = pickOutcome();

    if (outcome === 'no_answer') {
      // ringing → no_answer (5s — rang out)
      timers.push(setTimeout(() => {
        onProgress({ callId, status: 'no_answer' });
        activeCallTimers.delete(callId);
      }, 5000));
    } else if (outcome === 'busy') {
      // ringing → busy (2s)
      timers.push(setTimeout(() => {
        onProgress({ callId, status: 'busy' });
        activeCallTimers.delete(callId);
      }, 2500));
    } else if (outcome === 'failed') {
      // preparing → failed (1.5s)
      timers.push(setTimeout(() => {
        onProgress({ callId, status: 'failed' });
        activeCallTimers.delete(callId);
      }, 1500));
    } else {
      // ringing → connected (3s)
      timers.push(setTimeout(() => {
        onProgress({ callId, status: 'connected' });
      }, 3000));

      // connected → in_progress (4s)
      timers.push(setTimeout(() => {
        onProgress({ callId, status: 'in_progress' });
      }, 4000));

      // in_progress → completed (call duration varies 6–14s for demo)
      const callDuration = 6000 + Math.floor(Math.random() * 8000);
      timers.push(setTimeout(() => {
        const duration = randomDuration();
        const summary = SUMMARIES[Math.floor(Math.random() * SUMMARIES.length)];
        onProgress({ callId, status: 'completed', duration, aiSummary: summary });
        activeCallTimers.delete(callId);
      }, 4000 + callDuration));
    }

    activeCallTimers.set(callId, timers);
    return call;
  },

  cancelCall(callId: string, onProgress: ProgressCallback) {
    const timers = activeCallTimers.get(callId);
    if (timers) {
      timers.forEach(clearTimeout);
      activeCallTimers.delete(callId);
    }
    onProgress({ callId, status: 'failed' });
  },
};

export const PURPOSE_LABELS: Record<CallPurpose, string> = {
  initial_screening: 'Initial Screening',
  follow_up: 'Follow-up',
  offer_discussion: 'Offer Discussion',
  general: 'General',
};
