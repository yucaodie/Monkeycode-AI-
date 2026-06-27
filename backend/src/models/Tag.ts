// Tag model types

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color?: string | null;
  created_at: string;
}

export interface CreateTagDTO {
  name: string;
  color?: string;
  user_id?: number;
}

export interface UpdateTagDTO {
  name?: string;
  color?: string;
}
