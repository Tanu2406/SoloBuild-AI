// ============================================================
// ScreeningReportHiring — Per-Hiring Candidate List
// Route: /screening-reports/:hiringId
// Shows all candidates for a hiring with dual-status columns:
//   Resume Status | Call Status | Assessment | Recommendation
// ============================================================

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, FileText, Phone, Star,
  CheckCircle2, Clock, ChevronRight, AlertCircle,
  Users,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { CandidateStatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useHiring, useHiringCandidates, useAppStore } from '../store/appStore';
import { screeningReportService } from '../services/screeningReportService';
import type { Candidate } from '../types';

// ─── Filter config ────────────────────────────────────────────
type FilterId = 'all' | 'strong_match' | 'potential_match' | 'not_match' | 'call_complete' | 'needs_review' | 'shortlisted';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all',            label: 'All' },
  { id: 'strong_match',   label: 'Strong Match' },
  { id: 'potential_match',label: 'Potential Match' },
  { id: 'not_match',      label: 'Not a Match' },
  { id: 'call_complete',  label: 'Call Complete' },
  { id: 'needs_review',   label: 'Needs Review' },
  { id: 'shortlisted',    label: 'Shortlisted' },
];

function matchesFilter(c: Candidate, f: FilterId): boolean {
  if (f === 'all') return true;
  if (f === 'strong_match') return (c.matchScore ?? 0) >= 80 && c.compatibility === 'compatible';
  if (f === 'potential_match') return (c.matchScore ?? 0) >= 60 && (c.matchScore ?? 0) < 80 && c.compatibility === 'compatible';
  if (f === 'not_match') return c.compatibility === 'not_compatible' || (c.matchScore ?? 0) < 60;
  if (f === 'call_complete') return !!c.callAssessmentComplete;
  if (f === 'needs_review') return !!c.callAssessmentComplete && ['interested', 'connected', 'shortlisted'].includes(c.status);
  if (f === 'shortlisted') return ['shortlisted', 'interview_scheduled', 'interview_completed', 'hired'].includes(c.status);
  return true;
}

// ─── Score/label helpers ──────────────────────────────────────
function resumeMatchLabel(score: number | undefined): { text: string; color: string; bg: string; border: string } {
  if (!score) return { text: 'Not Screened', color: 'var(--text-muted)', bg: 'var(--bg-subtle)', border: 'var(--border-default)' };
  if (score >= 80) return { text: 'Strong Match', color: 'var(--status-success-text)', bg: 'var(--status-success-bg)', border: 'var(--status-success-border)' };
  if (score >= 60) return { text: 'Potential Match', color: 'var(--brand-primary)', bg: 'var(--brand-primary-light)', border: 'var(--brand-primary-border)' };
  return { text: 'Not a Match', color: 'var(--status-error-text)', bg: 'var(--status-error-bg)', border: 'var(--status-error-border)' };
}

function callStatusInfo(c: Candidate): { text: string; color: string; bg: string; border: string } {
  if (c.callAssessmentComplete) {
    const label = c.callAssessmentLabel ?? 'consider';
    return screeningReportService.hireLabelStyle(label) as { text: string; color: string; bg: string; border: string };
  }
  if (c.callDuration && c.callDuration !== '—') return { text: 'Called', color: 'var(--brand-primary)', bg: 'var(--brand-primary-light)', border: 'var(--brand-primary-border)' };
  if (c.status === 'no_answer') return { text: 'No Answer', color: 'var(--status-warning-text)', bg: 'var(--status-warning-bg)', border: 'var(--status-warning-border)' };
  if (c.status === 'calling') return { text: 'Calling…', color: 'var(--status-info-text)', bg: 'var(--status-info-bg)', border: 'var(--status-info-border)' };
  return { text: 'Pending', color: 'var(--text-muted)', bg: 'var(--bg-subtle)', border: 'var(--border-default)' };
}

function callStatusText(c: Candidate): string {
  if (c.callAssessmentComplete) return screeningReportService.hireLabelText(c.callAssessmentLabel ?? 'consider');
  if (c.callDuration && c.callDuration !== '—') return 'Called';
  if (c.status === 'no_answer') return 'No Answer';
  if (c.status === 'calling') return 'Calling…';
  return 'Pending';
}

