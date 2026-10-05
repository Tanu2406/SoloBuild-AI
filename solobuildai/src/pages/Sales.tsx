import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Flame, Mail, Megaphone, Phone, Plus, Target, Users } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/ui/Layout';
import './sales.css';

type LeadStatus = 'New' | 'Researching' | 'Qualified' | 'Unqualified' | 'Needs Review' | 'Enriched';

type Lead = {
  id: string;
  name: string;
  company: string;
  industry: string;
  location: string;
  source: string;
  status: LeadStatus;
  email: string;
  phone: string;
  companySize: string;
  website: string;
  revenue: string;
  budget: string;
  need: string;
  timeline: string;
  owner: string;
  engagement: number;
  companyFit: number;
  intent: number;
  score: number;
  region: string;
};

type Campaign = {
  id: string;
  name: string;
  target: number;
  reps: string;
  contacted: number;
  qualified: number;
  conversion: string;
  status: 'Active' | 'Completed' | 'Draft';
};

const initialLeads: Lead[] = [
  {
    id: 'lead-rahul', name: 'Rahul Sharma', company: 'TechNova', industry: 'SaaS',
    location: 'Pune', source: 'LinkedIn', status: 'New',
    email: 'rahul.sharma@technova.example', phone: '+91 98765 43210',
    companySize: '201-500', website: 'technova.example', revenue: '$10M-$25M',
    budget: '$50k-$100k', need: 'Sales automation platform', timeline: 'This quarter',
    owner: 'Ava', engagement: 94, companyFit: 91, intent: 91, score: 92, region: 'West',
  },
  {
    id: 'lead-priya', name: 'Priya Mehta', company: 'BrightLabs', industry: 'IT',
    location: 'Mumbai', source: 'Website', status: 'Qualified',
    email: 'priya.mehta@brightlabs.example', phone: '+91 98765 12345',
    companySize: '51-200', website: 'brightlabs.example', revenue: '$5M-$10M',
    budget: '$25k-$50k', need: 'Cloud migration support', timeline: 'Next quarter',
    owner: 'Aria', engagement: 78, companyFit: 80, intent: 76, score: 78, region: 'West',
  },
  {
    id: 'lead-amit', name: 'Amit Patil', company: 'CloudEdge', industry: 'Cloud',
    location: 'Bengaluru', source: 'Referral', status: 'Researching',
    email: 'amit.patil@cloudedge.example', phone: '+91 98220 45454',
    companySize: '51-200', website: 'cloudedge.example', revenue: '$2M-$5M',
    budget: '$10k-$25k', need: 'Infrastructure optimization', timeline: 'Within 6 months',
    owner: 'Liam', engagement: 61, companyFit: 65, intent: 57, score: 61, region: 'South',
  },
  {
    id: 'lead-neha', name: 'Neha Joshi', company: 'PixelWorks', industry: 'E-commerce',
    location: 'Delhi', source: 'Event', status: 'Needs Review',
    email: 'neha.joshi@pixelworks.example', phone: '+91 98110 22334',
    companySize: '11-50', website: 'pixelworks.example', revenue: '$1M-$2M',
    budget: '$5k-$10k', need: 'Improve customer retention', timeline: 'Undecided',
    owner: 'Noah', engagement: 35, companyFit: 42, intent: 37, score: 38, region: 'North',
  },
  {
    id: 'lead-karan', name: 'Karan Shah', company: 'Northstar Retail', industry: 'Retail',
    location: 'Ahmedabad', source: 'Webinar', status: 'Unqualified',
    email: 'karan.shah@northstar.example', phone: '+91 98980 11223',
    companySize: '11-50', website: 'northstar.example', revenue: '$1M-$2M',
    budget: 'Under $5k', need: 'No current project', timeline: 'No timeline',
    owner: 'Noah', engagement: 44, companyFit: 40, intent: 48, score: 44, region: 'West',
  },
];

const initialCampaigns: Campaign[] = [
  { id: 'campaign-1', name: 'Q4 SaaS Outreach', target: 120, reps: 'Ava, Liam', contacted: 86, qualified: 28, conversion: '32.6%', status: 'Active' },
  { id: 'campaign-2', name: 'Mumbai Enterprise Leads', target: 80, reps: 'Aria, Noah', contacted: 80, qualified: 31, conversion: '38.8%', status: 'Completed' },
  { id: 'campaign-3', name: 'Product Demo Campaign', target: 60, reps: 'Ava, Aria', contacted: 22, qualified: 9, conversion: '40.9%', status: 'Active' },
  { id: 'campaign-4', name: 'Startup Growth Campaign', target: 100, reps: 'Liam, Noah', contacted: 0, qualified: 0, conversion: '-', status: 'Draft' },
];

