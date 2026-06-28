export interface KnowledgeFolder {
  id: number;
  user_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  file_count?: number;
}

export interface KnowledgeFile {
  id: number;
  folder_id: number;
  user_id: number;
  name: string;
  file_type: 'md' | 'docx' | 'pdf' | 'image';
  file_path: string | null;
  content_markdown: string | null;
  content_structured: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}
