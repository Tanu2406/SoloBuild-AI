// ============================================================
// Call Simulation Service
// Simulates the AI Recruiter calling candidates one by one.
// This entire service will be REPLACED when real backend events
// (WebSocket / SSE / polling) are implemented with FastAPI.
// Architecture: service manages timers, dispatches store actions.
// ============================================================

import type { AppState } from '../store/appStore';
import type { CandidateStatus, Call, ActivityItem, ActivityType } from '../types';

type DispatchFn = React.Dispatch<any>;

// Outcomes weighted to feel realistic
const OUTCOMES: { status: CandidateStatus; weight: number; callStatus: Call['status']; label: string }[] = [
  { status: 'interested', weight: 22, callStatus: 'completed', label: 'Interested' },
  { status: 'shortlisted', weight: 12, callStatus: 'completed', label: 'Shortlisted' },
  { status: 'connected', weight: 15, callStatus: 'completed', label: 'Connected' },
  { status: 'not_interested', weight: 18, callStatus: 'completed', label: 'Not interested' },
  { status: 'no_answer', weight: 20, callStatus: 'no_answer', label: 'No answer' },
  { status: 'busy', weight: 8, callStatus: 'busy', label: 'Busy' },
  { status: 'call_failed', weight: 5, callStatus: 'failed', label: 'Call failed' },
];

function weightedRandom(): typeof OUTCOMES[0] {
  const total = OUTCOMES.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const outcome of OUTCOMES) {
    r -= outcome.weight;
    if (r <= 0) return outcome;
  }
  return OUTCOMES[0];
}

