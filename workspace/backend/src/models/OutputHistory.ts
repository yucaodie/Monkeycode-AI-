// Output History model types

export interface OutputHistory {
  id: number;
  user_id: number;
  knowledge_ids: string; // JSON array string
  template_id?: number | null;
  prompt?: string | null;
  output_content: string;
  output_format?: string | null;
  created_at: string;
}

export interface CreateOutputHistoryDTO {
  knowledge_ids: string[];
  template_id?: number;
  prompt?: string;
  output_content: string;
  output_format?: string;
  user_id?: number;
}
