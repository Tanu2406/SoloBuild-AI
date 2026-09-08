import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, PhoneMissed,
  Loader2, CheckCircle2, AlertCircle, Volume2
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../ui/Toast';
import { useAppStore, useRecruiters } from '../../store/appStore';
import { dialerService, PURPOSE_LABELS } from '../../services/dialerService';
import type { DirectCallStatus, CallPurpose, DirectCall } from '../../types';

interface DialerModalProps {
  open: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialCandidateName?: string;
}

type DialerScreen = 'form' | 'active' | 'result';

const PURPOSE_OPTIONS = Object.entries(PURPOSE_LABELS).map(([value, label]) => ({ value, label }));

const STATUS_CONFIG: Record<DirectCallStatus, {
  label: string;
  sub: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  pulse: boolean;
}> = {
  preparing: {
    label: 'Preparing call…',
    sub: 'Setting up your AI Recruiter',
    color: 'var(--brand-primary)',
    bg: 'var(--brand-primary-light)',
    icon: <Loader2 size={28} className="spin" />,
    pulse: false,
  },
  ringing: {
    label: 'Ringing…',
    sub: 'Calling the candidate',
    color: '#0891b2',
    bg: '#ecfeff',
    icon: <Phone size={28} />,
    pulse: true,
  },
  connected: {
    label: 'Connected',
    sub: 'Candidate answered',
    color: 'var(--status-success-text)',
    bg: 'var(--status-success-bg)',
    icon: <Phone size={28} />,
    pulse: false,
  },
  in_progress: {
    label: 'In conversation',
    sub: 'AI Recruiter is screening the candidate',
    color: 'var(--status-success-text)',
    bg: 'var(--status-success-bg)',
    icon: <Volume2 size={28} />,
    pulse: true,
  },
  completed: {
    label: 'Call completed',
    sub: 'Screening finished',
    color: 'var(--status-success-text)',
    bg: 'var(--status-success-bg)',
    icon: <CheckCircle2 size={28} />,
    pulse: false,
  },
  no_answer: {
    label: 'No answer',
    sub: 'The candidate did not pick up',
    color: 'var(--status-warning-text)',
    bg: 'var(--status-warning-bg)',
    icon: <PhoneMissed size={28} />,
    pulse: false,
  },
  busy: {
    label: 'Line busy',
    sub: 'The candidate\'s line was busy',
    color: 'var(--status-warning-text)',
    bg: 'var(--status-warning-bg)',
    icon: <PhoneOff size={28} />,
    pulse: false,
  },
  failed: {
    label: 'Call failed',
    sub: 'Something went wrong. Please try again.',
    color: 'var(--status-error-text)',
    bg: 'var(--status-error-bg)',
    icon: <AlertCircle size={28} />,
    pulse: false,
  },
};

const TERMINAL_STATUSES: DirectCallStatus[] = ['completed', 'no_answer', 'busy', 'failed'];
const isTerminal = (s: DirectCallStatus) => TERMINAL_STATUSES.includes(s);

