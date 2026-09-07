import React from 'react';
import { Check } from 'lucide-react';
import type { AIRecruiter } from '../../types';
import { Avatar } from '../ui/Avatar';

interface RecruiterCardProps {
  recruiter: AIRecruiter;
  selected?: boolean;
  onClick?: () => void;
}

export const RecruiterCard: React.FC<RecruiterCardProps> = ({ recruiter, selected, onClick }) => {
  return (
    <div
      className={`recruiter-card ${selected ? 'recruiter-card--selected' : ''}`}
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div className="recruiter-card__check">
        {selected && <Check size={14} strokeWidth={2.5} />}
      </div>
      <Avatar name={recruiter.name} size="lg" color={recruiter.avatarColor} />
      <div className="recruiter-card__info">
        <h4 className="recruiter-card__name">{recruiter.name}</h4>
        <p className="recruiter-card__desc">{recruiter.description}</p>
        <div className="recruiter-card__tags">
          {recruiter.languages.map(lang => (
            <span key={lang} className="recruiter-card__tag">{lang}</span>
          ))}
          <span className="recruiter-card__tag recruiter-card__tag--style">{recruiter.conversationStyle}</span>
        </div>
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.recruiter-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  background: var(--bg-white);
}

.recruiter-card:hover {
  border-color: var(--brand-primary);
  background: var(--brand-primary-light);
}

.recruiter-card--selected {
  border-color: var(--brand-primary);
  background: var(--brand-primary-light);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}

.recruiter-card__check {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid var(--border-default);
  background: var(--bg-white);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.recruiter-card--selected .recruiter-card__check {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: white;
}

.recruiter-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recruiter-card__name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.recruiter-card__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.recruiter-card__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.recruiter-card__tag {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  background: var(--bg-subtle);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}

.recruiter-card__tag--style {
  background: var(--brand-primary-light);
  color: var(--brand-primary);
  border-color: #bfdbfe;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('recruiter-card-styles')) {
  style.id = 'recruiter-card-styles';
  document.head.appendChild(style);
}
