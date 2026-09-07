import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Phone, Star, ChevronRight, TrendingUp,
  Plus, AlertCircle, PauseCircle
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { HiringStatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ActivityItemComponent } from '../components/product/ActivityItem';
import { DialerModal } from '../components/product/DialerModal';
import { EmptyState } from '../components/ui/EmptyState';
import { useHirings, useActivity } from '../store/appStore';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const hirings = useHirings();
  const activity = useActivity();
  const [dialerOpen, setDialerOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Live stats from store
  const activeHirings = hirings.filter(h => h.status === 'calling' || h.status === 'paused');
  const totalContacted = hirings.reduce((s, h) => s + h.contacted, 0);
  const totalCandidates = hirings.reduce((s, h) => s + h.candidateCount, 0);
  const totalShortlisted = hirings.reduce((s, h) => s + h.shortlisted, 0);
  const totalInterested = hirings.reduce((s, h) => s + h.interested, 0);

  // Hirings that need attention: paused, or draft with 0 candidates
  const needsAttention = hirings.filter(
    h => h.status === 'paused' ||
    (h.status === 'draft' && h.candidateCount === 0)
  );

  return (
    <div className="page-content animate-fade-in">

      {/* ——— GREETING + PRIMARY ACTIONS ——— */}
      <div className="home-hero">
        <div className="home-hero__text">
          <h1 className="home-hero__greeting">{greeting} 👋</h1>
          <p className="home-hero__sub">What would you like to do?</p>
        </div>

        <div className="home-actions">
          <button
            className="home-action home-action--primary"
            onClick={() => navigate('/hiring/create')}
          >
            <div className="home-action__icon">
              <Plus size={22} strokeWidth={2} />
            </div>
            <div className="home-action__text">
              <span className="home-action__label">Create Hiring</span>
              <span className="home-action__sub">Bulk AI screening</span>
            </div>
          </button>

          <button
            className="home-action home-action--secondary"
            onClick={() => setDialerOpen(true)}
          >
            <div className="home-action__icon home-action__icon--secondary">
              <Phone size={22} strokeWidth={2} />
            </div>
            <div className="home-action__text">
              <span className="home-action__label">Dial a Number</span>
              <span className="home-action__sub">Quick individual call</span>
            </div>
          </button>
        </div>
      </div>

      {/* ——— NEEDS YOUR ATTENTION ——— */}
      {needsAttention.length > 0 && (
        <div className="home-attention animate-fade-in">
          <div className="home-attention__header">
            <AlertCircle size={15} />
            Needs your attention
          </div>
          <div className="home-attention__items">
            {needsAttention.map(h => (
              <button
                key={h.id}
                className="home-attention__item"
                onClick={() => navigate(h.status === 'draft' ? '/hiring/create' : `/hiring/${h.id}`)}
              >
                <div className="home-attention__item-left">
                  {h.status === 'paused' ? (
                    <PauseCircle size={15} color="var(--status-warning-text)" />
                  ) : (
                    <Briefcase size={15} color="var(--text-tertiary)" />
                  )}
                  <span className="home-attention__item-title">{h.title}</span>
                  <span className="home-attention__item-loc">{h.location}</span>
                </div>
                <div className="home-attention__item-right">
                  <span className="home-attention__item-badge">
                    {h.status === 'paused' ? 'Paused — resume calling' : 'Draft — not launched'}
                  </span>
                  <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ——— STATS ——— */}
      <div className="home-stats">
        <StatCard label="Active Hirings" value={activeHirings.length} icon={<Briefcase size={18} />} />
        <StatCard
          label="Candidates Contacted"
          value={totalContacted}
          sub={`of ${totalCandidates} total`}
          icon={<Phone size={18} />}
        />
        <StatCard label="Interested" value={totalInterested} icon={<TrendingUp size={18} />} />
        <StatCard label="Shortlisted" value={totalShortlisted} icon={<Star size={18} />} />
      </div>

      {/* ——— MAIN BODY ——— */}
      <div className="home-body">

        {/* Active hirings */}
        <div className="home-section">
          <div className="home-section__header">
            <h2 className="home-section__title">Active Hirings</h2>
            <button className="home-section__link" onClick={() => navigate('/hiring')}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          {activeHirings.length === 0 ? (
            <div className="home-section__empty">
              <EmptyState
                icon={<Briefcase size={22} />}
                title="No active hirings"
                description="Create a hiring to start AI screening."
                action={{ label: 'Create Hiring', onClick: () => navigate('/hiring/create') }}
              />
            </div>
          ) : (
            <div className="home-hirings">
              {activeHirings.map(hiring => (
                <div
                  key={hiring.id}
                  className="home-hiring-row"
                  onClick={() => navigate(`/hiring/${hiring.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/hiring/${hiring.id}`)}
                >
                  <div className="home-hiring-row__left">
                    <div className="home-hiring-row__header">
                      <span className="home-hiring-row__title">{hiring.title}</span>
                      <HiringStatusBadge status={hiring.status} />
                    </div>
                    <span className="home-hiring-row__location">{hiring.location}</span>
                    <div className="home-hiring-row__progress">
                      <ProgressBar value={hiring.contacted} total={hiring.candidateCount || 1} />
                      <span className="home-hiring-row__progress-text">
                        {hiring.contacted} / {hiring.candidateCount} contacted
                      </span>
                    </div>
                  </div>
                  <div className="home-hiring-row__stats">
                    <div className="home-hiring-row__stat">
                      <span className="home-hiring-row__stat-val">{hiring.connected}</span>
                      <span className="home-hiring-row__stat-label">Connected</span>
                    </div>
                    <div className="home-hiring-row__stat">
                      <span className="home-hiring-row__stat-val">{hiring.interested}</span>
                      <span className="home-hiring-row__stat-label">Interested</span>
                    </div>
                    <div className="home-hiring-row__stat">
                      <span className="home-hiring-row__stat-val home-hiring-row__stat-val--accent">
                        {hiring.shortlisted}
                      </span>
                      <span className="home-hiring-row__stat-label">Shortlisted</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="home-section">
          <div className="home-section__header">
            <h2 className="home-section__title">Recent Activity</h2>
            <button className="home-section__link" onClick={() => navigate('/activity')}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          {activity.length === 0 ? (
            <div style={{ padding: '28px 24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              No activity yet. Start a hiring to see results here.
            </div>
          ) : (
            <div className="home-activity-card">
              {activity.slice(0, 8).map(item => (
                <ActivityItemComponent key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialer modal */}
      <DialerModal open={dialerOpen} onClose={() => setDialerOpen(false)} />
    </div>
  );
};

export default Home;

// Styles
const style = document.createElement('style');
style.textContent = `
/* Hero section */
.home-hero {
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.home-hero__text { display: flex; flex-direction: column; gap: 4px; }

.home-hero__greeting {
  font-size: var(--font-size-5xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.home-hero__sub {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

/* Action buttons */
.home-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  align-items: center;
}

.home-action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  text-align: left;
  min-width: 190px;
}

.home-action--primary {
  background: var(--brand-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.home-action--primary:hover {
  background: var(--brand-primary-hover);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transform: translateY(-1px);
}

.home-action--secondary {
  background: var(--bg-white);
  color: var(--text-primary);
  border: 1.5px solid var(--border-default);
  box-shadow: var(--shadow-xs);
}

.home-action--secondary:hover {
  border-color: var(--brand-primary);
  background: var(--brand-primary-light);
  transform: translateY(-1px);
}

.home-action__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.home-action__icon--secondary {
  background: var(--brand-primary-light);
  color: var(--brand-primary);
}

.home-action--primary .home-action__icon {
  background: rgba(255,255,255,0.2);
}

.home-action__text { display: flex; flex-direction: column; gap: 2px; }

.home-action__label {
  font-size: var(--font-size-base);
  font-weight: 600;
  line-height: 1.2;
}

.home-action__sub {
  font-size: var(--font-size-xs);
  opacity: 0.75;
  line-height: 1.2;
}

.home-action--secondary .home-action__sub {
  color: var(--text-secondary);
  opacity: 1;
}

/* Attention section */
.home-attention {
  margin-bottom: 24px;
  background: var(--status-warning-bg);
  border: 1px solid var(--status-warning-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.home-attention__header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--status-warning-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--status-warning-border);
}

.home-attention__items { display: flex; flex-direction: column; }

.home-attention__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 16px;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 1px solid var(--status-warning-border);
  transition: background var(--transition-fast);
  text-align: left;
  width: 100%;
}

.home-attention__item:last-child { border-bottom: none; }

.home-attention__item:hover { background: rgba(251,191,36,0.08); }

.home-attention__item-left {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
}

.home-attention__item-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.home-attention__item-loc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.home-attention__item-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.home-attention__item-badge {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--status-warning-text);
}

/* Stats */
.home-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

/* Body */
.home-body {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.home-section {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.home-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--border-default);
}

.home-section__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.home-section__link {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-sm);
  color: var(--brand-primary);
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.home-section__link:hover { opacity: 0.7; }

.home-section__empty { padding: 16px; }

/* Hirings rows */
.home-hirings { display: flex; flex-direction: column; }

.home-hiring-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-default);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.home-hiring-row:last-child { border-bottom: none; }
.home-hiring-row:hover { background: var(--bg-hover); }

.home-hiring-row__left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home-hiring-row__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.home-hiring-row__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.home-hiring-row__location {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.home-hiring-row__progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 280px;
}

.home-hiring-row__progress-text {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.home-hiring-row__stats {
  display: flex;
  gap: 20px;
  flex-shrink: 0;
}

.home-hiring-row__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.home-hiring-row__stat-val {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.home-hiring-row__stat-val--accent { color: var(--brand-primary); }
.home-hiring-row__stat-label { font-size: 11px; color: var(--text-tertiary); }

/* Activity */
.home-activity-card { padding: 4px 24px 8px; }

/* Responsive */
@media (max-width: 1100px) {
  .home-hero { flex-direction: column; gap: 20px; }
  .home-actions { width: 100%; }
  .home-action { flex: 1; min-width: 0; }
  .home-stats { grid-template-columns: repeat(2, 1fr); }
  .home-body { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .home-hero__greeting { font-size: var(--font-size-4xl); }
  .home-actions { flex-direction: column; }
  .home-action { width: 100%; min-width: 0; }
  .home-stats { grid-template-columns: repeat(2, 1fr); }
  .home-hiring-row__stats { display: none; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('home-page-styles')) {
  style.id = 'home-page-styles';
  document.head.appendChild(style);
}
