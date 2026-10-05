import { apiRequest } from './api';

export interface CampaignCreatePayload {
  title: string;
  raw_text?: string;
  file?: File | null;
}

export interface CampaignResult {
  id: string;
  title: string;
  raw_text?: string | null;
  required_fields?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateListItem {
  id: string;
  campaign_id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  file_url?: string | null;
  ingestion_item_id?: string | null;
  extracted_fields?: Record<string, any> | null;
  workflow_step?: string | null;
  step_status?: string;
  created_at?: string;
  updated_at?: string;
}

export const campaignService = {
  async create(payload: CampaignCreatePayload) {
    const formData = new FormData();
    formData.append('title', payload.title);

    if (payload.raw_text && !payload.file) {
      formData.append('raw_text', payload.raw_text);
    }

    if (payload.file) {
      formData.append('file', payload.file);
    }

    return apiRequest<CampaignResult>('/campaigns/', {
      method: 'POST',
      body: formData,
    });
  },

  async update(campaignId: string, payload: CampaignCreatePayload) {
    const formData = new FormData();
    formData.append('title', payload.title);

    if (payload.raw_text && !payload.file) {
      formData.append('raw_text', payload.raw_text);
    }

    if (payload.file) {
      formData.append('file', payload.file);
    }

    return apiRequest<CampaignResult>(`/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: formData,
    });
  },

  async uploadCandidates(campaignId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return apiRequest<{ batch_id: string; status: string; accepted_candidates: number; rejected_candidates: number }>(
      `/campaigns/${campaignId}/candidates/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );
  },

  async retryUpload(campaignId: string, batchId: string) {
    return apiRequest<{ batch_id: string; status: string; accepted_candidates: number; rejected_candidates: number }>(
      `/campaigns/${campaignId}/candidates/upload/${batchId}/retry`,
      { method: 'POST' },
    );
  },

  async uploadBatchStatus(campaignId: string, batchId: string) {
    return apiRequest<{ batch_id: string; status: string; total_candidates: number; processed: number; failed: number; finished_at?: string | null; failed_candidates?: string[] }>(
      `/campaigns/${campaignId}/candidates/upload/${batchId}/status`,
      { method: 'GET' },
    );
  },

  async getCandidates(campaignId: string) {
    return apiRequest<CandidateListItem[]>(`/campaigns/${campaignId}/candidates`, { method: 'GET' });
  },

  async updateCandidate(campaignId: string, candidateId: string, payload: { name?: string; email?: string; phone?: string; extracted_fields?: Record<string, any> }) {
    return apiRequest<CandidateListItem>(`/campaigns/${campaignId}/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async startScreening(campaignId: string, candidateIds: string[]) {
    return apiRequest<{ batch_id: string; status: string }>(`/campaigns/${campaignId}/candidates/screen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_ids: candidateIds }),
    });
  },

  async screeningStatus(campaignId: string, batchId: string) {
    return apiRequest<{ batch_id: string; status: string; total_candidates: number; processed: number; failed: number; finished_at?: string | null; failed_candidates?: string[] }>(
      `/campaigns/${campaignId}/candidates/screen/${batchId}/status`,
      { method: 'GET' },
    );
  },

  async startCalling(campaignId: string, candidateIds: string[]) {
    return apiRequest<{ batch_id: string; status: string }>(`/campaigns/${campaignId}/candidates/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_ids: candidateIds }),
    });
  },

  async callingStatus(campaignId: string, batchId: string) {
    return apiRequest<{ batch_id: string; status: string; total_candidates: number; processed: number; failed: number; finished_at?: string | null; failed_candidates?: string[] }>(
      `/campaigns/${campaignId}/candidates/call/${batchId}/status`,
      { method: 'GET' },
    );
  },
};
