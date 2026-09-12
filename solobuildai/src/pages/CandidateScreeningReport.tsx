// ============================================================
// CandidateScreeningReport
// Full candidate screening report page.
// Route: /screening-reports/:hiringId/candidate/:candidateId
// Also reachable from CandidateDetail, HiringWorkspace, Home.
//
// Sections (tabbed):
//   Overview  |  Resume Screening  |  AI Call Assessment  |  Capability Analysis  |  Evidence
//
// PDF download: window.print() with @media print styles.
// Schedule Interview: reuses existing ScheduleInterviewModal.
// ============================================================

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Calendar, CheckCircle2,
  Clock, MapPin, Briefcase, User, AlertTriangle,
  FileText, Phone, Star, Shield, TrendingUp, BookOpen,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { CandidateStatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { CapabilityMap } from '../components/product/CapabilityMap';
import { SkillsBreakdown } from '../components/product/SkillsBreakdown';
import { DimensionScorecard } from '../components/product/DimensionScorecard';
import { ScheduleInterviewModal } from '../components/product/ScheduleInterviewModal';
import { useCandidate } from '../store/appStore';
import { screeningReportService } from '../services/screeningReportService';
import { useToast } from '../components/ui/Toast';
import type { AIHireLabel } from '../types';

type ReportTab = 'overview' | 'resume' | 'call' | 'capability' | 'evidence';

// ─── Helper: inject print styles once ───────────────────────
const PRINT_STYLE_ID = 'screening-report-print-styles';
function injectPrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = PRINT_STYLE_ID;
  s.textContent = `
    @media print {
      .sidebar, .app-topbar, .report-no-print { display: none !important; }
      .app-main { padding: 0 !important; }
      .app-shell { display: block !important; }
      .app-main-wrapper { margin: 0 !important; }
      .page-content { padding: 24px !important; max-width: 100% !important; }
      .report-tab-bar { display: none !important; }
      .report-section { display: block !important; page-break-inside: avoid; }
      .report-print-show { display: block !important; }
      @page { margin: 20mm; }
    }
  `;
  document.head.appendChild(s);
}

// ─── Label helpers ───────────────────────────────────────────
function hireLabelDisplay(label: AIHireLabel) {
  const map: Record<AIHireLabel, { text: string; emoji: string }> = {
    strong_hire: { text: 'Strong Hire', emoji: '★' },
    hire:        { text: 'Hire',        emoji: '✓' },
    consider:    { text: 'Consider',   emoji: '~' },
    no_hire:     { text: 'No Hire',    emoji: '✗' },
  };
  return map[label] ?? { text: label, emoji: '' };
}

function confidenceLabel(c: 'high' | 'medium' | 'low') {
  if (c === 'high') return 'High Confidence';
  if (c === 'medium') return 'Medium Confidence';
  return 'Low Confidence';
}

