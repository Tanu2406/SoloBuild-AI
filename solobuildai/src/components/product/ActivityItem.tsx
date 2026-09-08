import React from 'react';
import { Phone, PhoneOff, PhoneMissed, Star, Briefcase, Play, Pause, Sparkles, Calendar, CheckCircle2, UserCheck } from 'lucide-react';
import type { ActivityItem as ActivityItemType, ActivityType } from '../../types';

interface ActivityItemProps {
  item: ActivityItemType;
}

const iconMap: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string }> = {
  call_completed:       { icon: <Phone size={14} />,        color: 'var(--status-success-text)', bg: 'var(--status-success-bg)' },
  call_failed:          { icon: <PhoneOff size={14} />,     color: 'var(--status-error-text)',   bg: 'var(--status-error-bg)' },
  call_no_answer:       { icon: <PhoneMissed size={14} />,  color: 'var(--status-warning-text)', bg: 'var(--status-warning-bg)' },
  candidate_interested: { icon: <Star size={14} />,         color: 'var(--status-success-text)', bg: 'var(--status-success-bg)' },
  candidate_shortlisted:{ icon: <Star size={14} />,         color: '#15803d', bg: '#f0fdf4' },
  hiring_created:       { icon: <Briefcase size={14} />,    color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)' },
  hiring_launched:      { icon: <Play size={14} />,         color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)' },
  hiring_paused:        { icon: <Pause size={14} />,        color: 'var(--status-warning-text)', bg: 'var(--status-warning-bg)' },
  hiring_resumed:       { icon: <Play size={14} />,         color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)' },
  hiring_completed:     { icon: <Briefcase size={14} />,    color: 'var(--status-success-text)', bg: 'var(--status-success-bg)' },
  direct_call_completed:{ icon: <Phone size={14} />,        color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)' },
  direct_call_failed:   { icon: <PhoneOff size={14} />,     color: 'var(--status-error-text)',   bg: 'var(--status-error-bg)' },
  direct_call_no_answer:{ icon: <PhoneMissed size={14} />,  color: 'var(--status-warning-text)', bg: 'var(--status-warning-bg)' },
  screening_started:    { icon: <Sparkles size={14} />,     color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)' },
  screening_completed:  { icon: <Sparkles size={14} />,     color: '#15803d',                   bg: '#f0fdf4' },
  candidate_compatible: { icon: <CheckCircle2 size={14} />, color: 'var(--status-success-text)', bg: 'var(--status-success-bg)' },
  candidate_incompatible:{ icon: <PhoneOff size={14} />,    color: 'var(--status-error-text)',   bg: 'var(--status-error-bg)' },
  candidate_included:   { icon: <UserCheck size={14} />,    color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)' },
  interview_scheduled:  { icon: <Calendar size={14} />,     color: '#7c3aed',                   bg: '#f5f3ff' },
  interview_completed:  { icon: <CheckCircle2 size={14} />, color: 'var(--status-success-text)', bg: 'var(--status-success-bg)' },
  interview_cancelled:  { icon: <PhoneOff size={14} />,     color: 'var(--status-error-text)',   bg: 'var(--status-error-bg)' },
};

export const ActivityItemComponent: React.FC<ActivityItemProps> = ({ item }) => {
  const config = iconMap[item.type];

  return (
    <div className="activity-item">
      <div
        className="activity-item__icon"
        style={{ color: config.color, background: config.bg }}
      >
        {config.icon}
      </div>
      <div className="activity-item__content">
        <div className="activity-item__main">
          {item.candidateName && (
            <span className="activity-item__candidate">{item.candidateName}</span>
          )}
          <span className="activity-item__desc">{item.description}</span>
        </div>
        <div className="activity-item__meta">
          {item.hiringTitle && (
            <span className="activity-item__hiring">{item.hiringTitle}</span>
          )}
          <span className="activity-item__time">{item.timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-default);
}
.activity-item:last-child {
  border-bottom: none;
}

.activity-item__icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.activity-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.activity-item__main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.activity-item__candidate {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.activity-item__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.activity-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-item__hiring {
  font-size: var(--font-size-xs);
  color: var(--brand-primary);
  font-weight: 500;
}

.activity-item__time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}
`;
if (typeof document !== 'undefined' && !document.getElementById('activity-item-styles')) {
  style.id = 'activity-item-styles';
  document.head.appendChild(style);
}
