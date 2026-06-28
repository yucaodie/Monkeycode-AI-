import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { NotebookRepository } from '../repositories/NotebookRepository.js';
import { NoteRepository } from '../repositories/NoteRepository.js';
import { NotePageRepository } from '../repositories/NotePageRepository.js';
import { NotePageVersionRepository } from '../repositories/NotePageVersionRepository.js';
import { KnowledgeFileRepository } from '../repositories/KnowledgeFileRepository.js';
import { KnowledgeFolderRepository } from '../repositories/KnowledgeFolderRepository.js';
import { CreateNotebookDTO, UpdateNotebookDTO } from '../models/Notebook.js';
import { CreateNoteDTO, UpdateNoteDTO } from '../models/Note.js';
import { CreateNotePageDTO, UpdateNotePageDTO } from '../models/NotePage.js';
import { getDatabase } from '../utils/database.js';

const router = Router();
const notebookRepo = new NotebookRepository();
const noteRepo = new NoteRepository();
const pageRepo = new NotePageRepository();
const versionRepo = new NotePageVersionRepository();
const fileRepo = new KnowledgeFileRepository();
const folderRepo = new KnowledgeFolderRepository();

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ==================== Notebooks ====================

router.get('/notebooks', (req, res) => {
  try {
    const notebooks = notebookRepo.list();
    res.json(notebooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list notebooks' });
  }
});

router.post('/notebooks', (req, res) => {
  try {
    const dto: CreateNotebookDTO = req.body;
    if (!dto.name) return res.status(400).json({ error: 'name is required' });
    const notebook = notebookRepo.create(dto);
    res.status(201).json(notebook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notebook' });
  }
});

router.put('/notebooks/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const dto: UpdateNotebookDTO = req.body;
    const notebook = notebookRepo.update(id, dto);
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notebook' });
  }
});

router.delete('/notebooks/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = notebookRepo.delete(id);
    if (!deleted) return res.status(404).json({ error: 'Notebook not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notebook' });
  }
});

// ==================== Tree ====================

router.get('/tree', (req, res) => {
  try {
    const notebooks = notebookRepo.list();
    const tree = notebooks.map(nb => {
      const notes = noteRepo.listByNotebook(nb.id);
      return {
        id: nb.id,
        name: nb.name,
        type: 'notebook' as const,
        children: notes.map(n => ({
          id: n.id,
          name: n.name,
          type: 'note' as const,
          children: [],
        })),
      };
    });
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: 'Failed to build tree' });
  }
});

// ==================== Notes ====================

