import { getDatabase } from '../utils/database.js';
import { Template, CreateTemplateDTO, UpdateTemplateDTO } from '../models/Template.js';

export class TemplateRepository {
  /**
   * Create a new template
   */
  create(dto: CreateTemplateDTO, userId: number = 1): Template {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO templates (user_id, name, type, content, description, is_preset)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      dto.name,
      dto.type,
      dto.content,
      dto.description || null,
      dto.is_preset ? 1 : 0
    );

    return this.getById(Number(result.lastInsertRowid), userId)!;
  }

  /**
   * Get template by ID
   */
  getById(id: number, userId: number = 1): Template | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ? AND (user_id = ? OR is_preset = 1)');
    return stmt.get(id, userId) as Template | null;
  }

  /**
   * Update template
   */
  update(id: number, dto: UpdateTemplateDTO, userId: number = 1): Template | null {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) {
      fields.push('name = ?');
      values.push(dto.name);
    }
    if (dto.content !== undefined) {
      fields.push('content = ?');
      values.push(dto.content);
    }
    if (dto.description !== undefined) {
      fields.push('description = ?');
      values.push(dto.description);
    }

    if (fields.length === 0) {
      return this.getById(id, userId);
    }

    values.push(id, userId);

    const stmt = db.prepare(`
      UPDATE templates 
      SET ${fields.join(', ')}
      WHERE id = ? AND (user_id = ? OR is_preset = 1)
    `);

    stmt.run(...values);
    return this.getById(id, userId);
  }

  /**
   * Delete template
   */
  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM templates WHERE id = ? AND user_id = ? AND is_preset = 0');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  /**
   * List all templates
   */
  list(userId: number = 1, type?: 'preset' | 'custom'): Template[] {
    const db = getDatabase();
    let query = 'SELECT * FROM templates WHERE user_id = ? OR is_preset = 1';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY is_preset DESC, created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params) as Template[];
  }

  /**
   * Get preset templates only
   */
  getPresetTemplates(): Template[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM templates WHERE is_preset = 1 ORDER BY name');
    return stmt.all() as Template[];
  }

  /**
   * Get custom templates for user
   */
  getCustomTemplates(userId: number = 1): Template[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM templates WHERE user_id = ? AND is_preset = 0 ORDER BY created_at DESC');
    return stmt.all(userId) as Template[];
  }
}
