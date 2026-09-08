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
