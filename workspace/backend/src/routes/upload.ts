import { Router } from 'express';
import upload from '../middleware/upload.js';
import { parsePDF } from '../services/PdfParser.js';
import { parseWord } from '../services/WordParser.js';
import { parseImage } from '../services/ImageParser.js';
import { getDatabase } from '../utils/database.js';
import { KnowledgeRepository } from '../repositories/KnowledgeRepository.js';
import { TagRepository } from '../repositories/TagRepository.js';
import { DocumentStructureRepository } from '../repositories/DocumentStructureRepository.js';
import { getSearchService } from '../services/SearchService.js';
import { getKnowledgeEnrichmentService } from '../services/KnowledgeEnrichmentService.js';

const router = Router();
const knowledgeRepo = new KnowledgeRepository();
const tagRepo = new TagRepository();
const docStructureRepo = new DocumentStructureRepository();
const searchService = getSearchService();
const enrichmentService = getKnowledgeEnrichmentService();

// POST /api/upload - Upload and parse file
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未找到上传文件' });
    }

    const file = req.file;
    const userId = 1; // Default user for MVP

    // Determine file type
    let originalType: 'pdf' | 'word' | 'image' = 'pdf';
    if (file.mimetype.includes('word') || file.originalname.endsWith('.docx') || file.originalname.endsWith('.doc')) {
      originalType = 'word';
    } else if (file.mimetype.includes('image')) {
      originalType = 'image';
    } else if (!file.mimetype.includes('pdf') && !file.originalname.endsWith('.pdf')) {
      return res.status(400).json({ error: '不支持的文件类型，仅支持 PDF、Word 和图片格式' });
    }

    // Parse document based on type
    let parsedData;
    try {
      if (originalType === 'pdf') {
        parsedData = await parsePDF(file.path);
      } else if (originalType === 'word') {
        parsedData = await parseWord(file.path);
      } else if (originalType === 'image') {
        parsedData = await parseImage(file.path);
      }
    } catch (parseError) {
      console.error('Parsing failed:', parseError);
      return res.status(500).json({ 
        error: '文件解析失败', 
        message: parseError instanceof Error ? parseError.message : '未知错误' 
      });
    }

    // Enrich with AI
    const enrichment = await enrichmentService.enrichKnowledge({
      content: parsedData.text,
      original_type: originalType,
      file_path: file.filename,
    });

    // Create knowledge entry
    const db = getDatabase();
    const transaction = db.transaction(() => {
      const knowledge = knowledgeRepo.create({
        content: parsedData.text,
        original_type: originalType,
        file_path: file.filename,
        title: enrichment.title || parsedData.title || file.originalname,
        summary: enrichment.summary,
      });

      // Associate tags
      if (enrichment.tagIds.length > 0) {
        tagRepo.setTagsForKnowledge(knowledge.id, enrichment.tagIds);
      }

      // Save document structure
      if (parsedData.structure) {
        docStructureRepo.create(knowledge.id, {
          structure_json: JSON.stringify(parsedData.structure),
          headings: JSON.stringify(parsedData.structure.headings),
          tables_count: parsedData.structure.tablesCount,
          images_count: parsedData.structure.imagesCount,
        });
      }

      return knowledge;
    });

    const knowledge = transaction();
    const tags = tagRepo.getByKnowledgeId(knowledge.id);

    // Index for semantic search (async)
    searchService.indexKnowledge(knowledge.id, parsedData.text).catch(err => {
      console.error('Failed to index knowledge for search:', err);
    });

    res.status(201).json({
      ...knowledge,
      tags,
      original_name: file.originalname,
      file_size: file.size,
      page_count: (parsedData as any).pageCount,
      headings: parsedData.headings || [],
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

export default router;
