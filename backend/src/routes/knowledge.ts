import { Router } from 'express';
import { KnowledgeRepository } from '../repositories/KnowledgeRepository.js';
import { TagRepository } from '../repositories/TagRepository.js';
import { getKnowledgeEnrichmentService } from '../services/KnowledgeEnrichmentService.js';
import { getSearchService } from '../services/SearchService.js';
import { CreateKnowledgeDTO, UpdateKnowledgeDTO } from '../models/Knowledge.js';
import { getDatabase } from '../utils/database.js';

const router = Router();
const knowledgeRepo = new KnowledgeRepository();
const tagRepo = new TagRepository();
const enrichmentService = getKnowledgeEnrichmentService();
const searchService = getSearchService();

// GET /api/knowledge - List knowledge
router.get('/', (req, res) => {
  try {
    const { tagId, limit, offset, orderBy, order } = req.query;
    
    const result = knowledgeRepo.list({
      tagId: tagId ? Number(tagId) : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
      orderBy: orderBy as 'created_at' | 'updated_at' | undefined,
      order: order as 'ASC' | 'DESC' | undefined,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list knowledge' });
  }
});

// GET /api/knowledge/:id - Get knowledge by ID
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const knowledge = knowledgeRepo.getById(id);

    if (!knowledge) {
      return res.status(404).json({ error: 'Knowledge not found' });
    }

    // Get associated tags
    const tags = tagRepo.getByKnowledgeId(id);
    
    res.json({ ...knowledge, tags });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get knowledge' });
  }
});

// POST /api/knowledge - Create knowledge
router.post('/', async (req, res) => {
  try {
    const dto: CreateKnowledgeDTO = req.body;
    
    if (!dto.content || !dto.original_type) {
      return res.status(400).json({ error: 'content and original_type are required' });
    }

    // Enrich with AI (async, non-blocking)
    const enrichment = await enrichmentService.enrichKnowledge(dto);
    
    // Merge AI-generated metadata
    const finalDto: CreateKnowledgeDTO = {
      ...dto,
      title: enrichment.title || dto.title,
      summary: enrichment.summary || dto.summary,
    };

    // Create knowledge in database
    const db = getDatabase();
    const transaction = db.transaction(() => {
      const knowledge = knowledgeRepo.create(finalDto);
      
      // Associate tags
      if (enrichment.tagIds.length > 0) {
        tagRepo.setTagsForKnowledge(knowledge.id, enrichment.tagIds);
      }
      
      return knowledge;
    });

    const knowledge = transaction();
    const tags = tagRepo.getByKnowledgeId(knowledge.id);
    
    // Index for semantic search (async, non-blocking)
    searchService.indexKnowledge(knowledge.id, dto.content).catch(err => {
      console.error('Failed to index knowledge for search:', err);
    });
    
    res.status(201).json({ ...knowledge, tags });
  } catch (error) {
    console.error('Failed to create knowledge:', error);
    res.status(500).json({ error: 'Failed to create knowledge' });
  }
});

// PUT /api/knowledge/:id - Update knowledge
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const dto: UpdateKnowledgeDTO = req.body;
    
    const knowledge = knowledgeRepo.update(id, dto);
    
    if (!knowledge) {
      return res.status(404).json({ error: 'Knowledge not found' });
    }

    // Handle tags if provided
    if (req.body.tagIds && Array.isArray(req.body.tagIds)) {
      tagRepo.setTagsForKnowledge(id, req.body.tagIds);
    }

    const tags = tagRepo.getByKnowledgeId(id);
    res.json({ ...knowledge, tags });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update knowledge' });
  }
});

// DELETE /api/knowledge/:id - Delete knowledge
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = knowledgeRepo.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Knowledge not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete knowledge' });
  }
});

// GET /api/knowledge/tags/list - Get all tags
router.get('/tags/list', (req, res) => {
  try {
    const tags = tagRepo.list();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tags' });
  }
});

export default router;
