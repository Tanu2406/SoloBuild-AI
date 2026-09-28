import { ChatComposer } from './ChatComposer';
import { ChatMessage } from './ChatMessage';
import type { ChatMessageData } from './types';

export function ChatWindow({
  messages,
  loading,
  disabled,
}: {
  messages: ChatMessageData[];
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <main className="chatbot-window" aria-label="Chat center">
      <div className="chatbot-window__messages">
        <div className="chatbot-window__message-list">
          {messages.map(message => <ChatMessage key={message.id} message={message} />)}
          {loading && <div className="chatbot-window__loading" role="status">SoloBuildAI is thinking...</div>}
        </div>
      </div>
      <div className="chatbot-window__footer">
        <div className="chatbot-window__composer-wrap">
          <ChatComposer disabled={disabled} />
        </div>
      </div>
    </main>
  );
}