const representatives = ['Ava', 'Aria', 'Liam', 'Noah'];

type ActivityRecord = { id: string; lead: string; action: string; detail: string; kind: string };

const activitySeed: ActivityRecord[] = [
  { id: 'activity-1', lead: 'Rahul Sharma', action: 'Called 20 minutes ago', detail: 'Follow-up scheduled for today', kind: 'Call' },
  { id: 'activity-2', lead: 'Priya Mehta', action: 'Email sent 1 hour ago', detail: 'Product overview shared', kind: 'Email' },
  { id: 'activity-3', lead: 'Amit Patil', action: 'Meeting yesterday', detail: 'Discovery meeting completed', kind: 'Meeting' },
  { id: 'activity-4', lead: 'Neha Joshi', action: 'Lead updated 3 hours ago', detail: 'Added from the Mumbai technology event', kind: 'Update' },
  { id: 'activity-5', lead: 'Rahul Sharma', action: 'Assigned today', detail: 'Assigned to Ava', kind: 'Assignment' },
];

const statusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' => {
  if (status === 'Qualified' || status === 'Enriched' || status === 'Active') return 'success';
  if (status === 'Researching' || status === 'Needs Review' || status === 'Draft') return 'warning';
  if (status === 'Completed') return 'info';
  return 'neutral';
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const category = score >= 80 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold';
  const variant = category === 'Hot' ? 'error' : category === 'Warm' ? 'warning' : 'info';
  return <Badge variant={variant}>{category}</Badge>;
};

