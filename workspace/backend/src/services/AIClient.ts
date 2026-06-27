import OpenAI from 'openai';

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
const RETRY_DELAY = 1000; // 1 second

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * AI Client - OpenAI API wrapper with retry logic
 */
export class AIClient {
  private apiKey: string;
  private baseURL: string;
  private client: OpenAI | null = null;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  /**
   * Get or create OpenAI client
   */
  private getClient(): OpenAI | null {
    if (!this.apiKey) {
      return null;
    }
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      });
    }
    return this.client;
  }

  /**
   * Execute API call with retry logic
   */
  private async withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(`${operationName} attempt ${attempt} failed:`, error);

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(`${operationName} failed after ${MAX_RETRIES} retries: ${lastError?.message}`);
  }

  /**
   * Generate title from content
   */
  async generateTitle(content: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return '无标题';
    }

    return this.withRetry(async () => {
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的内容编辑，擅长为文章生成简洁准确的标题。请根据用户提供的内容，生成一个不超过 20 个字的中文标题。只返回标题，不要其他内容。',
          },
          {
            role: 'user',
            content: `请为以下内容生成一个标题：\n\n${content.substring(0, 1000)}`,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content?.trim() || '无标题';
    }, 'generateTitle');
  }

  /**
   * Generate summary from content
   */
  async generateSummary(content: string): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return '';
    }

    return this.withRetry(async () => {
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的内容摘要生成器。请根据用户提供的内容，生成一个 100-200 字的中文摘要，概括核心要点。只返回摘要，不要其他内容。',
          },
          {
            role: 'user',
            content: `请为以下内容生成摘要：\n\n${content.substring(0, 2000)}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    }, 'generateSummary');
  }

  /**
   * Generate tags from content
   */
  async generateTags(content: string): Promise<string[]> {
    const client = this.getClient();
    if (!client) {
      return [];
    }

    return this.withRetry(async () => {
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的内容分类专家。请根据用户提供的内容，生成 3-5 个标签（关键词）。标签应该是中文，每个标签不超过 10 个字。只返回标签列表，用逗号分隔，不要其他内容。',
          },
          {
            role: 'user',
            content: `请为以下内容生成标签：\n\n${content.substring(0, 1000)}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const tagsStr = completion.choices[0]?.message?.content?.trim() || '';
      return tagsStr
        .split(/[,，]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length <= 10)
        .slice(0, 5);
    }, 'generateTags');
  }

  /**
   * Generate output based on template and prompt
   */
  async generateOutput(
    knowledgeContent: string,
    templateContent: string,
    userPrompt?: string
  ): Promise<string> {
    const client = this.getClient();
    if (!client) {
      return knowledgeContent;
    }

    return this.withRetry(async () => {
      const systemPrompt = userPrompt
        ? `你是一个专业的文档整理助手。请根据用户的要求，将知识内容整理成指定格式。\n\n用户要求：${userPrompt}`
        : '你是一个专业的文档整理助手。请根据模板，将知识内容填充到模板中。保持模板的格式和结构。';

      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `模板：\n${templateContent}\n\n知识内容：\n${knowledgeContent.substring(0, 3000)}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      return completion.choices[0]?.message?.content || '';
    }, 'generateOutput');
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const client = this.getClient();
    if (!client) {
      return [];
    }

    return this.withRetry(async () => {
      const response = await client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0]?.embedding || [];
    }, 'generateEmbedding');
  }

  /**
   * Search similar content using embeddings
   */
  async searchBySemanticQuery(
    query: string,
    knowledgeEmbeddings: Array<{ id: number; embedding: number[] }>
  ): Promise<Array<{ id: number; score: number }>> {
    const client = this.getClient();
    if (!client) {
      // Return empty results if no client
      return [];
    }

    const queryEmbedding = await this.generateEmbedding(query);
    
    if (queryEmbedding.length === 0) {
      return [];
    }

    // Calculate cosine similarity
    const results = knowledgeEmbeddings.map(item => ({
      id: item.id,
      score: this.cosineSimilarity(queryEmbedding, item.embedding),
    }));

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
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

// Singleton instance
let aiClientInstance: AIClient | null = null;

export function getAIClient(): AIClient {
  if (!aiClientInstance) {
    aiClientInstance = new AIClient();
  }
  return aiClientInstance;
}
