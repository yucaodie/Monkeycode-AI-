import { getDatabase } from '../utils/database.js';
import { AIClient, getAIClient } from './AIClient.js';
import { Knowledge } from '../models/Knowledge.js';
import { Embedding } from '../models/Embedding.js';

export interface SearchResult {
  id: number;
  score: number;
  knowledge: Knowledge;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
}

/**
 * Semantic Search Service
 */
export class SearchService {
  private aiClient: AIClient;

  constructor() {
    this.aiClient = getAIClient();
  }

  /**
   * Search knowledge by semantic query
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 10, minScore = 0.3 } = options;
    const db = getDatabase();

    try {
      // Get all embeddings
      const embeddingStmt = db.prepare('SELECT knowledge_id, embedding FROM embeddings');
      const embeddings = embeddingStmt.all() as Array<{ knowledge_id: number; embedding: string }>;

      if (embeddings.length === 0) {
        // Fallback to keyword search if no embeddings
        return this.keywordSearch(query, limit);
      }

      // Parse embeddings
      const knowledgeEmbeddings = embeddings.map(e => ({
        id: e.knowledge_id,
        embedding: JSON.parse(e.embedding) as number[],
      }));

      // Search by semantic similarity
      const scores = await this.aiClient.searchBySemanticQuery(query, knowledgeEmbeddings);

      // Filter by minimum score and limit
      const filteredScores = scores
        .filter(s => s.score >= minScore)
        .slice(0, limit);

      // Get knowledge details
      const results: SearchResult[] = [];
      for (const score of filteredScores) {
        const knowledge = db.prepare('SELECT * FROM knowledge WHERE id = ?').get(score.id) as Knowledge;
        if (knowledge) {
          results.push({
            id: score.id,
            score: score.score,
            knowledge,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Semantic search failed, falling back to keyword search:', error);
      return this.keywordSearch(query, limit);
    }
  }

  /**
   * Fallback keyword search
   */
  private keywordSearch(query: string, limit: number = 10): SearchResult[] {
    const db = getDatabase();
    const searchTerm = `%${query}%`;

    const stmt = db.prepare(`
      SELECT * FROM knowledge
      WHERE title LIKE ? OR content LIKE ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const items = stmt.all(searchTerm, searchTerm, limit) as Knowledge[];

    return items.map(knowledge => ({
      id: knowledge.id,
      score: 0.5, // Default score for keyword matches
      knowledge,
    }));
  }

  /**
   * Generate and save embedding for knowledge
   */
  async indexKnowledge(knowledgeId: number, content: string): Promise<void> {
    const db = getDatabase();

    try {
      const embedding = await this.aiClient.generateEmbedding(content);

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO embeddings (knowledge_id, embedding, model)
        VALUES (?, ?, 'text-embedding-ada-002')
      `);

      stmt.run(knowledgeId, JSON.stringify(embedding));
    } catch (error) {
      console.error('Failed to index knowledge:', error);
      throw error;
    }
  }

  /**
   * Remove embedding for knowledge
   */
  async removeKnowledgeIndex(knowledgeId: number): Promise<void> {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM embeddings WHERE knowledge_id = ?');
    stmt.run(knowledgeId);
  }
}

// Singleton instance
let searchServiceInstance: SearchService | null = null;

export function getSearchService(): SearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new SearchService();
  }
  return searchServiceInstance;
}