export const DialerModal: React.FC<DialerModalProps> = ({
  open,
  onClose,
  initialPhone,
  initialCandidateName,
}) => {
  const { showToast } = useToast();
  const { dispatch } = useAppStore();
  const recruiters = useRecruiters();

  // Form state
  const [phone, setPhone] = useState(initialPhone || '');
  const [candidateName, setCandidateName] = useState(initialCandidateName || '');
  const [recruiterId, setRecruiterId] = useState('');
  const [purpose, setPurpose] = useState<CallPurpose>('initial_screening');
  const [errors, setErrors] = useState<{ phone?: string; recruiterId?: string }>({});

  useEffect(() => {
    if (open) {
      if (initialPhone) setPhone(initialPhone);
      if (initialCandidateName) setCandidateName(initialCandidateName);
    }
  }, [open, initialPhone, initialCandidateName]);

  // Call state
  const [screen, setScreen] = useState<DialerScreen>('form');
  const [callStatus, setCallStatus] = useState<DirectCallStatus>('preparing');
  const [_callId, setCallId] = useState('');
  const [duration, setDuration] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeCallIdRef = useRef('');

  // Pre-select first recruiter
  useEffect(() => {
    if (recruiters.length > 0 && !recruiterId) {
      setRecruiterId(recruiters[0].id);
    }
  }, [recruiters, recruiterId]);

  // Elapsed timer while call is live
  useEffect(() => {
    if (callStatus === 'in_progress' || callStatus === 'connected') {
      elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [callStatus]);

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function reset() {
    setPhone('');
    setCandidateName('');
    setPurpose('initial_screening');
    setErrors({});
    setScreen('form');
    setCallStatus('preparing');
    setCallId('');
    setDuration('');
    setAiSummary('');
    setElapsed(0);
  }

  function handleClose() {
    // If call is active (non-terminal), cancel it first
    if (screen === 'active' && !isTerminal(callStatus) && activeCallIdRef.current) {
      dialerService.cancelCall(activeCallIdRef.current, () => {});
    }
    reset();
    onClose();
  }

  function validate() {
    const e: { phone?: string; recruiterId?: string } = {};
    if (!phone.trim()) {
      e.phone = 'Candidate phone number is required';
    } else if (!/^[\d\s+\-()]{7,}$/.test(phone.trim())) {
      e.phone = 'Please enter a valid phone number';
    }
    if (!recruiterId) e.recruiterId = 'Please select an AI Recruiter';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleStartCall() {
    if (!validate()) return;

    const recruiter = recruiters.find(r => r.id === recruiterId);
    if (!recruiter) return;

    setScreen('active');
    setCallStatus('preparing');
    setElapsed(0);

    const call = dialerService.startCall(
      {
        phoneNumber: phone.trim(),
        aiRecruiterId: recruiterId,
        recruiterName: recruiter.name,
        purpose,
        candidateName: candidateName.trim() || undefined,
      },
      (event) => {
        setCallStatus(event.status);

        if (event.duration) setDuration(event.duration);
        if (event.aiSummary) setAiSummary(event.aiSummary);

        if (isTerminal(event.status)) {
          // Persist to store
          const now = new Date();

          const directCall: DirectCall = {
            id: event.callId,
            candidateName: candidateName.trim() || undefined,
            phoneNumber: phone.trim(),
            aiRecruiterId: recruiterId,
            purpose,
            status: event.status,
            duration: event.duration,
            aiSummary: event.aiSummary,
            startedAt: new Date(now.getTime() - (elapsed + 2) * 1000).toISOString(),
            endedAt: now.toISOString(),
            timeAgo: 'just now',
          };

          dispatch({ type: 'ADD_DIRECT_CALL', payload: directCall });

          // Add activity entry
          const actType =
            event.status === 'completed' ? 'direct_call_completed' :
            event.status === 'no_answer' ? 'direct_call_no_answer' :
            'direct_call_failed';

          const desc =
            event.status === 'completed'
              ? `Direct call completed${event.duration ? ` — ${event.duration}` : ''}${candidateName ? ` · ${candidateName}` : ''}`
              : event.status === 'no_answer'
              ? `Direct call — no answer${candidateName ? ` · ${candidateName}` : ''}`
              : `Direct call failed${candidateName ? ` · ${candidateName}` : ''}`;

          dispatch({
            type: 'ADD_ACTIVITY',
            payload: {
              id: `act_dc_${Date.now()}`,
              type: actType,
              candidateName: candidateName.trim() || phone.trim(),
              description: desc,
              timestamp: now.toISOString(),
              timeAgo: 'just now',
            },
          });

          if (event.status === 'completed') {
            showToast('Call completed successfully', 'success');
          }
        }
      }
    );

    setCallId(call.id);
    activeCallIdRef.current = call.id;
  }

  function handleEndCall() {
    if (activeCallIdRef.current) {
      dialerService.cancelCall(activeCallIdRef.current, (event) => {
        setCallStatus(event.status);
      });
    }
  }

  const recruiter = recruiters.find(r => r.id === recruiterId);
  const statusConfig = STATUS_CONFIG[callStatus];
  const callIsTerminal = isTerminal(callStatus);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="sm"
    >
      <div className="dialer">
        {/* ——— FORM SCREEN ——— */}
        {screen === 'form' && (
          <div className="dialer__form animate-fade-in">
            <div className="dialer__header">
              <div className="dialer__header-icon">
                <Phone size={18} />
              </div>
              <div>
                <h2 className="dialer__title">Dial a Number</h2>
                <p className="dialer__subtitle">Your AI Recruiter will handle the conversation.</p>
              </div>
            </div>

            <div className="dialer__fields">
              <Input
                label="Candidate phone number"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => { setPhone(e.target.value); setErrors(er => ({ ...er, phone: '' })); }}
                error={errors.phone}
                leftIcon={<Phone size={14} />}
                autoFocus
              />

              <Input
                label="Candidate name"
                placeholder="Optional — helps your AI Recruiter"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                hint="Optional"
              />

              <div className="dialer__field-row">
                <Select
                  label="AI Recruiter"
                  options={recruiters.map(r => ({ value: r.id, label: `${r.name} — ${r.languages.join(', ')}` }))}
                  value={recruiterId}
                  onChange={e => { setRecruiterId(e.target.value); setErrors(er => ({ ...er, recruiterId: '' })); }}
                  error={errors.recruiterId}
                />
                <Select
                  label="Call purpose"
                  options={PURPOSE_OPTIONS}
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as CallPurpose)}
                />
              </div>
            </div>

            <div className="dialer__platform-note">
              <Phone size={13} />
              Calls are placed using your SoloBuildAI calling number.
            </div>

            <div className="dialer__form-actions">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button icon={<Phone size={15} />} onClick={handleStartCall} size="lg" fullWidth>
                Start Call
              </Button>
            </div>
          </div>
        )}

        {/* ——— ACTIVE CALL SCREEN ——— */}
        {screen === 'active' && (
          <div className="dialer__active animate-fade-in">
            {/* Status visual */}
            <div
              className={`dialer__call-state ${statusConfig.pulse ? 'dialer__call-state--pulse' : ''}`}
              style={{ color: statusConfig.color, background: statusConfig.bg }}
            >
              {statusConfig.icon}
            </div>

            <div className="dialer__call-info">
              <h3 className="dialer__call-status">{statusConfig.label}</h3>
              <p className="dialer__call-sub">{statusConfig.sub}</p>
            </div>

            {/* Who we're calling */}
            <div className="dialer__call-target">
              {recruiter && (
                <div className="dialer__call-recruiter">
                  <Avatar name={recruiter.name} size="sm" color={recruiter.avatarColor} />
                  <span>{recruiter.name}</span>
                  <span className="dialer__call-sep">·</span>
                  <span>{PURPOSE_LABELS[purpose]}</span>
                </div>
              )}
              <div className="dialer__call-phone">
                {candidateName && <span className="dialer__call-candidate-name">{candidateName}</span>}
                <span>{phone}</span>
              </div>
            </div>

            {/* Live elapsed timer */}
            {(callStatus === 'in_progress' || callStatus === 'connected') && (
              <div className="dialer__elapsed">{formatElapsed(elapsed)}</div>
            )}

            {/* Result details */}
            {callIsTerminal && (
              <div className="dialer__result animate-fade-in">
                {duration && (
                  <div className="dialer__result-row">
                    <span className="dialer__result-label">Duration</span>
                    <span className="dialer__result-value">{duration}</span>
                  </div>
                )}
                {aiSummary && (
                  <div className="dialer__ai-summary">
                    <span className="dialer__ai-label">
                      <span className="dialer__ai-dot" />
                      AI Summary
                    </span>
                    <p className="dialer__ai-text">{aiSummary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="dialer__active-actions">
              {!callIsTerminal ? (
                <Button
                  variant="danger"
                  icon={<PhoneOff size={16} />}
                  onClick={handleEndCall}
                  size="lg"
                  fullWidth
                >
                  End Call
                </Button>
              ) : (
                <div className="dialer__terminal-actions">
                  <Button variant="secondary" onClick={handleClose} fullWidth>
                    Close
                  </Button>
                  {(callStatus === 'no_answer' || callStatus === 'busy' || callStatus === 'failed') && (
                    <Button
                      icon={<Phone size={15} />}
                      onClick={() => {
                        setScreen('form');
                        setCallStatus('preparing');
                        setElapsed(0);
                        setDuration('');
                        setAiSummary('');
                      }}
                      fullWidth
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Styles injected once
const style = document.createElement('style');
style.textContent = `
.dialer { display: flex; flex-direction: column; }

/* Form screen */
.dialer__form { display: flex; flex-direction: column; gap: 20px; }

.dialer__header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.dialer__header-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  background: var(--brand-primary-light);
  color: var(--brand-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dialer__title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.dialer__subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: 2px;
}

.dialer__fields { display: flex; flex-direction: column; gap: 16px; }

.dialer__field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.dialer__platform-note {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  padding: 10px 12px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
}

.dialer__form-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Active call screen */
.dialer__active {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 8px 0 4px;
  text-align: center;
}

.dialer__call-state {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.dialer__call-state--pulse {
  animation: dialerPulse 1.8s ease-in-out infinite;
}

@keyframes dialerPulse {
  0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  50% { box-shadow: 0 0 0 12px transparent; opacity: 0.9; }
}

.dialer__call-info { display: flex; flex-direction: column; gap: 4px; }

.dialer__call-status {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.dialer__call-sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.dialer__call-target {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 20px;
  background: var(--bg-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
  border: 1px solid var(--border-default);
}

.dialer__call-recruiter {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.dialer__call-sep { color: var(--text-tertiary); }

.dialer__call-phone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dialer__call-candidate-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.dialer__call-phone span:last-child {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.02em;
}

.dialer__elapsed {
  font-size: 32px;
  font-weight: 800;
  color: var(--status-success-text);
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}

.dialer__result {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialer__result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}

.dialer__result-label { color: var(--text-secondary); }
.dialer__result-value { font-weight: 600; color: var(--text-primary); }

.dialer__ai-summary {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialer__ai-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--brand-primary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dialer__ai-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-primary);
  flex-shrink: 0;
}

.dialer__ai-text {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  line-height: 1.6;
  padding: 12px 14px;
  background: var(--brand-primary-light);
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
}

.dialer__active-actions { width: 100%; }

.dialer__terminal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@media (max-width: 640px) {
  .dialer__field-row { grid-template-columns: 1fr; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('dialer-styles')) {
  style.id = 'dialer-styles';
  document.head.appendChild(style);
}
