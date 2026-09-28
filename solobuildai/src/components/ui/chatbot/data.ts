import type { ChatMessageData, ChatSolution } from './types';

export const talentAcquisitionSolution: ChatSolution = {
  name: 'Talent Acquisition',
  tools: [
    'HR System',
    'Document Management',
    'Email & Calendar',
    'Identity Management',
    'People Analytics',
  ],
  actions: [
    'View pending leave requests',
    'Check joining formalities',
    'Verify documents',
    'Update employee profile',
    'Generate HR report',
  ],
};

export const talentAcquisitionDemoMessages: ChatMessageData[] = [
  {
    id: 'hr-user',
    role: 'user',
    content: 'Help me with my pending HR tasks',
  },
  {
    id: 'hr-assistant',
    role: 'assistant',
    content: 'I found several pending HR tasks. I can help you review, prioritize, and take action on them. Here’s a summary of what I found:',
    summary: [
      '3 pending leave requests',
      '2 pending joining formalities',
      '1 pending document verification',
      '1 pending profile update',
    ],
    activity: {
      label: 'AI is working...',
      badge: 'Demo activity',
      steps: [
        { label: 'Checking connected systems', status: 'Completed' },
        { label: 'Retrieving relevant information', status: 'Completed' },
        { label: 'Preparing recommended actions', status: 'Completed' },
      ],
    },
  },
];