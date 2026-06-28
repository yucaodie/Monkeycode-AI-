import apiClient from './api';
import type { Notebook, Note, NotePage, NotePageVersion } from '../types/notes';

export interface TreeNode {
  id: number;
  name: string;
  type: 'notebook' | 'note' | 'page';
  children?: TreeNode[];
}

const notesService = {
  async getTree(): Promise<TreeNode[]> {
    const { data } = await apiClient.get('/notes/tree');
    return data;
  },
  // Notebooks
  async getNotebooks(): Promise<Notebook[]> {
    const { data } = await apiClient.get('/notes/notebooks');
    return data;
  },

  async createNotebook(name: string): Promise<Notebook> {
    const { data } = await apiClient.post('/notes/notebooks', { name });
    return data;
  },

  async updateNotebook(id: number, dto: { name?: string; sort_order?: number }): Promise<Notebook> {
    const { data } = await apiClient.put(`/notes/notebooks/${id}`, dto);
    return data;
  },

  async deleteNotebook(id: number): Promise<void> {
    await apiClient.delete(`/notes/notebooks/${id}`);
  },

  // Notes
  async getNotes(notebookId: number): Promise<Note[]> {
    const { data } = await apiClient.get(`/notes/notebooks/${notebookId}/notes`);
    return data;
  },

  async createNote(notebookId: number, name: string): Promise<Note> {
    const { data } = await apiClient.post(`/notes/notebooks/${notebookId}/notes`, { name });
    return data;
  },

  async updateNote(id: number, dto: { name?: string; notebook_id?: number; sort_order?: number }): Promise<Note> {
    const { data } = await apiClient.put(`/notes/notes/${id}`, dto);
    return data;
  },

  async deleteNote(id: number): Promise<void> {
    await apiClient.delete(`/notes/notes/${id}`);
  },

  // Pages
  async getPages(noteId: number): Promise<NotePage[]> {
    const { data } = await apiClient.get(`/notes/notes/${noteId}/pages`);
    return data;
  },

  async getNotebookPages(notebookId: number): Promise<(NotePage & { note_name: string })[]> {
    const { data } = await apiClient.get(`/notes/notebooks/${notebookId}/pages`);
    return data;
  },

  async createPage(noteId: number, title: string): Promise<NotePage> {
    const { data } = await apiClient.post(`/notes/notes/${noteId}/pages`, { title });
    return data;
  },

  async getPage(id: number): Promise<NotePage> {
    const { data } = await apiClient.get(`/notes/pages/${id}`);
    return data;
  },

  async updatePage(id: number, dto: { title?: string; content?: string; note_id?: number; sort_order?: number }): Promise<NotePage> {
    const { data } = await apiClient.put(`/notes/pages/${id}`, dto);
    return data;
  },

  async deletePage(id: number): Promise<void> {
    await apiClient.delete(`/notes/pages/${id}`);
  },

  // Versions
  async getVersions(pageId: number): Promise<NotePageVersion[]> {
    const { data } = await apiClient.get(`/notes/pages/${pageId}/versions`);
    return data;
  },

  async restoreVersion(pageId: number, versionId: number): Promise<NotePage> {
    const { data } = await apiClient.post(`/notes/pages/${pageId}/restore/${versionId}`);
    return data;
  },
};

export default notesService;
