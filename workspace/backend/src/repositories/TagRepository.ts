import { getDatabase } from '../utils/database.js';
import { Tag, CreateTagDTO, UpdateTagDTO } from '../models/Tag.js';

export class TagRepository {
  /**
   * Create a new tag
   */
  create(dto: CreateTagDTO, userId: number = 1): Tag {
    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)');
    
    const result = stmt.run(userId, dto.name, dto.color || null);
    return this.getByName(dto.name, userId)!;
  }

  /**
   * Get tag by name
   */
  getByName(name: string, userId: number = 1): Tag | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tags WHERE name = ? AND user_id = ?');
    return stmt.get(name, userId) as Tag | null;
  }

  /**
   * Get tag by ID
   */
  getById(id: number, userId: number = 1): Tag | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as Tag | null;
  }

  /**
   * Update tag
   */
  update(id: number, dto: UpdateTagDTO, userId: number = 1): Tag | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) {
      fields.push('name = ?');
      values.push(dto.name);
    }
    if (dto.color !== undefined) {
      fields.push('color = ?');
      values.push(dto.color);
    }

    if (fields.length === 0) {
      return this.getById(id, userId);
    }

    values.push(id, userId);

    const stmt = db.prepare(`
      UPDATE tags 
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);
    return this.getById(id, userId);
  }

  /**
   * Delete tag
   */
  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM tags WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  /**
   * List all tags
   */
  list(userId: number = 1): Tag[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tags WHERE user_id = ? ORDER BY name');
    return stmt.all(userId) as Tag[];
  }

  /**
   * Get tags by knowledge ID
   */
  getByKnowledgeId(knowledgeId: number): Tag[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN knowledge_tags kt ON t.id = kt.tag_id
      WHERE kt.knowledge_id = ?
    `);
    return stmt.all(knowledgeId) as Tag[];
  }

  /**
   * Add tag to knowledge
   */
  addTagToKnowledge(knowledgeId: number, tagId: number): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO knowledge_tags (knowledge_id, tag_id)
      VALUES (?, ?)
    `);
    stmt.run(knowledgeId, tagId);
  }

  /**
   * Remove tag from knowledge
   */
  removeTagFromKnowledge(knowledgeId: number, tagId: number): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      DELETE FROM knowledge_tags
      WHERE knowledge_id = ? AND tag_id = ?
    `);
    stmt.run(knowledgeId, tagId);
  }

  /**
   * Set tags for knowledge (replace all existing tags)
   */
  setTagsForKnowledge(knowledgeId: number, tagIds: number[]): void {
    const db = getDatabase();
    
    // Remove existing tags
    const deleteStmt = db.prepare('DELETE FROM knowledge_tags WHERE knowledge_id = ?');
    deleteStmt.run(knowledgeId);

    // Add new tags
    const insertStmt = db.prepare(
      'INSERT OR IGNORE INTO knowledge_tags (knowledge_id, tag_id) VALUES (?, ?)'
    );

    for (const tagId of tagIds) {
      insertStmt.run(knowledgeId, tagId);
    }
  }
}
