import { Router } from 'express';
import { getOutputService } from '../services/OutputService.js';
import { TemplateRepository } from '../repositories/TemplateRepository.js';

const router = Router();
const outputService = getOutputService();
const templateRepo = new TemplateRepository();

// POST /api/output - Generate output
router.post('/', async (req, res) => {
  try {
    const { knowledgeIds, templateId, prompt, outputFormat } = req.body;

    if (!knowledgeIds || !Array.isArray(knowledgeIds) || knowledgeIds.length === 0) {
      return res.status(400).json({ error: 'knowledgeIds 是必需的，且必须是非空数组' });
    }

    const result = await outputService.generateOutput({
      knowledgeIds,
      templateId,
      prompt,
      outputFormat,
    });

    res.json({
      outputId: result.outputId,
      content: result.content,
      format: result.format,
    });
  } catch (error) {
    console.error('Output generation failed:', error);
    res.status(500).json({ 
      error: '输出生成失败',
      message: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// GET /api/templates - List templates
router.get('/templates', async (req, res) => {
  try {
    const { type } = req.query;
    const userId = 1; // Default user for MVP

    const templates = templateRepo.list(userId, type as 'preset' | 'custom' | undefined);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: '获取模板列表失败' });
  }
});

// POST /api/templates - Create custom template
router.post('/templates', async (req, res) => {
  try {
    const { name, content, description } = req.body;
    const userId = 1;

    if (!name || !content) {
      return res.status(400).json({ error: 'name 和 content 是必需的' });
    }

    const template = templateRepo.create({
      name,
      type: 'custom',
      content,
      description,
    }, userId);

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template failed:', error);
    res.status(500).json({ error: '创建模板失败' });
  }
});

// GET /api/output/history - Get output history
router.get('/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const userId = 1;

    const history = outputService.getHistory(userId, Number(limit));
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: '获取历史记录失败' });
  }
});

// GET /api/output/history/:id - Get output history by ID
router.get('/history/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = 1;

    const history = outputService.getHistoryById(id, userId);
    
    if (!history) {
      return res.status(404).json({ error: '未找到输出记录' });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: '获取输出记录失败' });
  }
});

export default router;
