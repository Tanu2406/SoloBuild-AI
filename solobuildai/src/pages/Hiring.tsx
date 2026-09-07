import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Briefcase } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { HiringCard } from '../components/product/HiringCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { useHirings } from '../store/appStore';

type TabId = 'all' | 'active' | 'draft' | 'completed';

const Hiring: React.FC = () => {
  const navigate = useNavigate();
  const hirings = useHirings();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');

  const filtered = hirings.filter(h => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && (h.status === 'calling' || h.status === 'paused' || h.status === 'ready')) ||
      (activeTab === 'draft' && h.status === 'draft') ||
      (activeTab === 'completed' && h.status === 'completed');
    const matchesSearch =
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const tabs = [
    { id: 'all', label: 'All', count: hirings.length },
    { id: 'active', label: 'Active', count: hirings.filter(h => ['calling', 'paused', 'ready'].includes(h.status)).length },
    { id: 'draft', label: 'Drafts', count: hirings.filter(h => h.status === 'draft').length },
    { id: 'completed', label: 'Completed', count: hirings.filter(h => h.status === 'completed').length },
  ];

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="Hiring"
        subtitle="Manage your hiring campaigns and track candidate progress."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('/hiring/create')}>
            Create Hiring
          </Button>
        }
      />

      <div className="hiring-toolbar">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={id => setActiveTab(id as TabId)} />
        <div className="hiring-toolbar__search">
          <Input
            placeholder="Search hirings..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={24} />}
          title={search ? 'No hirings found' : 'No hirings yet'}
          description={
            search
              ? 'Try adjusting your search.'
              : 'Start your first hiring and let your AI Recruiter handle the initial candidate conversations.'
          }
          action={!search ? { label: 'Create Hiring', onClick: () => navigate('/hiring/create') } : undefined}
        />
      ) : (
        <div className="hiring-grid">
          {filtered.map(hiring => (
            <HiringCard
              key={hiring.id}
              hiring={hiring}
              onClick={() => navigate(`/hiring/${hiring.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hiring;

const style = document.createElement('style');
style.textContent = `
.hiring-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.hiring-toolbar__search { width: 240px; }
.hiring-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 16px; }
@media (max-width: 640px) { .hiring-toolbar { flex-direction: column; align-items: stretch; } .hiring-toolbar__search { width: 100%; } .hiring-grid { grid-template-columns: 1fr; } }
`;
if (typeof document !== 'undefined' && !document.getElementById('hiring-page-styles')) {
  style.id = 'hiring-page-styles';
  document.head.appendChild(style);
}
