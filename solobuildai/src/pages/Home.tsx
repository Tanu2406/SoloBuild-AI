import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Phone, Star, ChevronRight, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { HiringStatusBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ActivityItemComponent } from '../components/product/ActivityItem';
import { mockHirings, mockActivity } from '../mock/data';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const activeHirings = mockHirings.filter(h => h.status === 'calling' || h.status === 'paused');
  const totalContacted = mockHirings.reduce((s, h) => s + h.contacted, 0);
  const totalCandidates = mockHirings.reduce((s, h) => s + h.candidateCount, 0);
  const totalShortlisted = mockHirings.reduce((s, h) => s + h.shortlisted, 0);
  const totalInterested = mockHirings.reduce((s, h) => s + h.interested, 0);

  return (
    <div className="page-content animate-fade-in">
      {/* Greeting */}
      <div className="home-greeting">
        <div>
          <h1 className="home-greeting__title">{greeting} 👋</h1>
          <p className="home-greeting__sub">Here's what's happening with your hiring today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="home-stats">
        <StatCard
          label="Active Hirings"
          value={activeHirings.length}
          icon={<Briefcase size={18} />}
        />
        <StatCard
          label="Candidates Contacted"
          value={totalContacted}
          sub={`of ${totalCandidates} total`}
          icon={<Phone size={18} />}
        />
        <StatCard
          label="Interested"
          value={totalInterested}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Shortlisted"
          value={totalShortlisted}
          icon={<Star size={18} />}
        />
      </div>

      {/* Main content */}
      <div className="home-body">
        {/* Active hirings */}
        <div className="home-section">
          <div className="home-section__header">
            <h2 className="home-section__title">Active Hirings</h2>
            <button className="home-section__link" onClick={() => navigate('/hiring')}>
              View all <ChevronRight size={14} />
            </button>
          </div>

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
                    <ProgressBar value={hiring.contacted} total={hiring.candidateCount} />
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
                    <span className="home-hiring-row__stat-val home-hiring-row__stat-val--accent">{hiring.shortlisted}</span>
                    <span className="home-hiring-row__stat-label">Shortlisted</span>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-tertiary)" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="home-section">
          <div className="home-section__header">
            <h2 className="home-section__title">Recent Activity</h2>
            <button className="home-section__link" onClick={() => navigate('/activity')}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          <div className="home-activity-card">
            {mockActivity.slice(0, 6).map(item => (
              <ActivityItemComponent key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

const style = document.createElement('style');
style.textContent = `
.home-greeting {
  margin-bottom: 28px;
}

.home-greeting__title {
  font-size: var(--font-size-5xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.home-greeting__sub {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  margin-top: 4px;
}

.home-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 36px;
}

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
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-default);
}

.home-section__title {
  font-size: var(--font-size-lg);
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

.home-hirings {
  display: flex;
  flex-direction: column;
}

.home-hiring-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
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

.home-hiring-row__stat-val--accent {
  color: var(--brand-primary);
}

.home-hiring-row__stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.home-activity-card {
  padding: 4px 24px 8px;
}

@media (max-width: 1100px) {
  .home-stats { grid-template-columns: repeat(2, 1fr); }
  .home-body { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .home-stats { grid-template-columns: repeat(2, 1fr); }
  .home-hiring-row__stats { display: none; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('home-page-styles')) {
  style.id = 'home-page-styles';
  document.head.appendChild(style);
}
