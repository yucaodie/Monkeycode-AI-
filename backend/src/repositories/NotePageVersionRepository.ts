import { getDatabase } from '../utils/database.js';
import { NotePageVersion } from '../models/NotePageVersion.js';

const MAX_VERSIONS = 10;

export class NotePageVersionRepository {
  create(pageId: number, content: string): NotePageVersion {
    const db = getDatabase();

    const result = db.transaction(() => {
      const stmt = db.prepare('INSERT INTO note_page_versions (page_id, content) VALUES (?, ?)');
      const r = stmt.run(pageId, content);

      const countRow = db.prepare('SELECT COUNT(*) as cnt FROM note_page_versions WHERE page_id = ?').get(pageId) as { cnt: number };
      if (countRow.cnt > MAX_VERSIONS) {
        const oldest = db.prepare(
          'SELECT id FROM note_page_versions WHERE page_id = ? ORDER BY created_at ASC LIMIT ?'
        ).all(pageId, countRow.cnt - MAX_VERSIONS) as Array<{ id: number }>;
        for (const row of oldest) {
          db.prepare('DELETE FROM note_page_versions WHERE id = ?').run(row.id);
        }
      }

      return r;
    })();

    return this.getById(Number(result.lastInsertRowid))!;
  }

  getById(id: number): NotePageVersion | null {
    const db = getDatabase();
    return db.prepare('SELECT * FROM note_page_versions WHERE id = ?').get(id) as NotePageVersion | null;
  }

  listByPage(pageId: number): NotePageVersion[] {
    const db = getDatabase();
    return db.prepare(
      'SELECT * FROM note_page_versions WHERE page_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(pageId, MAX_VERSIONS) as NotePageVersion[];
  }

  deleteByPage(pageId: number): void {
    const db = getDatabase();
    db.prepare('DELETE FROM note_page_versions WHERE page_id = ?').run(pageId);
  }
}
