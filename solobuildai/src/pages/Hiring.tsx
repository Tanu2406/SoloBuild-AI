import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Briefcase, X } from 'lucide-react';
import { PageHeader } from '../components/ui/Layout';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { HiringCard } from '../components/product/HiringCard';
import { DataTable, type Column } from '../components/ui/DataTable';
import { HiringStatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Avatar } from '../components/ui/Avatar';
import Candidates from './Candidates';
import { useHirings, useRecruiters, useAppStore } from '../store/appStore';
import { callSimulationService } from '../services/callSimulationService';
import { useToast } from '../components/ui/Toast';
import type { Hiring } from '../types';

type TabId = 'all' | 'active' | 'draft' | 'completed' | 'candidates';

const HiringPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const { showToast } = useToast();
  const hirings = useHirings();
  const recruiters = useRecruiters();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');

  const filtered = hirings.filter(h => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'active' && (h.status === 'calling' || h.status === 'paused' || h.status === 'ready')) ||
      (activeTab === 'draft' && h.status === 'draft') ||
      (activeTab === 'completed' && h.status === 'completed');
    const matchesSearch =
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      employmentTypeFilter === 'all' ||
      h.employmentType === employmentTypeFilter;
    return matchesTab && matchesSearch && matchesType;
  });

  const tabs = [
    { id: 'all', label: 'All Campaigns', count: hirings.length },
    { id: 'active', label: 'Active Screening', count: hirings.filter(h => ['calling', 'paused', 'ready'].includes(h.status)).length },
    { id: 'draft', label: 'Drafts', count: hirings.filter(h => h.status === 'draft').length },
    { id: 'completed', label: 'Completed', count: hirings.filter(h => h.status === 'completed').length },
    { id: 'candidates', label: 'Candidates' },
  ];

  const handlePauseCalling = (hiring: Hiring) => {
    callSimulationService.pause(hiring.id, dispatch, hiring.title);
    showToast(`Calling paused for ${hiring.title}`, 'info');
  };

  const handleResumeCalling = (hiring: Hiring) => {
    callSimulationService.resume(hiring.id, state, dispatch, hiring.title);
    showToast(`Calling resumed for ${hiring.title}`, 'success');
  };

  const columns: Column<Hiring>[] = [
    {
      key: 'title',
      header: 'Job Role & Location',
      sortable: true,
      render: (h: Hiring) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.title}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
            {h.location} · {h.employmentType.replace('_', '-')}
          </span>
        </div>
      ),
    },
    {
      key: 'aiRecruiterId',
      header: 'Assigned AI Recruiter',
      render: (h: Hiring) => {
        const rec = recruiters.find(r => r.id === h.aiRecruiterId);
        return rec ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar name={rec.name} size="sm" color={rec.avatarColor} />
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{rec.name}</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>Standard</span>
        );
      },
    },
    {
      key: 'candidateCount',
      header: 'Pool Size',
      sortable: true,
      render: (h: Hiring) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {h.candidateCount}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Screening Velocity',
      render: (h: Hiring) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
          <ProgressBar value={h.contacted} total={h.candidateCount || 1} />
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
            {h.contacted} of {h.candidateCount} contacted ({Math.round(((h.contacted) / (h.candidateCount || 1)) * 100)}%)
          </span>
        </div>
      ),
    },
    {
      key: 'shortlisted',
      header: 'Shortlisted',
      align: 'center',
      sortable: true,
      render: (h: Hiring) => (
        <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: 'var(--font-size-md)' }}>
          {h.shortlisted}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (h: Hiring) => <HiringStatusBadge status={h.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (h: Hiring) => (
        <div style={{ display: 'inline-flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
          {h.status === 'calling' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePauseCalling(h)}
            >
              Pause
            </Button>
          ) : h.status === 'paused' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleResumeCalling(h)}
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
      ),
    },
  ];

  return (
    <div className="page-content animate-fade-in">
      <PageHeader
        title="Hiring Campaigns"
        subtitle="Manage active voice recruitment campaigns and evaluate candidate screening progress."
        actions={
          <Button icon={<Plus size={16} />} onClick={() => navigate('/hiring/create')}>
            Create Hiring
          </Button>
        }
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '18px',
          flexWrap: 'wrap',
        }}
      >
        <Tabs tabs={tabs} activeTab={activeTab} onChange={id => setActiveTab(id as TabId)} />

        {activeTab !== 'candidates' && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Employment type filter */}
          <select
            value={employmentTypeFilter}
            onChange={e => setEmploymentTypeFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${employmentTypeFilter !== 'all' ? 'var(--brand-primary)' : 'var(--border-default)'}`,
              fontSize: 'var(--font-size-xs)',
              color: employmentTypeFilter !== 'all' ? 'var(--brand-primary)' : 'var(--text-primary)',
              background: employmentTypeFilter !== 'all' ? 'var(--brand-primary-light)' : 'var(--bg-white)',
              cursor: 'pointer',
            }}
            aria-label="Filter by employment type"
          >
            <option value="all">All Types</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>

          {/* Clear filter chip */}
          {(employmentTypeFilter !== 'all' || search) && (
            <button
              onClick={() => { setEmploymentTypeFilter('all'); setSearch(''); }}
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
              <X size={11} /> Clear
            </button>
          )}

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-white)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--brand-primary-light)' : 'transparent',
                color: viewMode === 'table' ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                border: 'none',
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--brand-primary-light)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                border: 'none',
                padding: '5px 8px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>}
      </div>

      {activeTab === 'candidates' ? (
        <Candidates embedded />
      ) : viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filtered}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search campaigns by role or location…"
          onRowClick={h => navigate(`/hiring/${h.id}`)}
          emptyIcon={<Briefcase size={24} />}
          emptyTitle={search ? 'No hirings found' : 'No hirings yet'}
          emptyDescription={
            search
              ? 'Try adjusting your search query.'
              : 'Create your first hiring campaign and let your AI Recruiter begin contacting candidates.'
          }
          emptyAction={!search ? { label: 'Create Hiring', onClick: () => navigate('/hiring/create') } : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '16px' }}>
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

export default HiringPage;
