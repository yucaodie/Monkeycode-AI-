import { getDatabase } from '../utils/database.js';
import {
  KnowledgeFile,
  CreateKnowledgeFileDTO,
  UpdateKnowledgeFileDTO,
  FileType,
} from '../models/KnowledgeFile.js';

export class KnowledgeFileRepository {
  create(dto: CreateKnowledgeFileDTO, userId: number = 1): KnowledgeFile {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO knowledge_files (folder_id, user_id, name, file_type, file_path, content_markdown, content_structured, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      dto.folder_id,
      userId,
      dto.name,
      dto.file_type,
      dto.file_path || null,
      dto.content_markdown || null,
      dto.content_structured || null,
      dto.summary || null,
    );
    return this.getById(Number(result.lastInsertRowid), userId)!;
  }

  getById(id: number, userId: number = 1): KnowledgeFile | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM knowledge_files WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as KnowledgeFile | null;
  }

  update(id: number, dto: UpdateKnowledgeFileDTO, userId: number = 1): KnowledgeFile | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.folder_id !== undefined) { fields.push('folder_id = ?'); values.push(dto.folder_id); }
    if (dto.content_markdown !== undefined) { fields.push('content_markdown = ?'); values.push(dto.content_markdown); }
    if (dto.content_structured !== undefined) { fields.push('content_structured = ?'); values.push(dto.content_structured); }
    if (dto.summary !== undefined) { fields.push('summary = ?'); values.push(dto.summary); }

    if (fields.length === 0) return this.getById(id, userId);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    const stmt = db.prepare(`
      UPDATE knowledge_files SET ${fields.join(', ')} WHERE id = ? AND user_id = ?
    `);
    stmt.run(...values);
    return this.getById(id, userId);
  }

  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM knowledge_files WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  listByFolder(folderId: number, userId: number = 1): KnowledgeFile[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM knowledge_files WHERE folder_id = ? AND user_id = ? ORDER BY file_type, name ASC'
    );
    return stmt.all(folderId, userId) as KnowledgeFile[];
  }

  getByType(fileType: FileType, userId: number = 1): KnowledgeFile[] {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM knowledge_files WHERE file_type = ? AND user_id = ? ORDER BY created_at DESC'
    );
    return stmt.all(fileType, userId) as KnowledgeFile[];
  }
}
