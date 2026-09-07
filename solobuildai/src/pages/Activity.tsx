import React, { useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Tabs } from '../components/ui/Tabs';
import { ActivityItemComponent } from '../components/product/ActivityItem';
import { EmptyState } from '../components/ui/EmptyState';
import { useActivity } from '../store/appStore';
import type { ActivityType } from '../types';

type ActivityFilter = 'all' | 'calls' | 'hiring';

const activityTabs = [
  { id: 'all', label: 'All activity' },
  { id: 'calls', label: 'Calls' },
  { id: 'hiring', label: 'Hiring' },
];

const callTypes: ActivityType[] = ['call_completed', 'call_failed', 'call_no_answer', 'candidate_interested', 'candidate_shortlisted'];
const hiringTypes: ActivityType[] = ['hiring_created', 'hiring_launched', 'hiring_paused', 'hiring_resumed', 'hiring_completed'];

const Activity: React.FC = () => {
  const activity = useActivity();
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filtered = activity.filter(item => {
    if (filter === 'calls') return callTypes.includes(item.type);
    if (filter === 'hiring') return hiringTypes.includes(item.type);
    return true;
  });

  const tabsWithCount = activityTabs.map(t => ({
    ...t,
    count: t.id === 'all' ? activity.length
      : t.id === 'calls' ? activity.filter(a => callTypes.includes(a.type)).length
      : activity.filter(a => hiringTypes.includes(a.type)).length,
  }));

  return (
    <div className="page-content animate-fade-in">
      <PageHeader title="Activity" subtitle="Everything happening across your hirings." />

      <div className="activity-filter">
        <Tabs tabs={tabsWithCount} activeTab={filter} onChange={id => setFilter(id as ActivityFilter)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon size={24} />}
          title="No activity yet"
          description="Activity will appear here once you start a hiring and calls begin."
        />
      ) : (
        <div className="activity-feed">
          {filtered.map(item => (
            <ActivityItemComponent key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Activity;

const style = document.createElement('style');
style.textContent = `
.activity-filter { margin-bottom: 20px; }
.activity-feed { background: var(--bg-white); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: 4px 24px 12px; max-width: 720px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('activity-page-styles')) {
  style.id = 'activity-page-styles';
  document.head.appendChild(style);
}
