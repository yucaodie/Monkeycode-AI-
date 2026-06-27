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

export interface Tag {
  id: number;
  name: string;
  color?: string;
}

export interface Template {
  id: number;
  name: string;
  type: 'preset' | 'custom';
  content: string;
  description?: string;
}

export interface SearchResponse {
  results: Knowledge[];
  total: number;
}
