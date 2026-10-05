import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Settings, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { ChatMode } from './ChatMode';
import { useInterviews, useActivity } from '../../store/appStore';

// ─── Scope filter chips shown left of search ───
type ScopeChip = { id: string; label: string; path?: string };

const SCOPE_CHIPS: ScopeChip[] = [
  { id: 'all',        label: 'All' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'hirings',    label: 'Hirings' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'activity',   label: 'Activity' },
];
const SALES_SCOPE_CHIPS: ScopeChip[] = [
  { id: 'all', label: 'All', path: '/sales' },
  { id: 'leads', label: 'Leads', path: '/sales/research' },
  { id: 'campaigns', label: 'Campaigns', path: '/sales/campaigns' },
  { id: 'calls', label: 'Calls', path: '/sales/activity' },
  { id: 'activities', label: 'Activities', path: '/sales/activity' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSales = location.pathname.startsWith('/sales');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeScope, setActiveScope] = useState('all');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [newChatRequest, setNewChatRequest] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const scopeChips = isSales ? SALES_SCOPE_CHIPS : SCOPE_CHIPS;
  const selectedScope = isSales
    ? location.pathname === '/sales' || location.pathname === '/sales/'
      ? 'all'
      : location.pathname.includes('/campaigns')
        ? 'campaigns'
        : location.pathname.includes('/activity')
          ? activeScope === 'calls' ? 'calls' : 'activities'
          : 'leads'
    : activeScope;

  const interviews = useInterviews();
  const activity = useActivity();

  const upcomingCount = interviews.filter(i => i.status === 'upcoming').length;
  // Recent activity items as notifications (last 4)
  const recentActivity = activity.slice(0, 4);
  const unreadNotifCount = Math.min(upcomingCount + recentActivity.length, 9);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notifLabel = (type: string) => {
    if (type.includes('shortlisted')) return '🌟 Candidate shortlisted';
    if (type.includes('interested')) return '✅ Candidate interested';
    if (type.includes('no_answer')) return '📵 No answer';
    if (type.includes('interview')) return '📅 Interview update';
    if (type.includes('screening')) return '🤖 Screening update';
    if (type.includes('hiring')) return '🏢 Hiring event';
    return '📋 Activity update';
  };

  return (
    <div className={chatMode ? 'app-shell app-shell--chat' : 'app-shell'}>
      <Sidebar
        onNewChat={() => {
          setChatMode(true);
          setNewChatRequest(request => request + 1);
        }}
        onNavigate={() => setChatMode(false)}
      />
      <div className="app-main-wrapper">

        {/* ══ TOPBAR ══ */}
        <div className="app-topbar">

          {/* LEFT — scope filter chips */}
          <div className="app-topbar__left">
            <span className="app-topbar__scope-label">Search in:</span>
            {scopeChips.map(chip => (
              <button
                key={chip.id}
                className={`app-topbar__chip ${selectedScope === chip.id ? 'app-topbar__chip--active' : ''}`}
                onClick={() => {
                  setActiveScope(chip.id);
                  if (chip.path) navigate(chip.path);
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* CENTER — search trigger */}
          <div className="app-topbar__center">
            <button
              className="app-topbar__search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open global search"
            >
              <Search size={14} className="app-topbar__search-icon" />
              <span className="app-topbar__search-label">
                Search {activeScope === 'all' ? (isSales ? 'sales' : 'everything') : activeScope}…
              </span>
              <span className="app-topbar__search-kbd">
                <kbd>⌘</kbd><kbd>K</kbd>
              </span>
            </button>
          </div>

          {/* RIGHT — notification bell + profile */}
          <div className="app-topbar__right">

            {/* Notification bell */}
            <div className="app-topbar__notif-wrap" ref={notifRef}>
              <button
                className="app-topbar__icon-btn"
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                aria-label="Notifications"
              >
                <Bell size={17} />
                {unreadNotifCount > 0 && (
                  <span className="app-topbar__badge">{unreadNotifCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="app-topbar__dropdown app-topbar__notif-panel">
                  <div className="app-topbar__dropdown-header">
                    <span className="app-topbar__dropdown-title">Notifications</span>
                    {upcomingCount > 0 && (
                      <button
                        className="app-topbar__dropdown-action"
                        onClick={() => { navigate('/interviews'); setNotifOpen(false); }}
                      >
                        {upcomingCount} upcoming interview{upcomingCount !== 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                  {recentActivity.length === 0 ? (
                    <p className="app-topbar__dropdown-empty">No recent notifications</p>
                  ) : (
                    <div className="app-topbar__notif-list">
                      {recentActivity.map(item => (
                        <div key={item.id} className="app-topbar__notif-item">
                          <div className="app-topbar__notif-content">
                            <span className="app-topbar__notif-title">{notifLabel(item.type)}</span>
                            <span className="app-topbar__notif-desc">{item.description}</span>
                          </div>
                          <span className="app-topbar__notif-time">{item.timeAgo}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="app-topbar__dropdown-footer"
                    onClick={() => { navigate('/activity'); setNotifOpen(false); }}
                  >
                    View all activity →
                  </button>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="app-topbar__profile-wrap" ref={profileRef}>
              <button
                className="app-topbar__profile-btn"
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                aria-label="Profile menu"
              >
                <div className="app-topbar__avatar">TC</div>
                <div className="app-topbar__profile-info">
                  <span className="app-topbar__profile-name">TalentCorp</span>
                  <span className="app-topbar__profile-plan">Pro plan</span>
                </div>
                <ChevronDown size={13} style={{ color: 'var(--text-tertiary)', transition: 'transform 150ms', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {profileOpen && (
                <div className="app-topbar__dropdown app-topbar__profile-panel">
                  <div className="app-topbar__dropdown-header">
                    <div className="app-topbar__profile-meta">
                      <div className="app-topbar__avatar app-topbar__avatar--lg">TC</div>
                      <div>
                        <span className="app-topbar__dropdown-title">TalentCorp</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', display: 'block' }}>admin@talentcorp.com</span>
                      </div>
                    </div>
                  </div>
                  <div className="app-topbar__profile-menu">
                    <button className="app-topbar__menu-item" onClick={() => { navigate('/settings'); setProfileOpen(false); }}>
                      <Settings size={14} /> Account Settings
                    </button>
                    <button className="app-topbar__menu-item" onClick={() => { navigate('/settings'); setProfileOpen(false); }}>
                      <User size={14} /> Profile
                    </button>
                    <div className="app-topbar__menu-divider" />
                    <button className="app-topbar__menu-item app-topbar__menu-item--danger" onClick={() => setProfileOpen(false)}>
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <main className="app-main">
          {chatMode ? <ChatMode solutionContext={isSales ? 'sales' : 'talent'} newChatRequest={newChatRequest} /> : children}
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
};
