export interface Notebook {
  id: number;
  user_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  notebook_id: number;
  user_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

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

export interface NotePageVersion {
  id: number;
  page_id: number;
  content: string;
  created_at: string;
}
