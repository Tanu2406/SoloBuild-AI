import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Briefcase,
  Calendar, CheckCircle2, XCircle, Play, Pause, RotateCcw, Clock, FileSearch
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { CandidateStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { DialerModal } from '../components/product/DialerModal';
import { ScheduleInterviewModal } from '../components/product/ScheduleInterviewModal';
import { CapabilityMap } from '../components/product/CapabilityMap';
import { useAppStore, useCandidate } from '../store/appStore';
import { screeningReportService } from '../services/screeningReportService';
import { useToast } from '../components/ui/Toast';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const { showToast } = useToast();

  const candidate = useCandidate(id || '');

  // Audio player simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dialer modal
  const [dialerOpen, setDialerOpen] = useState(false);
  // Schedule interview modal
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2 * speed;
        });
      }, 300);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  if (!candidate) {
    return (
      <div className="page-content">
        <EmptyState
          title="Candidate not found"
          description="This candidate record does not exist or may have been removed."
          action={{ label: 'Back to Candidates', onClick: () => navigate('/candidates') }}
        />
      </div>
    );
  }

  const handleShortlist = () => {
    dispatch({
      type: 'UPDATE_CANDIDATE',
      payload: { id: candidate.id, updates: { status: 'shortlisted' } },
    });
    showToast(`${candidate.name} marked as Shortlisted`, 'success');
  };

  const handleDisqualify = () => {
    dispatch({
      type: 'UPDATE_CANDIDATE',
      payload: { id: candidate.id, updates: { status: 'not_interested' } },
    });
    showToast(`${candidate.name} marked as Not Interested / Disqualified`, 'info');
  };

  const hasCallRecord = candidate.callDuration && candidate.callDuration !== '—';
  const totalSeconds = hasCallRecord ? 300 : 0;
  const currentSeconds = Math.floor((progress / 100) * totalSeconds);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-content animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          marginBottom: '16px',
          padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile Card */}
        <div
          className="table-container"
          style={{
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <Avatar name={candidate.name} size="xl" color="var(--brand-primary)" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {candidate.name}
                </h1>
                <CandidateStatusBadge status={candidate.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                {candidate.hiringTitle && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase size={13} /> {candidate.hiringTitle}
                  </span>
                )}
                {candidate.location && (
                  <>
                    <span>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} /> {candidate.location}
                    </span>
                  </>
                )}
                {candidate.experience && (
                  <>
                    <span>·</span>
                    <span>{candidate.experience} experience</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              icon={<Phone size={14} />}
              onClick={() => setDialerOpen(true)}
            >
              Call Candidate
            </Button>
            {candidate.status !== 'shortlisted' && (
              <Button
                variant="primary"
                icon={<CheckCircle2 size={14} />}
                onClick={handleShortlist}
              >
                Shortlist
              </Button>
            )}
            {candidate.hiringId && (
              <Button
                variant="outline"
                icon={<FileSearch size={14} />}
                onClick={() => navigate(`/screening-reports/${candidate.hiringId}/candidate/${candidate.id}`)}
              >
                Screening Report
              </Button>
            )}
          </div>
        </div>

        {/* Contact Info & Scorecard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', alignItems: 'start' }}>
          {/* Contact Details */}
          <div className="table-container" style={{ padding: '20px' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact Details
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
              <a
                href={`tel:${candidate.phone}`}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                  <Phone size={14} />
                </div>
                <span>{candidate.phone}</span>
              </a>

              {candidate.email && (
                <a
                  href={`mailto:${candidate.email}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                    <Mail size={14} />
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.email}</span>
                </a>
              )}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={<Calendar size={14} />}
                onClick={() => setScheduleOpen(true)}
              >
                Schedule Interview
              </Button>
              {candidate.status !== 'not_interested' && (
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  icon={<XCircle size={14} />}
                  onClick={handleDisqualify}
                >
                  Disqualify
                </Button>
              )}
            </div>
          </div>

          {/* AI Scorecard & Screening Analysis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Scorecard */}
            <div className="table-container" style={{ padding: '20px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Qualification Scorecard
              </span>
              <div className="scorecard-grid" style={{ marginTop: '12px' }}>
                <div className="scorecard-card">
                  <span className="scorecard-card__label">Availability</span>
                  <span className="scorecard-card__value">
                    {candidate.status === 'shortlisted' ? 'Immediate' : '30 Days'}
                  </span>
                </div>
                <div className="scorecard-card">
                  <span className="scorecard-card__label">Compensation Fit</span>
                  <span className="scorecard-card__value" style={{ color: 'var(--status-success-text)' }}>
                    Aligned with Budget
                  </span>
                </div>
                <div className="scorecard-card">
                  <span className="scorecard-card__label">Experience</span>
                  <span className="scorecard-card__value">{candidate.experience || '3+ years'}</span>
                </div>
                <div className="scorecard-card">
                  <span className="scorecard-card__label">AI Screening Match</span>
                  <span className="scorecard-card__value" style={{ color: 'var(--brand-primary)' }}>
                    {candidate.status === 'shortlisted' ? '94% Qualified' : '82% Match'}
                  </span>
                </div>
              </div>
            </div>

            {/* Screening Audio & Transcript */}
            {hasCallRecord ? (
              <div className="table-container" style={{ padding: '20px' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Call Recording & Notes
                </span>

                <div className="audio-player-card" style={{ marginTop: '12px' }}>
                  <div className="audio-player-top">
                    <div className="audio-player-ctrls">
                      <button
                        className="audio-play-btn"
                        onClick={() => setIsPlaying(!isPlaying)}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                      </button>
                      <div>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'block' }}>
                          Screening Audio Session
                        </span>
                        <span className="audio-time-label">
                          {formatTime(currentSeconds)} / {candidate.callDuration}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button className="audio-speed-btn" onClick={() => setProgress(0)} title="Restart">
                        <RotateCcw size={12} />
                      </button>
                      <button
                        className="audio-speed-btn"
                        onClick={() => {
                          const speeds: (1 | 1.25 | 1.5 | 2)[] = [1, 1.25, 1.5, 2];
                          const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
                          setSpeed(speeds[nextIdx]);
                        }}
                      >
                        {speed}x
                      </button>
                    </div>
                  </div>

                  <div
                    className="audio-scrubber-track"
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                      setProgress(newPct);
                    }}
                  >
                    <div className="audio-scrubber-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {candidate.aiSummary && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '14px 16px',
                      background: 'var(--brand-primary-light)',
                      border: '1px solid var(--brand-primary-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      AI Screening Summary
                    </span>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                      {candidate.aiSummary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="table-container" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Clock size={20} style={{ margin: '0 auto 8px', color: 'var(--text-tertiary)' }} />
                <span style={{ fontSize: 'var(--font-size-sm)', display: 'block' }}>
                  No screening call completed for this candidate yet.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Capability Snapshot + View Full Report CTA ── */}
      {screeningReportService.isReportAvailable(candidate) && (() => {
        const report = screeningReportService.getReport(candidate);
        const labelStyle = screeningReportService.hireLabelStyle(report.overallRecommendation.label);
        const callComplete = report.callAssessment.complete;
        return (
          <div style={{ maxWidth: '840px', marginTop: '4px' }}>
            <div className="table-container" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AI Assessment Summary
                  </span>
                  {callComplete && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{
                        fontSize: 'var(--font-size-lg)', fontWeight: 800, color: labelStyle.text,
                      }}>
                        {report.overallRecommendation.label === 'strong_hire' ? '★ Strong Hire'
                          : report.overallRecommendation.label === 'hire' ? '✓ Hire'
                          : report.overallRecommendation.label === 'consider' ? '~ Consider'
                          : '✗ No Hire'}
                      </span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)', fontWeight: 700,
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        background: labelStyle.bg, color: labelStyle.text,
                        border: `1px solid ${labelStyle.border}`,
                      }}>
                        {report.overallRecommendation.score} / 10
                      </span>
                    </div>
                  )}
                </div>
                {candidate.hiringId && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FileSearch size={13} />}
                    onClick={() => navigate(`/screening-reports/${candidate.hiringId}/candidate/${candidate.id}`)}
                  >
                    View Full Screening Report
                  </Button>
                )}
              </div>

              {/* Compact capability map */}
              <CapabilityMap
                competencies={report.capabilityAnalysis.competencies}
                totalWeighted={report.capabilityAnalysis.totalWeighted}
                compact
              />

              {/* Top strengths */}
              {callComplete && report.overallRecommendation.strengths.length > 0 && (
                <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-success-text)', marginBottom: '6px' }}>
                      Top Strengths
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {report.overallRecommendation.strengths.slice(0, 3).map(s => (
                        <li key={s} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', gap: '5px' }}>
                          <span style={{ color: 'var(--status-success-text)' }}>·</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {report.overallRecommendation.concerns.length > 0 && (
                    <div>
                      <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-warning-text)', marginBottom: '6px' }}>
                        Potential Concerns
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {report.overallRecommendation.concerns.slice(0, 3).map(c => (
                          <li key={c} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', gap: '5px' }}>
                            <span style={{ color: 'var(--status-warning-text)' }}>·</span>{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <DialerModal
        open={dialerOpen}
        initialPhone={candidate.phone}
        initialCandidateName={candidate.name}
        onClose={() => setDialerOpen(false)}
      />

      <ScheduleInterviewModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        candidate={candidate}
      />
    </div>
  );
};

export default CandidateDetail;
