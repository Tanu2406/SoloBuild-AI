// ============================================================
// SkillsBreakdown
// Grouped skill list with score bars, strength labels,
// and evidence source indicators (Resume vs Call).
// ============================================================

import React from 'react';
import type { SkillGroup, SkillAssessment } from '../../types';

interface SkillsBreakdownProps {
  skillGroups: SkillGroup[];
  compact?: boolean;
}

const strengthConfig = {
  strong:        { label: 'Strong',   color: 'var(--status-success-text)', bg: 'var(--status-success-bg)',  border: 'var(--status-success-border)' },
  moderate:      { label: 'Moderate', color: 'var(--brand-primary)',       bg: 'var(--brand-primary-light)', border: 'var(--brand-primary-border)' },
  weak:          { label: 'Weak',     color: 'var(--status-warning-text)', bg: 'var(--status-warning-bg)',  border: 'var(--status-warning-border)' },
  not_evaluated: { label: '—',        color: 'var(--text-muted)',          bg: 'var(--bg-subtle)',           border: 'var(--border-default)' },
};

const barColor = (score: number): string => {
  if (score >= 8) return 'var(--status-success-text)';
  if (score >= 6) return 'var(--brand-primary)';
  if (score >= 4) return 'var(--status-warning-text)';
  return 'var(--status-error-text)';
};

const sourceConfig = {
  resume: { label: 'Resume', color: 'var(--text-tertiary)',  bg: 'var(--bg-subtle)',           border: 'var(--border-default)' },
  call:   { label: 'Call',   color: 'var(--brand-primary)', bg: 'var(--brand-primary-light)', border: 'var(--brand-primary-border)' },
};

export const SkillsBreakdown: React.FC<SkillsBreakdownProps> = ({ skillGroups, compact = false }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '16px' : '24px' }}>

      {!compact && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          paddingBottom: '10px', borderBottom: '1px solid var(--border-default)',
          flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flex: 1 }}>
            Skills assessed from resume data and AI voice screening conversation.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {(['resume', 'call'] as const).map(src => {
              const cfg = sourceConfig[src];
              return (
                <div key={src} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    {src === 'resume' ? '= inferred from CV' : '= demonstrated in call'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {skillGroups.map(group => (
        <SkillGroupSection key={group.category} group={group} compact={compact} />
      ))}
    </div>
  );
};

const SkillGroupSection: React.FC<{ group: SkillGroup; compact: boolean }> = ({ group, compact }) => {
  return (
    <div>
      <p style={{
        fontSize: 'var(--font-size-xs)', fontWeight: 700,
        color: 'var(--text-tertiary)', textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: compact ? '8px' : '12px',
      }}>
        {group.category}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '10px' }}>
        {group.skills.map(skill => (
          <SkillRow key={skill.name} skill={skill} compact={compact} />
        ))}
      </div>
    </div>
  );
};

const SkillRow: React.FC<{ skill: SkillAssessment; compact: boolean }> = ({ skill, compact }) => {
  const scfg = strengthConfig[skill.strength];
  const srcCfg = sourceConfig[skill.source];
  const pct = Math.round((skill.score / 10) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Skill name */}
        <span style={{
          flex: 1, fontSize: compact ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
          fontWeight: 500, color: 'var(--text-primary)',
        }}>
          {skill.name}
        </span>

        {/* Source badge */}
        <span style={{
          fontSize: '10px', fontWeight: 600,
          padding: '1px 6px', borderRadius: 'var(--radius-full)',
          background: srcCfg.bg, color: srcCfg.color, border: `1px solid ${srcCfg.border}`,
          flexShrink: 0,
        }}>
          {srcCfg.label}
        </span>

        {/* Score */}
        <span style={{
          fontSize: 'var(--font-size-xs)', fontWeight: 700,
          color: barColor(skill.score), minWidth: '30px', textAlign: 'right', flexShrink: 0,
        }}>
          {skill.score}/10
        </span>

        {/* Strength badge */}
        {!compact && (
          <span style={{
            fontSize: '10px', fontWeight: 600,
            padding: '1px 8px', borderRadius: 'var(--radius-full)',
            background: scfg.bg, color: scfg.color, border: `1px solid ${scfg.border}`,
            minWidth: '60px', textAlign: 'center', flexShrink: 0,
          }}>
            {scfg.label}
          </span>
        )}
      </div>

      {/* Bar */}
      <div style={{
        height: compact ? '3px' : '5px',
        background: 'var(--bg-muted)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor(skill.score),
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
};
