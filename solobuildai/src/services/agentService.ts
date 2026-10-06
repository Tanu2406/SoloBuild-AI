import { apiJson, apiRequest } from './api';

export interface AgentPayload {
  name: string;
  conversation_style: string;
  languages: string;
  voice: string;
  interview_instruction: string;
}

export interface AgentResponse {
  id: string;
  name: string;
  conversation_style: string;
  languages: string;
  voice: string;
  interview_instruction: string;
}

export const agentService = {
  async create(payload: AgentPayload) {
    return apiJson<AgentResponse>('/agents', 'POST', payload, {
      'Content-Type': 'application/json',
    });
  },

  async update(agentId: string, payload: Partial<AgentPayload>) {
    return apiJson<AgentResponse>(`/agents/${agentId}`, 'PATCH', payload, {
      'Content-Type': 'application/json',
    });
  },

  async remove(agentId: string) {
    await apiRequest(`/agents/${agentId}`, { method: 'DELETE' });
  },
};
