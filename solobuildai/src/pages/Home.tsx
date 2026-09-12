import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Phone, Briefcase, ChevronRight,
  CheckCircle2, AlertCircle, PauseCircle,
  Play, Users, PhoneCall, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { HiringStatusBadge, CandidateStatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import { DialerModal } from '../components/product/DialerModal';
import { CandidateDrawer } from '../components/product/CandidateDrawer';
import { useAppStore, useHirings, useCandidates, useActivity, useRecruiters } from '../store/appStore';
import { callSimulationService } from '../services/callSimulationService';
import { useToast } from '../components/ui/Toast';
import type { Candidate, Hiring } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { state, dispatch } = useAppStore();
  const hirings = useHirings();
  const candidates = useCandidates();
  const activity = useActivity();
  const recruiters = useRecruiters();

  // Dialog & Drawer state
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerCandidate, setDialerCandidate] = useState<{ phone: string; name?: string } | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Computed Operational Stats
  const activeHirings = hirings.filter(h => h.status === 'calling' || h.status === 'paused');
  const callingHiring = hirings.find(h => h.status === 'calling');
  const totalCandidates = hirings.reduce((s, h) => s + h.candidateCount, 0);
  const totalContacted = hirings.reduce((s, h) => s + h.contacted, 0);
  const totalConnected = hirings.reduce((s, h) => s + h.connected, 0);
  const totalShortlisted = hirings.reduce((s, h) => s + h.shortlisted, 0);

  const contactRate = totalCandidates > 0 ? Math.round((totalContacted / totalCandidates) * 100) : 0;
  const connectRate = totalContacted > 0 ? Math.round((totalConnected / totalContacted) * 100) : 0;
  const shortlistRate = totalContacted > 0 ? Math.round((totalShortlisted / totalContacted) * 100) : 0;

  // Candidates awaiting review (shortlisted or interested)
  const candidatesForReview = candidates
    .filter(c => c.status === 'shortlisted' || c.status === 'interested')
    .slice(0, 5);

  const handleInspectCandidate = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setDrawerOpen(true);
  };

  const handleCallAgain = (cand: Candidate) => {
    setDrawerOpen(false);
    setDialerCandidate({ phone: cand.phone, name: cand.name });
    setDialerOpen(true);
  };

  const handlePauseCalling = (hiring: Hiring) => {
    callSimulationService.pause(hiring.id, dispatch, hiring.title);
    showToast(`Calling paused for ${hiring.title}`, 'info');
  };

  const handleResumeCalling = (hiring: Hiring) => {
    callSimulationService.resume(hiring.id, state, dispatch, hiring.title);
    showToast(`Calling resumed for ${hiring.title}`, 'success');
  };

  return (
    <div className="page-content animate-fade-in">
      {/* ——— COMMAND BAR ——— */}
      <div className="page-header" style={{ marginBottom: '18px' }}>
        <div className="page-header__text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-header__title">Recruitment Operations</h1>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--brand-primary)',
                background: 'var(--brand-primary-light)',
                border: '1px solid var(--brand-primary-border)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              TalentCorp · Enterprise
            </span>
          </div>
          <p className="page-header__subtitle">
            Autonomous AI voice screening cockpit and active candidate decision pipeline.
          </p>
        </div>

        <div className="page-header__actions">
          <Button
            variant="secondary"
            icon={<Phone size={15} />}
            onClick={() => {
              setDialerCandidate(null);
              setDialerOpen(true);
            }}
          >
            Dial a Number
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/hiring/create')}
          >
            Create Hiring
          </Button>
        </div>
      </div>

      {/* ——— LIVE SCREENING OPERATIONS MONITOR ——— */}
      {callingHiring ? (
        <div className="ops-banner ops-banner--active">
          <div className="ops-banner__left">
            <span className="ops-banner__pulse-dot" />
            <div className="ops-banner__text">
              <span className="ops-banner__title">
                AI Screening Active: {callingHiring.title}
              </span>
              <span className="ops-banner__sub">
                {callingHiring.contacted} of {callingHiring.candidateCount} candidates contacted ·{' '}
                {callingHiring.shortlisted} shortlisted so far · Auto-dialing candidate pool
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<PauseCircle size={14} />}
              onClick={() => handlePauseCalling(callingHiring)}
            >
              Pause Calling
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight size={14} />}
              onClick={() => navigate(`/hiring/${callingHiring.id}`)}
            >
              Open Workspace
            </Button>
          </div>
        </div>
      ) : activeHirings.some(h => h.status === 'paused') ? (
        <div className="ops-banner" style={{ background: 'var(--status-warning-bg)', borderColor: 'var(--status-warning-border)' }}>
          <div className="ops-banner__left">
            <AlertCircle size={16} color="var(--status-warning-text)" />
            <div className="ops-banner__text">
              <span className="ops-banner__title" style={{ color: 'var(--status-warning-text)' }}>
                Screening Paused
              </span>
              <span className="ops-banner__sub">
                {activeHirings.filter(h => h.status === 'paused').map(h => h.title).join(', ')} currently paused.
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Play size={13} />}
            onClick={() => {
              const paused = activeHirings.find(h => h.status === 'paused');
              if (paused) handleResumeCalling(paused);
            }}
          >
            Resume Calling
          </Button>
        </div>
      ) : null}

      {/* ——— OPERATIONAL METRIC TILES ——— */}
      <div className="metrics-row">
        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>ACTIVE CAMPAIGNS</span>
            <Briefcase size={15} color="var(--text-tertiary)" />
          </div>
          <div className="metric-tile__value">{activeHirings.length}</div>
          <span className="metric-tile__sub">
            {hirings.length} total job role{hirings.length === 1 ? '' : 's'} managed
          </span>
        </div>

        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>CANDIDATES SCREENED</span>
            <PhoneCall size={15} color="var(--text-tertiary)" />
          </div>
          <div className="metric-tile__value">{totalContacted}</div>
          <span className="metric-tile__sub">
            {contactRate}% of {totalCandidates} total candidates processed
          </span>
        </div>

        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>CALL CONNECT RATE</span>
            <Users size={15} color="var(--text-tertiary)" />
          </div>
          <div className="metric-tile__value">{connectRate}%</div>
          <span className="metric-tile__sub">
            {totalConnected} pick-ups across AI campaigns
          </span>
        </div>

        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>QUALIFIED / SHORTLISTED</span>
            <Sparkles size={15} color="var(--brand-primary)" />
          </div>
          <div className="metric-tile__value" style={{ color: 'var(--brand-primary)' }}>
            {totalShortlisted}
          </div>
          <span className="metric-tile__sub">
            {shortlistRate}% pass rate ready for human interview
          </span>
        </div>
      </div>

      {/* ——— MAIN OPERATIONAL GRID ——— */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px', alignItems: 'start' }}>
        {/* LEFT: ACTIVE HIRINGS TABLE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="table-container">
            <div className="table-toolbar">
              <div className="table-toolbar__left">
                <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Active Hiring Campaigns
                </span>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-subtle)',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500,
                  }}
                >
                  {activeHirings.length} active
                </span>
              </div>
              <div className="table-toolbar__right">
                <Button variant="ghost" size="sm" onClick={() => navigate('/hiring')}>
                  View all campaigns <ChevronRight size={13} />
                </Button>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role & Location</th>
                    <th>AI Recruiter</th>
                    <th>Progress</th>
                    <th style={{ textAlign: 'center' }}>Qualified</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeHirings.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No active campaigns right now. Click "Create Hiring" to launch your next screening.
                      </td>
                    </tr>
                  ) : (
                    activeHirings.map(h => {
                      const rec = recruiters.find(r => r.id === h.aiRecruiterId);
                      return (
                        <tr
                          key={h.id}
                          onClick={() => navigate(`/hiring/${h.id}`)}
                        >
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.title}</span>
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                                {h.location}
                              </span>
                            </div>
                          </td>
                          <td>
                            {rec ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Avatar name={rec.name} size="sm" color={rec.avatarColor} />
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{rec.name}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>Standard</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '130px' }}>
                              <ProgressBar value={h.contacted} total={h.candidateCount || 1} />
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                {h.contacted}/{h.candidateCount} ({Math.round(((h.contacted) / (h.candidateCount || 1)) * 100)}%)
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 'var(--font-size-md)' }}>
                              {h.shortlisted}
                            </span>
                          </td>
                          <td>
                            <HiringStatusBadge status={h.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                              {h.status === 'calling' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePauseCalling(h)}
                                  title="Pause calling"
                                >
                                  Pause
                                </Button>
                              ) : h.status === 'paused' ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleResumeCalling(h)}
                                  title="Resume calling"
                                >
                                  Resume
                                </Button>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/hiring/${h.id}`)}
                              >
                                Console
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ATTENTION QUEUE: CANDIDATES READY FOR REVIEW */}
          {candidatesForReview.length > 0 && (
            <div className="table-container">
              <div className="table-toolbar" style={{ background: 'var(--status-success-bg)', borderBottomColor: 'var(--status-success-border)' }}>
                <div className="table-toolbar__left">
                  <CheckCircle2 size={16} color="var(--status-success-text)" />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--status-success-text)' }}>
                    Action Required: {candidatesForReview.length} Candidates Qualified & Ready for HR Review
                  </span>
                </div>
                <div className="table-toolbar__right">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/candidates')}>
                    View all candidates <ChevronRight size={13} />
                  </Button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Call Duration</th>
                      <th style={{ textAlign: 'right' }}>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatesForReview.map(cand => (
                      <tr key={cand.id} onClick={() => handleInspectCandidate(cand)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Avatar name={cand.name} size="sm" color="var(--brand-primary)" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cand.name}</span>
                              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{cand.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                            {cand.hiringTitle || '—'}
                          </span>
                        </td>
                        <td>
                          <CandidateStatusBadge status={cand.status} />
                        </td>
                        <td>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                            {cand.callDuration || '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectCandidate(cand);
                            }}
                          >
                            Inspect
                          </Button>
                          {cand.hiringId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/screening-reports/${cand.hiringId}/candidate/${cand.id}`);
                              }}
                            >
                              Report
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: REAL-TIME STREAM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="table-container">
            <div className="table-toolbar">
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Live Screening Stream
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
                Audit Log <ChevronRight size={13} />
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '580px', overflowY: 'auto' }}>
              {activity.slice(0, 10).map(item => {
                // Find candidate matching item if any
                const matchedCandidate = item.candidateName
                  ? candidates.find(c => c.name.toLowerCase() === item.candidateName?.toLowerCase())
                  : null;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: 'var(--font-size-sm)',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: 'var(--radius-full)',
                        background:
                          item.type === 'candidate_shortlisted' || item.type === 'candidate_interested'
                            ? 'var(--status-success-bg)'
                            : item.type === 'call_no_answer'
                            ? 'var(--status-warning-bg)'
                            : 'var(--brand-primary-light)',
                        color:
                          item.type === 'candidate_shortlisted' || item.type === 'candidate_interested'
                            ? 'var(--status-success-text)'
                            : item.type === 'call_no_answer'
                            ? 'var(--status-warning-text)'
                            : 'var(--brand-primary-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <PhoneCall size={13} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.candidateName || item.hiringTitle || 'Recruitment Event'}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                          {item.timeAgo}
                        </span>
                      </div>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.description}
                      </span>
                    </div>

                    {matchedCandidate && (
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--brand-primary)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px',
                          alignSelf: 'center',
                        }}
                        onClick={() => handleInspectCandidate(matchedCandidate)}
                        title="Inspect Candidate"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ——— IN-CONTEXT CANDIDATE EVALUATION DRAWER ——— */}
      <CandidateDrawer
        candidate={selectedCandidate}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCallAgain={handleCallAgain}
      />

      {/* ——— DIALER MODAL ——— */}
      <DialerModal
        open={dialerOpen}
        initialPhone={dialerCandidate?.phone}
        initialCandidateName={dialerCandidate?.name}
        onClose={() => {
          setDialerOpen(false);
          setDialerCandidate(null);
        }}
      />
    </div>
  );
};

export default Home;
