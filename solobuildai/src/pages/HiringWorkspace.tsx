import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pause, Play, MapPin, Calendar, MoreHorizontal, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { HiringStatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CandidateFunnel } from '../components/product/CandidateFunnel';
import { ActivityItemComponent } from '../components/product/ActivityItem';
import { Avatar } from '../components/ui/Avatar';
import { CandidateStatusBadge } from '../components/ui/Badge';
import { mockHirings, mockCandidates, mockActivity, mockAIRecruiters } from '../mock/data';
import { useToast } from '../components/ui/Toast';

type WorkspaceTab = 'overview' | 'candidates' | 'calls' | 'results';

const workspaceTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'calls', label: 'Calls' },
  { id: 'results', label: 'Results' },
];

const HiringWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [paused, setPaused] = useState(false);

  const hiring = mockHirings.find(h => h.id === id) || mockHirings[0];
  const recruiter = mockAIRecruiters.find(r => r.id === hiring.aiRecruiterId);
  const candidates = mockCandidates.filter(c => c.hiringId === hiring.id);
  const recentActivity = mockActivity.filter(a => a.hiringTitle === hiring.title);

  const handlePauseToggle = () => {
    setPaused(!paused);
    showToast(paused ? 'Calling resumed' : 'Calling paused', paused ? 'success' : 'info');
  };

  return (
    <div className="page-content animate-fade-in">
      {/* Back nav */}
      <button className="workspace__back" onClick={() => navigate('/hiring')}>
        <ArrowLeft size={15} /> All Hirings
      </button>

      {/* Workspace header */}
      <div className="workspace-header">
        <div className="workspace-header__left">
          <div className="workspace-header__title-row">
            <h1 className="workspace-header__title">{hiring.title}</h1>
            <HiringStatusBadge status={paused ? 'paused' : hiring.status} />
          </div>
          <div className="workspace-header__meta">
            <span className="workspace-header__meta-item">
              <MapPin size={13} />{hiring.location}
            </span>
            <span className="workspace-header__meta-sep">·</span>
            <span className="workspace-header__meta-item">
              {hiring.candidateCount} candidates
            </span>
            <span className="workspace-header__meta-sep">·</span>
            <span className="workspace-header__meta-item">
              <Calendar size={13} />
              Created {new Date(hiring.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="workspace-header__actions">
          <Button
            variant="secondary"
            icon={paused ? <Play size={15} /> : <Pause size={15} />}
            onClick={handlePauseToggle}
          >
            {paused ? 'Resume calling' : 'Pause calling'}
          </Button>
          <Button variant="ghost" size="md" icon={<MoreHorizontal size={16} />} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={workspaceTabs}
        activeTab={activeTab}
        onChange={id => setActiveTab(id as WorkspaceTab)}
      />

      <div className="workspace-body">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="workspace-overview animate-fade-in">
            <div className="workspace-overview__main">
              {/* Progress card */}
              <div className="ws-card">
                <h3 className="ws-card__title">Campaign progress</h3>
                <div className="ws-progress-block">
                  <div className="ws-progress-numbers">
                    <span className="ws-progress-primary">{hiring.contacted}</span>
                    <span className="ws-progress-sep">/</span>
                    <span className="ws-progress-total">{hiring.candidateCount}</span>
                    <span className="ws-progress-label">candidates contacted</span>
                  </div>
                  <ProgressBar value={hiring.contacted} total={hiring.candidateCount} size="md" />
                </div>
              </div>

              {/* Funnel */}
              <div className="ws-card">
                <h3 className="ws-card__title">Candidate funnel</h3>
                <CandidateFunnel hiring={hiring} />
              </div>

              {/* Recent activity */}
              <div className="ws-card">
                <h3 className="ws-card__title">Recent activity</h3>
                {recentActivity.length > 0 ? (
                  recentActivity.map(item => (
                    <ActivityItemComponent key={item.id} item={item} />
                  ))
                ) : (
                  mockActivity.slice(0, 5).map(item => (
                    <ActivityItemComponent key={item.id} item={item} />
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="workspace-overview__sidebar">
              {/* AI Recruiter */}
              <div className="ws-card">
                <h3 className="ws-card__title">AI Recruiter</h3>
                {recruiter ? (
                  <div className="ws-recruiter">
                    <Avatar name={recruiter.name} size="md" color={recruiter.avatarColor} />
                    <div className="ws-recruiter__info">
                      <span className="ws-recruiter__name">{recruiter.name}</span>
                      <span className="ws-recruiter__langs">{recruiter.languages.join(' + ')}</span>
                    </div>
                  </div>
                ) : (
                  <span className="ws-no-recruiter">Not configured</span>
                )}
              </div>

              {/* Quick stats */}
              <div className="ws-card">
                <h3 className="ws-card__title">At a glance</h3>
                <div className="ws-quick-stats">
                  {[
                    { label: 'Contacted', value: hiring.contacted },
                    { label: 'Connected', value: hiring.connected },
                    { label: 'Interested', value: hiring.interested },
                    { label: 'Shortlisted', value: hiring.shortlisted },
                    { label: 'Not interested', value: hiring.candidateCount - hiring.contacted },
                  ].map(s => (
                    <div key={s.label} className="ws-quick-stat">
                      <span className="ws-quick-stat__label">{s.label}</span>
                      <span className="ws-quick-stat__value">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CANDIDATES TAB */}
        {activeTab === 'candidates' && (
          <div className="animate-fade-in ws-table-section">
            <div className="ws-table-header">
              <span className="ws-table-count">{hiring.candidateCount} candidates</span>
              <Button variant="secondary" size="sm" icon={<Download size={14} />}>Export</Button>
            </div>
            <div className="ws-table-wrap">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Experience</th>
                    <th>Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id} onClick={() => navigate(`/candidates/${c.id}`)} className="clickable-row">
                      <td>
                        <div className="table-name-cell">
                          <Avatar name={c.name} size="sm" color="var(--brand-primary)" />
                          <span className="table-name">{c.name}</span>
                        </div>
                      </td>
                      <td className="table-secondary">{c.phone}</td>
                      <td><CandidateStatusBadge status={c.status} /></td>
                      <td className="table-secondary">{c.experience || '—'}</td>
                      <td className="table-secondary">{c.lastActivity || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CALLS TAB */}
        {activeTab === 'calls' && (
          <div className="animate-fade-in ws-table-section">
            <div className="ws-table-header">
              <span className="ws-table-count">{hiring.contacted} calls made</span>
            </div>
            <div className="ws-table-wrap">
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.filter(c => c.callDuration && c.callDuration !== '—').map(c => (
                    <tr key={c.id} onClick={() => navigate(`/candidates/${c.id}`)} className="clickable-row">
                      <td>
                        <div className="table-name-cell">
                          <Avatar name={c.name} size="sm" color="var(--brand-primary)" />
                          <span className="table-name">{c.name}</span>
                        </div>
                      </td>
                      <td className="table-secondary">Sep 7, 2026 · 10:30 AM</td>
                      <td className="table-secondary">{c.callDuration}</td>
                      <td>
                        <CandidateStatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && (
          <div className="animate-fade-in ws-results">
            <div className="ws-results-grid">
              <div className="ws-card ws-results-card ws-results-card--shortlisted">
                <div className="ws-results-card__number">{hiring.shortlisted}</div>
                <div className="ws-results-card__label">Shortlisted</div>
              </div>
              <div className="ws-card ws-results-card ws-results-card--interested">
                <div className="ws-results-card__number">{hiring.interested}</div>
                <div className="ws-results-card__label">Interested</div>
              </div>
              <div className="ws-card ws-results-card ws-results-card--connected">
                <div className="ws-results-card__number">{hiring.connected}</div>
                <div className="ws-results-card__label">Connected</div>
              </div>
              <div className="ws-card ws-results-card ws-results-card--pending">
                <div className="ws-results-card__number">{hiring.candidateCount - hiring.contacted}</div>
                <div className="ws-results-card__label">Pending</div>
              </div>
            </div>

            <div className="ws-card">
              <h3 className="ws-card__title">Shortlisted candidates</h3>
              <div className="ws-table-wrap">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Call duration</th>
                      <th>AI Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.filter(c => c.status === 'shortlisted').map(c => (
                      <tr key={c.id} onClick={() => navigate(`/candidates/${c.id}`)} className="clickable-row">
                        <td>
                          <div className="table-name-cell">
                            <Avatar name={c.name} size="sm" color="var(--brand-primary)" />
                            <span className="table-name">{c.name}</span>
                          </div>
                        </td>
                        <td className="table-secondary">{c.callDuration}</td>
                        <td>
                          <span className="ws-summary-preview">{c.aiSummary?.slice(0, 80)}…</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HiringWorkspace;

const style = document.createElement('style');
style.textContent = `
.workspace__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  margin-bottom: 20px;
  transition: color var(--transition-fast);
  padding: 0;
}
.workspace__back:hover { color: var(--text-primary); }

.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.workspace-header__left { display: flex; flex-direction: column; gap: 8px; }

.workspace-header__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.workspace-header__title {
  font-size: var(--font-size-4xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.workspace-header__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  flex-wrap: wrap;
}

.workspace-header__meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.workspace-header__meta-sep { color: var(--text-tertiary); }

.workspace-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.workspace-body {
  margin-top: 24px;
}

.workspace-overview {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

.workspace-overview__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-overview__sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ws-card {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ws-card__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.ws-progress-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ws-progress-numbers {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.ws-progress-primary {
  font-size: 40px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -1px;
}

.ws-progress-sep {
  font-size: var(--font-size-2xl);
  color: var(--text-tertiary);
  margin: 0 2px;
}

.ws-progress-total {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-secondary);
}

.ws-progress-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-left: 8px;
}

.ws-recruiter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ws-recruiter__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ws-recruiter__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.ws-recruiter__langs {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.ws-no-recruiter {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.ws-quick-stats {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ws-quick-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-default);
}
.ws-quick-stat:last-child { border-bottom: none; }

.ws-quick-stat__label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.ws-quick-stat__value {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

/* Table */
.ws-table-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ws-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ws-table-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.ws-table-wrap {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overflow-x: auto;
}

.ws-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.ws-table th {
  padding: 11px 16px;
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--bg-subtle);
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
}

.ws-table td {
  padding: 13px 16px;
  border-bottom: 1px solid var(--border-default);
  vertical-align: middle;
}

.ws-table tr:last-child td { border-bottom: none; }

.clickable-row { cursor: pointer; }
.clickable-row:hover td { background: var(--bg-hover); }

.table-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-name {
  font-weight: 500;
  color: var(--text-primary);
}

.table-secondary {
  color: var(--text-secondary);
}

.ws-summary-preview {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  max-width: 300px;
  display: block;
  line-height: 1.4;
}

/* Results */
.ws-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ws-results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.ws-results-card {
  align-items: center;
  text-align: center;
  padding: 28px 16px;
}

.ws-results-card__number {
  font-size: 44px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;
}

.ws-results-card__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: 4px;
}

.ws-results-card--shortlisted .ws-results-card__number { color: #16a34a; }
.ws-results-card--interested .ws-results-card__number { color: #2563eb; }
.ws-results-card--connected .ws-results-card__number { color: #0891b2; }
.ws-results-card--pending .ws-results-card__number { color: var(--text-secondary); }

@media (max-width: 1100px) {
  .workspace-overview { grid-template-columns: 1fr; }
  .workspace-overview__sidebar { grid-row: 1; }
  .ws-results-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .workspace-header__title { font-size: var(--font-size-3xl); }
  .ws-results-grid { grid-template-columns: repeat(2, 1fr); }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('workspace-styles')) {
  style.id = 'workspace-styles';
  document.head.appendChild(style);
}
