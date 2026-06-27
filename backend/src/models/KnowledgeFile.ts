export type FileType = 'md' | 'docx' | 'pdf' | 'image';

export interface KnowledgeFile {
  id: number;
  folder_id: number;
  user_id: number;
  name: string;
  file_type: FileType;
  file_path: string | null;
  content_markdown: string | null;
  content_structured: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeFileDTO {
  folder_id: number;
  name: string;
  file_type: FileType;
  file_path?: string;
  content_markdown?: string;
  content_structured?: string;
  summary?: string;
  user_id?: number;
}

export interface UpdateKnowledgeFileDTO {
  name?: string;
  folder_id?: number;
  content_markdown?: string;
  content_structured?: string;
  summary?: string;
}
