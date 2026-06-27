export interface Note {
  id: number;
  notebook_id: number;
  user_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteDTO {
  notebook_id: number;
  name: string;
  sort_order?: number;
  user_id?: number;
}

export interface UpdateNoteDTO {
  name?: string;
  notebook_id?: number;
  sort_order?: number;
}
