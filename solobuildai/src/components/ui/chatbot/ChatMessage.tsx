import { AIActivity } from './AIActivity';
import type { ChatMessageData } from './types';

export function ChatMessage({ message }: { message: ChatMessageData }) {
  if (message.role === 'user') {
    return (
      <div className="chatbot-message chatbot-message--user">
        <div className="chatbot-message__user-bubble">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="chatbot-message chatbot-message--assistant">
      <div className="chatbot-message__assistant-avatar">SB</div>
      <div className="chatbot-message__assistant-content">
        <p className="chatbot-message__assistant-name">Rollo AI</p>
        <p className="chatbot-message__assistant-text">{message.content}</p>
        {message.summary && (
          <div className="chatbot-message__summary">
            {message.summary.map(item => (
              <div className="chatbot-message__summary-item" key={item}>
                <span className="chatbot-message__summary-check">✓</span>
                {item}
              </div>
            ))}
          </div>
        )}
        {message.activity && <AIActivity activity={message.activity} />}
      </div>
    </div>
  );
}