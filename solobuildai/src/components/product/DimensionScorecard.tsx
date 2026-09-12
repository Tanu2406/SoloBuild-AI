// ============================================================
// DimensionScorecard
// Displays AI call interview dimension scores with visual
// bars, numeric scores, and verified gap callouts.
// Used exclusively in the AI Call Assessment section.
// ============================================================

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CallDimension } from '../../types';

interface DimensionScorecardProps {
  dimensions: CallDimension[];
  compact?: boolean;
}

const scoreColor = (score: number): string => {
  if (score >= 8) return 'var(--status-success-text)';
  if (score >= 6) return 'var(--brand-primary)';
  if (score >= 4) return 'var(--status-warning-text)';
  return 'var(--status-error-text)';
};

const scoreBg = (score: number): string => {
  if (score >= 8) return 'var(--status-success-bg)';
  if (score >= 6) return 'var(--brand-primary-light)';
  if (score >= 4) return 'var(--status-warning-bg)';
  return 'var(--status-error-bg)';
};

const scoreBorder = (score: number): string => {
  if (score >= 8) return 'var(--status-success-border)';
  if (score >= 6) return 'var(--brand-primary-border)';
  if (score >= 4) return 'var(--status-warning-border)';
  return 'var(--status-error-border)';
};

const scoreLabel = (score: number): string => {
  if (score >= 8.5) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Moderate';
  if (score >= 3) return 'Needs Work';
  return 'Weak';
};

export const DimensionScorecard: React.FC<DimensionScorecardProps> = ({ dimensions, compact = false }) => {
  if (dimensions.length === 0) return null;

  const avg = Math.round((dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) * 10) / 10;
  const gaps = dimensions.filter(d => d.verifiedGap);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '10px' : '14px' }}>

      {/* Summary bar */}
      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: scoreBg(avg),
          border: `1px solid ${scoreBorder(avg)}`,
          borderRadius: 'var(--radius-md)',
        }}>
          <div>
            <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: scoreColor(avg), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Call Score
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Average across {dimensions.length} assessment dimensions
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: scoreColor(avg), lineHeight: 1 }}>
              {avg}
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: scoreColor(avg), fontWeight: 600 }}>
              / 10
            </p>
          </div>
        </div>
      )}

      {/* Dimensions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '12px' }}>
        {dimensions.map(d => (
          <DimensionRow key={d.name} dimension={d} compact={compact} />
        ))}
      </div>

      {/* Verified gaps section */}
      {!compact && gaps.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          marginTop: '4px', padding: '14px 16px',
          background: 'var(--status-warning-bg)',
          border: '1px solid var(--status-warning-border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} style={{ color: 'var(--status-warning-text)', flexShrink: 0 }} />
            <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--status-warning-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verified Gaps from Conversation
            </p>
          </div>
          {gaps.map(d => (
            <div key={d.name} style={{
              padding: '10px 12px',
              background: 'var(--bg-white)',
              border: '1px solid var(--status-warning-border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {d.name}
              </p>
              <p style={{
                fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)',
                lineHeight: 1.55, fontStyle: 'italic',
              }}>
                "{d.verifiedGap}"
              </p>
            </div>
          ))}
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Evidence above is derived from the AI voice screening conversation. These are verified observations, not inferences.
          </p>
        </div>
      )}
    </div>
  );
};

const DimensionRow: React.FC<{ dimension: CallDimension; compact: boolean }> = ({ dimension: d, compact }) => {
  const pct = Math.round((d.score / d.maxScore) * 100);
  const hasGap = !!d.verifiedGap;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Name + gap indicator */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
          <span style={{
            fontSize: compact ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
            fontWeight: 500, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {d.name}
          </span>
          {hasGap && !compact && (
            <AlertTriangle size={11} style={{ color: 'var(--status-warning-text)', flexShrink: 0 }} />
          )}
        </div>

        {/* Score chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          padding: '2px 8px',
          background: scoreBg(d.score),
          border: `1px solid ${scoreBorder(d.score)}`,
          borderRadius: 'var(--radius-full)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: scoreColor(d.score) }}>
            {d.score}
          </span>
          <span style={{ fontSize: '10px', color: scoreColor(d.score), opacity: 0.7 }}>
            /{d.maxScore}
          </span>
        </div>

        {/* Label (full view) */}
        {!compact && (
          <span style={{
            fontSize: '10px', fontWeight: 600, color: scoreColor(d.score),
            minWidth: '60px', textAlign: 'right',
          }}>
            {scoreLabel(d.score)}
          </span>
        )}
      </div>

      {/* Bar */}
      <div style={{
        height: compact ? '4px' : '6px',
        background: 'var(--bg-muted)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: scoreColor(d.score),
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Notes (full view only) */}
      {!compact && d.notes && (
        <p style={{
          fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)',
          lineHeight: 1.5, marginTop: '1px',
        }}>
          {d.notes}
        </p>
      )}
    </div>
  );
};
