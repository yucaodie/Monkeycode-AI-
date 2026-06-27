export type ModelCategory = 'chat' | 'embedding' | 'reranker';

export interface ModelConfig {
  id: number;
  user_id: number;
  name: string;
  category: ModelCategory;
  api_base_url: string;
  api_key: string;
  model_identifier: string;
  is_default: boolean;
  is_active: boolean;
  last_test_status: string | null;
  last_test_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateModelConfigDTO {
  name: string;
  category: ModelCategory;
  api_base_url: string;
  api_key: string;
  model_identifier: string;
  is_default?: boolean;
  is_active?: boolean;
  user_id?: number;
}

export interface UpdateModelConfigDTO {
  name?: string;
  api_base_url?: string;
  api_key?: string;
  model_identifier?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export const MODEL_CATEGORY_LABELS: Record<ModelCategory, string> = {
  chat: '问答模型',
  embedding: '向量模型',
  reranker: '重排序模型',
};

export const MODEL_CATEGORIES: ModelCategory[] = ['chat', 'embedding', 'reranker'];
