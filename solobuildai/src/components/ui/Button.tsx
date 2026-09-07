import React from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx('btn', `btn--${variant}`, `btn--${size}`, {
        'btn--loading': loading,
        'btn--full': fullWidth,
        'btn--icon-only': !children && (icon || iconRight),
      }, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn__spinner" aria-hidden="true" />
      )}
      {!loading && icon && <span className="btn__icon btn__icon--left">{icon}</span>}
      {children && <span className="btn__label">{children}</span>}
      {!loading && iconRight && <span className="btn__icon btn__icon--right">{iconRight}</span>}
    </button>
  );
};

// Inject button styles
const style = document.createElement('style');
style.textContent = `
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  position: relative;
  text-decoration: none;
  line-height: 1;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--full { width: 100%; }

/* Sizes */
.btn--sm {
  font-size: var(--font-size-sm);
  padding: 6px 12px;
  height: 32px;
}
.btn--md {
  font-size: var(--font-size-base);
  padding: 8px 16px;
  height: 38px;
}
.btn--lg {
  font-size: var(--font-size-md);
  padding: 10px 20px;
  height: 44px;
}

.btn--icon-only.btn--sm { width: 32px; padding: 0; }
.btn--icon-only.btn--md { width: 38px; padding: 0; }
.btn--icon-only.btn--lg { width: 44px; padding: 0; }

/* Variants */
.btn--primary {
  background: var(--brand-primary);
  color: var(--text-inverse);
}
.btn--primary:hover:not(:disabled) {
  background: var(--brand-primary-hover);
}

.btn--secondary {
  background: var(--bg-subtle);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn--secondary:hover:not(:disabled) {
  background: var(--border-default);
}

.btn--outline {
  background: transparent;
  color: var(--brand-primary);
  border: 1px solid var(--brand-primary);
}
.btn--outline:hover:not(:disabled) {
  background: var(--brand-primary-light);
}

.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
}
.btn--ghost:hover:not(:disabled) {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.btn--danger {
  background: var(--status-error-bg);
  color: var(--status-error-text);
  border: 1px solid var(--status-error-border);
}
.btn--danger:hover:not(:disabled) {
  background: #fecaca;
}

/* Spinner */
.btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.btn__icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('btn-styles')) {
  style.id = 'btn-styles';
  document.head.appendChild(style);
}
