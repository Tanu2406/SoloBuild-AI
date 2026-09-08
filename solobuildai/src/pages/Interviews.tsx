import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, CheckCircle2, Clock, X, Video, User, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { useAppStore, useInterviews, useCandidates, useHirings } from '../store/appStore';
import { useToast } from '../components/ui/Toast';
import type { Interview, InterviewStatus } from '../types';

type TabId = 'upcoming' | 'completed' | 'cancelled' | 'all';

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical:  'Technical',
  hr:         'HR',
  managerial: 'Managerial',
  final:      'Final Round',
  panel:      'Panel',
};

const STATUS_CONFIG: Record<InterviewStatus, { label: string; color: string; bg: string; border: string }> = {
  upcoming:    { label: 'Upcoming',    color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)',  border: 'var(--brand-primary-border)' },
  completed:   { label: 'Completed',   color: 'var(--status-success-text)', bg: 'var(--status-success-bg)',   border: 'var(--status-success-border)' },
  cancelled:   { label: 'Cancelled',   color: 'var(--status-error-text)',   bg: 'var(--status-error-bg)',     border: 'var(--status-error-border)' },
  rescheduled: { label: 'Rescheduled', color: 'var(--status-warning-text)', bg: 'var(--status-warning-bg)',   border: 'var(--status-warning-border)' },
};

const Interviews: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { dispatch } = useAppStore();
  const interviews = useInterviews();
  const candidates = useCandidates();
  const hirings = useHirings();

  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [search, setSearch] = useState('');

  const filtered = interviews.filter(iv => {
    const matchesTab =
      activeTab === 'all' ||
      iv.status === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      iv.candidateName.toLowerCase().includes(q) ||
      iv.hiringTitle.toLowerCase().includes(q) ||
      (INTERVIEW_TYPE_LABELS[iv.interviewType] || iv.interviewType).toLowerCase().includes(q) ||
      iv.interviewer.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  // Sort upcoming by date asc, completed by date desc
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.scheduledDate).getTime();
    const db = new Date(b.scheduledDate).getTime();
    return activeTab === 'completed' ? db - da : da - db;
  });

  const tabs = [
    { id: 'upcoming',  label: 'Upcoming',  count: interviews.filter(i => i.status === 'upcoming').length },
    { id: 'completed', label: 'Completed', count: interviews.filter(i => i.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: interviews.filter(i => i.status === 'cancelled').length },
    { id: 'all',       label: 'All',       count: interviews.length },
  ];

  const handleMarkCompleted = (iv: Interview) => {
    dispatch({ type: 'UPDATE_INTERVIEW', payload: { id: iv.id, updates: { status: 'completed' } } });
    dispatch({ type: 'UPDATE_CANDIDATE', payload: { id: iv.candidateId, updates: { status: 'interview_completed' } } });
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_ivc_${Date.now()}`,
        type: 'interview_completed',
        candidateName: iv.candidateName,
        hiringTitle: iv.hiringTitle,
        description: `${INTERVIEW_TYPE_LABELS[iv.interviewType]} interview completed for ${iv.candidateName}`,
        timestamp: new Date().toISOString(),
        timeAgo: 'just now',
      },
    });
    showToast(`Interview marked completed for ${iv.candidateName}`, 'success');
  };

  const handleCancel = (iv: Interview) => {
    dispatch({ type: 'UPDATE_INTERVIEW', payload: { id: iv.id, updates: { status: 'cancelled' } } });
    dispatch({
      type: 'ADD_ACTIVITY',
      payload: {
        id: `act_ivcancel_${Date.now()}`,
        type: 'interview_cancelled',
        candidateName: iv.candidateName,
        hiringTitle: iv.hiringTitle,
        description: `Interview cancelled for ${iv.candidateName}`,
        timestamp: new Date().toISOString(),
        timeAgo: 'just now',
      },
    });
    showToast(`Interview cancelled for ${iv.candidateName}`, 'info');
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const isToday = (dateStr: string) =>
    new Date(dateStr).toDateString() === new Date().toDateString();

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="Interviews"
        subtitle="Manage scheduled, completed, and cancelled candidate interviews across all hiring campaigns."
      />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={id => setActiveTab(id as TabId)} />
        <div style={{ maxWidth: '280px', width: '100%' }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by candidate, role, or type…"
            leftIcon={<Search size={14} />}
          />
        </div>
      </div>

      {/* Interview list */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Calendar size={24} />}
          title={search ? 'No interviews match your search' : activeTab === 'upcoming' ? 'No upcoming interviews' : `No ${activeTab} interviews`}
          description={
            search
              ? 'Try adjusting your search query.'
              : activeTab === 'upcoming'
              ? 'Schedule interviews from the Hiring Workspace after shortlisting candidates.'
              : 'Interviews will appear here as you progress candidates through the hiring pipeline.'
          }
          action={activeTab === 'upcoming' && !search ? { label: 'Go to Hiring', onClick: () => navigate('/hiring') } : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sorted.map(iv => {
            const statusCfg = STATUS_CONFIG[iv.status];
            const typeLabel = INTERVIEW_TYPE_LABELS[iv.interviewType] || iv.interviewType;
            const candidate = candidates.find(c => c.id === iv.candidateId);
            const hiring = hirings.find(h => h.id === iv.hiringId);
            const dateIsToday = isToday(iv.scheduledDate);

            return (
              <div key={iv.id} className="iv-card" style={{
                background: 'var(--bg-white)',
                border: `1px solid ${iv.status === 'upcoming' && dateIsToday ? 'var(--brand-primary-border)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
              }}>
                {/* Date block */}
                <div style={{
                  minWidth: '56px', textAlign: 'center', flexShrink: 0,
                  padding: '8px', borderRadius: 'var(--radius-sm)',
                  background: dateIsToday ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                  border: `1px solid ${dateIsToday ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: dateIsToday ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {new Date(iv.scheduledDate).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: dateIsToday ? 'white' : 'var(--text-primary)', lineHeight: 1.1 }}>
                    {new Date(iv.scheduledDate).getDate()}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Avatar name={iv.candidateName} size="sm" color="var(--brand-primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--font-size-base)' }}>{iv.candidateName}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`,
                        }}>
                          {statusCfg.label}
                        </span>
                        {dateIsToday && iv.status === 'upcoming' && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary)', color: 'white', animation: 'pulse 1.5s infinite' }}>
                            Today
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} /> {formatDate(iv.scheduledDate)}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> {iv.scheduledTime}
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          {typeLabel} Interview
                        </span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--brand-primary)', fontWeight: 500 }}>
                          {iv.hiringTitle}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={11} /> {iv.interviewer}
                        </span>
                        {iv.meetingLink && (
                          <a
                            href={iv.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 'var(--font-size-xs)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                          >
                            <Video size={11} /> Join Meeting
                          </a>
                        )}
                      </div>
                      {iv.notes && (
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                          Note: {iv.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                      {iv.status === 'upcoming' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<CheckCircle2 size={13} />}
                            onClick={() => handleMarkCompleted(iv)}
                          >
                            Mark Completed
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<X size={13} />}
                            onClick={() => handleCancel(iv)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {candidate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconRight={<ChevronRight size={13} />}
                          onClick={() => navigate(`/candidates/${candidate.id}`)}
                        >
                          Profile
                        </Button>
                      )}
                      {hiring && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/hiring/${hiring.id}`)}
                        >
                          Workspace
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Interviews;
