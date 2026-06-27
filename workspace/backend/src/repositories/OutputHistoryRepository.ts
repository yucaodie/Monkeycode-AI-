import { getDatabase } from '../utils/database.js';
import { OutputHistory, CreateOutputHistoryDTO } from '../models/OutputHistory.js';

export class OutputHistoryRepository {
  /**
   * Create output history entry
   */
  create(dto: CreateOutputHistoryDTO, userId: number = 1): number {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO output_history 
        (user_id, knowledge_ids, template_id, prompt, output_content, output_format)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      JSON.stringify(dto.knowledge_ids),
      dto.template_id || null,
      dto.prompt || null,
      dto.output_content,
      dto.output_format || null
    );

    return Number(result.lastInsertRowid);
  }

  /**
   * Get output history by ID
   */
  getById(id: number, userId: number = 1): OutputHistory | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM output_history WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as OutputHistory | null;
  }

  /**
   * List output history for user
   */
  list(userId: number = 1, limit: number = 20): OutputHistory[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM output_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit) as OutputHistory[];
  }

  /**
   * Delete output history
   */
  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM output_history WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }
}
