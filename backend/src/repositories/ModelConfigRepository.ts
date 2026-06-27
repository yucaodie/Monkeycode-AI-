import { getDatabase } from '../utils/database.js';
import {
  ModelConfig,
  CreateModelConfigDTO,
  UpdateModelConfigDTO,
  ModelCategory,
} from '../models/ModelConfig.js';

export class ModelConfigRepository {
  create(dto: CreateModelConfigDTO, userId: number = 1): ModelConfig {
    const db = getDatabase();

    const transaction = db.transaction(() => {
      if (dto.is_default) {
        this._clearDefaultForCategory(dto.category, userId);
      }

      const stmt = db.prepare(`
        INSERT INTO ai_model_configs (user_id, name, category, api_base_url, api_key, model_identifier, is_default, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        userId,
        dto.name,
        dto.category,
        dto.api_base_url,
        dto.api_key,
        dto.model_identifier,
        dto.is_default ? 1 : 0,
        dto.is_active !== undefined ? (dto.is_active ? 1 : 0) : 1,
      );

      return Number(result.lastInsertRowid);
    });

    const id = transaction();
    return this.getById(id, userId)!;
  }

  getById(id: number, userId: number = 1): ModelConfig | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ai_model_configs WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as ModelConfig | null;
  }

  update(id: number, dto: UpdateModelConfigDTO, userId: number = 1): ModelConfig | null {
    const db = getDatabase();

    const existing = this.getById(id, userId);
    if (!existing) return null;

    const transaction = db.transaction(() => {
      if (dto.is_default) {
        this._clearDefaultForCategory(existing.category, userId);
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (dto.name !== undefined) { fields.push('name = ?'); values.push(dto.name); }
      if (dto.api_base_url !== undefined) { fields.push('api_base_url = ?'); values.push(dto.api_base_url); }
      if (dto.api_key !== undefined) { fields.push('api_key = ?'); values.push(dto.api_key); }
      if (dto.model_identifier !== undefined) { fields.push('model_identifier = ?'); values.push(dto.model_identifier); }
      if (dto.is_default !== undefined) {
        fields.push('is_default = ?');
        values.push(dto.is_default ? 1 : 0);
      }
      if (dto.is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(dto.is_active ? 1 : 0);
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');

      if (fields.length > 1) {
        values.push(id, userId);
        const stmt = db.prepare(`
          UPDATE ai_model_configs
          SET ${fields.join(', ')}
          WHERE id = ? AND user_id = ?
        `);
        stmt.run(...values);
      }
    });

    transaction();
    return this.getById(id, userId);
  }

  delete(id: number, userId: number = 1): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM ai_model_configs WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  list(userId: number = 1, category?: ModelCategory): ModelConfig[] {
    const db = getDatabase();
    let query = 'SELECT * FROM ai_model_configs WHERE user_id = ?';
    const params: any[] = [userId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, is_default DESC, created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params) as ModelConfig[];
  }

  getByCategory(userId: number = 1): Record<ModelCategory, ModelConfig[]> {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM ai_model_configs WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
    );
    const all = stmt.all(userId) as ModelConfig[];

    const grouped: Record<ModelCategory, ModelConfig[]> = {
      chat: [],
      embedding: [],
      reranker: [],
    };

    for (const config of all) {
      grouped[config.category].push(config);
    }

    return grouped;
  }

  getDefault(category: ModelCategory, userId: number = 1): ModelConfig | null {
    const db = getDatabase();
    const stmt = db.prepare(
      'SELECT * FROM ai_model_configs WHERE user_id = ? AND category = ? AND is_default = 1 AND is_active = 1'
    );
    return stmt.get(userId, category) as ModelConfig | null;
  }

  setDefault(id: number, userId: number = 1): ModelConfig | null {
    const db = getDatabase();
    const config = this.getById(id, userId);
    if (!config) return null;

    const transaction = db.transaction(() => {
      this._clearDefaultForCategory(config.category, userId);

      const stmt = db.prepare(
        'UPDATE ai_model_configs SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
      );
      stmt.run(id, userId);
    });

    transaction();
    return this.getById(id, userId);
  }

  updateTestStatus(id: number, status: string, userId: number = 1): void {
    const db = getDatabase();
    const stmt = db.prepare(
      'UPDATE ai_model_configs SET last_test_status = ?, last_test_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    );
    stmt.run(status, id, userId);
  }

  private _clearDefaultForCategory(category: ModelCategory, userId: number): void {
    const db = getDatabase();
    const stmt = db.prepare(
      'UPDATE ai_model_configs SET is_default = 0 WHERE user_id = ? AND category = ? AND is_default = 1'
    );
    stmt.run(userId, category);
  }
}
