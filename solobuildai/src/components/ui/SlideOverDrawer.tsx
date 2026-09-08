import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface SlideOverDrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  width,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="drawer-panel"
        style={width ? { maxWidth: width } : undefined}
        onClick={e => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-header__info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 className="drawer-header__title">{title}</h2>
              {badge}
            </div>
            {subtitle && <div className="drawer-header__meta">{subtitle}</div>}
          </div>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {children}
        </div>

        {footer && (
          <div className="drawer-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
