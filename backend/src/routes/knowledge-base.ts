import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { KnowledgeFolderRepository } from '../repositories/KnowledgeFolderRepository.js';
import { KnowledgeFileRepository } from '../repositories/KnowledgeFileRepository.js';
import { CreateKnowledgeFolderDTO, UpdateKnowledgeFolderDTO } from '../models/KnowledgeFolder.js';
import { CreateKnowledgeFileDTO, UpdateKnowledgeFileDTO, FileType } from '../models/KnowledgeFile.js';
import { getFileParserService } from '../services/FileParserService.js';
import { getKBService } from '../services/KBService.js';

const router = Router();
const folderRepo = new KnowledgeFolderRepository();
const fileRepo = new KnowledgeFileRepository();

const uploadsDir = path.join(__dirname, '../../uploads');
const knowledgeUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function detectFileType(filename: string): FileType {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.md':
    case '.markdown':
      return 'md';
    case '.docx':
      return 'docx';
    case '.pdf':
      return 'pdf';
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.webp':
    case '.bmp':
      return 'image';
    default:
      return 'md';
  }
}

// ==================== Folders ====================

router.get('/folders', (req, res) => {
  try {
    const folders = folderRepo.list();
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list folders' });
  }
});

router.post('/folders', (req, res) => {
  try {
    const dto: CreateKnowledgeFolderDTO = req.body;
    if (!dto.name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const folder = folderRepo.create(dto);
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

router.put('/folders/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const dto: UpdateKnowledgeFolderDTO = req.body;
    const folder = folderRepo.update(id, dto);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

router.delete('/folders/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = folderRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// ==================== Files ====================

router.get('/folders/:folderId/files', (req, res) => {
  try {
    const folderId = Number(req.params.folderId);
    const folder = folderRepo.getById(folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    const files = fileRepo.listByFolder(folderId);
    const summary = files.map(({ content_markdown, content_structured, ...rest }) => rest);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

router.post('/folders/:folderId/files', knowledgeUpload.single('file'), async (req, res) => {
  try {
    const folderId = Number(req.params.folderId);
    const folder = folderRepo.getById(folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const fileType = detectFileType(req.file.originalname);
    const displayName = req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname));
    const filePath = path.join(uploadsDir, req.file.filename);

    const parserService = getFileParserService();
    const parseResult = await parserService.parse(filePath, fileType);

    const dto: CreateKnowledgeFileDTO = {
      folder_id: folderId,
      name: displayName,
      file_type: fileType,
      file_path: `/uploads/${req.file.filename}`,
      content_markdown: parseResult.content_markdown,
      content_structured: parseResult.content_structured || undefined,
    };

    const file = fileRepo.create(dto);

    parserService.enrichWithAI(parseResult.content_markdown).then(enrichment => {
      if (enrichment.summary || enrichment.tagIds.length > 0) {
        fileRepo.update(file.id, {
          summary: enrichment.summary || undefined,
        });
      }
    }).catch(err => {
      console.error('Async AI enrichment failed:', err);
    });

    getKBService().indexFile(file.id).catch(err => {
      console.error('Async KB indexing failed:', err);
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.get('/files/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const file = fileRepo.getById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file' });
  }
});

router.get('/files/:id/content', (req, res) => {
  try {
    const id = Number(req.params.id);
    const file = fileRepo.getById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({
      id: file.id,
      name: file.name,
      file_type: file.file_type,
      content_markdown: file.content_markdown,
      content_structured: file.content_structured ? JSON.parse(file.content_structured) : null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

router.put('/files/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const dto: UpdateKnowledgeFileDTO = req.body;

    if (dto.folder_id !== undefined) {
      const targetFolder = folderRepo.getById(dto.folder_id);
      if (!targetFolder) {
        return res.status(404).json({ error: 'Target folder not found' });
      }
    }

    const file = fileRepo.update(id, dto);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update file' });
  }
});

router.delete('/files/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = fileRepo.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

router.get('/files/:id/refs', (req, res) => {
  try {
    const { getDatabase } = require('../utils/database.js');
    const id = Number(req.params.id);
    const file = fileRepo.getById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT npr.*, np.title as page_title
      FROM note_page_refs npr
      JOIN note_pages np ON np.id = npr.page_id
      WHERE npr.file_id = ?
    `);
    const refs = stmt.all(id);
    res.json(refs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file references' });
  }
});

export default router;
