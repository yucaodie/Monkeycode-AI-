import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'knowledge.db');

let db: Database.Database | null = null;

/**
 * Get database instance (singleton pattern)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Initialize database with all tables
 */
export function initializeDatabase(): void {
  const database = getDatabase();

  // Enable foreign keys
  database.pragma('foreign_keys = ON');

  // Create tables
  database.exec(`
    -- Knowledge table
    CREATE TABLE IF NOT EXISTS knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      content TEXT NOT NULL,
      original_type VARCHAR(20) NOT NULL,
      file_path VARCHAR(500),
      title VARCHAR(200),
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tags table
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name VARCHAR(50) NOT NULL UNIQUE,
      color VARCHAR(7),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Knowledge-Tags relationship
    CREATE TABLE IF NOT EXISTS knowledge_tags (
      knowledge_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (knowledge_id, tag_id),
      FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    -- Templates table
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      is_preset BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Output history table
    CREATE TABLE IF NOT EXISTS output_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      knowledge_ids TEXT NOT NULL,
      template_id INTEGER,
      prompt TEXT,
      output_content TEXT NOT NULL,
      output_format VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    -- Document structures table
    CREATE TABLE IF NOT EXISTS document_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      knowledge_id INTEGER NOT NULL,
      structure_json TEXT NOT NULL,
      headings TEXT,
      tables_count INTEGER DEFAULT 0,
      images_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE
    );

    -- Embeddings table
    CREATE TABLE IF NOT EXISTS embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      knowledge_id INTEGER NOT NULL,
      embedding TEXT NOT NULL,
      model VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (knowledge_id) REFERENCES knowledge(id) ON DELETE CASCADE
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_knowledge_user ON knowledge(user_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_created ON knowledge(created_at);
    CREATE INDEX IF NOT EXISTS idx_embeddings_knowledge ON embeddings(knowledge_id);

    -- ========== New tables for AI Notes & Knowledge Base ==========

    -- Notebooks table
    CREATE TABLE IF NOT EXISTS notebooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name VARCHAR(100) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notes table
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notebook_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      name VARCHAR(200) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE CASCADE
    );

    -- Note pages table
    CREATE TABLE IF NOT EXISTS note_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      title VARCHAR(300),
      content TEXT NOT NULL DEFAULT '',
      plain_text TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    -- Note page versions table
    CREATE TABLE IF NOT EXISTS note_page_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES note_pages(id) ON DELETE CASCADE
    );

    -- Knowledge folders table
    CREATE TABLE IF NOT EXISTS knowledge_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name VARCHAR(200) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Knowledge files table
    CREATE TABLE IF NOT EXISTS knowledge_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL DEFAULT 1,
      name VARCHAR(300) NOT NULL,
      file_type VARCHAR(10) NOT NULL,
      file_path VARCHAR(500),
      content_markdown TEXT,
      content_structured TEXT,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES knowledge_folders(id) ON DELETE CASCADE
    );

    -- Knowledge file embeddings table
    CREATE TABLE IF NOT EXISTS knowledge_file_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      embedding TEXT NOT NULL,
      model VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES knowledge_files(id) ON DELETE CASCADE
    );

    -- Note page references table (note <-> knowledge file linkage)
    CREATE TABLE IF NOT EXISTS note_page_refs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      ref_type VARCHAR(10) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (page_id) REFERENCES note_pages(id) ON DELETE CASCADE,
      FOREIGN KEY (file_id) REFERENCES knowledge_files(id) ON DELETE CASCADE,
      UNIQUE(page_id, file_id, ref_type)
    );

    -- AI model configs table
    CREATE TABLE IF NOT EXISTS ai_model_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(20) NOT NULL,
      api_base_url VARCHAR(500) NOT NULL,
      api_key VARCHAR(500) NOT NULL,
      model_identifier VARCHAR(200) NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      last_test_status VARCHAR(20),
      last_test_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Polymorphic tag associations table
    CREATE TABLE IF NOT EXISTS taggables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_id INTEGER NOT NULL,
      entity_type VARCHAR(20) NOT NULL,
      entity_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(tag_id, entity_type, entity_id)
    );

    -- ========== Indexes for new tables ==========
    CREATE INDEX IF NOT EXISTS idx_notebooks_user ON notebooks(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_notebook ON notes(notebook_id);
    CREATE INDEX IF NOT EXISTS idx_note_pages_note ON note_pages(note_id);
    CREATE INDEX IF NOT EXISTS idx_versions_page ON note_page_versions(page_id);
    CREATE INDEX IF NOT EXISTS idx_folders_user ON knowledge_folders(user_id);
    CREATE INDEX IF NOT EXISTS idx_files_folder ON knowledge_files(folder_id);
    CREATE INDEX IF NOT EXISTS idx_files_type ON knowledge_files(file_type);
    CREATE INDEX IF NOT EXISTS idx_kfe_file ON knowledge_file_embeddings(file_id);
    CREATE INDEX IF NOT EXISTS idx_model_configs_category ON ai_model_configs(user_id, category);
    CREATE INDEX IF NOT EXISTS idx_taggables_entity ON taggables(entity_type, entity_id);
  `);

  // Initialize preset templates
  initPresetTemplates(database);
}

/**
 * Initialize preset templates
 */
function initPresetTemplates(database: Database.Database): void {
  const checkStmt = database.prepare('SELECT COUNT(*) as count FROM templates WHERE is_preset = 1');
  const result = checkStmt.get() as { count: number };

  if (result.count === 0) {
    const insertStmt = database.prepare(`
      INSERT INTO templates (name, type, content, description, is_preset)
      VALUES (?, 'preset', ?, ?, 1)
    `);

    insertStmt.run(
      '技术方案文档',
      `# 技术方案：{{title}}

## 一、方案概述
{{summary}}

## 二、技术架构
{{architecture}}

## 三、核心功能
{{features}}

## 四、实施计划
{{implementation_plan}}

## 五、风险评估
{{risks}}

## 六、资源需求
{{resources}}
`,
      '标准的技术方案文档模板，包含架构、功能、实施计划等'
    );

    insertStmt.run(
      '项目申报表',
      `# 项目申报表

## 项目基本信息
- 项目名称：{{project_name}}
- 申报单位：{{organization}}
- 项目负责人：{{leader}}
- 申报日期：{{date}}

## 项目概述
{{summary}}

## 项目目标
{{objectives}}

## 技术路线
{{technical_approach}}

## 预期成果
{{expected_results}}

## 经费预算
{{budget}}

## 项目团队
{{team}}
`,
      '标准的项目申报表模板，包含基本信息、目标、技术路线等'
    );
  }
}
