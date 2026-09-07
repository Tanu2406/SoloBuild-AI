import React, { useState } from 'react';
import { PageHeader } from '../components/ui/Layout';
import { Tabs } from '../components/ui/Tabs';
import { ActivityItemComponent } from '../components/product/ActivityItem';
import { mockActivity } from '../mock/data';
import type { ActivityType } from '../types';

type ActivityFilter = 'all' | 'calls' | 'hiring';

const activityTabs = [
  { id: 'all', label: 'All activity' },
  { id: 'calls', label: 'Calls' },
  { id: 'hiring', label: 'Hiring' },
];

const callTypes: ActivityType[] = ['call_completed', 'call_failed', 'call_no_answer'];
const hiringTypes: ActivityType[] = ['hiring_created', 'hiring_launched', 'candidate_shortlisted', 'candidate_interested'];

const Activity: React.FC = () => {
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filtered = mockActivity.filter(item => {
    if (filter === 'calls') return callTypes.includes(item.type);
    if (filter === 'hiring') return hiringTypes.includes(item.type);
    return true;
  });

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="Activity"
        subtitle="Everything happening across your hirings."
      />

      <div className="activity-filter">
        <Tabs
          tabs={activityTabs}
          activeTab={filter}
          onChange={id => setFilter(id as ActivityFilter)}
        />
      </div>

      <div className="activity-feed">
        {filtered.map(item => (
          <ActivityItemComponent key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Activity;

const style = document.createElement('style');
style.textContent = `
.activity-filter {
  margin-bottom: 20px;
}

.activity-feed {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 4px 24px 12px;
  max-width: 720px;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('activity-page-styles')) {
  style.id = 'activity-page-styles';
  document.head.appendChild(style);
}
