import React from 'react';
import { ChatWindow } from './chatbot/ChatWindow';
import { ChatHeader } from './chatbot/ChatHeader';
import { ContextPanel } from './chatbot/ContextPanel';
import { talentAcquisitionDemoMessages, talentAcquisitionSolution } from './chatbot/data';
import './chatbot/chatbot.css';

export const ChatMode: React.FC = () => (
  <section className="marketing-chatbot" aria-label="Talent Acquisition assistant">
    <div className="marketing-chatbot__main">
      <ChatHeader />
      <div className="marketing-chatbot__panels">
        <ChatWindow messages={talentAcquisitionDemoMessages} loading={false} disabled />
        <ContextPanel solution={talentAcquisitionSolution} />
      </div>
    </div>
  </section>
);