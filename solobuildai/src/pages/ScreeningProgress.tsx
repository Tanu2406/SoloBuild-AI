import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2, Loader2, Sparkles, TrendingUp, X,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { useAppStore, useHiring, useRecruiters } from '../store/appStore';
import type { Candidate } from '../types';

// ——— Mock resume pool to generate screening results ———
const FIRST_NAMES = ['Arjun', 'Priya', 'Ravi', 'Ananya', 'Karan', 'Meera', 'Siddharth', 'Nisha',
  'Amit', 'Pooja', 'Rohan', 'Divya', 'Aditya', 'Sneha', 'Vikram', 'Kavya',
  'Rahul', 'Isha', 'Nikhil', 'Tanvi', 'Harsh', 'Prerna', 'Gaurav', 'Simran'];
const LAST_NAMES = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Joshi', 'Nair',
  'Reddy', 'Desai', 'Kapoor', 'Bose', 'Iyer', 'Malhotra', 'Rao', 'Banerjee'];

function randItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateMockCandidates(hiringId: string, hiringTitle: string, count: number): Candidate[] {
  const skillPools: Record<string, string[][]> = {
    default: [
      ['Communication', 'Teamwork', 'MS Office'],
      ['Leadership', 'Problem Solving', 'Excel'],
      ['Project Management', 'Agile', 'Jira'],
    ],
  };
  const pools = skillPools.default;

  return Array.from({ length: count }, (_, i) => {
    const name = `${randItem(FIRST_NAMES)} ${randItem(LAST_NAMES)}`;
    const expYears = 1 + Math.floor(Math.random() * 8);
    const score = 35 + Math.floor(Math.random() * 62);
    const compatible = score >= 60;
    const skills = [...randItem(pools), ...(Math.random() > 0.5 ? [randItem(['Python', 'React', 'SQL', 'Salesforce', 'AWS'])] : [])];
    const missing = compatible
      ? (Math.random() > 0.5 ? [randItem(['Kubernetes', 'GraphQL', 'Workday', 'Salesforce'])] : [])
      : [randItem(['Core experience', 'Domain knowledge', 'Required certification']),
         randItem(['3+ years exp', 'CRM skills', 'Enterprise exposure'])];

    return {
      id: `c_${hiringId}_screen_${i}`,
      name,
      phone: `+91 ${Math.floor(70000 + Math.random() * 29999)} ${Math.floor(10000 + Math.random() * 89999)}`,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      position: hiringTitle,
      experience: `${expYears} year${expYears !== 1 ? 's' : ''}`,
      skills,
      education: randItem(['B.Tech, IIT', 'MBA, IIM', 'B.Com, DU', 'B.Tech, NIT', 'MCA, Pune Univ', 'BBA, Symbiosis']),
      hiringId,
      hiringTitle,
      status: 'added' as const,
      matchScore: score,
      compatibility: compatible ? 'compatible' : 'not_compatible',
      strongMatches: skills.slice(0, Math.max(1, skills.length - missing.length)),
      missingRequirements: missing,
      aiRecommendation: compatible
        ? score >= 80 ? 'Strongly compatible — excellent profile match'
        : 'Compatible — meets core requirements'
        : 'Not compatible — insufficient experience or missing key skills',
      includedInCallList: compatible,
      lastActivity: '—',
    };
  });
}

const STAGES = [
  { id: 'upload',    label: 'Processing resumes',              sub: 'Extracting candidate information from files' },
  { id: 'extract',   label: 'Extracting candidate information', sub: 'Parsing names, experience, education, skills' },
  { id: 'evaluate',  label: 'Evaluating against JD',           sub: 'Scoring each resume against the job requirements' },
  { id: 'match',     label: 'JD ↔ Resume matching',            sub: 'Calculating compatibility scores and fit analysis' },
  { id: 'results',   label: 'Generating screening results',    sub: 'Finalising compatible and non-compatible candidates' },
];

