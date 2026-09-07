import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, Play, Clock, AlertCircle } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { CandidateStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useCandidate } from '../store/appStore';

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Stable waveform heights — computed once using a seeded approach
  const waveformRef = useRef<number[]>(
    Array.from({ length: 48 }, (_, i) => 14 + Math.abs(Math.sin(i * 1.3) * 14) + (i % 7) * 1.5)
  );

  const candidate = useCandidate(id || '');

  if (!candidate) {
    return (
      <div className="page-content">
        <EmptyState title="Candidate not found" description="This candidate may have been removed." action={{ label: 'Back', onClick: () => navigate(-1) }} />
      </div>
    );
  }

  const hasCallData = candidate.callDuration && candidate.callDuration !== '—';

  return (
    <div className="page-content animate-fade-in">
      <button className="workspace__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="candidate-detail">
        {/* Profile header */}
        <div className="cd-profile">
          <div className="cd-profile__left">
            <Avatar name={candidate.name} size="xl" color="var(--brand-primary)" />
            <div className="cd-profile__info">
              <h1 className="cd-profile__name">{candidate.name}</h1>
              <div className="cd-profile__meta">
                {candidate.hiringTitle && (
                  <span className="cd-profile__meta-item"><Briefcase size={13} />{candidate.hiringTitle}</span>
                )}
                {candidate.location && (
                  <span className="cd-profile__meta-item"><MapPin size={13} />{candidate.location}</span>
                )}
                {candidate.experience && (
                  <span className="cd-profile__meta-item">{candidate.experience} experience</span>
                )}
              </div>
              <div style={{ marginTop: 4 }}>
                <CandidateStatusBadge status={candidate.status} />
              </div>
            </div>
          </div>
          <div className="cd-profile__actions">
            <Button variant="secondary" icon={<Phone size={15} />}>Call again</Button>
          </div>
        </div>

        <div className="cd-body">
          {/* Contact */}
          <div className="cd-card">
            <h3 className="cd-card__title">Contact</h3>
            <div className="cd-contact-list">
              <a href={`tel:${candidate.phone}`} className="cd-contact-item">
                <div className="cd-contact-item__icon"><Phone size={14} /></div>
                <span>{candidate.phone}</span>
              </a>
              {candidate.email && (
                <a href={`mailto:${candidate.email}`} className="cd-contact-item">
                  <div className="cd-contact-item__icon"><Mail size={14} /></div>
                  <span>{candidate.email}</span>
                </a>
              )}
            </div>
          </div>

          {/* Recruitment activity */}
          {hasCallData ? (
            <div className="cd-card">
              <h3 className="cd-card__title">Recruitment activity</h3>

              <div className="cd-call-record">
                <div className="cd-call-record__header">
                  <div className="cd-call-record__icon">
                    <Phone size={14} />
                  </div>
                  <div className="cd-call-record__info">
                    <span className="cd-call-record__label">Screening call completed</span>
                    <span className="cd-call-record__time">{candidate.lastActivity}</span>
                  </div>
                  <div className="cd-call-record__right">
                    <span className="cd-call-record__duration">
                      <Clock size={12} /> {candidate.callDuration}
                    </span>
                    <CandidateStatusBadge status={candidate.status} />
                  </div>
                </div>

                {/* Waveform player (visual) */}
                <div className="cd-player">
                  <button className="cd-player__play" aria-label="Play recording">
                    <Play size={16} fill="currentColor" />
                  </button>
                  <div className="cd-player__waveform">
                    {waveformRef.current.map((h, i) => (
                      <div
                        key={i}
                        className="cd-player__bar"
                        style={{ height: `${h}px`, opacity: i < 22 ? 1 : 0.3 }}
                      />
                    ))}
                  </div>
                  <span className="cd-player__time">{candidate.callDuration}</span>
                </div>
              </div>

              {/* AI summary */}
              {candidate.aiSummary && (
                <div className="cd-ai-summary">
                  <div className="cd-ai-summary__label">
                    <span className="cd-ai-summary__dot" />
                    AI Summary
                  </div>
                  <p className="cd-ai-summary__text">{candidate.aiSummary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="cd-card">
              <h3 className="cd-card__title">Recruitment activity</h3>
              {candidate.status === 'added' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  <Clock size={14} /> Waiting to be called
                </div>
              ) : candidate.status === 'no_answer' || candidate.status === 'busy' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-warning-text)', fontSize: 'var(--font-size-sm)' }}>
                  <AlertCircle size={14} />
                  {candidate.status === 'no_answer' ? 'No answer on last call attempt' : 'Line was busy'}
                  {candidate.lastActivity && <span style={{ color: 'var(--text-tertiary)' }}>— {candidate.lastActivity}</span>}
                </div>
              ) : (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>No calls completed yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;

const style = document.createElement('style');
style.textContent = `
.candidate-detail { display: flex; flex-direction: column; gap: 20px; max-width: 760px; }
.cd-profile { background: var(--bg-white); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 28px; display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.cd-profile__left { display: flex; align-items: flex-start; gap: 18px; }
.cd-profile__info { display: flex; flex-direction: column; gap: 6px; }
.cd-profile__name { font-size: var(--font-size-3xl); font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
.cd-profile__meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cd-profile__meta-item { display: flex; align-items: center; gap: 4px; font-size: var(--font-size-sm); color: var(--text-secondary); }
.cd-profile__actions { flex-shrink: 0; }
.cd-body { display: flex; flex-direction: column; gap: 16px; }
.cd-card { background: var(--bg-white); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.cd-card__title { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); }
.cd-contact-list { display: flex; flex-direction: column; gap: 10px; }
.cd-contact-item { display: flex; align-items: center; gap: 10px; font-size: var(--font-size-base); color: var(--text-primary); text-decoration: none; transition: color var(--transition-fast); }
.cd-contact-item:hover { color: var(--brand-primary); }
.cd-contact-item__icon { width: 30px; height: 30px; border-radius: var(--radius-sm); background: var(--bg-subtle); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); flex-shrink: 0; }
.cd-call-record { display: flex; flex-direction: column; gap: 14px; padding: 16px; background: var(--bg-app); border: 1px solid var(--border-default); border-radius: var(--radius-lg); }
.cd-call-record__header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cd-call-record__icon { width: 32px; height: 32px; border-radius: var(--radius-md); background: var(--status-success-bg); color: var(--status-success-text); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cd-call-record__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.cd-call-record__label { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }
.cd-call-record__time { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.cd-call-record__right { display: flex; align-items: center; gap: 10px; }
.cd-call-record__duration { display: flex; align-items: center; gap: 4px; font-size: var(--font-size-xs); color: var(--text-secondary); font-weight: 500; }
.cd-player { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-white); border: 1px solid var(--border-default); border-radius: var(--radius-md); }
.cd-player__play { width: 34px; height: 34px; border-radius: 50%; background: var(--brand-primary); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background var(--transition-fast); }
.cd-player__play:hover { background: var(--brand-primary-hover); }
.cd-player__waveform { flex: 1; display: flex; align-items: center; gap: 2px; height: 40px; overflow: hidden; }
.cd-player__bar { width: 3px; border-radius: 2px; background: var(--brand-primary); flex-shrink: 0; }
.cd-player__time { font-size: var(--font-size-xs); color: var(--text-secondary); font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.cd-ai-summary { display: flex; flex-direction: column; gap: 8px; }
.cd-ai-summary__label { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); font-weight: 600; color: var(--brand-primary); letter-spacing: 0.04em; text-transform: uppercase; }
.cd-ai-summary__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--brand-primary); }
.cd-ai-summary__text { font-size: var(--font-size-sm); color: var(--text-primary); line-height: 1.6; padding: 14px 16px; background: var(--brand-primary-light); border: 1px solid #bfdbfe; border-radius: var(--radius-md); }
`;
if (typeof document !== 'undefined' && !document.getElementById('candidate-detail-styles')) {
  style.id = 'candidate-detail-styles';
  document.head.appendChild(style);
}
