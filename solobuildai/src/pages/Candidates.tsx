import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { CandidateStatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { mockCandidates } from '../mock/data';
import type { CandidateStatus } from '../types';

type FilterTab = 'all' | CandidateStatus;

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'interested', label: 'Interested' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'no_answer', label: 'No Answer' },
];

const Candidates: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filtered = mockCandidates.filter(c => {
    const matchFilter = activeFilter === 'all' || c.status === activeFilter;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.hiringTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    return matchFilter && matchSearch;
  });

  const tabsWithCount = filterTabs.map(t => ({
    ...t,
    count: t.id === 'all'
      ? mockCandidates.length
      : mockCandidates.filter(c => c.status === t.id).length,
  }));

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="Candidates"
        subtitle="All candidates across your hirings."
      />

      <div className="candidates-toolbar">
        <div className="candidates-toolbar__search">
          <Input
            placeholder="Search by name, hiring, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      <div className="candidates-filter-row">
        <Tabs
          tabs={tabsWithCount}
          activeTab={activeFilter}
          onChange={id => setActiveFilter(id as FilterTab)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No candidates found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="candidates-table-wrap">
          <table className="candidates-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Hiring</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(candidate => (
                <tr
                  key={candidate.id}
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                  className="candidates-table__row"
                >
                  <td>
                    <div className="candidate-name-cell">
                      <Avatar name={candidate.name} size="sm" color="var(--brand-primary)" />
                      <div className="candidate-name-info">
                        <span className="candidate-name">{candidate.name}</span>
                        {candidate.location && (
                          <span className="candidate-location">{candidate.location}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {candidate.hiringTitle ? (
                      <span className="candidate-hiring">{candidate.hiringTitle}</span>
                    ) : '—'}
                  </td>
                  <td className="candidate-phone">{candidate.phone}</td>
                  <td>
                    <CandidateStatusBadge status={candidate.status} />
                  </td>
                  <td className="candidate-activity">{candidate.lastActivity || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Candidates;

const style = document.createElement('style');
style.textContent = `
.candidates-toolbar {
  margin-bottom: 0;
}

.candidates-toolbar__search {
  max-width: 380px;
  margin-bottom: 16px;
}

.candidates-filter-row {
  margin-bottom: 20px;
}

.candidates-table-wrap {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overflow-x: auto;
}

.candidates-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.candidates-table th {
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

.candidates-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-default);
  vertical-align: middle;
}

.candidates-table tr:last-child td { border-bottom: none; }

.candidates-table__row {
  cursor: pointer;
  transition: background var(--transition-fast);
}
.candidates-table__row:hover td { background: var(--bg-hover); }

.candidate-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.candidate-name-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.candidate-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: var(--font-size-base);
}

.candidate-location {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.candidate-hiring {
  color: var(--brand-primary);
  font-weight: 500;
  font-size: var(--font-size-sm);
}

.candidate-phone {
  color: var(--text-secondary);
}

.candidate-activity {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}
`;
if (typeof document !== 'undefined' && !document.getElementById('candidates-page-styles')) {
  style.id = 'candidates-page-styles';
  document.head.appendChild(style);
}
