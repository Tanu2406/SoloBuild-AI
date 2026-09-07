import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={16} />,
    error: <AlertCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span className="toast__icon">{icons[toast.type]}</span>
            <span className="toast__message">{toast.message}</span>
            <button className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const style = document.createElement('style');
style.textContent = `
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  font-weight: 500;
  min-width: 280px;
  max-width: 380px;
  animation: toastIn 200ms ease forwards;
  border: 1px solid transparent;
}

.toast--success {
  background: var(--status-success-bg);
  color: var(--status-success-text);
  border-color: var(--status-success-border);
}
.toast--error {
  background: var(--status-error-bg);
  color: var(--status-error-text);
  border-color: var(--status-error-border);
}
.toast--info {
  background: var(--brand-primary-light);
  color: var(--brand-primary-text);
  border-color: var(--status-info-border);
}

.toast__icon {
  display: flex;
  flex-shrink: 0;
}

.toast__message {
  flex: 1;
  line-height: 1.4;
}

.toast__close {
  background: none;
  border: none;
  cursor: pointer;
  color: currentColor;
  opacity: 0.6;
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.toast__close:hover { opacity: 1; }
`;
if (typeof document !== 'undefined' && !document.getElementById('toast-styles')) {
  style.id = 'toast-styles';
  document.head.appendChild(style);
}
