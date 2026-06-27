import apiClient from './api';
import type { KnowledgeFolder, KnowledgeFile } from '../types/knowledgeBase';

const kbService = {
  // Folders
  async getFolders(): Promise<KnowledgeFolder[]> {
    const { data } = await apiClient.get('/knowledge-base/folders');
    return data;
  },

  async createFolder(name: string): Promise<KnowledgeFolder> {
    const { data } = await apiClient.post('/knowledge-base/folders', { name });
    return data;
  },

  async updateFolder(id: number, dto: { name?: string }): Promise<KnowledgeFolder> {
    const { data } = await apiClient.put(`/knowledge-base/folders/${id}`, dto);
    return data;
  },

  async deleteFolder(id: number): Promise<void> {
    await apiClient.delete(`/knowledge-base/folders/${id}`);
  },

  // Files
  async getFiles(folderId: number): Promise<KnowledgeFile[]> {
    const { data } = await apiClient.get(`/knowledge-base/folders/${folderId}/files`);
    return data;
  },

  async uploadFile(folderId: number, file: File, name?: string): Promise<KnowledgeFile> {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    const { data } = await apiClient.post(`/knowledge-base/folders/${folderId}/files`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getFile(id: number): Promise<KnowledgeFile> {
    const { data } = await apiClient.get(`/knowledge-base/files/${id}`);
    return data;
  },

  async getFileContent(id: number): Promise<{ content_markdown: string | null; content_structured: any }> {
    const { data } = await apiClient.get(`/knowledge-base/files/${id}/content`);
    return data;
  },

  async updateFile(id: number, dto: { name?: string; folder_id?: number }): Promise<KnowledgeFile> {
    const { data } = await apiClient.put(`/knowledge-base/files/${id}`, dto);
    return data;
  },

  async deleteFile(id: number): Promise<void> {
    await apiClient.delete(`/knowledge-base/files/${id}`);
  },
};

export default kbService;
