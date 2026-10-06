import { ArrowLeft } from 'lucide-react';

export function ChatHeader({
  onExit,
}: {
  onExit: () => void;
}) {
  return (
    <header className="chatbot-header">
      <div className="chatbot-header__identity">
        <div className="chatbot-header__avatar" aria-hidden="true">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className="chatbot-header__copy">
          <p className="chatbot-header__title">Rollo AI</p>
          <p className="chatbot-header__subtitle">Talent Acquisition</p>
        </div>
      </div>
      <div className="chatbot-header__actions">
        <span className="chatbot-header__status" title="Online">
          Online
        </span>
        <button type="button" className="chatbot-header__exit" aria-label="Back to app" onClick={onExit}>
          <ArrowLeft size={14} />
          <span>Back to app</span>
        </button>
      </div>
    </header>
  );
}