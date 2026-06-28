export interface Notebook {
  id: number;
  user_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  note_count?: number;
}

export interface CreateNotebookDTO {
  name: string;
  sort_order?: number;
  user_id?: number;
}

export interface UpdateNotebookDTO {
  name?: string;
  sort_order?: number;
}
