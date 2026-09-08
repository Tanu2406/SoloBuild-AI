import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Briefcase, Bot, Activity, ArrowRight } from 'lucide-react';
import { useHirings, useCandidates, useRecruiters, useActivity } from '../../store/appStore';
import type { Hiring, Candidate, AIRecruiter, ActivityItem } from '../../types';

type ResultKind = 'candidate' | 'hiring' | 'recruiter' | 'activity';

interface SearchResult {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
}

const KIND_CONFIG: Record<ResultKind, { label: string; icon: React.ReactNode; color: string }> = {
  candidate: {
    label: 'Candidate',
    icon: <Users size={13} />,
    color: 'var(--brand-primary)',
  },
  hiring: {
    label: 'Hiring',
    icon: <Briefcase size={13} />,
    color: '#7c3aed',
  },
  recruiter: {
    label: 'AI Recruiter',
    icon: <Bot size={13} />,
    color: '#0891b2',
  },
  activity: {
    label: 'Activity',
    icon: <Activity size={13} />,
    color: '#059669',
  },
};

function scoreMatch(text: string, query: string): number {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 3;
  if (t.startsWith(q)) return 2;
  if (t.includes(q)) return 1;
  return 0;
}

function searchCandidates(candidates: Candidate[], query: string): SearchResult[] {
  return candidates
    .filter(c => {
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.position || '').toLowerCase().includes(q) ||
        (c.hiringTitle || '').toLowerCase().includes(q)
      );
    })
    .map(c => ({
      id: c.id,
      kind: 'candidate' as ResultKind,
      title: c.name,
      subtitle: c.hiringTitle || c.position || 'Candidate',
      meta: c.status.replace(/_/g, ' '),
      href: `/candidates/${c.id}`,
    }))
    .sort((a, b) => scoreMatch(b.title, query) - scoreMatch(a.title, query))
    .slice(0, 4);
}

function searchHirings(hirings: Hiring[], query: string): SearchResult[] {
  return hirings
    .filter(h => {
      const q = query.toLowerCase();
      return (
        h.title.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.status.toLowerCase().includes(q)
      );
    })
    .map(h => ({
      id: h.id,
      kind: 'hiring' as ResultKind,
      title: h.title,
      subtitle: `${h.location} · ${h.status}`,
      meta: `${h.candidateCount} candidates`,
      href: `/hiring/${h.id}`,
    }))
    .slice(0, 3);
}

function searchRecruiters(recruiters: AIRecruiter[], query: string): SearchResult[] {
  return recruiters
    .filter(r => {
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.conversationStyle.toLowerCase().includes(q) ||
        r.languages.some(l => l.toLowerCase().includes(q)) ||
        r.voice.toLowerCase().includes(q)
      );
    })
    .map(r => ({
      id: r.id,
      kind: 'recruiter' as ResultKind,
      title: r.name,
      subtitle: `${r.conversationStyle} · ${r.languages.join(', ')}`,
      meta: r.voice,
      href: '/recruiters',
    }))
    .slice(0, 2);
}