// ─── Main page ────────────────────────────────────────────────
const ScreeningReportHiring: React.FC = () => {
  const { hiringId } = useParams<{ hiringId: string }>();
  const navigate = useNavigate();
  const { dispatch } = useAppStore();

  const hiring = useHiring(hiringId ?? '');
  const candidates = useHiringCandidates(hiringId ?? '');

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.experience ?? '').toLowerCase().includes(q);
      return matchesSearch && matchesFilter(c, activeFilter);
    });
  }, [candidates, search, activeFilter]);

  if (!hiring) {
    return (
      <div className="page-content">
        <EmptyState
          title="Hiring not found"
          description="This campaign does not exist or has been removed."
          action={{ label: 'Back to Screening Reports', onClick: () => navigate('/screening-reports') }}
        />
      </div>
    );
  }

  // Aggregate counts
  const resumeScreened = candidates.filter(c => c.matchScore !== undefined).length;
  const callScreened = candidates.filter(c => c.callAssessmentComplete).length;
  const strongMatches = candidates.filter(c => (c.matchScore ?? 0) >= 80 && c.compatibility === 'compatible').length;
  const shortlisted = candidates.filter(c => ['shortlisted', 'interview_scheduled', 'interview_completed', 'hired'].includes(c.status)).length;
  const needsReview = candidates.filter(c => c.callAssessmentComplete && ['interested', 'connected', 'shortlisted'].includes(c.status)).length;

  return (
    <div className="page-content animate-fade-in">

      {/* ── Back ── */}
      <button
        onClick={() => navigate('/screening-reports')}
        style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center',
          gap: '6px', cursor: 'pointer', marginBottom: '16px', padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to Screening Reports
      </button>

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-header__text">
          <h1 className="page-header__title">{hiring.title}</h1>
          <p className="page-header__subtitle">
            {hiring.location} · Screening report for all {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="page-header__actions">
          <button
            onClick={() => navigate(`/hiring/${hiring.id}`)}
            style={{
              padding: '6px 14px', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', background: 'var(--bg-white)',
              fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'var(--font-family)',
            }}
          >
            Open Hiring Workspace →
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="metrics-row" style={{ marginBottom: '20px' }}>
        <div className="metric-tile">
          <div className="metric-tile__header"><Users size={11} style={{ display: 'inline' }} /> <span>CANDIDATES</span></div>
          <div className="metric-tile__value">{candidates.length}</div>
          <span className="metric-tile__sub">In this campaign</span>
        </div>
        <div className="metric-tile">
          <div className="metric-tile__header"><FileText size={11} style={{ display: 'inline' }} /> <span>RESUME SCREENED</span></div>
          <div className="metric-tile__value">{resumeScreened}</div>
          <span className="metric-tile__sub">JD compatibility done</span>
        </div>
        <div className="metric-tile">
          <div className="metric-tile__header"><Phone size={11} style={{ display: 'inline' }} /> <span>CALL SCREENED</span></div>
          <div className="metric-tile__value">{callScreened}</div>
          <span className="metric-tile__sub">AI assessment complete</span>
        </div>
        <div className="metric-tile">
          <div className="metric-tile__header"><Star size={11} style={{ display: 'inline' }} /> <span>STRONG MATCHES</span></div>
          <div className="metric-tile__value" style={{ color: 'var(--status-success-text)' }}>{strongMatches}</div>
          <span className="metric-tile__sub">Resume score ≥ 80%</span>
        </div>
        <div className="metric-tile">
          <div className="metric-tile__header"><CheckCircle2 size={11} style={{ display: 'inline' }} /> <span>SHORTLISTED</span></div>
          <div className="metric-tile__value" style={{ color: 'var(--brand-primary)' }}>{shortlisted}</div>
          <span className="metric-tile__sub">Ready for interview</span>
        </div>
      </div>

      {/* ── Two-stage notice ── */}
      <div style={{
        padding: '12px 16px', marginBottom: '16px',
        background: 'var(--bg-subtle)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          <span style={{
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: 'var(--brand-primary-light)', color: 'var(--brand-primary)',
            border: '1px solid var(--brand-primary-border)',
            fontSize: '10px', fontWeight: 700,
          }}>
            STAGE 1
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Resume Screening
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>→</span>
          <span style={{
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: 'var(--status-success-bg)', color: 'var(--status-success-text)',
            border: '1px solid var(--status-success-border)',
            fontSize: '10px', fontWeight: 700,
          }}>
            STAGE 2
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
            AI Call Assessment
          </span>
        </div>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
          Resume and call assessments are separate. Full recommendation is available after both are complete.
        </p>
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', background: 'var(--bg-white)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
          flex: 1, maxWidth: '300px',
        }}>
          <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidates…"
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-family)', flex: 1,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--font-size-xs)', fontWeight: 500,
                border: '1px solid', cursor: 'pointer', transition: 'all var(--transition-fast)',
                borderColor: activeFilter === f.id ? 'var(--brand-primary)' : 'var(--border-default)',
                background: activeFilter === f.id ? 'var(--brand-primary-light)' : 'var(--bg-white)',
                color: activeFilter === f.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
              }}
            >
              {f.label}
              {f.id === 'needs_review' && needsReview > 0 && (
                <span style={{
                  marginLeft: '4px', padding: '0 4px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--status-warning-text)', color: 'white',
                  fontSize: '9px', fontWeight: 700,
                }}>
                  {needsReview}
                </span>
              )}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          {filtered.length} of {candidates.length}
        </span>
      </div>

      {/* ── Column headers ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 32px 40px',
        gap: '12px',
        padding: '8px 16px',
        fontSize: 'var(--font-size-xs)', fontWeight: 700,
        color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        <span>Candidate</span>
        <span>Resume Screening</span>
        <span>Call Assessment</span>
        <span>Stage</span>
        <span>Recommendation</span>
        <span title="Liked Profile" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Star size={11} />
          <span>Liked</span>
        </span>
        <span />
      </div>

      {/* ── Candidate rows ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '40px 24px', textAlign: 'center',
          background: 'var(--bg-white)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)', fontWeight: 600 }}>
            No candidates match your filters
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filtered.map(c => (
            <CandidateReportRow
              key={c.id}
              candidate={c}
              hiringId={hiring.id}
              onOpen={() => navigate(`/screening-reports/${hiring.id}/candidate/${c.id}`)}
              onToggleFavorite={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: c.id })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Candidate row ────────────────────────────────────────────
const CandidateReportRow: React.FC<{
  candidate: Candidate;
  hiringId: string;
  onOpen: () => void;
  onToggleFavorite: () => void;
}> = ({ candidate: c, onOpen, onToggleFavorite }) => {
  const resumeInfo = resumeMatchLabel(c.matchScore);
  const callInfo = callStatusInfo(c);
  const callText = callStatusText(c);
  const hasReport = screeningReportService.isReportAvailable(c);

  // Overall recommendation chip
  const getRecommendation = (): { text: string; style: ReturnType<typeof screeningReportService.hireLabelStyle> } | null => {
    if (!c.callAssessmentComplete) return null;
    const label = c.callAssessmentLabel ?? 'consider';
    return {
      text: screeningReportService.hireLabelText(label),
      style: screeningReportService.hireLabelStyle(label),
    };
  };
  const recommendation = getRecommendation();

  return (
    <div
      onClick={hasReport ? onOpen : undefined}
      className="table-container"
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 32px 40px',
        gap: '12px',
        padding: '13px 16px',
        alignItems: 'center',
        cursor: hasReport ? 'pointer' : 'default',
        transition: 'box-shadow var(--transition-fast)',
      }}
      onMouseEnter={e => hasReport && (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
    >
      {/* Candidate name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <Avatar name={c.name} size="sm" color="var(--brand-primary)" />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.name}
          </p>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            {c.experience ?? '—'} exp
          </p>
        </div>
      </div>

      {/* Resume screening */}
      <div>
        {c.matchScore !== undefined ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 600,
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: resumeInfo.bg, color: resumeInfo.color, border: `1px solid ${resumeInfo.border}`,
              display: 'inline-block',
            }}>
              {resumeInfo.text}
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              {c.matchScore}% match
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={10} /> Pending
          </span>
        )}
      </div>

      {/* Call assessment */}
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 600,
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: callInfo.bg, color: callInfo.color, border: `1px solid ${callInfo.border}`,
            display: 'inline-block',
          }}>
            {callText}
          </span>
          {c.callAssessmentScore !== undefined && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              {c.callAssessmentScore}/10
            </span>
          )}
          {!c.callAssessmentComplete && c.callDuration && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              {c.callDuration}
            </span>
          )}
        </div>
      </div>

      {/* Hiring stage */}
      <div>
        <CandidateStatusBadge status={c.status} />
      </div>

      {/* Recommendation */}
      <div>
        {recommendation ? (
          <span style={{
            fontSize: '11px', fontWeight: 700,
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: recommendation.style.bg,
            color: recommendation.style.text,
            border: `1px solid ${recommendation.style.border}`,
            display: 'inline-block',
          }}>
            {recommendation.text}
          </span>
        ) : (
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {c.callAssessmentComplete ? '—' : (
              <>
                <AlertCircle size={10} />
                Call pending
              </>
            )}
          </span>
        )}
      </div>

      {/* Star / Favourite */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          title={c.isFavorite ? 'Remove from favourites' : 'Mark as favourite'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px', display: 'flex', alignItems: 'center',
            color: c.isFavorite ? '#f59e0b' : 'var(--text-muted)',
            transition: 'color 120ms',
          }}
          onMouseEnter={e => { if (!c.isFavorite) (e.currentTarget as HTMLButtonElement).style.color = '#fbbf24'; }}
          onMouseLeave={e => { if (!c.isFavorite) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          <Star size={15} fill={c.isFavorite ? '#f59e0b' : 'none'} strokeWidth={1.75} />
        </button>
      </div>

      {/* Arrow */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {hasReport && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
      </div>
    </div>
  );
};

export default ScreeningReportHiring;
