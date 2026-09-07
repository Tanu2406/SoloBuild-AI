import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className={clsx('input-field-wrap', { 'input-field-wrap--error': !!error })}>
        {leftIcon && <span className="input-icon input-icon--left">{leftIcon}</span>}
        <input
          id={inputId}
          className={clsx('input-field', {
            'input-field--has-left': !!leftIcon,
            'input-field--has-right': !!rightIcon,
            'input-field--error': !!error,
          }, className)}
          {...props}
        />
        {rightIcon && <span className="input-icon input-icon--right">{rightIcon}</span>}
      </div>
      {error && <p className="input-error">{error}</p>}
      {!error && hint && <p className="input-hint">{hint}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  hint,
  error,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx('input-field textarea-field', {
          'input-field--error': !!error,
        }, className)}
        {...props}
      />
      {error && <p className="input-error">{error}</p>}
      {!error && hint && <p className="input-hint">{hint}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  hint,
  error,
  options,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="select-wrap">
        <select
          id={inputId}
          className={clsx('input-field select-field', {
            'input-field--error': !!error,
          }, className)}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="select-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      {error && <p className="input-error">{error}</p>}
      {!error && hint && <p className="input-hint">{hint}</p>}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.input-field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}

.input-field:focus {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

.input-field--error {
  border-color: var(--status-error-text);
}
.input-field--error:focus {
  box-shadow: 0 0 0 3px rgba(185,28,28,0.1);
}

.input-field--has-left { padding-left: 36px; }
.input-field--has-right { padding-right: 36px; }

.input-icon {
  position: absolute;
  display: flex;
  align-items: center;
  color: var(--text-tertiary);
  pointer-events: none;
}
.input-icon--left { left: 11px; }
.input-icon--right { right: 11px; }

.textarea-field {
  height: auto;
  min-height: 100px;
  padding: 10px 12px;
  resize: vertical;
  line-height: 1.5;
}

.select-wrap {
  position: relative;
}
.select-field {
  appearance: none;
  cursor: pointer;
  padding-right: 36px;
}
.select-arrow {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
  display: flex;
  align-items: center;
}

.input-error {
  font-size: var(--font-size-xs);
  color: var(--status-error-text);
}
.input-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}
`;
if (typeof document !== 'undefined' && !document.getElementById('input-styles')) {
  style.id = 'input-styles';
  document.head.appendChild(style);
}
