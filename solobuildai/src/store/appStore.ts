// ============================================================
// SoloBuildAI — Global Application Store
// React Context + useReducer with localStorage persistence.
// ============================================================

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  Hiring, Candidate, AIRecruiter, Call,
  ActivityItem, DirectCall, Interview,
} from '../types';
import { seedData } from './seedData';

// ——— State shape ———
export interface AppState {
  hirings: Hiring[];
  candidates: Candidate[];
  recruiters: AIRecruiter[];
  calls: Call[];
  directCalls: DirectCall[];
  activity: ActivityItem[];
  interviews: Interview[];
  initialized: boolean;
}

// ——— Actions ———
type Action =
  | { type: 'HYDRATE'; payload: AppState }
  | { type: 'CREATE_HIRING'; payload: Hiring }
  | { type: 'UPDATE_HIRING'; payload: { id: string; updates: Partial<Hiring> } }
  | { type: 'DELETE_HIRING'; payload: string }
  | { type: 'ADD_CANDIDATES'; payload: { hiringId: string; candidates: Candidate[] } }
  | { type: 'UPDATE_CANDIDATE'; payload: { id: string; updates: Partial<Candidate> } }
  | { type: 'CREATE_RECRUITER'; payload: AIRecruiter }
  | { type: 'UPDATE_RECRUITER'; payload: { id: string; updates: Partial<AIRecruiter> } }
  | { type: 'DELETE_RECRUITER'; payload: string }
  | { type: 'ADD_CALL'; payload: Call }
  | { type: 'ADD_DIRECT_CALL'; payload: DirectCall }
  | { type: 'UPDATE_DIRECT_CALL'; payload: { id: string; updates: Partial<DirectCall> } }
  | { type: 'ADD_ACTIVITY'; payload: ActivityItem }
  | { type: 'SCHEDULE_INTERVIEW'; payload: Interview }
  | { type: 'UPDATE_INTERVIEW'; payload: { id: string; updates: Partial<Interview> } }
  | { type: 'TOGGLE_FAVORITE'; payload: string }   // candidateId
  | { type: 'RESET_TO_SEED' };

// ——— Derived helpers ———
function computeHiringStats(hiring: Hiring, candidates: Candidate[]): Partial<Hiring> {
  const hiringCandidates = candidates.filter(c => c.hiringId === hiring.id);
  return {
    candidateCount: hiringCandidates.length,
    contacted: hiringCandidates.filter(c =>
      ['contacted', 'connected', 'interested', 'shortlisted', 'interview_scheduled',
       'interview_completed', 'hired', 'not_interested', 'no_answer', 'busy', 'call_failed'].includes(c.status)
    ).length,
    connected: hiringCandidates.filter(c =>
      ['connected', 'interested', 'shortlisted', 'interview_scheduled',
       'interview_completed', 'hired'].includes(c.status)
    ).length,
    interested: hiringCandidates.filter(c =>
      ['interested', 'shortlisted', 'interview_scheduled', 'interview_completed', 'hired'].includes(c.status)
    ).length,
    shortlisted: hiringCandidates.filter(c =>
      ['shortlisted', 'interview_scheduled', 'interview_completed', 'hired'].includes(c.status)
    ).length,
  };
}

function recomputeAllHiringStats(hirings: Hiring[], candidates: Candidate[]): Hiring[] {
  return hirings.map(h => ({ ...h, ...computeHiringStats(h, candidates) }));
}

