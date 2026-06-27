import apiClient from './api';
import { Knowledge, Tag } from '../types';

export interface UploadResult extends Knowledge {
  tags: Tag[];
  original_name: string;
  file_size: number;
  page_count?: number;
  headings: string[];
}

export interface CreateKnowledgeParams {
  content: string;
  original_type: 'text' | 'pdf' | 'word' | 'image';
  file_path?: string;
  title?: string;
  summary?: string;
}

export interface UpdateKnowledgeParams {
  content?: string;
  title?: string;
  summary?: string;
  tagIds?: number[];
}

export const knowledgeService = {
  async getList(params?: {
    tagId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Knowledge[]; total: number }> {
    const response = await apiClient.get('/knowledge', { params });
    return response.data;
  },

  async getById(id: number): Promise<Knowledge & { tags: Tag[] }> {
    const response = await apiClient.get(`/knowledge/${id}`);
    return response.data;
  },

  async create(params: CreateKnowledgeParams): Promise<Knowledge & { tags: Tag[] }> {
    const response = await apiClient.post('/knowledge', params);
    return response.data;
  },

  async update(id: number, params: UpdateKnowledgeParams): Promise<Knowledge & { tags: Tag[] }> {
    const response = await apiClient.put(`/knowledge/${id}`, params);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/knowledge/${id}`);
  },

  async getTags(): Promise<Tag[]> {
    const response = await apiClient.get('/knowledge/tags/list');
    return response.data;
  },
};

export const uploadService = {
  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

export default knowledgeService;
