export interface NotePage {
  id: number;
  note_id: number;
  user_id: number;
  title: string | null;
  content: string;
  plain_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNotePageDTO {
  note_id: number;
  title?: string;
  content?: string;
  plain_text?: string;
  sort_order?: number;
  user_id?: number;
}

export interface UpdateNotePageDTO {
  title?: string;
  content?: string;
  plain_text?: string;
  sort_order?: number;
  note_id?: number;
}
