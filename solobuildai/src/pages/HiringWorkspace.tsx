import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pause, Play, MapPin, Calendar,
  Download, Sparkles, CheckCircle2,
  Filter, Phone
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { HiringStatusBadge, CandidateStatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CandidateFunnel } from '../components/product/CandidateFunnel';
import { ActivityItemComponent } from '../components/product/ActivityItem';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { DataTable, type Column } from '../components/ui/DataTable';
import { CandidateDrawer } from '../components/product/CandidateDrawer';
import { DialerModal } from '../components/product/DialerModal';
import {
  useAppStore,
  useHiring,
  useHiringCandidates,
  useActivity,
  useRecruiters,
  useCalls
} from '../store/appStore';
import { callSimulationService } from '../services/callSimulationService';
import { useToast } from '../components/ui/Toast';
import type { Candidate, Call } from '../types';

type WorkspaceTab = 'overview' | 'candidates' | 'calls' | 'results';

const workspaceTabs = [
  { id: 'overview', label: 'Campaign Overview' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'calls', label: 'Call Logs' },
  { id: 'results', label: 'Shortlist & Decisions' },
];

const HiringWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { state, dispatch } = useAppStore();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [candidateFilter, setCandidateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawer & Dialer states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerCandidate, setDialerCandidate] = useState<{ phone: string; name?: string } | null>(null);

  const hiring = useHiring(id || '');
  const candidates = useHiringCandidates(id || '');
  const allActivity = useActivity();
  const recruiters = useRecruiters();
  const allCalls = useCalls();

  // If hiring was created (status=ready/calling) but simulation isn't running, start it
  useEffect(() => {
    if (
      hiring &&
      (hiring.status === 'calling' || hiring.status === 'ready') &&
      !callSimulationService.isRunning(hiring.id)
    ) {
      const hasPending = candidates.some(c => c.status === 'added' || c.status === 'calling');
      if (hasPending) {
        dispatch({ type: 'UPDATE_HIRING', payload: { id: hiring.id, updates: { status: 'calling' } } });
        callSimulationService.start(hiring.id, state, dispatch, 350);
      }
    }
  }, [hiring?.id]);

  if (!hiring) {
    return (
      <div className="page-content">
        <EmptyState
          title="Hiring not found"
          description="This hiring campaign may have been deleted."
          action={{ label: 'Back to Hiring', onClick: () => navigate('/hiring') }}
        />
      </div>
    );
  }

  const recruiter = recruiters.find(r => r.id === hiring.aiRecruiterId);
  const hiringActivity = allActivity.filter(a => a.hiringTitle === hiring.title).slice(0, 20);
  const hiringCalls = allCalls.filter(c => c.hiringId === hiring.id);

  const handlePauseToggle = () => {
    if (hiring.status === 'calling') {
      callSimulationService.pause(hiring.id, dispatch, hiring.title);
      showToast('Calling paused', 'info');
    } else if (hiring.status === 'paused') {
      callSimulationService.resume(hiring.id, state, dispatch, hiring.title);
      showToast('Calling resumed', 'success');
    }
  };

  const handleOpenCandidate = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setDrawerOpen(true);
  };

  const handleCallAgain = (cand: Candidate) => {
    setDrawerOpen(false);
    setDialerCandidate({ phone: cand.phone, name: cand.name });
    setDialerOpen(true);
  };

  // Bulk actions
  const handleBulkShortlist = () => {
    selectedIds.forEach(candId => {
      dispatch({
        type: 'UPDATE_CANDIDATE',
        payload: { id: candId, updates: { status: 'shortlisted' } },
      });
    });
    showToast(`${selectedIds.length} candidate(s) shortlisted`, 'success');
    setSelectedIds([]);
  };

  const handleBulkDisqualify = () => {
    selectedIds.forEach(candId => {
      dispatch({
        type: 'UPDATE_CANDIDATE',
        payload: { id: candId, updates: { status: 'not_interested' } },
      });
    });
    showToast(`${selectedIds.length} candidate(s) marked not interested`, 'info');
    setSelectedIds([]);
  };

  const handleExportCSV = () => {
    const exportData = candidates.filter(c => selectedIds.length === 0 || selectedIds.includes(c.id));
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Name,Phone,Email,Status,Experience,Location,Call Duration,Summary']
        .concat(
          exportData.map(c =>
            `"${c.name}","${c.phone}","${c.email || ''}","${c.status}","${c.experience || ''}","${c.location || ''}","${c.callDuration || ''}","${(c.aiSummary || '').replace(/"/g, '""')}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${hiring.title.replace(/\s+/g, '_')}_candidates.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${exportData.length} candidates to CSV`, 'success');
  };

  // Filtering candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesFilter =
      candidateFilter === 'all' ||
      c.status === candidateFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Shortlisted candidates for Results tab
  const shortlistedCandidates = candidates.filter(c => c.status === 'shortlisted');

  // Candidate Table Columns
  const candidateColumns: Column<Candidate>[] = [
    {
      key: 'name',
      header: 'Candidate Name',
      sortable: true,
      render: (c: Candidate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar name={c.name} size="sm" color="var(--brand-primary)" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{c.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Screening Status',
      sortable: true,
      render: (c: Candidate) => <CandidateStatusBadge status={c.status} />,
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (c: Candidate) => c.experience || '—',
    },
    {
      key: 'location',
      header: 'Location',
      render: (c: Candidate) => c.location || hiring.location,
    },
    {
      key: 'callDuration',
      header: 'Call Time',
      render: (c: Candidate) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
          {c.callDuration || '—'}
        </span>
      ),
    },
    {
      key: 'lastActivity',
      header: 'Last Contact',
      render: (c: Candidate) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
          {c.lastActivity || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (c: Candidate) => (
        <div style={{ display: 'inline-flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenCandidate(c)}
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  // Call Logs Table Columns
  const callColumns: Column<Call>[] = [
    {
      key: 'candidateName',
      header: 'Candidate',
      render: (call: Call) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar name={call.candidateName} size="sm" color="var(--brand-primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{call.candidateName}</span>
        </div>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (call: Call) => <CandidateStatusBadge status={call.outcome || 'contacted'} />,
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (call: Call) => call.duration || '—',
    },
    {
      key: 'timeAgo',
      header: 'Time',
      render: (call: Call) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
          {call.timeAgo}
        </span>
      ),
    },
    {
      key: 'aiSummary',
      header: 'Key Takeaway',
      render: (call: Call) => (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', display: 'block', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {call.aiSummary || 'No summary available.'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (call: Call) => {
        const cand = candidates.find(c => c.id === call.candidateId);
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cand && handleOpenCandidate(cand)}
          >
            Review Call
          </Button>
        );
      },
    },
  ];

  const canPause = hiring.status === 'calling' || hiring.status === 'paused';

  return (
    <div className="page-content animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/hiring')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-size-sm)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          marginBottom: '14px',
          padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to All Hirings
      </button>

      {/* Operational Header */}
      <div className="page-header" style={{ marginBottom: '18px' }}>
        <div className="page-header__text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="page-header__title">{hiring.title}</h1>
            <HiringStatusBadge status={hiring.status} />
          </div>
          <div className="page-header__subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} /> {hiring.location}
            </span>
            <span>·</span>
            <span>{hiring.candidateCount} candidate pool</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} /> Created {new Date(hiring.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="page-header__actions">
          {canPause && (
            <Button
              variant={hiring.status === 'calling' ? 'secondary' : 'primary'}
              icon={hiring.status === 'paused' ? <Play size={15} /> : <Pause size={15} />}
              onClick={handlePauseToggle}
            >
              {hiring.status === 'paused' ? 'Resume Calling' : 'Pause Calling'}
            </Button>
          )}
          <Button
            variant="outline"
            icon={<Download size={14} />}
            onClick={handleExportCSV}
          >
            Export Pipeline
          </Button>
        </div>
      </div>

      {/* Campaign Velocity Metric Tiles */}
      <div className="metrics-row">
        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>SCREENING PROGRESS</span>
          </div>
          <div className="metric-tile__value">
            {hiring.contacted} <span style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-tertiary)', fontWeight: 500 }}>/ {hiring.candidateCount}</span>
          </div>
          <div style={{ marginTop: '4px' }}>
            <ProgressBar value={hiring.contacted} total={hiring.candidateCount || 1} />
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>CONNECTED RATE</span>
          </div>
          <div className="metric-tile__value">
            {hiring.contacted > 0 ? Math.round((hiring.connected / hiring.contacted) * 100) : 0}%
          </div>
          <span className="metric-tile__sub">{hiring.connected} picked up calls</span>
        </div>

        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>INTERESTED</span>
          </div>
          <div className="metric-tile__value">{hiring.interested}</div>
          <span className="metric-tile__sub">Wants to explore role</span>
        </div>

        <div className="metric-tile">
          <div className="metric-tile__header">
            <span>QUALIFIED / SHORTLISTED</span>
          </div>
          <div className="metric-tile__value" style={{ color: 'var(--brand-primary)' }}>
            {hiring.shortlisted}
          </div>
          <span className="metric-tile__sub">Ready for interview</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '18px' }}>
        <Tabs
          tabs={workspaceTabs.map(t => ({
            ...t,
            count:
              t.id === 'candidates' ? candidates.length :
              t.id === 'calls' ? hiringCalls.length :
              t.id === 'results' ? shortlistedCandidates.length :
              undefined,
          }))}
          activeTab={activeTab}
          onChange={tabId => setActiveTab(tabId as WorkspaceTab)}
        />
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Candidate Funnel */}
            <div className="table-container" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    AI Screening Funnel
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Real-time stage transitions from import to shortlist
                  </p>
                </div>
              </div>
              <CandidateFunnel hiring={hiring} />
            </div>

            {/* Campaign Recent Activity */}
            <div className="table-container">
              <div className="table-toolbar">
                <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Screening Event Stream
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  {hiringActivity.length} recent events
                </span>
              </div>
              <div style={{ padding: '8px 16px' }}>
                {hiringActivity.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                    Activity will appear as soon as the AI Recruiter connects with candidates.
                  </p>
                ) : (
                  hiringActivity.slice(0, 8).map(item => (
                    <ActivityItemComponent key={item.id} item={item} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI Recruiter Persona Scorecard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="table-container" style={{ padding: '20px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assigned AI Recruiter
              </span>
              {recruiter ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={recruiter.name} size="lg" color={recruiter.avatarColor} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {recruiter.name}
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                        {recruiter.conversationStyle} · {recruiter.voice}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Languages:</strong> {recruiter.languages.join(', ')}
                    </div>
                    {hiring.interviewInstructions && (
                      <div style={{ marginTop: '6px', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 'var(--font-size-xs)', lineHeight: 1.5 }}>
                        <strong style={{ display: 'block', marginBottom: '3px', color: 'var(--text-primary)' }}>Screening Instructions:</strong>
                        {hiring.interviewInstructions}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ marginTop: '8px', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                  Standard SoloBuildAI screening persona.
                </p>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="table-container" style={{ padding: '20px' }}>
              <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recruiter Actions
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  icon={<Phone size={14} />}
                  onClick={() => {
                    setDialerCandidate(null);
                    setDialerOpen(true);
                  }}
                >
                  Dial Specific Candidate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  icon={<Sparkles size={14} />}
                  onClick={() => setActiveTab('results')}
                >
                  Review Shortlist ({hiring.shortlisted})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CANDIDATES */}
      {activeTab === 'candidates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <Filter size={13} /> Filter:
            </div>
            {['all', 'shortlisted', 'interested', 'connected', 'no_answer', 'added'].map(filterKey => (
              <button
                key={filterKey}
                onClick={() => setCandidateFilter(filterKey)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  border: '1px solid',
                  borderColor: candidateFilter === filterKey ? 'var(--brand-primary)' : 'var(--border-default)',
                  background: candidateFilter === filterKey ? 'var(--brand-primary-light)' : 'var(--bg-white)',
                  color: candidateFilter === filterKey ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {filterKey === 'added' ? 'Queued' : filterKey.replace('_', ' ')}
                {filterKey === 'all'
                  ? ` (${candidates.length})`
                  : ` (${candidates.filter(c => c.status === filterKey).length})`}
              </button>
            ))}
          </div>

          <DataTable
            columns={candidateColumns}
            data={filteredCandidates}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search candidates by name, phone, or email…"
            onRowClick={handleOpenCandidate}
            batchActions={() => (
              <>
                <Button variant="secondary" size="sm" icon={<CheckCircle2 size={13} />} onClick={handleBulkShortlist}>
                  Bulk Shortlist
                </Button>
                <Button variant="ghost" size="sm" onClick={handleBulkDisqualify}>
                  Disqualify
                </Button>
                <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={handleExportCSV}>
                  Export CSV
                </Button>
              </>
            )}
            emptyTitle="No candidates match your filter"
            emptyDescription="Try selecting a different status filter or clear your search."
          />
        </div>
      )}

      {/* TAB CONTENT: CALL LOGS */}
      {activeTab === 'calls' && (
        <DataTable
          columns={callColumns}
          data={hiringCalls}
          emptyTitle="No calls logged yet"
          emptyDescription="Once the AI Recruiter begins contacting candidates, call durations and summaries will be recorded here."
          onRowClick={call => {
            const cand = candidates.find(c => c.id === call.candidateId);
            if (cand) handleOpenCandidate(cand);
          }}
        />
      )}

      {/* TAB CONTENT: SHORTLIST & RESULTS */}
      {activeTab === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--brand-primary-light)',
              border: '1px solid var(--brand-primary-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--brand-primary-text)' }}>
                Candidate Shortlist & Hiring Decisions
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                {shortlistedCandidates.length} candidate(s) met all role criteria during autonomous AI voice screening.
              </p>
            </div>
            {shortlistedCandidates.length > 0 && (
              <Button variant="primary" size="sm" icon={<Download size={14} />} onClick={handleExportCSV}>
                Export Shortlist to CSV
              </Button>
            )}
          </div>

          {shortlistedCandidates.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={24} />}
              title="No candidates shortlisted yet"
              description="As the AI Recruiter screens the candidate pool, those who meet your criteria will be populated here."
            />
          ) : (
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Shortlisted Candidate',
                  render: (c: Candidate) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar name={c.name} size="sm" color="var(--brand-primary)" />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{c.name}</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>{c.phone}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'experience',
                  header: 'Experience',
                  render: (c: Candidate) => c.experience || '—',
                },
                {
                  key: 'aiSummary',
                  header: 'AI Screening Takeaway',
                  render: (c: Candidate) => (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block', maxWidth: '400px' }}>
                      {c.aiSummary || 'Qualified candidate.'}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Decisions',
                  align: 'right',
                  render: (c: Candidate) => (
                    <div style={{ display: 'inline-flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenCandidate(c)}
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => showToast(`Interview invite queued for ${c.name}`, 'success')}
                      >
                        Schedule
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={shortlistedCandidates}
              onRowClick={handleOpenCandidate}
            />
          )}
        </div>
      )}

      {/* Candidate Evaluation Drawer */}
      <CandidateDrawer
        candidate={selectedCandidate}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCallAgain={handleCallAgain}
      />

      {/* Dialer Modal */}
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

export default HiringWorkspace;
