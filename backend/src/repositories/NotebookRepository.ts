import { getDatabase } from '../utils/database.js';
import { Notebook, CreateNotebookDTO, UpdateNotebookDTO } from '../models/Notebook.js';

export class NotebookRepository {
  create(dto: CreateNotebookDTO, userId: number = 1): Notebook {
    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO notebooks (user_id, name, sort_order) VALUES (?, ?, ?)');
    const result = stmt.run(userId, dto.name, dto.sort_order ?? 0);
    return this.getById(Number(result.lastInsertRowid), userId)!;
  }

  getById(id: number, userId: number = 1): Notebook | null {
    const db = getDatabase();
    return db.prepare('SELECT * FROM notebooks WHERE id = ? AND user_id = ?').get(id, userId) as Notebook | null;
  }

  update(id: number, dto: UpdateNotebookDTO, userId: number = 1): Notebook | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(dto.sort_order); }
    if (fields.length === 0) return this.getById(id, userId);
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);
    db.prepare(`UPDATE notebooks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return this.getById(id, userId);
  }

  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    return db.prepare('DELETE FROM notebooks WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
  }

  list(userId: number = 1): Notebook[] {
    const db = getDatabase();
    return db.prepare(
      `SELECT n.*, (
         SELECT COUNT(*) FROM note_pages np
         JOIN notes nt ON nt.id = np.note_id
         WHERE nt.notebook_id = n.id
       ) as note_count
       FROM notebooks n WHERE n.user_id = ? ORDER BY n.sort_order ASC, n.created_at ASC`
    ).all(userId) as Notebook[];
  }
}
