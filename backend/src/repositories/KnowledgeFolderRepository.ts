import { getDatabase } from '../utils/database.js';
import {
  KnowledgeFolder,
  CreateKnowledgeFolderDTO,
  UpdateKnowledgeFolderDTO,
} from '../models/KnowledgeFolder.js';

export class KnowledgeFolderRepository {
  create(dto: CreateKnowledgeFolderDTO, userId: number = 1): KnowledgeFolder {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO knowledge_folders (user_id, name, sort_order)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(userId, dto.name, dto.sort_order ?? 0);
    return this.getById(Number(result.lastInsertRowid), userId)!;
  }

  getById(id: number, userId: number = 1): KnowledgeFolder | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM knowledge_folders WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as KnowledgeFolder | null;
  }

  update(id: number, dto: UpdateKnowledgeFolderDTO, userId: number = 1): KnowledgeFolder | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(dto.sort_order); }

    if (fields.length === 0) return this.getById(id, userId);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    const stmt = db.prepare(`
      UPDATE knowledge_folders SET ${fields.join(', ')} WHERE id = ? AND user_id = ?
    `);
    stmt.run(...values);
    return this.getById(id, userId);
  }

  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM knowledge_folders WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  list(userId: number = 1): KnowledgeFolder[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM knowledge_folders WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC'
    );
    return stmt.all(userId) as KnowledgeFolder[];
  }
}
