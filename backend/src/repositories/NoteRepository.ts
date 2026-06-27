import { getDatabase } from '../utils/database.js';
import { Note, CreateNoteDTO, UpdateNoteDTO } from '../models/Note.js';

export class NoteRepository {
  create(dto: CreateNoteDTO, userId: number = 1): Note {
    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO notes (notebook_id, user_id, name, sort_order) VALUES (?, ?, ?, ?)');
    const result = stmt.run(dto.notebook_id, userId, dto.name, dto.sort_order ?? 0);
    return this.getById(Number(result.lastInsertRowid), userId)!;
  }

  getById(id: number, userId: number = 1): Note | null {
    const db = getDatabase();
    return db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(id, userId) as Note | null;
  }

  update(id: number, dto: UpdateNoteDTO, userId: number = 1): Note | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.notebook_id !== undefined) { fields.push('notebook_id = ?'); values.push(dto.notebook_id); }
    if (dto.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(dto.sort_order); }
    if (fields.length === 0) return this.getById(id, userId);
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);
    db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return this.getById(id, userId);
  }

  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    return db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
  }

  listByNotebook(notebookId: number, userId: number = 1): Note[] {
    const db = getDatabase();
    return db.prepare(
      'SELECT * FROM notes WHERE notebook_id = ? AND user_id = ? ORDER BY sort_order ASC, created_at ASC'
    ).all(notebookId, userId) as Note[];
  }
}
