import type { ChatMessageData } from './types';

export function AIActivity({ activity }: { activity: NonNullable<ChatMessageData['activity']> }) {
  return (
    <div className="chatbot-activity">
      <div className="chatbot-activity__header">
        <span className="chatbot-activity__label">
          <span className="chatbot-activity__dot" />
          {activity.label}
        </span>
        <span className="chatbot-activity__demo">{activity.badge}</span>
      </div>
      <div className="chatbot-activity__items">
        {activity.steps.map(step => (
          <div className="chatbot-activity__item" key={`${step.label}-${step.status}`}>
            <span className="chatbot-activity__item-name">
              <span className="chatbot-activity__check">✓</span>
              <span>{step.label}</span>
            </span>
            <span className="chatbot-activity__complete">{step.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}