// ——— Reducer ———
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    case 'HYDRATE':
      return { ...action.payload, initialized: true };

    case 'RESET_TO_SEED':
      return { ...seedData, initialized: true };

    case 'CREATE_HIRING':
      return { ...state, hirings: [...state.hirings, action.payload] };

    case 'UPDATE_HIRING': {
      const hirings = state.hirings.map(h =>
        h.id === action.payload.id
          ? { ...h, ...action.payload.updates, updatedAt: new Date().toISOString() }
          : h
      );
      return { ...state, hirings };
    }

    case 'DELETE_HIRING':
      return {
        ...state,
        hirings: state.hirings.filter(h => h.id !== action.payload),
        candidates: state.candidates.filter(c => c.hiringId !== action.payload),
      };

    case 'ADD_CANDIDATES': {
      const { hiringId, candidates: newCandidates } = action.payload;
      const merged = [
        ...state.candidates.filter(c => c.hiringId !== hiringId),
        ...newCandidates,
      ];
      const updatedHirings = state.hirings.map(h => {
        if (h.id !== hiringId) return h;
        const stats = computeHiringStats(h, merged);
        return {
          ...h, ...stats,
          candidateIds: merged.filter(c => c.hiringId === hiringId).map(c => c.id),
          updatedAt: new Date().toISOString(),
        };
      });
      return { ...state, candidates: merged, hirings: updatedHirings };
    }

    case 'UPDATE_CANDIDATE': {
      const candidates = state.candidates.map(c =>
        c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
      );
      const hirings = recomputeAllHiringStats(state.hirings, candidates);
      return { ...state, candidates, hirings };
    }

    case 'CREATE_RECRUITER':
      return { ...state, recruiters: [...state.recruiters, action.payload] };

    case 'UPDATE_RECRUITER':
      return {
        ...state,
        recruiters: state.recruiters.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };

    case 'DELETE_RECRUITER':
      return { ...state, recruiters: state.recruiters.filter(r => r.id !== action.payload) };

    case 'ADD_CALL':
      return { ...state, calls: [action.payload, ...state.calls] };

    case 'ADD_DIRECT_CALL':
      return { ...state, directCalls: [action.payload, ...state.directCalls] };

    case 'UPDATE_DIRECT_CALL':
      return {
        ...state,
        directCalls: state.directCalls.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };

    case 'ADD_ACTIVITY':
      return { ...state, activity: [action.payload, ...state.activity] };

    case 'SCHEDULE_INTERVIEW':
      return { ...state, interviews: [action.payload, ...state.interviews] };

    case 'UPDATE_INTERVIEW':
      return {
        ...state,
        interviews: state.interviews.map(i =>
          i.id === action.payload.id
            ? { ...i, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : i
        ),
      };

    case 'TOGGLE_FAVORITE': {
      const candidates = state.candidates.map(c =>
        c.id === action.payload ? { ...c, isFavorite: !c.isFavorite } : c
      );
      return { ...state, candidates };
    }

    default:
      return state;
  }
}

// ——— Context ———
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue>({
  state: { ...seedData, initialized: false },
  dispatch: () => {},
});

const STORAGE_KEY = 'solobuildai_v2';

// ——— Provider ———
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { ...seedData, initialized: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: AppState = JSON.parse(raw);
        if (parsed.hirings && parsed.candidates && parsed.recruiters) {
          if (!parsed.directCalls) parsed.directCalls = [];
          if (!parsed.interviews) parsed.interviews = [];
          dispatch({ type: 'HYDRATE', payload: { ...parsed, initialized: true } });
          return;
        }
      }
    } catch { /* corrupted — fall to seed */ }
    dispatch({ type: 'HYDRATE', payload: { ...seedData, initialized: true } });
  }, []);

  useEffect(() => {
    if (!state.initialized) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  return React.createElement(AppContext.Provider, { value: { state, dispatch } }, children);
};

export const useAppStore = () => useContext(AppContext);

// ——— Selector hooks ———
export const useHirings = () => useAppStore().state.hirings;
export const useCandidates = () => useAppStore().state.candidates;
export const useRecruiters = () => useAppStore().state.recruiters;
export const useCalls = () => useAppStore().state.calls;
export const useActivity = () => useAppStore().state.activity;
export const useInterviews = () => useAppStore().state.interviews;

export const useHiring = (id: string) =>
  useAppStore().state.hirings.find(h => h.id === id);

export const useCandidate = (id: string) =>
  useAppStore().state.candidates.find(c => c.id === id);

export const useHiringCandidates = (hiringId: string) =>
  useAppStore().state.candidates.filter(c => c.hiringId === hiringId);

export const useDirectCalls = () => useAppStore().state.directCalls;