const ScreeningProgress: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const hiring = useHiring(id || '');
  const recruiters = useRecruiters();

  const resumeCount = parseInt(searchParams.get('resumes') || '5', 10);
  const mode = searchParams.get('mode') as 'screen_only' | 'screen_and_call' || 'screen_only';

  const [currentStage, setCurrentStage] = useState(0);   // 0-4 = stages, 5 = done
  const [done, setDone] = useState(false);
  const [generatedCandidates, setGeneratedCandidates] = useState<Candidate[]>([]);

  const compatible = generatedCandidates.filter(c => c.compatibility === 'compatible');
  const incompatible = generatedCandidates.filter(c => c.compatibility === 'not_compatible');

  useEffect(() => {
    if (!hiring) return;

    // Generate mock candidates once
    const mocks = generateMockCandidates(hiring.id, hiring.title, resumeCount);
    setGeneratedCandidates(mocks);

    // Animate through stages
    let stage = 0;
    const delays = [600, 900, 1100, 900, 800];

    const advance = () => {
      if (stage >= STAGES.length) {
        setDone(true);

        // Persist to store
        dispatch({ type: 'ADD_CANDIDATES', payload: { hiringId: hiring.id, candidates: mocks } });
        dispatch({
          type: 'UPDATE_HIRING',
          payload: { id: hiring.id, updates: { status: 'screened', resumeCount } },
        });
        dispatch({
          type: 'ADD_ACTIVITY',
          payload: {
            id: `act_sc_${Date.now()}`,
            type: 'screening_completed',
            hiringTitle: hiring.title,
            description: `${resumeCount} resumes screened — ${mocks.filter(c => c.compatibility === 'compatible').length} compatible, ${mocks.filter(c => c.compatibility === 'not_compatible').length} not compatible`,
            timestamp: new Date().toISOString(),
            timeAgo: 'just now',
          },
        });

        // If screen_and_call, also mark ready to start simulation after redirect
        if (mode === 'screen_and_call') {
          // Will be handled in HiringWorkspace after redirect
          dispatch({
            type: 'UPDATE_HIRING',
            payload: { id: hiring.id, updates: { status: 'ready' } },
          });
        }
        return;
      }
      setCurrentStage(stage);
      stage++;
      setTimeout(advance, delays[stage - 1] || 800);
    };

    const t = setTimeout(advance, 400);
    return () => clearTimeout(t);
  }, [hiring?.id]);

  const handleViewResults = () => {
    navigate(`/hiring/${id}?tab=screening`);
  };

  if (!hiring) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      </div>
    );
  }

  const recruiter = recruiters.find(r => r.id === hiring.aiRecruiterId);

  return (
    <div className="screening-progress-page">
      <div className="sp-panel">
        {/* Header */}
        <div className="sp-header">
          <div className="sp-header__icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="sp-header__title">AI Resume Screening</h1>
            <p className="sp-header__sub">{hiring.title} · {hiring.location}</p>
          </div>
        </div>

        {/* Recruiter badge */}
        {recruiter && (
          <div className="sp-recruiter-badge">
            <Avatar name={recruiter.name} size="sm" color={recruiter.avatarColor} />
            <span>{recruiter.name} will call compatible candidates</span>
          </div>
        )}

        {/* Progress stages */}
        <div className="sp-stages">
          {STAGES.map((stage, i) => {
            const isComplete = done || i < currentStage;
            const isActive = !done && i === currentStage;
            return (
              <div key={stage.id} className={`sp-stage ${isComplete ? 'sp-stage--done' : isActive ? 'sp-stage--active' : 'sp-stage--pending'}`}>
                <div className="sp-stage__icon">
                  {isComplete ? (
                    <CheckCircle2 size={18} />
                  ) : isActive ? (
                    <Loader2 size={18} className="spin" />
                  ) : (
                    <div className="sp-stage__dot" />
                  )}
                </div>
                <div className="sp-stage__text">
                  <span className="sp-stage__label">{stage.label}</span>
                  {(isActive || isComplete) && (
                    <span className="sp-stage__sub">{stage.sub}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Counter animation */}
        {!done && (
          <div className="sp-counter">
            <Loader2 size={16} className="spin" style={{ color: 'var(--brand-primary)' }} />
            <span>
              Processing{' '}
              <strong>{resumeCount}</strong> resume{resumeCount !== 1 ? 's' : ''}…
            </span>
          </div>
        )}

        {/* Results summary */}
        {done && (
          <div className="sp-results animate-fade-in">
            <div className="sp-results__summary">
              <div className="sp-results__total">
                <span className="sp-results__num">{resumeCount}</span>
                <span className="sp-results__lbl">Resumes Screened</span>
              </div>
              <div className="sp-results__split">
                <div className="sp-results__compatible">
                  <CheckCircle2 size={16} />
                  <span className="sp-results__split-num">{compatible.length}</span>
                  <span className="sp-results__split-lbl">Compatible</span>
                </div>
                <div className="sp-results__incompatible">
                  <X size={16} />
                  <span className="sp-results__split-num">{incompatible.length}</span>
                  <span className="sp-results__split-lbl">Not Compatible</span>
                </div>
              </div>
            </div>

            {/* Top compatible preview */}
            <div className="sp-top-candidates">
              <p className="sp-top-candidates__label">
                <TrendingUp size={13} /> Top compatible candidates
              </p>
              {compatible.slice(0, 3).map(c => (
                <div key={c.id} className="sp-top-candidate">
                  <Avatar name={c.name} size="sm" color="var(--brand-primary)" />
                  <div className="sp-top-candidate__info">
                    <span className="sp-top-candidate__name">{c.name}</span>
                    <span className="sp-top-candidate__exp">{c.experience} · {c.education}</span>
                  </div>
                  <div className="sp-top-candidate__score" style={{
                    color: (c.matchScore || 0) >= 80 ? 'var(--status-success-text)' : 'var(--brand-primary)',
                    background: (c.matchScore || 0) >= 80 ? 'var(--status-success-bg)' : 'var(--brand-primary-light)',
                  }}>
                    {c.matchScore}%
                  </div>
                </div>
              ))}
              {compatible.length > 3 && (
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '4px 0' }}>
                  +{compatible.length - 3} more compatible candidates
                </p>
              )}
            </div>

            {mode === 'screen_and_call' && (
              <div className="sp-auto-call-note">
                <AlertCircle size={14} style={{ color: 'var(--status-info-text)', flexShrink: 0 }} />
                <span>
                  <strong>Screen &amp; Start Calling</strong> — compatible candidates will begin receiving calls once you reach the workspace.
                </span>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconRight={<ChevronRight size={16} />}
              onClick={handleViewResults}
            >
              View Screening Results in Workspace
            </Button>
          </div>
        )}
      </div>

      {injectScreeningStyles()}
    </div>
  );
};

function injectScreeningStyles() {
  if (typeof document !== 'undefined' && !document.getElementById('sp-styles')) {
    const s = document.createElement('style');
    s.id = 'sp-styles';
    s.textContent = `
.screening-progress-page {
  min-height: 100vh;
  background: var(--bg-app);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 24px 40px;
}
.sp-panel {
  width: 100%;
  max-width: 560px;
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.sp-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.sp-header__icon {
  width: 48px; height: 48px; border-radius: var(--radius-lg);
  background: var(--brand-primary); color: white;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sp-header__title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}
.sp-header__sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}
.sp-recruiter-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
  width: fit-content;
}
.sp-stages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sp-stage {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}
.sp-stage--active { background: var(--brand-primary-light); }
.sp-stage--done { opacity: 0.7; }
.sp-stage--pending { opacity: 0.35; }
.sp-stage__icon {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.sp-stage--done .sp-stage__icon { color: var(--status-success-text); }
.sp-stage--active .sp-stage__icon { color: var(--brand-primary); }
.sp-stage--pending .sp-stage__icon { color: var(--text-muted); }
.sp-stage__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--text-muted); margin: 5px;
}
.sp-stage__text { display: flex; flex-direction: column; gap: 2px; }
.sp-stage__label { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); }
.sp-stage__sub { font-size: var(--font-size-xs); color: var(--text-secondary); }
.sp-counter {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--font-size-sm); color: var(--text-secondary);
  padding: 10px 14px; background: var(--bg-subtle);
  border-radius: var(--radius-md);
}
.sp-results {
  display: flex; flex-direction: column; gap: 16px;
}
.sp-results__summary {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}
.sp-results__total {
  display: flex; flex-direction: column; align-items: center;
  min-width: 80px; border-right: 1px solid var(--border-default);
  padding-right: 16px;
}
.sp-results__num { font-size: 28px; font-weight: 800; color: var(--text-primary); line-height: 1; }
.sp-results__lbl { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
.sp-results__split { display: flex; gap: 20px; flex: 1; justify-content: center; }
.sp-results__compatible, .sp-results__incompatible {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.sp-results__compatible { color: var(--status-success-text); }
.sp-results__incompatible { color: var(--status-error-text); }
.sp-results__split-num { font-size: 22px; font-weight: 700; }
.sp-results__split-lbl { font-size: 11px; font-weight: 500; }
.sp-top-candidates {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.sp-top-candidates__label {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--font-size-xs); font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-subtle);
}
.sp-top-candidate {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.sp-top-candidate:last-child { border-bottom: none; }
.sp-top-candidate__info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.sp-top-candidate__name { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.sp-top-candidate__exp { font-size: var(--font-size-xs); color: var(--text-secondary); }
.sp-top-candidate__score {
  font-size: var(--font-size-xs); font-weight: 700;
  padding: 3px 8px; border-radius: var(--radius-full);
}
.sp-auto-call-note {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 14px; background: var(--status-info-bg);
  border: 1px solid var(--status-info-border); border-radius: var(--radius-md);
  font-size: var(--font-size-xs); color: var(--status-info-text); line-height: 1.5;
}
    `;
    document.head.appendChild(s);
  }
  return null;
}

export default ScreeningProgress;
