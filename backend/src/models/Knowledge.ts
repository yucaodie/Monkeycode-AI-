// Knowledge model types

export interface Knowledge {
  id: number;
  user_id: number;
  content: string;
  original_type: 'text' | 'pdf' | 'word' | 'image';
  file_path?: string | null;
  title?: string | null;
  summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeDTO {
  content: string;
  original_type: 'text' | 'pdf' | 'word' | 'image';
  file_path?: string;
  user_id?: number;
}

export interface UpdateKnowledgeDTO {
  content?: string;
  title?: string;
  summary?: string;
}
