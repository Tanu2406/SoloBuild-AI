import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, Mail, MapPin, Briefcase, Clock,
  CheckCircle2, XCircle, Calendar, Play, Pause, RotateCcw
} from 'lucide-react';
import { SlideOverDrawer } from '../ui/SlideOverDrawer';
import { CandidateStatusBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useAppStore } from '../../store/appStore';
import type { Candidate } from '../../types';

export interface CandidateDrawerProps {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  onCallAgain?: (candidate: Candidate) => void;
  onScheduleInterview?: (candidate: Candidate) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidate,
  open,
  onClose,
  onCallAgain,
  onScheduleInterview,
}) => {
  const { dispatch } = useAppStore();
  const { showToast } = useToast();

  // Audio player simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [speed, setSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset audio when candidate changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [candidate?.id]);

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

  if (!candidate) return null;

  const handleShortlist = () => {
    dispatch({
      type: 'UPDATE_CANDIDATE',
      payload: { id: candidate.id, updates: { status: 'shortlisted' } },
    });
    showToast(`${candidate.name} shortlisted for next round`, 'success');
  };

  const handleDisqualify = () => {
    dispatch({
      type: 'UPDATE_CANDIDATE',
      payload: { id: candidate.id, updates: { status: 'not_interested' } },
    });
    showToast(`${candidate.name} marked as not interested / disqualified`, 'info');
  };

  const handleScheduleInterview = () => {
    if (onScheduleInterview && candidate) {
      onScheduleInterview(candidate);
      onClose();
    } else {
      showToast(`Interview invitation link generated for ${candidate!.name}`, 'success');
    }
  };

  const hasCallRecord = candidate.callDuration && candidate.callDuration !== '—';

  // Format current elapsed time for audio simulation
  const totalSeconds = hasCallRecord ? 300 : 0; // ~5 mins mock
  const currentSeconds = Math.floor((progress / 100) * totalSeconds);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SlideOverDrawer
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar name={candidate.name} size="md" color="var(--brand-primary)" />
          <span>{candidate.name}</span>
        </div>
      }
      subtitle={
        <>
          {candidate.hiringTitle && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={12} /> {candidate.hiringTitle}
            </span>
          )}
          {candidate.location && (
            <>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {candidate.location}
              </span>
            </>
          )}
          {candidate.experience && (
            <>
              <span>·</span>
              <span>{candidate.experience} exp</span>
            </>
          )}
        </>
      }
      badge={<CandidateStatusBadge status={candidate.status} />}
      footer={
        <>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              icon={<Phone size={13} />}
              onClick={() => onCallAgain?.(candidate)}
            >
              Call Again
            </Button>
            {candidate.status !== 'not_interested' && (
              <Button
                variant="ghost"
                size="sm"
                icon={<XCircle size={13} />}
                onClick={handleDisqualify}
              >
                Disqualify
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Calendar size={13} />}
              onClick={handleScheduleInterview}
            >
              Schedule
            </Button>
            {candidate.status !== 'shortlisted' && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 size={13} />}
                onClick={handleShortlist}
              >
                Shortlist Candidate
              </Button>
            )}
          </div>
        </>
      }
    >
      {/* Contact Bar */}
      <div className="drawer-section">
        <div className="drawer-section__title">Contact Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <a
            href={`tel:${candidate.phone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)',
            }}
          >
            <Phone size={14} color="var(--brand-primary)" />
            <span>{candidate.phone}</span>
          </a>
          {candidate.email && (
            <a
              href={`mailto:${candidate.email}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Mail size={14} color="var(--brand-primary)" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{candidate.email}</span>
            </a>
          )}
        </div>
      </div>

      {/* AI Qualification Scorecard */}
      <div className="drawer-section">
        <div className="drawer-section__title">AI Screening Scorecard</div>
        <div className="scorecard-grid">
          <div className="scorecard-card">
            <span className="scorecard-card__label">Availability</span>
            <span className="scorecard-card__value">
              {candidate.status === 'shortlisted' ? 'Immediate / 15 Days' : '30–45 Days'}
            </span>
          </div>
          <div className="scorecard-card">
            <span className="scorecard-card__label">Compensation Fit</span>
            <span className="scorecard-card__value" style={{ color: 'var(--status-success-text)' }}>
              Within Budget
            </span>
          </div>
          <div className="scorecard-card">
            <span className="scorecard-card__label">Domain Experience</span>
            <span className="scorecard-card__value">{candidate.experience || '3+ years'}</span>
          </div>
          <div className="scorecard-card">
            <span className="scorecard-card__label">Screening Match</span>
            <span className="scorecard-card__value">
              {candidate.status === 'shortlisted' ? '92% Strong Fit' : candidate.status === 'interested' ? '81% Moderate Fit' : '65% Standard'}
            </span>
          </div>
        </div>
      </div>

      {/* Call Audio & Screening Highlights */}
      {hasCallRecord ? (
        <div className="drawer-section">
          <div className="drawer-section__title">Call Recording & Analysis</div>
          <div className="audio-player-card">
            <div className="audio-player-top">
              <div className="audio-player-ctrls">
                <button
                  className="audio-play-btn"
                  onClick={() => setIsPlaying(!isPlaying)}
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                    AI Screening Audio
                  </span>
                  <span className="audio-time-label">
                    {formatTime(currentSeconds)} / {candidate.callDuration}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="audio-speed-btn"
                  onClick={() => setProgress(0)}
                  title="Restart"
                >
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

          {/* AI Transcript & Summary */}
          {candidate.aiSummary && (
            <div
              style={{
                background: 'var(--brand-primary-light)',
                border: '1px solid var(--brand-primary-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <CheckCircle2 size={14} /> Key Screening Insights
              </div>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}
              >
                {candidate.aiSummary}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="drawer-section">
          <div className="drawer-section__title">Call Status</div>
          <div
            style={{
              padding: '16px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            <Clock size={16} color="var(--text-tertiary)" />
            <span>
              {candidate.status === 'added'
                ? 'Candidate is queued. The AI Recruiter will call during the next active batch.'
                : candidate.status === 'no_answer'
                ? 'Last call went unanswered. You can trigger a manual retry using the Call Again button.'
                : 'No screening call completed yet.'}
            </span>
          </div>
        </div>
      )}
    </SlideOverDrawer>
  );
};
