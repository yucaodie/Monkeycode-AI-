import OpenAI from 'openai';
import { ModelConfigRepository } from '../repositories/ModelConfigRepository.js';

export interface AIGenerateTitleResult {
  title: string;
}

export interface AIGenerateSummaryResult {
  summary: string;
}

export interface AIGenerateTagsResult {
  tags: string[];
}

export interface AIGenerateOutputResult {
  content: string;
}

export interface AIEmbeddingResult {
  embedding: number[];
  model: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class AIClient {
  private modelConfigRepo: ModelConfigRepository;

  constructor() {
    this.modelConfigRepo = new ModelConfigRepository();
  }

  private async withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`${operationName} attempt ${attempt} failed:`, error);

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt);
        }
      }
    }

    throw new Error(`${operationName} failed after ${MAX_RETRIES} retries: ${lastError?.message}`);
  }

  /**
   * Get default model config for a category, with env fallback for chat
   */
  private getDefaultModelFor(category: 'chat' | 'embedding' | 'reranker') {
    const dbConfig = this.modelConfigRepo.getDefault(category);
    if (dbConfig) {
      return dbConfig;
    }

    if (category === 'chat') {
      const apiKey = process.env.OPENAI_API_KEY;
      const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      if (apiKey) {
        return {
          api_base_url: baseURL,
          api_key: apiKey,
          model_identifier: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        };
      }
    }

    if (category === 'embedding') {
      const apiKey = process.env.OPENAI_API_KEY;
      const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      if (apiKey) {
        return {
          api_base_url: baseURL,
          api_key: apiKey,
          model_identifier: 'text-embedding-ada-002',
        };
      }
    }

    return null;
  }

  /**
   * Core chat completion method - creates temp client from DB config each call
   */
  async chatComplete(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { max_tokens?: number; temperature?: number }
  ): Promise<string> {
    const config = this.getDefaultModelFor('chat');
    if (!config) {
      return '';
    }

    const client = new OpenAI({
      apiKey: config.api_key,
      baseURL: config.api_base_url,
    });

    return this.withRetry(async () => {
      const completion = await client.chat.completions.create({
        model: config.model_identifier,
        messages,
        max_tokens: options?.max_tokens ?? 200,
        temperature: options?.temperature ?? 0.7,
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    }, 'chatComplete');
  }

  async generateTitle(content: string): Promise<string> {
    try {
      const title = await this.chatComplete(
        [
          {
            role: 'system',
            content: '你是一个专业的内容编辑，擅长为文章生成简洁准确的标题。请根据用户提供的内容，生成一个不超过 20 个字的中文标题。只返回标题，不要其他内容。',
          },
          {
            role: 'user',
            content: `请为以下内容生成一个标题：\n\n${content.substring(0, 1000)}`,
          },
        ],
        { max_tokens: 50, temperature: 0.7 }
      );

      return title || '无标题';
    } catch {
      return '无标题';
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      return await this.chatComplete(
        [
          {
            role: 'system',
            content: '你是一个专业的内容摘要生成器。请根据用户提供的内容，生成一个 100-200 字的中文摘要，概括核心要点。只返回摘要，不要其他内容。',
          },
          {
            role: 'user',
            content: `请为以下内容生成摘要：\n\n${content.substring(0, 2000)}`,
          },
        ],
        { max_tokens: 200, temperature: 0.7 }
      );
    } catch {
      return '';
    }
  }

  async generateTags(content: string): Promise<string[]> {
    try {
      const tagsStr = await this.chatComplete(
        [
          {
            role: 'system',
            content: '你是一个专业的内容分类专家。请根据用户提供的内容，生成 3-5 个标签（关键词）。标签应该是中文，每个标签不超过 10 个字。只返回标签列表，用逗号分隔，不要其他内容。',
          },
          {
            role: 'user',
            content: `请为以下内容生成标签：\n\n${content.substring(0, 1000)}`,
          },
        ],
        { max_tokens: 100, temperature: 0.7 }
      );

      return tagsStr
        .split(/[,，]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length <= 10)
        .slice(0, 5);
    } catch {
      return [];
    }
  }

  async generateOutput(
    knowledgeContent: string,
    templateContent: string,
    userPrompt?: string
  ): Promise<string> {
    const config = this.getDefaultModelFor('chat');
    if (!config) {
      return knowledgeContent;
    }

    const systemPrompt = userPrompt
      ? `你是一个专业的文档整理助手。请根据用户的要求，将知识内容整理成指定格式。\n\n用户要求：${userPrompt}`
      : '你是一个专业的文档整理助手。请根据模板，将知识内容填充到模板中。保持模板的格式和结构。';

    try {
      return await this.chatComplete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `模板：\n${templateContent}\n\n知识内容：\n${knowledgeContent.substring(0, 3000)}` },
        ],
        { max_tokens: 2000, temperature: 0.7 }
      );
    } catch {
      return knowledgeContent;
    }
  }

  /**
   * Generate embedding for text using configured embedding model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const config = this.getDefaultModelFor('embedding');
    if (!config) {
      return [];
    }

    const client = new OpenAI({
      apiKey: config.api_key,
      baseURL: config.api_base_url,
    });

    return this.withRetry(async () => {
      const response = await client.embeddings.create({
        model: config.model_identifier,
        input: text,
      });

      return response.data[0]?.embedding || [];
    }, 'generateEmbedding');
  }

  /**
   * Rerank documents based on query relevance.
   * If no reranker model configured, returns documents in original order.
   */
  async rerank(
    query: string,
    documents: Array<{ content: string; [key: string]: any }>
  ): Promise<Array<{ index: number; score: number; document: any }>> {
    const config = this.getDefaultModelFor('reranker');
    if (!config) {
      return documents.map((doc, i) => ({ index: i, score: 0, document: doc }));
    }

    const client = new OpenAI({
      apiKey: config.api_key,
      baseURL: config.api_base_url,
    });

    return this.withRetry(async () => {
      const response = await client.chat.completions.create({
        model: config.model_identifier,
        messages: [
          {
            role: 'system',
            content: 'You are a relevance scoring assistant. For each document, assign a relevance score (0-100) based on how well it matches the query. Return a JSON array of objects with "index" and "score" fields, sorted by score descending. Only return the JSON array, nothing else.',
          },
          {
            role: 'user',
            content: `Query: ${query}\n\nDocuments:\n${documents.map((d, i) => `[${i}]: ${d.content?.substring(0, 500) || JSON.stringify(d)}`).join('\n\n')}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      });

      const text = response.choices[0]?.message?.content?.trim() || '[]';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]) as Array<{ index: number; score: number }>;
        return scores
          .sort((a, b) => b.score - a.score)
          .map(s => ({ index: s.index, score: s.score, document: documents[s.index] }));
      }

      return documents.map((doc, i) => ({ index: i, score: 0, document: doc }));
    }, 'rerank');
  }

  /**
   * Search similar content using embeddings
   */
  async searchBySemanticQuery(
    query: string,
    knowledgeEmbeddings: Array<{ id: number; embedding: number[] }>
  ): Promise<Array<{ id: number; score: number }>> {
    if (knowledgeEmbeddings.length === 0) {
      return [];
    }

    const queryEmbedding = await this.generateEmbedding(query);

    if (queryEmbedding.length === 0) {
      return [];
    }

    const results = knowledgeEmbeddings.map(item => ({
      id: item.id,
      score: this.cosineSimilarity(queryEmbedding, item.embedding),
    }));

    results.sort((a, b) => b.score - a.score);

    return results;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}

let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    aiClientInstance = new AIClient();
  }
  return aiClientInstance;
}
