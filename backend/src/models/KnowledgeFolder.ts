export interface KnowledgeFolder {
  id: number;
  user_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  file_count?: number;
}

export interface CreateKnowledgeFolderDTO {
  name: string;
  sort_order?: number;
  user_id?: number;
}

export interface UpdateKnowledgeFolderDTO {
  name?: string;
  sort_order?: number;
}
