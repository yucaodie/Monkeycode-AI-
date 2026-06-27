import { AIClient, getAIClient } from './AIClient.js';
import { TagRepository } from '../repositories/TagRepository.js';
import { CreateKnowledgeDTO } from '../models/Knowledge.js';

export interface KnowledgeEnrichmentResult {
  title?: string;
  summary?: string;
  tagIds: number[];
}

/**
 * AI Enhancement Service for knowledge processing
 */
export class KnowledgeEnrichmentService {
  private aiClient: AIClient;
  private tagRepository: TagRepository;

  constructor() {
    this.aiClient = getAIClient();
    this.tagRepository = new TagRepository();
  }

  /**
   * Enrich knowledge with AI-generated metadata
   */
  async enrichKnowledge(dto: CreateKnowledgeDTO): Promise<KnowledgeEnrichmentResult> {
    const result: KnowledgeEnrichmentResult = {
      tagIds: [],
    };

    try {
      // Generate tags first (most important)
      const tags = await this.aiClient.generateTags(dto.content);
      result.tagIds = await this.ensureTagsExist(tags);

      // Generate title
      result.title = await this.aiClient.generateTitle(dto.content);

      // Generate summary
      result.summary = await this.aiClient.generateSummary(dto.content);

      return result;
    } catch (error) {
      console.error('AI enrichment failed:', error);
      // Return empty enrichment on failure (knowledge will be saved without AI metadata)
      return result;
    }
  }

  /**
   * Ensure tags exist in database, create if not
   */
  private async ensureTagsExist(tagNames: string[]): Promise<number[]> {
    const tagIds: number[] = [];

    for (const tagName of tagNames) {
      let tag = this.tagRepository.getByName(tagName);

      if (!tag) {
        // Generate a random color for the tag
        const color = this.generateRandomColor();
        tag = this.tagRepository.create({
          name: tagName,
          color,
        });
      }

      if (tag) {
        tagIds.push(tag.id);
      }
    }

    return tagIds;
  }

  /**
   * Generate random hex color for tags
   */
  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEAA7', // Yellow
      '#DDA0DD', // Plum
      '#98D8C8', // Mint
      '#F7DC6F', // Sunflower
      '#BB8FCE', // Purple
      '#85C1E9', // Sky Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Generate response based on knowledge and user query
   */
  async generateResponse(
    knowledgeContent: string,
    userQuery: string
  ): Promise<string> {
    return this.aiClient.generateOutput(knowledgeContent, userQuery);
  }
}

// Singleton instance
let enrichmentServiceInstance: KnowledgeEnrichmentService | null = null;

export function getKnowledgeEnrichmentService(): KnowledgeEnrichmentService {
  if (!enrichmentServiceInstance) {
    enrichmentServiceInstance = new KnowledgeEnrichmentService();
  }
  return enrichmentServiceInstance;
}