// ─── Sub-components ──────────────────────────────────────────

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, icon, children, className }) => (
  <div
    className={`table-container report-section ${className ?? ''}`}
    style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
      {icon && (
        <div style={{
          width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
          background: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--brand-primary)', flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div>
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);

const AssessmentStatusPill: React.FC<{ complete: boolean; label: string }> = ({ complete, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '3px 10px', borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)', fontWeight: 600,
    background: complete ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
    color: complete ? 'var(--status-success-text)' : 'var(--status-warning-text)',
    border: `1px solid ${complete ? 'var(--status-success-border)' : 'var(--status-warning-border)'}`,
  }}>
    {complete ? <CheckCircle2 size={11} /> : <Clock size={11} />}
    {label}
  </span>
);

const ScoreBubble: React.FC<{ score: number; maxScore?: number; size?: 'sm' | 'md' | 'lg' }> = ({
  score, maxScore = 10, size = 'md',
}) => {
  const color = screeningReportService.hireLabelStyle(
    screeningReportService.labelForCallScore(score)
  );
  const dim = size === 'lg' ? 72 : size === 'md' ? 56 : 40;
  const fs = size === 'lg' ? 'var(--font-size-2xl)' : size === 'md' ? 'var(--font-size-xl)' : 'var(--font-size-md)';

  return (
    <div style={{
      width: dim, height: dim, borderRadius: '50%',
      background: color.bg, border: `2px solid ${color.border}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ fontSize: fs, fontWeight: 800, color: color.text, lineHeight: 1 }}>
        {score}
      </span>
      <span style={{ fontSize: '9px', color: color.text, opacity: 0.7 }}>/{maxScore}</span>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────

const CandidateScreeningReport: React.FC = () => {
  const { candidateId, hiringId } = useParams<{ candidateId: string; hiringId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const candidate = useCandidate(candidateId ?? '');
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  // Inject print CSS once
  React.useEffect(() => { injectPrintStyles(); }, []);

  const handleDownloadPDF = useCallback(() => {
    // Show all sections for print, then restore
    showToast('Opening print / save as PDF dialog…', 'info');
    setTimeout(() => window.print(), 300);
  }, [showToast]);

  if (!candidate) {
    return (
      <div className="page-content">
        <EmptyState
          title="Report not found"
          description="This candidate report does not exist or the candidate has been removed."
          action={{ label: 'Back to Screening Reports', onClick: () => navigate('/screening-reports') }}
        />
      </div>
    );
  }

  const report = screeningReportService.getReport(candidate);
  const callComplete = report.callAssessment.complete;
  const hasResume = screeningReportService.isReportAvailable(candidate);
  const { resumeScreening, callAssessment, capabilityAnalysis, overallRecommendation } = report;

  const labelDisplay = hireLabelDisplay(overallRecommendation.label);
  const labelStyle = screeningReportService.hireLabelStyle(overallRecommendation.label);
  const callLabelStyle = screeningReportService.hireLabelStyle(callAssessment.label);
  const callLabelDisplay = hireLabelDisplay(callAssessment.label);

  const canSchedule = callComplete && ['shortlisted', 'interested', 'connected'].includes(candidate.status);
  const alreadyScheduled = ['interview_scheduled', 'interview_completed', 'hired'].includes(candidate.status);

  // Back navigation: prefer hiringId-based route, fallback to screening reports
  const backPath = hiringId
    ? `/screening-reports/${hiringId}`
    : '/screening-reports';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'resume', label: 'Resume Screening' },
    { id: 'call', label: `AI Call Assessment${callComplete ? '' : ' ·  Pending'}` },
    { id: 'capability', label: 'Capability Analysis' },
    { id: 'evidence', label: 'Evidence' },
  ];

  // ─── Score bar for resume match ─────────────────────────
  const matchPct = resumeScreening.matchScore;
  const matchColor = matchPct >= 80
    ? 'var(--status-success-text)'
    : matchPct >= 60 ? 'var(--brand-primary)' : 'var(--status-error-text)';
  const matchBg = matchPct >= 80
    ? 'var(--status-success-bg)'
    : matchPct >= 60 ? 'var(--brand-primary-light)' : 'var(--status-error-bg)';
  const matchBorder = matchPct >= 80
    ? 'var(--status-success-border)'
    : matchPct >= 60 ? 'var(--brand-primary-border)' : 'var(--status-error-border)';

  return (
    <div className="page-content animate-fade-in" style={{ maxWidth: '900px' }}>

      {/* ── Back nav ── */}
      <button
        className="report-no-print"
        onClick={() => navigate(backPath)}
        style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)', display: 'inline-flex', alignItems: 'center',
          gap: '6px', cursor: 'pointer', marginBottom: '16px', padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to Screening Reports
      </button>

      {/* ── Candidate Header Card ── */}
      <div className="table-container" style={{ padding: '22px 24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>

          {/* Left: Identity */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <Avatar name={candidate.name} size="xl" color="var(--brand-primary)" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {candidate.name}
                </h1>
                <CandidateStatusBadge status={candidate.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '5px', flexWrap: 'wrap' }}>
                {candidate.hiringTitle && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={12} /> {candidate.hiringTitle}
                  </span>
                )}
                {candidate.experience && (
                  <>
                    <span style={{ color: 'var(--border-strong)' }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> {candidate.experience}
                    </span>
                  </>
                )}
                {candidate.location && (
                  <>
                    <span style={{ color: 'var(--border-strong)' }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {candidate.location}
                    </span>
                  </>
                )}
                {candidate.education && (
                  <>
                    <span style={{ color: 'var(--border-strong)' }}>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={12} /> {candidate.education}
                    </span>
                  </>
                )}
              </div>

              {/* Assessment status pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <AssessmentStatusPill
                  complete={hasResume}
                  label={hasResume ? 'Resume Screened' : 'Resume Pending'}
                />
                <AssessmentStatusPill
                  complete={callComplete}
                  label={callComplete ? 'Call Assessment Complete' : 'Call Pending'}
                />
                {callComplete && (
                  <AssessmentStatusPill complete label="Assessment Ready" />
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="report-no-print" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            {alreadyScheduled ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)',
                fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--status-success-text)',
              }}>
                <CheckCircle2 size={13} /> Interview Scheduled
              </span>
            ) : (
              <Button
                variant="primary"
                icon={<Calendar size={14} />}
                onClick={() => setScheduleOpen(true)}
                disabled={!canSchedule}
              >
                Schedule Interview
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={13} />}
              onClick={handleDownloadPDF}
            >
              Download Report
            </Button>
            {!canSchedule && !alreadyScheduled && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textAlign: 'right', maxWidth: '200px' }}>
                Available after AI call assessment is complete
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="report-tab-bar report-no-print" style={{ marginBottom: '18px' }}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={t => setActiveTab(t as ReportTab)}
        />
      </div>

      {/* ══════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* AI Recommendation card — only when call is complete */}
          {callComplete ? (
            <div style={{
              padding: '22px 24px',
              background: labelStyle.bg,
              border: `1px solid ${labelStyle.border}`,
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: labelStyle.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    AI Recommendation
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: labelStyle.text }}>
                      {labelDisplay.emoji} {labelDisplay.text}
                    </span>
                    <span style={{
                      fontSize: 'var(--font-size-xs)', fontWeight: 600, padding: '2px 8px',
                      borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.6)',
                      color: labelStyle.text, border: `1px solid ${labelStyle.border}`,
                    }}>
                      {overallRecommendation.score} / 10
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6, maxWidth: '560px' }}>
                    {overallRecommendation.summary}
                  </p>
                </div>

                {/* Score circle */}
                <ScoreBubble score={overallRecommendation.score} size="lg" />
              </div>

              {/* Why / Concerns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '18px' }}>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-success-text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    ✓ Strengths
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {overallRecommendation.strengths.map(s => (
                      <li key={s} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ color: 'var(--status-success-text)', marginTop: '1px', flexShrink: 0 }}>·</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {overallRecommendation.concerns.length > 0 && (
                  <div>
                    <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-warning-text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                      ⚠ Concerns
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {overallRecommendation.concerns.map(c => (
                        <li key={c} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ color: 'var(--status-warning-text)', marginTop: '1px', flexShrink: 0 }}>·</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended next step */}
              <div style={{
                marginTop: '16px', padding: '12px 14px',
                background: 'rgba(255,255,255,0.55)',
                border: `1px solid ${labelStyle.border}`,
                borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: labelStyle.text, marginBottom: '3px' }}>
                  Recommended Next Step
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {overallRecommendation.recommendedNextStep}
                </p>
              </div>

              {/* Schedule CTA */}
              {!alreadyScheduled && canSchedule && (
                <div className="report-no-print" style={{ marginTop: '16px' }}>
                  <Button
                    variant="primary"
                    icon={<Calendar size={14} />}
                    onClick={() => setScheduleOpen(true)}
                  >
                    Schedule Interview
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Call pending banner */
            <div style={{
              padding: '18px 20px',
              background: 'var(--status-warning-bg)',
              border: '1px solid var(--status-warning-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <AlertTriangle size={16} style={{ color: 'var(--status-warning-text)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--status-warning-text)' }}>
                  AI Call Assessment Pending
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.55 }}>
                  The overall AI recommendation and interview scheduling will be available after the candidate completes the AI voice screening call.
                  Resume screening is complete and shown below.
                </p>
              </div>
            </div>
          )}

          {/* Two-column: Resume snapshot + Call snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* Resume snapshot */}
            <div className="table-container" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileText size={14} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Resume Screening
                </span>
              </div>
              {/* Match score pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', background: matchBg,
                border: `1px solid ${matchBorder}`, borderRadius: 'var(--radius-md)',
                marginBottom: '12px',
              }}>
                <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: matchColor }}>{matchPct}%</span>
                <div>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: matchColor }}>{resumeScreening.resumeLabel}</p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>JD compatibility score</p>
                </div>
              </div>
              {/* Strong matches */}
              {resumeScreening.strongMatches.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-success-text)', marginBottom: '5px' }}>
                    Matches
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {resumeScreening.strongMatches.map(m => (
                      <span key={m} style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: 'var(--status-success-bg)', color: 'var(--status-success-text)',
                        border: '1px solid var(--status-success-border)',
                      }}>
                        ✓ {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {resumeScreening.missingRequirements.length > 0 && (
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-warning-text)', marginBottom: '5px' }}>
                    Gaps
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {resumeScreening.missingRequirements.map(m => (
                      <span key={m} style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: 'var(--status-warning-bg)', color: 'var(--status-warning-text)',
                        border: '1px solid var(--status-warning-border)',
                      }}>
                        ~ {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <button
                className="report-no-print"
                onClick={() => setActiveTab('resume')}
                style={{
                  marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)', color: 'var(--brand-primary)', padding: 0, fontWeight: 600,
                }}
              >
                View full resume analysis →
              </button>
            </div>

            {/* Call snapshot */}
            <div className="table-container" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Phone size={14} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  AI Call Assessment
                </span>
              </div>
              {callComplete ? (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px',
                    background: callLabelStyle.bg, border: `1px solid ${callLabelStyle.border}`,
                    borderRadius: 'var(--radius-md)', marginBottom: '12px',
                  }}>
                    <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: callLabelStyle.text }}>
                      {callAssessment.overallScore}
                    </span>
                    <div>
                      <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: callLabelStyle.text }}>
                        {callLabelDisplay.text}
                      </p>
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        {confidenceLabel(callAssessment.confidence)} · {callAssessment.signalCount} signals
                      </p>
                    </div>
                  </div>
                  {/* Compact dimension preview (top 3) */}
                  <DimensionScorecard
                    dimensions={callAssessment.dimensions.slice(0, 3)}
                    compact
                  />
                  <button
                    className="report-no-print"
                    onClick={() => setActiveTab('call')}
                    style={{
                      marginTop: '12px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)', color: 'var(--brand-primary)', padding: 0, fontWeight: 600,
                    }}
                  >
                    View full call assessment →
                  </button>
                </>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '24px 16px', gap: '8px',
                  background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}>
                  <Clock size={22} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Call not yet completed
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Assessment data will appear here once the AI screening call is done.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Capability map compact preview */}
          {capabilityAnalysis.competencies.length > 0 && (
            <SectionCard
              title="Capability Overview"
              subtitle="Top competencies evaluated against role requirements"
              icon={<TrendingUp size={15} />}
            >
              <CapabilityMap
                competencies={capabilityAnalysis.competencies}
                totalWeighted={capabilityAnalysis.totalWeighted}
                compact
              />
              <button
                className="report-no-print"
                onClick={() => setActiveTab('capability')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 'var(--font-size-xs)', color: 'var(--brand-primary)', padding: 0, fontWeight: 600,
                }}
              >
                View full capability analysis →
              </button>
            </SectionCard>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: RESUME SCREENING
      ══════════════════════════════════════════ */}
      {activeTab === 'resume' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <SectionCard
            title="Resume Match Summary"
            subtitle="Evaluated against the job description"
            icon={<FileText size={15} />}
          >
            {/* Score row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px', background: matchBg,
                border: `1px solid ${matchBorder}`, borderRadius: 'var(--radius-md)', flex: 1,
              }}>
                <span style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, color: matchColor }}>
                  {matchPct}%
                </span>
                <div>
                  <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: matchColor }}>
                    {resumeScreening.resumeLabel}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    JD compatibility score · Resume-based assessment
                  </p>
                </div>
              </div>
              <div style={{
                padding: '14px 18px', background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
              }}>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '3px' }}>
                  EVIDENCE SOURCE
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Resume / CV
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  Not conversation evidence
                </p>
              </div>
            </div>

            {/* Summary narrative */}
            <div style={{
              padding: '14px 16px', background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
            }}>
              <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                AI Analysis
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                {resumeScreening.resumeSummary}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Skill Match vs Job Description"
            subtitle="What the resume confirms vs what's missing"
            icon={<Shield size={15} />}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-success-text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  ✓ Confirmed Matches
                </p>
                {resumeScreening.strongMatches.length === 0 ? (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>No strong matches identified.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {resumeScreening.strongMatches.map(m => (
                      <div key={m} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', background: 'var(--status-success-bg)',
                        border: '1px solid var(--status-success-border)', borderRadius: 'var(--radius-sm)',
                      }}>
                        <CheckCircle2 size={13} style={{ color: 'var(--status-success-text)', flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-warning-text)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  ~ Potential Gaps
                </p>
                {resumeScreening.missingRequirements.length === 0 ? (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--status-success-text)', fontWeight: 600 }}>
                    ✓ No gaps identified
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {resumeScreening.missingRequirements.map(m => (
                      <div key={m} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', background: 'var(--status-warning-bg)',
                        border: '1px solid var(--status-warning-border)', borderRadius: 'var(--radius-sm)',
                      }}>
                        <AlertTriangle size={13} style={{ color: 'var(--status-warning-text)', flexShrink: 0 }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {candidate.skills && candidate.skills.length > 0 && (
            <SectionCard title="All Skills on Resume" icon={<Star size={15} />}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {candidate.skills.map(s => (
                  <span key={s} style={{
                    padding: '4px 12px', borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--font-size-sm)', fontWeight: 500,
                    background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: AI CALL ASSESSMENT
      ══════════════════════════════════════════ */}
      {activeTab === 'call' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!callComplete ? (
            <div style={{
              padding: '40px 24px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '12px', textAlign: 'center',
              background: 'var(--bg-white)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <Clock size={32} style={{ color: 'var(--text-muted)' }} />
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                Call Assessment Not Yet Available
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
                The AI call assessment will appear here after the candidate completes the AI voice screening call.
                Resume screening data is already available in the Resume Screening tab.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', background: 'var(--status-info-bg)',
                border: '1px solid var(--status-info-border)', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)', color: 'var(--status-info-text)',
              }}>
                <Phone size={13} />
                {candidate.callDuration
                  ? `Call attempted — duration: ${candidate.callDuration}`
                  : 'No call recorded yet'}
              </div>
            </div>
          ) : (
            <>
              {/* Header scorecard */}
              <div style={{
                padding: '22px 24px',
                background: callLabelStyle.bg, border: `1px solid ${callLabelStyle.border}`,
                borderRadius: 'var(--radius-lg)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: callLabelStyle.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      AI Voice Screening Assessment
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                      <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: callLabelStyle.text }}>
                        {callLabelDisplay.emoji} {callLabelDisplay.text}
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-xs)', fontWeight: 600,
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: 'rgba(255,255,255,0.6)', color: callLabelStyle.text,
                        border: `1px solid ${callLabelStyle.border}`,
                      }}>
                        {confidenceLabel(callAssessment.confidence)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={11} /> Duration: {callAssessment.callDuration}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={11} /> {callAssessment.signalCount} conversation signals extracted
                      </span>
                    </div>
                  </div>
                  <ScoreBubble score={callAssessment.overallScore} size="lg" />
                </div>
              </div>

              {/* Strengths + Concerns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <SectionCard title="Demonstrated Strengths" icon={<CheckCircle2 size={14} />}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {callAssessment.strengths.map(s => (
                      <li key={s} style={{ display: 'flex', gap: '8px', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--status-success-text)', flexShrink: 0, fontWeight: 700 }}>✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
                {callAssessment.concerns.length > 0 && (
                  <SectionCard title="Areas of Concern" icon={<AlertTriangle size={14} />}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {callAssessment.concerns.map(c => (
                        <li key={c} style={{ display: 'flex', gap: '8px', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--status-warning-text)', flexShrink: 0, fontWeight: 700 }}>~</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}
              </div>

              {/* Dimension Scorecard */}
              <SectionCard
                title="Dimension Scorecard"
                subtitle="Performance across individual assessment dimensions from the AI screening call"
                icon={<TrendingUp size={14} />}
              >
                <DimensionScorecard dimensions={callAssessment.dimensions} />
              </SectionCard>

              {/* Recommended next step */}
              <div style={{
                padding: '16px 18px',
                background: 'var(--brand-primary-light)',
                border: '1px solid var(--brand-primary-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
              }}>
                <Star size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '4px' }}>
                    Recommended Next Step
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {callAssessment.recommendedNextStep}
                  </p>
                </div>
                {!alreadyScheduled && canSchedule && (
                  <div className="report-no-print" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Calendar size={13} />}
                      onClick={() => setScheduleOpen(true)}
                    >
                      Schedule Interview
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: CAPABILITY ANALYSIS
      ══════════════════════════════════════════ */}
      {activeTab === 'capability' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionCard
            title="Capability Map"
            subtitle={`${capabilityAnalysis.totalWeighted} core competencies evaluated against role requirements`}
            icon={<TrendingUp size={15} />}
          >
            <CapabilityMap
              competencies={capabilityAnalysis.competencies}
              totalWeighted={capabilityAnalysis.totalWeighted}
            />
          </SectionCard>

          <SectionCard
            title="Skills Breakdown"
            subtitle="Individual skills assessed from resume and AI screening conversation"
            icon={<Star size={15} />}
          >
            <SkillsBreakdown skillGroups={capabilityAnalysis.skillGroups} />
          </SectionCard>

          {/* Radar summary */}
          <div style={{
            padding: '16px 18px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}>
            <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              AI Capability Interpretation
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.7 }}>
              {capabilityAnalysis.radarSummary}
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '8px' }}>
              Scores reflect demonstrated capability during the assessment, not potential or prior experience alone.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: EVIDENCE
      ══════════════════════════════════════════ */}
      {activeTab === 'evidence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Resume evidence */}
          {resumeScreening.evidence.length > 0 && (
            <SectionCard
              title="Resume Evidence"
              subtitle="Information derived from the candidate's CV and job description comparison"
              icon={<FileText size={14} />}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {resumeScreening.evidence.map((ev, i) => (
                  <EvidenceCard key={i} source="resume" label={ev.label} detail={ev.detail} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Call evidence */}
          {callComplete && callAssessment.evidence.length > 0 && (
            <SectionCard
              title="Conversation Evidence"
              subtitle="Information derived from the AI voice screening call — demonstrated by the candidate"
              icon={<Phone size={14} />}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {callAssessment.evidence.map((ev, i) => (
                  <EvidenceCard key={i} source="call" label={ev.label} detail={ev.detail} />
                ))}
              </div>
            </SectionCard>
          )}

          {!callComplete && (
            <div style={{
              padding: '20px', background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Conversation evidence will appear here after the AI screening call is completed.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            padding: '12px 16px', background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>About evidence classification:</strong>{' '}
              Resume evidence is inferred from the candidate's CV against the job description.
              Conversation evidence is directly observed during the AI voice screening and represents demonstrated knowledge, communication, and reasoning — not assumptions.
              These two sources are intentionally kept separate.
            </p>
          </div>
        </div>
      )}

      {/* ── Schedule Interview Modal ── */}
      <ScheduleInterviewModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        candidate={candidate}
      />
    </div>
  );
};

// ─── Evidence card sub-component ─────────────────────────────
const EvidenceCard: React.FC<{
  source: 'resume' | 'call';
  label: string;
  detail: string;
}> = ({ source, label, detail }) => {
  const isCall = source === 'call';
  return (
    <div style={{
      padding: '12px 14px',
      background: isCall ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
      border: `1px solid ${isCall ? 'var(--brand-primary-border)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700,
          padding: '1px 7px', borderRadius: 'var(--radius-full)',
          background: isCall ? 'var(--brand-primary)' : 'var(--bg-muted)',
          color: isCall ? 'white' : 'var(--text-secondary)',
        }}>
          {isCall ? 'CALL' : 'RESUME'}
        </span>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {label}
        </span>
      </div>
      <p style={{
        fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)',
        lineHeight: 1.6,
        ...(isCall && detail.startsWith('"') ? { fontStyle: 'italic' } : {}),
      }}>
        {detail}
      </p>
    </div>
  );
};

export default CandidateScreeningReport;
