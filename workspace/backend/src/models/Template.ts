// Template model types

export interface Template {
  id: number;
  user_id: number;
  name: string;
  type: 'preset' | 'custom';
  content: string;
  description?: string | null;
  is_preset: boolean;
  created_at: string;
}

export interface CreateTemplateDTO {
  name: string;
  type: 'preset' | 'custom';
  content: string;
  description?: string;
  user_id?: number;
}

export interface UpdateTemplateDTO {
  name?: string;
  content?: string;
  description?: string;
}
