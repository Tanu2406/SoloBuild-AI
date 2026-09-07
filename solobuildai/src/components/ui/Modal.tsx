import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`modal modal--${size}`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="modal__header">
            <h2 className="modal__title">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={16} />} aria-label="Close" />
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 180ms ease;
}

.modal {
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalIn 200ms ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal--sm { max-width: 400px; }
.modal--md { max-width: 540px; }
.modal--lg { max-width: 680px; }
.modal--xl { max-width: 800px; }

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}

.modal__title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('modal-styles')) {
  style.id = 'modal-styles';
  document.head.appendChild(style);
}
