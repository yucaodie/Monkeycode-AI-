import { getDatabase } from '../utils/database.js';
import { AIClient, getAIClient } from './AIClient.js';
import { KnowledgeFile } from '../models/KnowledgeFile.js';

export interface KBFileSearchResult {
  id: number;
  score: number;
  file: KnowledgeFile;
}

export interface KBSearchOptions {
  limit?: number;
  minScore?: number;
}

export class KBService {
  private aiClient: AIClient;

  constructor() {
    this.aiClient = getAIClient();
  }

  async search(query: string, options: KBSearchOptions = {}): Promise<KBFileSearchResult[]> {
    const { limit = 10, minScore = 0.3 } = options;
    const db = getDatabase();

    try {
      const stmt = db.prepare('SELECT file_id, embedding FROM knowledge_file_embeddings');
      const rows = stmt.all() as Array<{ file_id: number; embedding: string }>;

      if (rows.length === 0) {
        return this.keywordSearch(query, limit);
      }

      const fileEmbeddings = rows.map(r => ({
        id: r.file_id,
        embedding: JSON.parse(r.embedding) as number[],
      }));

      const queryEmbedding = await this.aiClient.generateEmbedding(query);

      if (queryEmbedding.length === 0) {
        return this.keywordSearch(query, limit);
      }

      const scored = fileEmbeddings
        .map(item => ({
          id: item.id,
          score: this.cosineSimilarity(queryEmbedding, item.embedding),
        }))
        .filter(s => s.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      const results: KBFileSearchResult[] = [];
      const fileStmt = db.prepare('SELECT * FROM knowledge_files WHERE id = ?');
      for (const s of scored) {
        const file = fileStmt.get(s.id) as KnowledgeFile;
        if (file) {
          results.push({ id: s.id, score: s.score, file });
        }
      }

      return results;
    } catch (error) {
      console.error('KB semantic search failed, falling back to keyword search:', error);
      return this.keywordSearch(query, limit);
    }
  }

  async indexFile(fileId: number): Promise<void> {
    const db = getDatabase();

    try {
      const file = db.prepare('SELECT * FROM knowledge_files WHERE id = ?').get(fileId) as KnowledgeFile;
      if (!file || !file.content_markdown) return;

      const embedding = await this.aiClient.generateEmbedding(file.content_markdown);

      if (embedding.length === 0) return;

      const stmt = db.prepare(`
        INSERT INTO knowledge_file_embeddings (file_id, embedding, model)
        VALUES (?, ?, 'embedding-v1')
      `);

      stmt.run(fileId, JSON.stringify(embedding));
      console.log(`Indexed knowledge file ${fileId}`);
    } catch (error) {
      console.error(`Failed to index knowledge file ${fileId}:`, error);
    }
  }

  async removeIndex(fileId: number): Promise<void> {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM knowledge_file_embeddings WHERE file_id = ?');
    stmt.run(fileId);
  }

  private keywordSearch(query: string, limit: number = 10): KBFileSearchResult[] {
    const db = getDatabase();
    const searchTerm = `%${query}%`;

    const stmt = db.prepare(`
      SELECT * FROM knowledge_files
      WHERE name LIKE ? OR content_markdown LIKE ? OR summary LIKE ?
      ORDER BY updated_at DESC
      LIMIT ?
    `);

    const items = stmt.all(searchTerm, searchTerm, searchTerm, limit) as KnowledgeFile[];

    return items.map(file => ({
      id: file.id,
      score: 0.5,
      file,
    }));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

let kbServiceInstance: KBService | null = null;

export function getKBService(): KBService {
  if (!kbServiceInstance) {
    kbServiceInstance = new KBService();
  }
  return kbServiceInstance;
}