function randomDuration(): string {
  const mins = 1 + Math.floor(Math.random() * 8);
  const secs = Math.floor(Math.random() * 60);
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

const AI_SUMMARIES: Record<string, string[]> = {
  interested: [
    'Candidate is actively looking for new opportunities. Strong communication skills. Available within 30–45 days.',
    'Expressed strong interest in the role. Asked detailed questions about the team and growth path. Available to join in 1 month.',
    'Good domain experience. Open to the offered package. Wants to proceed to next round.',
  ],
  shortlisted: [
    'Excellent candidate. Meets all criteria. Strong background and immediate availability. Highly recommended.',
    'Outstanding profile. Deep expertise in the area. Cultural fit looks good. Recommend for shortlist.',
    'Impressed by the depth of experience. Salary expectations aligned. Ready to join quickly.',
  ],
  connected: [
    'Call connected. Candidate is considering the opportunity. Will get back in 2–3 days.',
    'Spoke briefly. Candidate asked for a follow-up with more details about the role.',
  ],
  not_interested: [
    'Candidate is happy in current role. Not actively looking. May consider after 6 months.',
    'Not interested at this time. Recently joined a new company.',
    'Salary expectations significantly higher than budget. Not interested.',
  ],
};

function generateSummary(status: CandidateStatus): string {
  const key = status === 'shortlisted' ? 'shortlisted'
    : status === 'interested' ? 'interested'
    : status === 'connected' ? 'connected'
    : status === 'not_interested' ? 'not_interested'
    : '';
  if (!key || !AI_SUMMARIES[key]) return '';
  const arr = AI_SUMMARIES[key];
  return arr[Math.floor(Math.random() * arr.length)];
}

function timeAgo(ms: number): string {
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)} min ago`;
  return `${Math.floor(ms / 3600000)} hr ago`;
}

function activityTypeForOutcome(status: CandidateStatus): ActivityType {
  if (status === 'shortlisted') return 'candidate_shortlisted';
  if (status === 'interested') return 'candidate_interested';
  if (status === 'no_answer') return 'call_no_answer';
  if (status === 'call_failed') return 'call_failed';
  return 'call_completed';
}

// ——— Active simulation timers (keyed by hiringId) ———
const activeTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

export const callSimulationService = {
  isRunning(hiringId: string): boolean {
    return activeTimers.has(hiringId);
  },

  // Starts processing candidates one by one.
  // interval: ms between each candidate (300ms for demo speed)
  start(
    hiringId: string,
    state: AppState,
    dispatch: DispatchFn,
    intervalMs = 350
  ) {
    if (activeTimers.has(hiringId)) return;

    const hiring = state.hirings.find(h => h.id === hiringId);
    if (!hiring) return;

    // Get candidates that haven't been called yet (status 'added' or 'calling')
    let pendingIds = state.candidates
      .filter(c => c.hiringId === hiringId && (c.status === 'added' || c.status === 'calling'))
      .map(c => c.id);

    if (pendingIds.length === 0) {
      // All candidates already processed — mark hiring complete
      dispatch({ type: 'UPDATE_HIRING', payload: { id: hiringId, updates: { status: 'completed' } } });
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: `act_complete_${Date.now()}`,
          type: 'hiring_completed',
          hiringTitle: hiring.title,
          description: `All candidates contacted for ${hiring.title}`,
          timestamp: new Date().toISOString(),
          timeAgo: 'just now',
        } as ActivityItem,
      });
      return;
    }

    let index = 0;

    // Mark hiring as calling
    dispatch({ type: 'UPDATE_HIRING', payload: { id: hiringId, updates: { status: 'calling' } } });

    const timer = setInterval(() => {
      if (index >= pendingIds.length) {
        clearInterval(timer);
        activeTimers.delete(hiringId);

        // Check if all candidates are now processed
        dispatch({ type: 'UPDATE_HIRING', payload: { id: hiringId, updates: { status: 'completed' } } });
        dispatch({
          type: 'ADD_ACTIVITY',
          payload: {
            id: `act_complete_${Date.now()}`,
            type: 'hiring_completed',
            hiringTitle: hiring.title,
            description: `All candidates contacted for ${hiring.title}`,
            timestamp: new Date().toISOString(),
            timeAgo: 'just now',
          } as ActivityItem,
        });
        return;
      }

      const candidateId = pendingIds[index];
      index++;

      const outcome = weightedRandom();
      const now = new Date();
      const duration = outcome.callStatus === 'completed' ? randomDuration() : undefined;
      const summary = outcome.callStatus === 'completed' ? generateSummary(outcome.status) : undefined;
      const ago = timeAgo(0);

      // Update candidate
      dispatch({
        type: 'UPDATE_CANDIDATE',
        payload: {
          id: candidateId,
          updates: {
            status: outcome.status,
            lastActivity: ago,
            lastActivityAt: now.toISOString(),
            callDuration: duration || '—',
            callOutcome: outcome.label,
            aiSummary: summary || '',
          },
        },
      });

      // Find candidate name for activity/call records
      const candidate = state.candidates.find(c => c.id === candidateId);
      const candidateName = candidate?.name || 'Unknown';

      // Add call record
      const call: Call = {
        id: `call_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        candidateId,
        candidateName,
        hiringId,
        hiringTitle: hiring.title,
        status: outcome.callStatus,
        duration,
        outcome: outcome.status,
        aiSummary: summary,
        startedAt: now.toISOString(),
        completedAt: now.toISOString(),
        timeAgo: ago,
      };
      dispatch({ type: 'ADD_CALL', payload: call });

      // Add activity
      const actType = activityTypeForOutcome(outcome.status);
      let actDesc = '';
      if (outcome.callStatus === 'completed') {
        actDesc = `Screening call completed — ${duration}`;
      } else if (outcome.status === 'no_answer') {
        actDesc = 'Call attempt — no answer';
      } else if (outcome.status === 'busy') {
        actDesc = 'Call attempt — line busy';
      } else {
        actDesc = 'Call failed';
      }

      if (outcome.status === 'shortlisted') actDesc = `Candidate shortlisted after screening call`;
      if (outcome.status === 'interested') actDesc = `Candidate expressed interest in ${hiring.title} role`;

      const actItem: ActivityItem = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: actType,
        candidateName,
        hiringTitle: hiring.title,
        description: actDesc,
        timestamp: now.toISOString(),
        timeAgo: ago,
      };
      dispatch({ type: 'ADD_ACTIVITY', payload: actItem });
    }, intervalMs);

    activeTimers.set(hiringId, timer);
  },

  pause(hiringId: string, dispatch: DispatchFn, hiringTitle: string) {
    const timer = activeTimers.get(hiringId);
    if (timer) {
      clearInterval(timer);
      activeTimers.delete(hiringId);
    }
    dispatch({ type: 'UPDATE_HIRING', payload: { id: hiringId, updates: { status: 'paused' } } });
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_pause_${Date.now()}`,
        type: 'hiring_paused',
        hiringTitle,
        description: `Calling paused for ${hiringTitle}`,
        timestamp: new Date().toISOString(),
        timeAgo: 'just now',
      } as ActivityItem,
    });
  },

  resume(hiringId: string, state: AppState, dispatch: DispatchFn, hiringTitle: string) {
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_resume_${Date.now()}`,
        type: 'hiring_resumed',
        hiringTitle,
        description: `Calling resumed for ${hiringTitle}`,
        timestamp: new Date().toISOString(),
        timeAgo: 'just now',
      } as ActivityItem,
    });
    this.start(hiringId, state, dispatch);
  },

  stop(hiringId: string) {
    const timer = activeTimers.get(hiringId);
    if (timer) {
      clearInterval(timer);
      activeTimers.delete(hiringId);
    }
  },

  stopAll() {
    activeTimers.forEach(timer => clearInterval(timer));
    activeTimers.clear();
  },
};
