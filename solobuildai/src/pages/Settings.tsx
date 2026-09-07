import React, { useState } from 'react';
import { PageHeader } from '../components/ui/Layout';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Building2, Phone, Link2, CreditCard, Bell, ChevronRight } from 'lucide-react';

type SettingsSection = 'workspace' | 'calling' | 'integrations' | 'billing' | 'notifications';

const sections = [
  { id: 'workspace', label: 'Workspace', icon: <Building2 size={16} /> },
  { id: 'calling', label: 'Calling', icon: <Phone size={16} /> },
  { id: 'integrations', label: 'Integrations', icon: <Link2 size={16} /> },
  { id: 'billing', label: 'Credits & Billing', icon: <CreditCard size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
];

const Settings: React.FC = () => {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('workspace');

  const handleSave = () => {
    showToast('Settings saved', 'success');
  };

  return (
    <div className="page-content animate-fade-in">
      <PageHeader title="Settings" />

      <div className="settings-layout">
        {/* Sidebar nav */}
        <div className="settings-nav">
          {sections.map(s => (
            <button
              key={s.id}
              className={`settings-nav__item ${activeSection === s.id ? 'settings-nav__item--active' : ''}`}
              onClick={() => setActiveSection(s.id as SettingsSection)}
            >
              <span className="settings-nav__icon">{s.icon}</span>
              <span className="settings-nav__label">{s.label}</span>
              <ChevronRight size={14} className="settings-nav__arrow" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content">

          {activeSection === 'workspace' && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section__title">Workspace</h2>
              <p className="settings-section__desc">Manage your workspace information.</p>

              <div className="settings-fields">
                <Input label="Workspace name" defaultValue="TalentCorp" />
                <Input label="Your name" defaultValue="Priya Sharma" />
                <Input label="Email" defaultValue="priya@talentcorp.in" type="email" />
                <Select
                  label="Timezone"
                  options={[
                    { value: 'IST', label: 'India Standard Time (IST, UTC+5:30)' },
                    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                  ]}
                  defaultValue="IST"
                />
              </div>

              <div className="settings-actions">
                <Button onClick={handleSave}>Save changes</Button>
              </div>
            </div>
          )}

          {activeSection === 'calling' && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section__title">Calling</h2>
              <p className="settings-section__desc">Configure when and how your AI Recruiter makes calls.</p>

              <div className="settings-fields">
                <div className="settings-field-group">
                  <label className="settings-field-label">Calling hours</label>
                  <div className="settings-time-row">
                    <Select
                      options={Array.from({ length: 24 }, (_, i) => ({
                        value: String(i),
                        label: `${i.toString().padStart(2, '0')}:00`,
                      }))}
                      defaultValue="10"
                    />
                    <span className="settings-time-sep">to</span>
                    <Select
                      options={Array.from({ length: 24 }, (_, i) => ({
                        value: String(i),
                        label: `${i.toString().padStart(2, '0')}:00`,
                      }))}
                      defaultValue="18"
                    />
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-label">Skip weekends</span>
                    <span className="settings-toggle-sub">Don't make calls on Saturdays and Sundays</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked className="toggle__input" />
                    <span className="toggle__track" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-label">Retry unanswered calls</span>
                    <span className="settings-toggle-sub">Automatically call back candidates who didn't answer</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" defaultChecked className="toggle__input" />
                    <span className="toggle__track" />
                  </label>
                </div>
              </div>

              <div className="settings-actions">
                <Button onClick={handleSave}>Save changes</Button>
              </div>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section__title">Integrations</h2>
              <p className="settings-section__desc">Connect SoloBuildAI with the tools your team uses.</p>

              <div className="integrations-list">
                {[
                  { name: 'Google Sheets', desc: 'Import candidate lists directly', connected: true, color: '#0f9d58' },
                  { name: 'Google Workspace', desc: 'Sync with Google Calendar and Gmail', connected: false, color: '#4285f4' },
                  { name: 'Slack', desc: 'Get hiring updates in Slack', connected: false, color: '#4a154b' },
                  { name: 'WhatsApp Business', desc: 'Send follow-up messages via WhatsApp', connected: false, color: '#25d366' },
                ].map(integration => (
                  <div key={integration.name} className="integration-item">
                    <div className="integration-item__icon" style={{ color: integration.color }}>
                      <Link2 size={18} />
                    </div>
                    <div className="integration-item__info">
                      <span className="integration-item__name">{integration.name}</span>
                      <span className="integration-item__desc">{integration.desc}</span>
                    </div>
                    <Button
                      variant={integration.connected ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => showToast(integration.connected ? `${integration.name} disconnected` : `${integration.name} connected`, 'success')}
                    >
                      {integration.connected ? 'Connected' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section__title">Credits & Billing</h2>
              <p className="settings-section__desc">Manage your calling credits and subscription.</p>

              <div className="billing-overview">
                <div className="billing-stat">
                  <span className="billing-stat__value">1,840</span>
                  <span className="billing-stat__label">Credits remaining</span>
                </div>
                <div className="billing-stat">
                  <span className="billing-stat__value">3,160</span>
                  <span className="billing-stat__label">Credits used this month</span>
                </div>
                <div className="billing-stat">
                  <span className="billing-stat__value">Sep 30</span>
                  <span className="billing-stat__label">Renewal date</span>
                </div>
              </div>

              <div className="billing-plan">
                <div className="billing-plan__header">
                  <span className="billing-plan__name">Pro Plan</span>
                  <span className="billing-plan__badge">Active</span>
                </div>
                <p className="billing-plan__desc">5,000 calling credits per month · Unlimited hirings · Priority support</p>
                <Button variant="outline" size="sm">Upgrade plan</Button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section__title">Notifications</h2>
              <p className="settings-section__desc">Choose when to get notified about hiring activity.</p>

              <div className="settings-fields">
                {[
                  { label: 'Candidate shortlisted', sub: 'When a candidate is marked as shortlisted', checked: true },
                  { label: 'Candidate interested', sub: 'When a candidate expresses interest', checked: true },
                  { label: 'Hiring complete', sub: 'When all candidates in a hiring have been contacted', checked: true },
                  { label: 'Daily summary', sub: 'Daily email with hiring progress', checked: false },
                  { label: 'Call failures', sub: 'When there are repeated call failures', checked: false },
                ].map(notif => (
                  <div key={notif.label} className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">{notif.label}</span>
                      <span className="settings-toggle-sub">{notif.sub}</span>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" defaultChecked={notif.checked} className="toggle__input" />
                      <span className="toggle__track" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="settings-actions">
                <Button onClick={handleSave}>Save preferences</Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;

const style = document.createElement('style');
style.textContent = `
.settings-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: start;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 8px;
}

.settings-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
}
.settings-nav__item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.settings-nav__item--active {
  background: var(--brand-primary-light);
  color: var(--brand-primary);
}
.settings-nav__item--active .settings-nav__icon { color: var(--brand-primary); }

.settings-nav__icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: color var(--transition-fast);
}
.settings-nav__label { flex: 1; }
.settings-nav__arrow {
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: opacity var(--transition-fast);
  opacity: 0;
}
.settings-nav__item:hover .settings-nav__arrow,
.settings-nav__item--active .settings-nav__arrow {
  opacity: 1;
}

.settings-content {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section__title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.2px;
}

.settings-section__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: -16px;
}

.settings-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-actions {
  padding-top: 4px;
  border-top: 1px solid var(--border-default);
}

.settings-field-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
  display: block;
  margin-bottom: 6px;
}

.settings-time-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-time-sep {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.settings-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-default);
}
.settings-toggle-row:last-child { border-bottom: none; }

.settings-toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-toggle-label {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
}

.settings-toggle-sub {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle__track {
  display: block;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--border-strong);
  transition: background var(--transition-fast);
  position: relative;
}

.toggle__track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-xs);
  transition: transform var(--transition-fast);
}

.toggle__input:checked + .toggle__track {
  background: var(--brand-primary);
}

.toggle__input:checked + .toggle__track::after {
  transform: translateX(18px);
}

/* Integrations */
.integrations-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.integration-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-default);
}
.integration-item:last-child { border-bottom: none; }

.integration-item__icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.integration-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.integration-item__name {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
}

.integration-item__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Billing */
.billing-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 24px;
  background: var(--bg-subtle);
  border-radius: var(--radius-lg);
}

.billing-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.billing-stat__value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
}

.billing-stat__label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.billing-plan {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}

.billing-plan__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.billing-plan__name {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.billing-plan__badge {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: var(--status-success-bg);
  color: var(--status-success-text);
  border: 1px solid var(--status-success-border);
}

.billing-plan__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.settings-field-group {
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .settings-layout { grid-template-columns: 1fr; }
  .billing-overview { grid-template-columns: 1fr; }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('settings-page-styles')) {
  style.id = 'settings-page-styles';
  document.head.appendChild(style);
}
