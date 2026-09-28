import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Briefcase,
  Bot,
  Activity,
  Settings,
  Menu,
  X,
  CalendarDays,
  FileSearch,
  Plus,
  MessageSquare,
} from 'lucide-react';
import { useHirings, useCandidates, useInterviews } from '../../store/appStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/',                  label: 'Home',              icon: <Home         size={18} strokeWidth={1.75} /> },
  { path: '/hiring',            label: 'Hiring',            icon: <Briefcase    size={18} strokeWidth={1.75} /> },
  { path: '/screening-reports', label: 'Screening Reports', icon: <FileSearch   size={18} strokeWidth={1.75} /> },
  { path: '/recruiters',        label: 'AI Recruiters',     icon: <Bot          size={18} strokeWidth={1.75} /> },
  { path: '/interviews',        label: 'Interviews',        icon: <CalendarDays size={18} strokeWidth={1.75} /> },
  { path: '/activity',          label: 'Activity',          icon: <Activity     size={18} strokeWidth={1.75} /> },
];

const bottomItems: NavItem[] = [
  { path: '/settings', label: 'Settings', icon: <Settings size={18} strokeWidth={1.75} /> },
];

interface RecentChatSummary {
  id: string;
  title: string;
}

interface SidebarProps {
  onNewChat: () => void;
  onNavigate: () => void;
  recentChats?: RecentChatSummary[];
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewChat, onNavigate, recentChats = [] }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hirings = useHirings();
  const candidates = useCandidates();
  const interviews = useInterviews();

  const isCalling = hirings.some(h => h.status === 'calling');
  const upcomingInterviewCount = interviews.filter(i => i.status === 'upcoming').length;
  const screeningNeedsReview = candidates.filter(c =>
    c.callAssessmentComplete &&
    ['interested', 'connected', 'shortlisted'].includes(c.status) &&
    !['interview_scheduled', 'interview_completed', 'hired'].includes(c.status)
  ).length;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-mark">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="var(--brand-primary)" />
                <path d="M8 22L16 10L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 18H21" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="sidebar__logo-text">
              <span className="sidebar__logo-name">SoloBuild</span>
              <span className="sidebar__logo-ai">AI</span>
            </div>
          </div>
          <button
            className="sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Main navigation">
          <div className="sidebar__section">
            {navItems.map(item => {
              const showCallingBadge = item.path === '/hiring' && isCalling;
              const showInterviewCount = item.path === '/interviews' && upcomingInterviewCount > 0;
              const showScreeningReview = item.path === '/screening-reports' && screeningNeedsReview > 0;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                  }
                  onClick={() => {
                    onNavigate();
                    setMobileOpen(false);
                  }}
                >
                  <span className="sidebar__item-icon">{item.icon}</span>
                  <span className="sidebar__item-label">{item.label}</span>
                  {showCallingBadge && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--status-success-dot)',
                        animation: 'pulse 1.5s infinite',
                      }}
                      title="AI Screening active"
                    />
                  )}
                  {showInterviewCount && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--brand-primary-light)',
                        color: 'var(--brand-primary)',
                        fontWeight: 700,
                      }}
                    >
                      {upcomingInterviewCount}
                    </span>
                  )}
                  {showScreeningReview && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--status-warning-bg)',
                        color: 'var(--status-warning-text)',
                        fontWeight: 700,
                        border: '1px solid var(--status-warning-border)',
                      }}
                      title="Candidates need review"
                    >
                      {screeningNeedsReview}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
          <button
            type="button"
            className="sidebar__item"
            onClick={() => {
              onNewChat();
              setMobileOpen(false);
            }}
            style={{ width: '100%', border: 0, background: 'transparent', textAlign: 'left' }}
          >
            <span className="sidebar__item-icon" style={{ color: '#0066FF' }}>
              <Plus size={18} strokeWidth={1.75} />
            </span>
            <span className="sidebar__item-label">New Chat</span>
          </button>

          <div className="sidebar__section" aria-label="Recent chats">
            <p className="sidebar__section-label">Recent Chats</p>
            {recentChats.length === 0 ? (
              <p className="sidebar__empty-chats">No conversations yet</p>
            ) : (
              recentChats.map(chat => (
                <div className="sidebar__item" key={chat.id}>
                  <span className="sidebar__item-icon"><MessageSquare size={16} strokeWidth={1.75} /></span>
                  <span className="sidebar__item-label">{chat.title}</span>
                </div>
              ))
            )}
          </div>
        </nav>

        <div className="sidebar__bottom">
          {bottomItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
              }
              onClick={() => {
                onNavigate();
                setMobileOpen(false);
              }}
            >
              <span className="sidebar__item-icon">{item.icon}</span>
              <span className="sidebar__item-label">{item.label}</span>
            </NavLink>
          ))}

          <div className="sidebar__workspace">
            <div className="sidebar__workspace-avatar">TC</div>
            <div className="sidebar__workspace-info">
              <span className="sidebar__workspace-name">TalentCorp</span>
              <span className="sidebar__workspace-plan">Pro plan</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const style = document.createElement('style');
style.textContent = `
.sidebar {
  width: var(--sidebar-width);
  min-height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 16px;
  flex-shrink: 0;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar__logo-mark {
  display: flex;
  flex-shrink: 0;
}

.sidebar__logo-text {
  display: flex;
  align-items: baseline;
  gap: 1px;
}

.sidebar__logo-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.sidebar__logo-ai {
  font-size: 16px;
  font-weight: 700;
  color: var(--brand-primary);
  letter-spacing: -0.3px;
}

.sidebar-mobile-close {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: var(--radius-sm);
}

.sidebar__nav {
  flex: 1;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  color: var(--sidebar-item-text);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: background var(--transition-fast), color var(--transition-fast);
  cursor: pointer;
}

.sidebar__item:hover {
  background: var(--sidebar-item-hover-bg);
  color: var(--text-primary);
}

.sidebar__item--active {
  background: var(--sidebar-item-active-bg);
  color: var(--sidebar-item-active-text);
}

.sidebar__item--active .sidebar__item-icon {
  color: var(--brand-primary);
}

.sidebar__item-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--text-tertiary);
  transition: color var(--transition-fast);
}

.sidebar__item--active .sidebar__item-icon,
.sidebar__item:hover .sidebar__item-icon {
  color: inherit;
}

.sidebar__item-label {
  flex: 1;
}

.sidebar__bottom {
  padding: 10px;
  border-top: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.sidebar__workspace {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin-top: 4px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.sidebar__workspace:hover {
  background: var(--bg-hover);
}

.sidebar__workspace-avatar {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--brand-primary);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar__workspace-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.sidebar__workspace-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__workspace-plan {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Mobile */
.sidebar-mobile-toggle {
  display: none;
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 200;
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 8px;
  cursor: pointer;
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,0.4);
  z-index: 299;
}

@media (max-width: 768px) {
  .sidebar-mobile-toggle { display: flex; }
  
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 300;
    transform: translateX(-100%);
    transition: transform var(--transition-base);
    box-shadow: var(--shadow-lg);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-overlay { display: block; }
  .sidebar-mobile-close { display: flex; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('sidebar-styles')) {
  style.id = 'sidebar-styles';
  document.head.appendChild(style);
}
