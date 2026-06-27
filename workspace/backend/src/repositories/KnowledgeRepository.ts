import { getDatabase } from '../utils/database.js';
import { Knowledge, CreateKnowledgeDTO, UpdateKnowledgeDTO } from '../models/Knowledge.js';

export class KnowledgeRepository {
  /**
   * Create a new knowledge entry
   */
  create(dto: CreateKnowledgeDTO, userId: number = 1): Knowledge {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO knowledge (user_id, content, original_type, file_path, title, summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      dto.content,
      dto.original_type,
      dto.file_path || null,
      dto.title || null,
      dto.summary || null
    );

    return this.getById(Number(result.lastInsertRowid), userId)!;
  }

  /**
   * Get knowledge by ID
   */
  getById(id: number, userId: number = 1): Knowledge | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM knowledge WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as Knowledge | null;
  }

  /**
   * Update knowledge
   */
  update(id: number, dto: UpdateKnowledgeDTO, userId: number = 1): Knowledge | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.content !== undefined) {
      fields.push('content = ?');
      values.push(dto.content);
    }
    if (dto.title !== undefined) {
      fields.push('title = ?');
      values.push(dto.title);
    }
    if (dto.summary !== undefined) {
      fields.push('summary = ?');
      values.push(dto.summary);
    }

    if (fields.length === 0) {
      return this.getById(id, userId);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    const stmt = db.prepare(`
      UPDATE knowledge 
      SET ${fields.join(', ')}
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(...values);
    return this.getById(id, userId);
  }

  /**
   * Delete knowledge
   */
  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM knowledge WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  /**
   * List knowledge with pagination and filtering
   */
  list(options: {
    userId?: number;
    tagId?: number;
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at';
    order?: 'ASC' | 'DESC';
  } = {}): { items: Knowledge[]; total: number } {
    const db = getDatabase();
    const {
      userId = 1,
      tagId,
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      order = 'DESC',
    } = options;

    let query = 'SELECT * FROM knowledge WHERE user_id = ?';
    const params: any[] = [userId];

    if (tagId) {
      query += ` AND id IN (
        SELECT knowledge_id FROM knowledge_tags WHERE tag_id = ?
      )`;
      params.push(tagId);
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...params) as { count: number };

    // Get items
    query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const items = stmt.all(...params) as Knowledge[];

    return {
      items,
      total: countResult.count,
    };
  }
}
