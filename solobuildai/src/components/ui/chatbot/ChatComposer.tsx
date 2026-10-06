import React, { useState } from 'react';
import { SendIcon } from './Icon';

export function ChatComposer({ onSubmit }: { onSubmit: (message: string) => void }) {
  const [value, setValue] = useState('');

  function submitMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = value.trim();
    if (!message) return;
    onSubmit(message);
    setValue('');
  }

  return (
    <form className="chatbot-composer" aria-label="Chat message composer" onSubmit={submitMessage}>
      <button type="button" aria-label="Attach a file" className="chatbot-composer__optional" disabled title="File attachments are not available">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.5 11.5-7.75 7.75a5 5 0 0 1-7.07-7.07l8.13-8.13a3.5 3.5 0 1 1 4.95 4.95l-8.13 8.13a2 2 0 0 1-2.83-2.83l7.42-7.42" />
        </svg>
      </button>
      <input
        aria-label="Ask Rollo AI anything"
        placeholder="Ask Rollo AI anything..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="button" aria-label="AI suggestions" className="chatbot-composer__optional" disabled title="AI suggestions are not available">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
      </button>
      <button type="button" aria-label="Voice input" title="Voice input is not available" disabled>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
          <rect x="9" y="2" width="6" height="11" rx="3" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10a7 7 0 0 0 14 0M12 19v3m-3 0h6" />
        </svg>
      </button>
      <button type="submit" aria-label="Send message" disabled={!value.trim()}><SendIcon /></button>
    </form>
  );
}