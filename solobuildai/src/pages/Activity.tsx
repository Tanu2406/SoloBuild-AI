import React, { useState } from 'react';
import { Activity as ActivityIcon, Search, X } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Tabs } from '../components/ui/Tabs';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CandidateDrawer } from '../components/product/CandidateDrawer';
import { DialerModal } from '../components/product/DialerModal';
import { useActivity, useCandidates, useHirings, useRecruiters } from '../store/appStore';
import type { ActivityType, Candidate } from '../types';

type ActivityFilter = 'all' | 'calls' | 'direct' | 'hiring';

const activityTabs = [
  { id: 'all', label: 'All Operations' },
  { id: 'calls', label: 'Hiring Calls' },
  { id: 'direct', label: 'Direct Calls' },
  { id: 'hiring', label: 'Campaign Events' },
];

const hiringCallTypes: ActivityType[] = [
  'call_completed', 'call_failed', 'call_no_answer',
  'candidate_interested', 'candidate_shortlisted',
];

const directCallTypes: ActivityType[] = [
  'direct_call_completed', 'direct_call_failed', 'direct_call_no_answer',
];

const hiringEventTypes: ActivityType[] = [
  'hiring_created', 'hiring_launched', 'hiring_paused',
  'hiring_resumed', 'hiring_completed',
];

