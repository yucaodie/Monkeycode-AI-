// Document Structure model types

export interface DocumentStructure {
  id: number;
  knowledge_id: number;
  structure_json: string;
  headings?: string | null;
  tables_count: number;
  images_count: number;
  created_at: string;
}

export interface CreateDocumentStructureDTO {
  knowledge_id: number;
  structure_json: string;
  headings?: string;
  tables_count?: number;
  images_count?: number;
}