function searchActivity(activity: ActivityItem[], query: string): SearchResult[] {
  return activity
    .filter(a => {
      const q = query.toLowerCase();
      return (
        (a.candidateName || '').toLowerCase().includes(q) ||
        (a.hiringTitle || '').toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    })
    .map(a => ({
      id: a.id,
      kind: 'activity' as ResultKind,
      title: a.candidateName || a.hiringTitle || 'Event',
      subtitle: a.description,
      meta: a.timeAgo,
      href: '/activity',
    }))
    .slice(0, 3);
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const hirings = useHirings();
  const candidates = useCandidates();
  const recruiters = useRecruiters();
  const activity = useActivity();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = query.trim().length < 2
    ? []
    : [
        ...searchCandidates(candidates, query),
        ...searchHirings(hirings, query),
        ...searchRecruiters(recruiters, query),
        ...searchActivity(activity, query),
      ];

  // Group results by kind
  const grouped: Partial<Record<ResultKind, SearchResult[]>> = {};
  for (const r of results) {
    if (!grouped[r.kind]) grouped[r.kind] = [];
    grouped[r.kind]!.push(r);
  }

  const kindOrder: ResultKind[] = ['candidate', 'hiring', 'recruiter', 'activity'];
  const orderedResults: SearchResult[] = kindOrder.flatMap(k => grouped[k] || []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // Keep active index in bounds
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.href);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, orderedResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && orderedResults[activeIndex]) {
      handleSelect(orderedResults[activeIndex]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const showEmpty = query.trim().length >= 2 && orderedResults.length === 0;
  const showHint = query.trim().length < 2;

  return (
    <div className="gs-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Global search">
      <div
        className="gs-panel"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="gs-input-row">
          <Search size={16} className="gs-input-icon" />
          <input
            ref={inputRef}
            className="gs-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search candidates, hirings, recruiters, activity…"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button className="gs-clear-btn" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
          <kbd className="gs-kbd">ESC</kbd>
        </div>

        {/* Results */}
        <div className="gs-body" ref={listRef}>
          {showHint && (
            <div className="gs-hint">
              <p className="gs-hint__text">Type to search across candidates, hirings, AI recruiters, and activity.</p>
              <div className="gs-hint__tips">
                <span>Try: <em>"Rahul Sharma"</em></span>
                <span>Try: <em>"Senior Python Developer"</em></span>
                <span>Try: <em>"Sales Executive"</em></span>
              </div>
            </div>
          )}

          {showEmpty && (
            <div className="gs-empty">
              <Search size={20} style={{ color: 'var(--text-muted)' }} />
              <span>No results for <strong>"{query}"</strong></span>
            </div>
          )}

          {orderedResults.length > 0 && (
            <div className="gs-results">
              {kindOrder.map(kind => {
                const group = grouped[kind];
                if (!group || group.length === 0) return null;
                const cfg = KIND_CONFIG[kind];
                return (
                  <div key={kind} className="gs-group">
                    <div className="gs-group__label">
                      <span className="gs-group__icon" style={{ color: cfg.color }}>{cfg.icon}</span>
                      {cfg.label}
                      <span className="gs-group__count">{group.length}</span>
                    </div>
                    {group.map(result => {
                      const flatIdx = orderedResults.indexOf(result);
                      const isActive = flatIdx === activeIndex;
                      return (
                        <button
                          key={result.id}
                          data-idx={flatIdx}
                          className={`gs-result-item ${isActive ? 'gs-result-item--active' : ''}`}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          tabIndex={-1}
                        >
                          <div className="gs-result-item__body">
                            <span className="gs-result-item__title">{result.title}</span>
                            <span className="gs-result-item__sub">{result.subtitle}</span>
                          </div>
                          <div className="gs-result-item__right">
                            {result.meta && (
                              <span
                                className="gs-result-item__meta"
                                style={{
                                  background: `${cfg.color}14`,
                                  color: cfg.color,
                                }}
                              >
                                {result.meta}
                              </span>
                            )}
                            <ArrowRight size={12} className="gs-result-item__arrow" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="gs-footer">
          <span className="gs-footer__hint"><kbd>↑↓</kbd> navigate</span>
          <span className="gs-footer__hint"><kbd>↵</kbd> open</span>
          <span className="gs-footer__hint"><kbd>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

// Inject GlobalSearch styles
const style = document.createElement('style');
style.id = 'gs-styles';
style.textContent = `
.gs-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 600;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  animation: gsBackdropIn 140ms ease-out;
}

@keyframes gsBackdropIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.gs-panel {
  width: 100%;
  max-width: 600px;
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  box-shadow: 0 20px 60px -8px rgba(15,23,42,0.22), 0 8px 20px -4px rgba(15,23,42,0.1);
  border: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: gsPanelIn 160ms cubic-bezier(0.16, 1, 0.3, 1);
  max-height: calc(100vh - 120px);
}

@keyframes gsPanelIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.gs-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}

.gs-input-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.gs-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  color: var(--text-primary);
  background: transparent;
  font-weight: 500;
}

.gs-input::placeholder {
  color: var(--text-muted);
  font-weight: 400;
}

.gs-clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 3px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);
}

.gs-clear-btn:hover {
  color: var(--text-primary);
}

.gs-kbd {
  font-size: 10px;
  font-family: var(--font-family);
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xs);
  padding: 2px 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.gs-body {
  flex: 1;
  overflow-y: auto;
  min-height: 80px;
}

.gs-hint {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gs-hint__text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.gs-hint__tips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gs-hint__tips span {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background: var(--bg-subtle);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-default);
}

.gs-hint__tips em {
  font-style: normal;
  color: var(--brand-primary);
  font-weight: 600;
}

.gs-empty {
  padding: 36px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.gs-results {
  padding: 8px 0;
}

.gs-group {
  margin-bottom: 2px;
}

.gs-group__label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.gs-group__icon {
  display: flex;
  align-items: center;
}

.gs-group__count {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  padding: 1px 6px;
  font-weight: 600;
}

.gs-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
  border-radius: 0;
}

.gs-result-item:hover,
.gs-result-item--active {
  background: var(--bg-hover);
}

.gs-result-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gs-result-item__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gs-result-item__sub {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gs-result-item__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.gs-result-item__meta {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  text-transform: capitalize;
  white-space: nowrap;
}

.gs-result-item__arrow {
  color: var(--text-muted);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.gs-result-item:hover .gs-result-item__arrow,
.gs-result-item--active .gs-result-item__arrow {
  opacity: 1;
}

.gs-footer {
  padding: 8px 16px;
  border-top: 1px solid var(--border-default);
  display: flex;
  gap: 14px;
  flex-shrink: 0;
  background: var(--bg-subtle);
}

.gs-footer__hint {
  font-size: 10px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.gs-footer__hint kbd {
  font-family: var(--font-family);
  font-size: 10px;
  font-weight: 600;
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: 3px;
  padding: 1px 4px;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .gs-backdrop {
    padding-top: 20px;
    align-items: flex-start;
  }
  .gs-panel {
    max-width: calc(100% - 24px);
    max-height: calc(100vh - 40px);
    border-radius: var(--radius-lg);
  }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('gs-styles')) {
  document.head.appendChild(style);
}