const ActivityPage: React.FC = () => {
  const activity = useActivity();
  const candidates = useCandidates();
  const hirings = useHirings();
  const recruiters = useRecruiters();

  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [search, setSearch] = useState('');
  const [hiringFilter, setHiringFilter] = useState('all');
  const [recruiterFilter, setRecruiterFilter] = useState('all');

  // Drawer and dialer states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerCandidate, setDialerCandidate] = useState<{ phone: string; name?: string } | null>(null);

  const handleInspectCandidate = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setDrawerOpen(true);
  };

  const handleCallAgain = (cand: Candidate) => {
    setDrawerOpen(false);
    setDialerCandidate({ phone: cand.phone, name: cand.name });
    setDialerOpen(true);
  };

  const filtered = activity.filter(item => {
    const matchesFilter =
      filter === 'calls' ? hiringCallTypes.includes(item.type) :
      filter === 'direct' ? directCallTypes.includes(item.type) :
      filter === 'hiring' ? hiringEventTypes.includes(item.type) :
      true;

    const matchesHiring =
      hiringFilter === 'all' ||
      (item.hiringTitle || '') === hirings.find(h => h.id === hiringFilter)?.title;

    // recruiter filter: match via candidates that belong to the selected hiring
    const matchesRecruiter =
      recruiterFilter === 'all' ||
      (() => {
        const rec = recruiters.find(r => r.id === recruiterFilter);
        if (!rec) return false;
        // find hirings assigned to this recruiter, then check if the activity's hiringTitle matches
        const recHiringTitles = hirings
          .filter(h => h.aiRecruiterId === recruiterFilter)
          .map(h => h.title);
        return recHiringTitles.includes(item.hiringTitle || '');
      })();

    const matchesSearch =
      (item.candidateName || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.hiringTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesHiring && matchesRecruiter && matchesSearch;
  });

  const tabsWithCount = activityTabs.map(t => ({
    ...t,
    count:
      t.id === 'all' ? activity.length :
      t.id === 'calls' ? activity.filter(a => hiringCallTypes.includes(a.type)).length :
      t.id === 'direct' ? activity.filter(a => directCallTypes.includes(a.type)).length :
      activity.filter(a => hiringEventTypes.includes(a.type)).length,
  }));

  const getEventBadge = (type: ActivityType) => {
    if (type === 'candidate_shortlisted') {
      return { label: 'Shortlisted', bg: 'var(--status-success-bg)', text: 'var(--status-success-text)' };
    }
    if (type === 'candidate_interested') {
      return { label: 'Interested', bg: 'var(--status-success-bg)', text: 'var(--status-success-text)' };
    }
    if (type === 'call_completed' || type === 'direct_call_completed') {
      return { label: 'Call Finished', bg: 'var(--brand-primary-light)', text: 'var(--brand-primary-text)' };
    }
    if (type === 'call_no_answer' || type === 'direct_call_no_answer') {
      return { label: 'No Answer', bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)' };
    }
    if (type === 'call_failed' || type === 'direct_call_failed') {
      return { label: 'Failed', bg: 'var(--status-error-bg)', text: 'var(--status-error-text)' };
    }
    return { label: 'Campaign Event', bg: 'var(--bg-subtle)', text: 'var(--text-secondary)' };
  };

  const hasActiveFilters = hiringFilter !== 'all' || recruiterFilter !== 'all' || search;
  const clearFilters = () => {
    setHiringFilter('all');
    setRecruiterFilter('all');
    setSearch('');
  };

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="Screening Operations & Audit Log"
        subtitle="Chronological audit history of autonomous AI calls, candidate evaluations, and campaign events."
      />

      {/* Toolbar — tabs + search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <Tabs tabs={tabsWithCount} activeTab={filter} onChange={id => setFilter(id as ActivityFilter)} />

        <div style={{ maxWidth: '280px', width: '100%' }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events, candidates, roles…"
            leftIcon={<Search size={14} />}
          />
        </div>
      </div>

      {/* Secondary filter row — hiring + recruiter dropdowns */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
          flexWrap: 'wrap',
        }}
      >
        {/* Hiring filter */}
        <select
          value={hiringFilter}
          onChange={e => setHiringFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${hiringFilter !== 'all' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
            fontSize: 'var(--font-size-xs)',
            color: hiringFilter !== 'all' ? 'var(--brand-primary)' : 'var(--text-primary)',
            background: hiringFilter !== 'all' ? 'var(--brand-primary-light)' : 'var(--bg-white)',
            cursor: 'pointer',
          }}
          aria-label="Filter by hiring campaign"
        >
          <option value="all">All Campaigns</option>
          {hirings.map(h => (
            <option key={h.id} value={h.id}>{h.title}</option>
          ))}
        </select>

        {/* AI Recruiter filter */}
        <select
          value={recruiterFilter}
          onChange={e => setRecruiterFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${recruiterFilter !== 'all' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
            fontSize: 'var(--font-size-xs)',
            color: recruiterFilter !== 'all' ? 'var(--brand-primary)' : 'var(--text-primary)',
            background: recruiterFilter !== 'all' ? 'var(--brand-primary-light)' : 'var(--bg-white)',
            cursor: 'pointer',
          }}
          aria-label="Filter by AI recruiter"
        >
          <option value="all">All AI Recruiters</option>
          {recruiters.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-white)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={11} /> Clear filters
          </button>
        )}
      </div>

      {/* Activity Log Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar__left">
            <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Operational Event Records
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-subtle)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
              }}
            >
              {filtered.length} event{filtered.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 16px' }}>
            <EmptyState
              icon={<ActivityIcon size={24} />}
              title={search ? 'No matching activity' : 'No operational activity yet'}
              description={
                search
                  ? 'Try clearing your search query.'
                  : 'Activity events will automatically be recorded as calls and screening campaigns progress.'
              }
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Candidate / Subject</th>
                  <th>Campaign Role</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const badge = getEventBadge(item.type);
                  const matchedCandidate = item.candidateName
                    ? candidates.find(c => c.name.toLowerCase() === item.candidateName?.toLowerCase())
                    : null;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => matchedCandidate && handleInspectCandidate(matchedCandidate)}
                      style={{ cursor: matchedCandidate ? 'pointer' : 'default' }}
                    >
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: badge.bg,
                            color: badge.text,
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.candidateName || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                          {item.hiringTitle || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                          {item.description}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                          {item.timeAgo}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {matchedCandidate && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleInspectCandidate(matchedCandidate);
                            }}
                          >
                            Inspect
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default ActivityPage;
