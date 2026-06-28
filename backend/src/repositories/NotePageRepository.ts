import { getDatabase } from '../utils/database.js';
import { NotePage, CreateNotePageDTO, UpdateNotePageDTO } from '../models/NotePage.js';

export interface NotePageWithNote extends NotePage {
  note_name: string;
}

export class NotePageRepository {
  create(dto: CreateNotePageDTO, userId: number = 1): NotePage {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO note_pages (note_id, user_id, title, content, plain_text, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(dto.note_id, userId, dto.title || null, dto.content || '', dto.plain_text || null, dto.sort_order ?? 0);
    return this.getById(Number(result.lastInsertRowid), userId)!;
  }

  getById(id: number, userId: number = 1): NotePage | null {
    const db = getDatabase();
    return db.prepare('SELECT * FROM note_pages WHERE id = ? AND user_id = ?').get(id, userId) as NotePage | null;
  }

  update(id: number, dto: UpdateNotePageDTO, userId: number = 1): NotePage | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    if (dto.title !== undefined) { fields.push('title = ?'); values.push(dto.title); }
    if (dto.content !== undefined) { fields.push('content = ?'); values.push(dto.content); }
    if (dto.plain_text !== undefined) { fields.push('plain_text = ?'); values.push(dto.plain_text); }
    if (dto.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(dto.sort_order); }
    if (dto.note_id !== undefined) { fields.push('note_id = ?'); values.push(dto.note_id); }
    if (fields.length === 0) return this.getById(id, userId);
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);
    db.prepare(`UPDATE note_pages SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
    return this.getById(id, userId);
  }

  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    return db.prepare('DELETE FROM note_pages WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
  }

  listByNote(noteId: number, userId: number = 1): NotePage[] {
    const db = getDatabase();
    return db.prepare(
      'SELECT id, note_id, user_id, title, sort_order, created_at, updated_at FROM note_pages WHERE note_id = ? AND user_id = ? ORDER BY sort_order ASC, created_at ASC'
    ).all(noteId, userId) as NotePage[];
  }

  listByNotebook(notebookId: number, userId: number = 1): NotePageWithNote[] {
    const db = getDatabase();
    return db.prepare(
      `SELECT np.id, np.note_id, np.user_id, np.title, np.sort_order, np.created_at, np.updated_at, n.name as note_name
       FROM note_pages np
       JOIN notes n ON n.id = np.note_id
       WHERE n.notebook_id = ? AND np.user_id = ?
       ORDER BY n.sort_order ASC, np.sort_order ASC`
    ).all(notebookId, userId) as NotePageWithNote[];
  }
}