const Sales: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [leads, setLeads] = useState(initialLeads);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [assignments, setAssignments] = useState<Record<string, string>>({
    'lead-rahul': 'Ava',
    'lead-priya': 'Aria',
  });
  const [assignedLeads, setAssignedLeads] = useState(['lead-rahul', 'lead-priya']);
  const [researchedIds, setResearchedIds] = useState<string[]>([]);
  const [searchByPage, setSearchByPage] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [callLead, setCallLead] = useState<Lead | null>(null);
  const [callConnected, setCallConnected] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignTarget, setCampaignTarget] = useState('50');
  const [activities, setActivities] = useState<ActivityRecord[]>(activitySeed);

  const page = location.pathname.replace(/^\/sales\/?/, '').split('/')[0] || 'dashboard';
  const search = searchByPage[page] ?? '';
  const setSearch = (value: string) => setSearchByPage(current => ({ ...current, [page]: value }));
  const filteredLeads = useMemo(() => leads.filter(lead => {
    const query = search.toLowerCase();
    const matchesQuery = `${lead.name} ${lead.company} ${lead.industry} ${lead.location}`.toLowerCase().includes(query);
    return matchesQuery && (page !== 'research' || statusFilter === 'all' || lead.status === statusFilter);
  }), [leads, page, search, statusFilter]);
  const filteredCampaigns = useMemo(() => campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(search.toLowerCase())
  ), [campaigns, search]);

  const updateLead = (leadId: string, update: Partial<Lead>) =>
    setLeads(current => current.map(lead => lead.id === leadId ? { ...lead, ...update } : lead));

  const logActivity = (lead: Lead, kind: string, action: string, detail: string) =>
    setActivities(current => [{ id: `activity-${Date.now()}`, lead: lead.name, kind, action, detail }, ...current]);

  const openCall = (lead: Lead) => {
    setCallLead(lead);
    setCallConnected(false);
  };

  const endCall = () => {
    if (callLead) {
      logActivity(callLead, 'Call', 'Call ended just now', 'Call logged in the local demo activity feed');
      showToast(`Call with ${callLead.name} ended`, 'info');
    }
    setCallLead(null);
    setCallConnected(false);
  };

  const baseColumns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Lead / Contact',
      sortable: true,
      render: lead => (
        <div className="sales-cell-stack">
          <strong>{lead.name}</strong>
          <span>{lead.email}</span>
        </div>
      ),
    },
    { key: 'company', header: 'Company', sortable: true },
    { key: 'industry', header: 'Industry' },
    { key: 'location', header: 'Location' },
    { key: 'source', header: 'Source' },
    { key: 'status', header: 'Status', render: lead => <Badge variant={statusVariant(lead.status)} dot>{lead.status}</Badge> },
  ];

  const callButton = (lead: Lead) => (
    <Button variant="outline" size="sm" icon={<Phone size={13} />} onClick={() => openCall(lead)}>Call</Button>
  );

  const searchControls = (placeholder: string, filter = false) => ({
    search,
    onSearchChange: setSearch,
    searchPlaceholder: placeholder,
    toolbarActions: filter ? (
      <select
        className="sales-filter"
        value={statusFilter}
        aria-label="Filter leads by status"
        onChange={event => setStatusFilter(event.target.value)}
      >
        <option value="all">All statuses</option>
        {['New', 'Researching', 'Qualified', 'Unqualified', 'Needs Review'].map(status => <option key={status}>{status}</option>)}
      </select>
    ) : undefined,
  });

  const renderDashboard = () => (
    <>
      <PageHeader
        title="Sales / Lead Management"
        subtitle="Discover, qualify, and grow your sales pipeline with a clear view of every lead."
        actions={
          <>
            <Button variant="secondary" icon={<Phone size={15} />} onClick={() => openCall(leads[0])}>Call a Lead</Button>
            <Button icon={<Megaphone size={15} />} onClick={() => navigate('/sales/campaigns')}>Sales Campaigns</Button>
          </>
        }
      />
      <div className="sales-stat-grid">
        <StatCard label="Total Leads" value="248" sub="Across all sources" icon={<Users size={17} />} />
        <StatCard label="Qualified Leads" value="86" sub="34.7% of total leads" icon={<CheckCircle2 size={17} />} />
        <StatCard label="Leads in Progress" value="72" sub="Active sales conversations" icon={<Target size={17} />} />
        <StatCard label="Conversion Rate" value="34.7%" sub="4.2% this month" icon={<Building2 size={17} />} />
        <StatCard label="Assigned Leads" value="191" sub="Across 4 sales reps" icon={<Users size={17} />} />
        <StatCard label="Hot Leads" value="32" sub="Ready for follow-up" icon={<Flame size={17} />} />
      </div>
      <div className="sales-section-heading">
        <div><h2>Priority Leads</h2><p>Review high-value contacts and take the next action.</p></div>
        <Button variant="outline" size="sm" onClick={() => navigate('/sales/research')}>View all leads</Button>
      </div>
      <DataTable
        columns={[
          ...baseColumns.slice(0, 4),
          { key: 'score', header: 'Lead Score', align: 'center', render: lead => <strong className="sales-blue-score">{lead.score}</strong> },
          { key: 'category', header: 'Category', render: lead => <ScoreBadge score={lead.score} /> },
          { key: 'actions', header: 'Action', align: 'right', render: callButton },
        ]}
        data={leads}
      />
      <div className="sales-dashboard-panels">
        <section className="sales-panel">
          <div className="sales-section-heading sales-section-heading--compact"><div><h2>Active Campaigns</h2><p>Campaigns moving leads forward.</p></div><Button variant="ghost" size="sm" onClick={() => navigate('/sales/campaigns')}>See all</Button></div>
          {campaigns.filter(campaign => campaign.status === 'Active').slice(0, 2).map(campaign => (
            <div className="sales-campaign-preview" key={campaign.id}>
              <div className="sales-campaign-preview__title"><strong>{campaign.name}</strong><Badge variant="success" dot>Active</Badge></div>
              <ProgressBar value={campaign.contacted} total={campaign.target} />
              <span>{campaign.contacted} of {campaign.target} leads contacted</span>
            </div>
          ))}
        </section>
        <section className="sales-panel">
          <div className="sales-section-heading sales-section-heading--compact"><div><h2>Recent Activity</h2><p>Latest touchpoints in your pipeline.</p></div><Button variant="ghost" size="sm" onClick={() => navigate('/sales/activity')}>See all</Button></div>
          {activities.slice(0, 3).map(item => (
            <div className="sales-mini-activity" key={item.id}>
              <span>{item.kind === 'Email' ? <Mail size={14} /> : <Phone size={14} />}</span>
              <div><strong>{item.lead}</strong><span>{item.action}</span></div>
            </div>
          ))}
        </section>
      </div>
    </>
  );

  const renderResearch = () => (
    <>
      <PageHeader title="Lead Research" subtitle="Search and discover potential leads from your sample prospect pool." />
      <DataTable
        columns={[
          ...baseColumns,
          {
            key: 'research',
            header: 'Actions',
            align: 'right',
            render: lead => (
              <div className="sales-row-actions">
                <Button variant="secondary" size="sm" onClick={() => {
                  updateLead(lead.id, { status: 'Researching' });
                  setResearchedIds(current => current.includes(lead.id) ? current : [...current, lead.id]);
                  logActivity(lead, 'Update', 'Research started just now', `Researching ${lead.company}`);
                  showToast(`Research started for ${lead.company}`, 'success');
                }}>{researchedIds.includes(lead.id) ? 'Researched' : 'Research'}</Button>
                {callButton(lead)}
              </div>
            ),
          },
        ]}
        data={filteredLeads}
        {...searchControls('Search leads, companies, or industry…', true)}
      />
    </>
  );

  const renderEnrichment = () => (
    <>
      <PageHeader title="Lead Enrichment" subtitle="Complete company and contact profiles with local sample information." />
      <DataTable
        columns={[
          ...baseColumns.slice(0, 2),
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          { key: 'industry', header: 'Industry' },
          { key: 'companySize', header: 'Company Size' },
          { key: 'location', header: 'Location' },
          { key: 'website', header: 'Website' },
          { key: 'revenue', header: 'Revenue Range' },
          { key: 'source', header: 'Lead Source' },
          { key: 'enrichmentStatus', header: 'Enrichment Status', render: lead => <Badge variant={lead.status === 'Enriched' ? 'success' : 'warning'}>{lead.status === 'Enriched' ? 'Enriched' : 'Needs enrichment'}</Badge> },
          {
            key: 'actions', header: 'Action', align: 'right',
            render: lead => <Button size="sm" variant={lead.status === 'Enriched' ? 'secondary' : 'primary'} onClick={() => {
              updateLead(lead.id, { status: 'Enriched' });
              logActivity(lead, 'Update', 'Lead enriched just now', `${lead.company} profile updated with sample data`);
              showToast(`${lead.company} profile enriched with sample data`, 'success');
            }}>{lead.status === 'Enriched' ? 'Enriched' : 'Enrich Lead'}</Button>,
          },
        ]}
        data={filteredLeads}
        {...searchControls('Search enriched lead profiles…')}
      />
      <div className="sales-enrichment-note"><Building2 size={16} />Enrichment uses local demo data only. No external service is contacted.</div>
    </>
  );

  const renderQualification = () => (
    <>
      <PageHeader title="Lead Qualification" subtitle="Review budget, business need, and buying timeline to prioritize leads." />
      <DataTable
        columns={[
          { key: 'name', header: 'Lead Name', sortable: true, render: lead => <strong>{lead.name}</strong> },
          { key: 'company', header: 'Company' },
          { key: 'industry', header: 'Industry' },
          { key: 'budget', header: 'Budget' },
          { key: 'need', header: 'Need' },
          { key: 'timeline', header: 'Timeline' },
          { key: 'status', header: 'Qualification Status', render: lead => <Badge variant={statusVariant(lead.status)} dot>{lead.status}</Badge> },
          { key: 'owner', header: 'Assigned Owner', render: lead => <span className="sales-owner"><Avatar name={lead.owner} size="sm" />{lead.owner}</span> },
          {
            key: 'actions', header: 'Actions', align: 'right',
            render: lead => <div className="sales-row-actions">
              <Button size="sm" onClick={() => { updateLead(lead.id, { status: 'Qualified' }); logActivity(lead, 'Update', 'Lead qualified just now', 'Qualification details reviewed'); showToast(`${lead.name} qualified`, 'success'); }}>Qualify</Button>
              <Button variant="outline" size="sm" onClick={() => { updateLead(lead.id, { status: 'Needs Review' }); logActivity(lead, 'Update', 'Review requested just now', 'Lead flagged for review'); showToast(`${lead.name} flagged for review`, 'info'); }}>Review</Button>
            </div>,
          },
        ]}
        data={filteredLeads}
        {...searchControls('Search leads to qualify…')}
      />
    </>
  );

  const renderScoring = () => (
    <>
      <PageHeader title="Lead Scoring" subtitle="Prioritize prospects using engagement, company fit, and buying intent." />
      <DataTable
        columns={[
          { key: 'name', header: 'Lead', sortable: true, render: lead => <strong>{lead.name}</strong> },
          { key: 'company', header: 'Company' },
          { key: 'engagement', header: 'Engagement', render: lead => <span>{lead.engagement}<small>/100</small></span> },
          { key: 'companyFit', header: 'Company Fit', render: lead => <span>{lead.companyFit}<small>/100</small></span> },
          { key: 'intent', header: 'Intent', render: lead => <span>{lead.intent}<small>/100</small></span> },
          { key: 'score', header: 'Total Score', align: 'center', sortable: true, render: lead => <strong className="sales-score-total">{lead.score}</strong> },
          { key: 'category', header: 'Score Category', render: lead => <ScoreBadge score={lead.score} /> },
        ]}
        data={filteredLeads}
        {...searchControls('Search scored leads…')}
      />
    </>
  );

  const renderAssignment = () => (
    <>
      <PageHeader title="Lead Assignment" subtitle="Distribute leads to the right sales representatives across your regions." />
      <DataTable
        columns={[
          { key: 'name', header: 'Lead', render: lead => <strong>{lead.name}</strong> },
          { key: 'company', header: 'Company' },
          { key: 'score', header: 'Lead Score', align: 'center', render: lead => <span className="sales-assignment-score">{lead.score} <ScoreBadge score={lead.score} /></span> },
          { key: 'region', header: 'Region' },
          { key: 'rep', header: 'Assigned Sales Rep', render: lead => (
            <select className="sales-filter" aria-label={`Assign ${lead.name}`} value={assignments[lead.id] || ''} onChange={event => setAssignments(current => ({ ...current, [lead.id]: event.target.value }))}>
              <option value="">Select rep</option>
              {representatives.map(rep => <option key={rep}>{rep}</option>)}
            </select>
          ) },
          { key: 'assignmentStatus', header: 'Assignment Status', render: lead => <Badge variant={assignedLeads.includes(lead.id) ? 'success' : 'warning'}>{assignedLeads.includes(lead.id) ? 'Assigned' : 'Unassigned'}</Badge> },
          { key: 'action', header: 'Action', align: 'right', render: lead => <Button size="sm" disabled={!assignments[lead.id]} onClick={() => {
            setAssignedLeads(current => current.includes(lead.id) ? current : [...current, lead.id]);
            updateLead(lead.id, { owner: assignments[lead.id] });
            logActivity(lead, 'Assignment', `Assigned just now`, `Assigned to ${assignments[lead.id]}`);
            showToast(`${lead.name} assigned to ${assignments[lead.id]}`, 'success');
          }}>Assign</Button> },
        ]}
        data={filteredLeads}
        {...searchControls('Search leads to assign…')}
      />
    </>
  );

  const renderActivity = () => (
    <>
      <PageHeader title="Activity" subtitle="Calls, emails, meetings, follow-ups, and lead updates across your sales team." />
      <div className="sales-activity-list">
        {activities.map(item => (
          <article className="sales-activity-card" key={item.id}>
            <div className="sales-activity-card__icon">
              {item.kind === 'Email' ? <Mail size={16} /> : item.kind === 'Meeting' ? <Users size={16} /> : item.kind === 'Assignment' ? <Target size={16} /> : <Phone size={16} />}
            </div>
            <div className="sales-activity-card__content">
              <div className="sales-activity-card__heading"><strong>{item.lead}</strong><Badge variant="info">{item.kind}</Badge></div>
              <p>{item.action}</p><span>{item.detail}</span>
            </div>
            <Button variant="outline" size="sm" icon={<Phone size={13} />} onClick={() => {
              const lead = leads.find(candidate => candidate.name === item.lead);
              if (lead) openCall(lead);
            }}>Call</Button>
          </article>
        ))}
      </div>
    </>
  );

  const renderCampaigns = () => (
    <>
      <PageHeader title="Sales Campaigns" subtitle="Plan outreach, track lead engagement, and measure campaign conversion." actions={<Button icon={<Plus size={16} />} onClick={() => setCampaignModalOpen(true)}>Create Campaign</Button>} />
      <div className="sales-campaign-summary">
        <StatCard label="Total Campaigns" value={campaigns.length} icon={<Megaphone size={17} />} />
        <StatCard label="Active" value={campaigns.filter(campaign => campaign.status === 'Active').length} icon={<Target size={17} />} />
        <StatCard label="Leads Contacted" value={campaigns.reduce((total, campaign) => total + campaign.contacted, 0)} icon={<Phone size={17} />} />
      </div>
      <DataTable
        columns={[
          { key: 'name', header: 'Campaign Name', sortable: true, render: campaign => <strong>{campaign.name}</strong> },
          { key: 'target', header: 'Target Leads', align: 'center' },
          { key: 'reps', header: 'Assigned Sales Reps' },
          { key: 'contacted', header: 'Leads Contacted', render: campaign => <div className="sales-campaign-progress"><ProgressBar value={campaign.contacted} total={campaign.target} /><span>{campaign.contacted} / {campaign.target}</span></div> },
          { key: 'qualified', header: 'Qualified', align: 'center' },
          { key: 'conversion', header: 'Conversion' },
          { key: 'status', header: 'Status', render: campaign => <Badge variant={statusVariant(campaign.status)} dot>{campaign.status}</Badge> },
          { key: 'action', header: 'Action', align: 'right', render: campaign => <Button size="sm" variant={campaign.status === 'Draft' ? 'primary' : 'outline'} onClick={() => {
            const nextStatus = campaign.status === 'Draft' ? 'Active' : campaign.status === 'Active' ? 'Completed' : 'Active';
            setCampaigns(current => current.map(item => item.id === campaign.id ? { ...item, status: nextStatus } : item));
            showToast(`${campaign.name} marked ${nextStatus.toLowerCase()}`, 'success');
          }}>{campaign.status === 'Draft' ? 'Launch' : campaign.status === 'Active' ? 'Complete' : 'Reactivate'}</Button> },
        ]}
        data={filteredCampaigns}
        {...searchControls('Search campaigns…')}
      />
    </>
  );

  const content = (() => {
    switch (page) {
      case 'research': return renderResearch();
      case 'enrichment': return renderEnrichment();
      case 'qualification': return renderQualification();
      case 'scoring': return renderScoring();
      case 'assignment': return renderAssignment();
      case 'activity': return renderActivity();
      case 'campaigns': return renderCampaigns();
      default: return renderDashboard();
    }
  })();

  return (
    <div className="page-content animate-fade-in sales-page">
      {content}
      <Modal
        open={callLead !== null}
        onClose={endCall}
        title={`Calling ${callLead?.name ?? ''}...`}
        size="sm"
        footer={<>
          <Button variant="danger" onClick={endCall}>End Call</Button>
          <Button onClick={() => setCallConnected(true)} disabled={callConnected}>{callConnected ? 'Call connected' : 'Call'}</Button>
        </>}
      >
        <div className="sales-call-modal">
          <span><Phone size={22} /></span>
          <p>{callConnected ? `Connected with ${callLead?.name}.` : `Starting a demo call to ${callLead?.phone ?? ''}.`}</p>
          <small>This is a local UI simulation. No call will be placed.</small>
        </div>
      </Modal>
      <Modal
        open={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        title="Create Sales Campaign"
        footer={<>
          <Button variant="secondary" onClick={() => setCampaignModalOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            const name = campaignName.trim();
            const target = Number(campaignTarget);
            if (!name || !Number.isFinite(target) || target <= 0) {
              showToast('Enter a campaign name and a target greater than zero', 'error');
              return;
            }
            setCampaigns(current => [{
              id: `campaign-${Date.now()}`, name, target, reps: 'Ava, Aria',
              contacted: 0, qualified: 0, conversion: '-', status: 'Draft',
            }, ...current]);
            setCampaignName('');
            setCampaignTarget('50');
            setCampaignModalOpen(false);
            showToast('Campaign created as a draft', 'success');
          }}>Create Campaign</Button>
        </>}
      >
        <div className="sales-campaign-form">
          <Input label="Campaign name" value={campaignName} onChange={event => setCampaignName(event.target.value)} placeholder="e.g. West Coast SaaS Outreach" />
          <Input label="Target leads" type="number" min="1" value={campaignTarget} onChange={event => setCampaignTarget(event.target.value)} />
          <small>Campaigns are saved in local page state for this demo only.</small>
        </div>
      </Modal>
    </div>
  );
};

export default Sales;
