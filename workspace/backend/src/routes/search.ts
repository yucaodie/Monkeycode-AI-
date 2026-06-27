import { Router } from 'express';
import { getSearchService } from '../services/SearchService.js';

const router = Router();
const searchService = getSearchService();

// GET /api/search - Semantic search
router.get('/', async (req, res) => {
  try {
    const { q, limit, minScore } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await searchService.search(q, {
      limit: limit ? Number(limit) : 10,
      minScore: minScore ? Number(minScore) : 0.3,
    });

    res.json({
      results: results.map(r => ({
        id: r.id,
        score: r.score,
        ...r.knowledge,
      })),
      total: results.length,
      query: q,
    });
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
