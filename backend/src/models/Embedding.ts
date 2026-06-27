// Embedding model types

export interface Embedding {
  id: number;
  knowledge_id: number;
  embedding: string; // JSON array string
  model?: string | null;
  created_at: string;
}

export interface CreateEmbeddingDTO {
  knowledge_id: number;
  embedding: number[]; // Will be converted to JSON string
  model?: string;
}