router.get('/notebooks/:notebookId/notes', (req, res) => {
  try {
    const notebookId = Number(req.params.notebookId);
    const notebook = notebookRepo.getById(notebookId);
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });
    const notes = noteRepo.listByNotebook(notebookId);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

router.post('/notebooks/:notebookId/notes', (req, res) => {
  try {
    const notebookId = Number(req.params.notebookId);
    const notebook = notebookRepo.getById(notebookId);
    if (!notebook) return res.status(404).json({ error: 'Notebook not found' });

    const dto: CreateNoteDTO = { ...req.body, notebook_id: notebookId };
    if (!dto.name) return res.status(400).json({ error: 'name is required' });
    const note = noteRepo.create(dto);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/notes/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const dto: UpdateNoteDTO = req.body;

    if (dto.notebook_id !== undefined) {
      const target = notebookRepo.getById(dto.notebook_id);
      if (!target) return res.status(404).json({ error: 'Target notebook not found' });
    }

    const note = noteRepo.update(id, dto);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/notes/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = noteRepo.delete(id);
    if (!deleted) return res.status(404).json({ error: 'Note not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ==================== Note Pages ====================

router.get('/notes/:noteId/pages', (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    const note = noteRepo.getById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    const pages = pageRepo.listByNote(noteId);
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

router.post('/notes/:noteId/pages', (req, res) => {
  try {
    const noteId = Number(req.params.noteId);
    const note = noteRepo.getById(noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const dto: CreateNotePageDTO = { ...req.body, note_id: noteId };
    dto.content = dto.content || '';
    dto.plain_text = dto.plain_text || stripHtml(dto.content);

    const page = pageRepo.create(dto);
    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

router.get('/pages/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const page = pageRepo.getById(id);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get page' });
  }
});

router.put('/pages/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = pageRepo.getById(id);
    if (!existing) return res.status(404).json({ error: 'Page not found' });

    if (req.body.content !== undefined && req.body.content !== existing.content) {
      versionRepo.create(id, existing.content);
    }

    const dto: UpdateNotePageDTO = {};
    if (req.body.title !== undefined) dto.title = req.body.title;
    if (req.body.content !== undefined) {
      dto.content = req.body.content;
      dto.plain_text = req.body.plain_text || stripHtml(req.body.content);
    }
    if (req.body.sort_order !== undefined) dto.sort_order = req.body.sort_order;
    if (req.body.note_id !== undefined) {
      const targetNote = noteRepo.getById(req.body.note_id);
      if (!targetNote) return res.status(404).json({ error: 'Target note not found' });
      dto.note_id = req.body.note_id;
    }

    const page = pageRepo.update(id, dto);
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

router.delete('/pages/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = pageRepo.delete(id);
    if (!deleted) return res.status(404).json({ error: 'Page not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// ==================== Version History ====================

router.get('/pages/:id/versions', (req, res) => {
  try {
    const id = Number(req.params.id);
    const page = pageRepo.getById(id);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    const versions = versionRepo.listByPage(id);
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list versions' });
  }
});

router.post('/pages/:id/restore/:versionId', (req, res) => {
  try {
    const pageId = Number(req.params.id);
    const versionId = Number(req.params.versionId);

    const page = pageRepo.getById(pageId);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const version = versionRepo.getById(versionId);
    if (!version || version.page_id !== pageId) {
      return res.status(404).json({ error: 'Version not found' });
    }

    versionRepo.create(pageId, page.content);

    const updated = pageRepo.update(pageId, {
      content: version.content,
      plain_text: stripHtml(version.content),
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

// ==================== KB File Linking ====================

router.post('/pages/:id/link-file', (req, res) => {
  try {
    const pageId = Number(req.params.id);
    const { file_id, ref_type } = req.body;

    const page = pageRepo.getById(pageId);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    const file = fileRepo.getById(file_id);
    if (!file) return res.status(404).json({ error: 'File not found' });

    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO note_page_refs (page_id, file_id, ref_type) VALUES (?, ?, ?)'
    );
    const result = stmt.run(pageId, file_id, ref_type || 'link');

    res.status(201).json({ id: Number(result.lastInsertRowid), page_id: pageId, file_id, ref_type: ref_type || 'link' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link file' });
  }
});

// ==================== Export to KB ====================

const uploadsDir = path.join(__dirname, '../../uploads');

router.post('/pages/:id/export-to-kb', (req, res) => {
  try {
    const pageId = Number(req.params.id);
    const { folder_id } = req.body;

    const page = pageRepo.getById(pageId);
    if (!page) return res.status(404).json({ error: 'Page not found' });

    let targetFolderId = folder_id;
    if (!targetFolderId) {
      const folders = folderRepo.list();
      if (folders.length === 0) {
        return res.status(400).json({ error: 'No knowledge base folders exist. Please create a folder first.' });
      }
      targetFolderId = folders[0].id;
    }

    const folder = folderRepo.getById(targetFolderId);
    if (!folder) return res.status(404).json({ error: 'Target folder not found' });

    const plainText = page.plain_text || stripHtml(page.content);
    const filename = `${page.title || 'export'}.md`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, plainText, 'utf-8');

    const newFile = fileRepo.create({
      folder_id: targetFolderId,
      name: page.title || 'Exported Page',
      file_type: 'md',
      file_path: `/uploads/${filename}`,
      content_markdown: plainText,
    });

    const db = getDatabase();
    db.prepare(
      'INSERT OR IGNORE INTO note_page_refs (page_id, file_id, ref_type) VALUES (?, ?, ?)'
    ).run(pageId, newFile.id, 'embed');

    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export to KB' });
  }
});

export default router;
