import { getDatabase } from '../utils/database.js';
import { DocumentStructure, CreateDocumentStructureDTO } from '../models/DocumentStructure.js';

export class DocumentStructureRepository {
  /**
   * Create document structure entry
   */
  create(knowledgeId: number, dto: CreateDocumentStructureDTO): void {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO document_structures 
        (knowledge_id, structure_json, headings, tables_count, images_count)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      knowledgeId,
      dto.structure_json,
      dto.headings || null,
      dto.tables_count || 0,
      dto.images_count || 0
    );
  }

  /**
   * Get document structure by knowledge ID
   */
  getByKnowledgeId(knowledgeId: number): DocumentStructure | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM document_structures WHERE knowledge_id = ?');
    return stmt.get(knowledgeId) as DocumentStructure | null;
  }

  /**
   * Delete document structure
   */
  deleteByKnowledgeId(knowledgeId: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM document_structures WHERE knowledge_id = ?');
    stmt.run(knowledgeId);
  }
}
