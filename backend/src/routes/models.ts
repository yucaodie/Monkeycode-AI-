import { Router } from 'express';
import { ModelConfigRepository } from '../repositories/ModelConfigRepository.js';
import { CreateModelConfigDTO, UpdateModelConfigDTO, MODEL_CATEGORIES } from '../models/ModelConfig.js';

const router = Router();
const modelConfigRepo = new ModelConfigRepository();

const VALID_CATEGORIES = new Set<string>(MODEL_CATEGORIES);

// GET /api/models - List all model configs, optionally filter by category
router.get('/', (req, res) => {
  try {
    const { category, grouped } = req.query;

    if (grouped === 'true') {
      const result = modelConfigRepo.getByCategory();
      return res.json(result);
    }

    if (category) {
      const cat = category as string;
      if (!VALID_CATEGORIES.has(cat)) {
        return res.status(400).json({ error: `Invalid category. Must be one of: ${MODEL_CATEGORIES.join(', ')}` });
      }
      const models = modelConfigRepo.list(1, cat as any);
      return res.json(models);
    }

    const models = modelConfigRepo.list();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list model configs' });
  }
});

// POST /api/models - Create a new model config
router.post('/', (req, res) => {
  try {
    const dto: CreateModelConfigDTO = req.body;

    if (!dto.name || !dto.category || !dto.api_base_url || !dto.api_key || !dto.model_identifier) {
      return res.status(400).json({ error: 'name, category, api_base_url, api_key, and model_identifier are required' });
    }

    if (!VALID_CATEGORIES.has(dto.category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${MODEL_CATEGORIES.join(', ')}` });
    }

    const model = modelConfigRepo.create(dto);
    res.status(201).json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create model config' });
  }
});

// PUT /api/models/:id - Update a model config
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const dto: UpdateModelConfigDTO = req.body;

    const model = modelConfigRepo.update(id, dto);

    if (!model) {
      return res.status(404).json({ error: 'Model config not found' });
    }

    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update model config' });
  }
});

// DELETE /api/models/:id - Delete a model config
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = modelConfigRepo.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Model config not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete model config' });
  }
});

// POST /api/models/:id/test - Test model connectivity
router.post('/:id/test', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const model = modelConfigRepo.getById(id);

    if (!model) {
      return res.status(404).json({ error: 'Model config not found' });
    }

    const baseUrl = model.api_base_url.replace(/\/+$/, '');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${model.api_key}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        modelConfigRepo.updateTestStatus(id, 'ok');
        return res.json({ status: 'ok', httpStatus: response.status });
      } else if (response.status === 401 || response.status === 403) {
        modelConfigRepo.updateTestStatus(id, 'fail');
        return res.json({ status: 'fail', httpStatus: response.status, error: 'Authentication failed' });
      } else {
        modelConfigRepo.updateTestStatus(id, 'fail');
        return res.json({ status: 'fail', httpStatus: response.status, error: `Unexpected status: ${response.status}` });
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        modelConfigRepo.updateTestStatus(id, 'timeout');
        return res.json({ status: 'timeout', error: 'Connection timed out after 10 seconds' });
      }
      modelConfigRepo.updateTestStatus(id, 'fail');
      return res.json({ status: 'fail', error: fetchErr.message || 'Unknown connection error' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to test model connectivity' });
  }
});

// PUT /api/models/:id/default - Set as default model for its category
router.put('/:id/default', (req, res) => {
  try {
    const id = Number(req.params.id);
    const model = modelConfigRepo.setDefault(id);

    if (!model) {
      return res.status(404).json({ error: 'Model config not found' });
    }

    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set default model' });
  }
});

export default router;
