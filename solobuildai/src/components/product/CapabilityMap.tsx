// ============================================================
// CapabilityMap
// Horizontal competency bars with CORE / NICE TO HAVE labels,
// strength indicators, and score percentages.
// Props: competencies[], totalWeighted
// ============================================================

import React from 'react';
import type { Competency } from '../../types';

interface CapabilityMapProps {
  competencies: Competency[];
  totalWeighted: number;
  compact?: boolean; // compact=true → used inside Overview tab
}

const strengthConfig = {
  strong:        { label: 'Strong',        color: 'var(--status-success-text)',  bg: 'var(--status-success-bg)',  border: 'var(--status-success-border)',  barColor: 'var(--status-success-text)' },
  moderate:      { label: 'Moderate',      color: 'var(--brand-primary)',        bg: 'var(--brand-primary-light)', border: 'var(--brand-primary-border)',  barColor: 'var(--brand-primary)' },
  weak:          { label: 'Weak',          color: 'var(--status-warning-text)',  bg: 'var(--status-warning-bg)',  border: 'var(--status-warning-border)', barColor: 'var(--status-warning-text)' },
  not_evaluated: { label: 'Not Evaluated', color: 'var(--text-muted)',           bg: 'var(--bg-subtle)',           border: 'var(--border-default)',        barColor: 'var(--bg-muted)' },
};

export const CapabilityMap: React.FC<CapabilityMapProps> = ({ competencies, totalWeighted, compact = false }) => {
  const coreComps = competencies.filter(c => c.importance === 'core');
  const niceComps = competencies.filter(c => c.importance === 'nice_to_have');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '16px' }}>

      {/* Header summary */}
      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: '12px', borderBottom: '1px solid var(--border-default)',
        }}>
          <div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Evaluated against role requirements
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', background: 'var(--brand-primary-light)',
            borderRadius: 'var(--radius-full)', border: '1px solid var(--brand-primary-border)',
          }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--brand-primary)' }}>
              {totalWeighted} / {coreComps.length} core competencies
            </span>
          </div>
        </div>
      )}

      {/* Core competencies */}
      <div>
        {!compact && (
          <p style={{
            fontSize: 'var(--font-size-xs)', fontWeight: 700,
            color: 'var(--text-tertiary)', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: '10px',
          }}>
            Core Requirements
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '10px' }}>
          {coreComps.map(c => <CompetencyRow key={c.name} competency={c} compact={compact} />)}
        </div>
      </div>

      {/* Nice to have */}
      {niceComps.length > 0 && (
        <div style={{ marginTop: compact ? '4px' : '8px' }}>
          {!compact && (
            <p style={{
              fontSize: 'var(--font-size-xs)', fontWeight: 700,
              color: 'var(--text-tertiary)', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '10px',
            }}>
              Nice to Have
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '10px' }}>
            {niceComps.map(c => <CompetencyRow key={c.name} competency={c} compact={compact} isNice />)}
          </div>
        </div>
      )}

      {/* Legend */}
      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
          paddingTop: '12px', borderTop: '1px solid var(--border-subtle)',
        }}>
          {(['strong', 'moderate', 'weak'] as const).map(s => {
            const cfg = strengthConfig[s];
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: cfg.barColor, flexShrink: 0,
                }} />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CompetencyRow: React.FC<{
  competency: Competency;
  compact: boolean;
  isNice?: boolean;
}> = ({ competency: c, compact, isNice = false }) => {
  const cfg = strengthConfig[c.strength];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>

        {/* Name + importance label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          <span style={{
            fontSize: compact ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
            fontWeight: 500, color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {c.name}
          </span>
          {!compact && (
            <span style={{
              fontSize: '10px', fontWeight: 600,
              padding: '1px 6px', borderRadius: 'var(--radius-full)',
              background: isNice ? 'var(--bg-subtle)' : 'var(--brand-primary-light)',
              color: isNice ? 'var(--text-tertiary)' : 'var(--brand-primary)',
              border: `1px solid ${isNice ? 'var(--border-default)' : 'var(--brand-primary-border)'}`,
              flexShrink: 0,
            }}>
              {isNice ? 'NICE TO HAVE' : 'CORE'}
            </span>
          )}
        </div>

        {/* Right side: score + strength badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            fontSize: 'var(--font-size-xs)', fontWeight: 700,
            color: cfg.barColor, minWidth: '32px', textAlign: 'right',
          }}>
            {c.score}%
          </span>
          {!compact && (
            <span style={{
              fontSize: '10px', fontWeight: 600,
              padding: '1px 8px', borderRadius: 'var(--radius-full)',
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
              minWidth: '64px', textAlign: 'center',
            }}>
              {cfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: compact ? '4px' : '6px',
        background: 'var(--bg-muted)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${c.score}%`,
          background: cfg.barColor,
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.4s ease',
          opacity: c.strength === 'not_evaluated' ? 0.3 : 1,
        }} />
      </div>

      {/* Notes (full view only) */}
      {!compact && c.notes && (
        <p style={{
          fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)',
          marginTop: '1px', lineHeight: 1.5,
        }}>
          {c.notes}
        </p>
      )}
    </div>
  );
};
