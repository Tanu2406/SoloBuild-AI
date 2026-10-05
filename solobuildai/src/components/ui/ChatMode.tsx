import React, { useState } from 'react';
import { ChatWindow } from './chatbot/ChatWindow';
import { ChatHeader } from './chatbot/ChatHeader';
import { ContextPanel } from './chatbot/ContextPanel';
import { salesSolution, talentAcquisitionDemoMessages, talentAcquisitionSolution } from './chatbot/data';
import type { ChatMessageData } from './chatbot/types';
import './chatbot/chatbot.css';

export const ChatMode: React.FC<{
  solutionContext: 'sales' | 'talent';
  newChatRequest: number;
}> = ({ solutionContext, newChatRequest }) => {
  const isSales = solutionContext === 'sales';
  const solution = isSales ? salesSolution : talentAcquisitionSolution;
  const [chatSession, setChatSession] = useState<{ request: number; messages: ChatMessageData[] }>({
    request: newChatRequest,
    messages: [],
  });
  const messages = chatSession.request === newChatRequest ? chatSession.messages : [];

  const sendMessage = (content: string) => {
    const normalized = content.toLowerCase();
    let response = 'You have 248 sample leads, including 86 qualified leads and 32 hot leads.';
    if (normalized.includes('hot') || normalized.includes('highest score')) {
      response = 'Rahul Sharma at TechNova has the highest lead score (92, Hot), followed by Priya Mehta at BrightLabs (78, Warm).';
    } else if (normalized.includes('follow-up') || normalized.includes('follow up')) {
      response = 'Rahul Sharma has a follow-up scheduled today. Amit Patil may need a first-touch follow-up.';
    } else if (normalized.includes('activity') || normalized.includes('today')) {
      response = 'Today: 4 calls, 6 emails, 2 meetings, and 3 lead updates are recorded in the sample activity feed.';
    } else if (normalized.includes('campaign')) {
      response = 'There are 2 active sample campaigns: Q4 SaaS Outreach and Product Demo Campaign. Mumbai Enterprise Leads is completed; Startup Growth Campaign is a draft.';
    }
    setChatSession(current => ({
      request: newChatRequest,
      messages: [
        ...(current.request === newChatRequest ? current.messages : []),
        { id: crypto.randomUUID(), role: 'user', content },
        { id: crypto.randomUUID(), role: 'assistant', content: response },
      ],
    }));
  };

  return (
    <section className="marketing-chatbot" aria-label={`${solution.name} assistant`}>
      <div className="marketing-chatbot__main">
        <ChatHeader subtitle={solution.name} />
        <div className="marketing-chatbot__panels">
          <ChatWindow
            key={`${solutionContext}-${newChatRequest}`}
            messages={isSales ? messages : talentAcquisitionDemoMessages}
            loading={false}
            disabled={!isSales}
            onSubmit={isSales ? sendMessage : undefined}
          />
          <ContextPanel solution={solution} onAction={isSales ? sendMessage : undefined} />
        </div>
      </div>
    </section>
  );
};