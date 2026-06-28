import { Router } from 'express';
import { getQAService } from '../services/QAService.js';

const router = Router();

router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'question is required' });
    }

    const qaService = getQAService();
    const result = await qaService.ask(question.trim());
    res.json(result);
  } catch (error) {
    console.error('QA route error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

export default router;
