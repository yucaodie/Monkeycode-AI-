import { getDatabase } from '../utils/database.js';
import { getAIClient } from './AIClient.js';
import { KnowledgeRepository } from '../repositories/KnowledgeRepository.js';
import { TemplateRepository } from '../repositories/TemplateRepository.js';
import { OutputHistoryRepository } from '../repositories/OutputHistoryRepository.js';

export interface GenerateOutputRequest {
  knowledgeIds: number[];
  templateId?: number;
  prompt?: string;
  outputFormat?: 'markdown' | 'word' | 'pdf';
}

export interface GenerateOutputResult {
  outputId: number;
  content: string;
  format: string;
}

/**
 * Output Generation Service
 */
export class OutputService {
  private aiClient = getAIClient();
  private knowledgeRepo = new KnowledgeRepository();
  private templateRepo = new TemplateRepository();
  private outputHistoryRepo = new OutputHistoryRepository();

  /**
   * Generate output based on knowledge and template/prompt
   */
  async generateOutput(request: GenerateOutputRequest, userId: number = 1): Promise<GenerateOutputResult> {
    const { knowledgeIds, templateId, prompt, outputFormat = 'markdown' } = request;

    // Get knowledge content
    const knowledgeItems = knowledgeIds.map(id => this.knowledgeRepo.getById(id, userId));
    const validKnowledge = knowledgeItems.filter(k => k !== null) as Array<typeof knowledgeItems[0]>;

    if (validKnowledge.length === 0) {
      throw new Error('未找到指定的知识片段');
    }

    // Combine knowledge content
    const combinedContent = validKnowledge
      .map(k => `## ${k.title || '无标题'}\n\n${k.content}`)
      .join('\n\n');

    let templateContent = '';
    let templateName = '';

    // Get template if specified
    if (templateId) {
      const template = this.templateRepo.getById(templateId, userId);
      if (template) {
        templateContent = template.content;
        templateName = template.name;
      }
    }

    // Generate output using AI
    let output: string;
    
    if (templateContent && !prompt) {
      // Use template
      output = await this.fillTemplate(templateContent, combinedContent);
    } else if (prompt) {
      // Use natural language prompt
      output = await this.generateFromPrompt(combinedContent, prompt, templateContent);
    } else {
      // Default: just return combined content
      output = combinedContent;
    }

    // Save to history
    const outputId = this.outputHistoryRepo.create({
      knowledge_ids: knowledgeIds,
      template_id: templateId,
      prompt: prompt || null,
      output_content: output,
      output_format: outputFormat,
    });

    return {
      outputId,
      content: output,
      format: outputFormat,
    };
  }

  /**
   * Fill template with knowledge content
   */
  private async fillTemplate(template: string, content: string): Promise<string> {
    // Simple placeholder replacement for basic templates
    let result = template;
    
    // Replace common placeholders
    result = result.replace(/{{title}}/g, '知识整理');
    result = result.replace(/{{content}}/g, content);
    result = result.replace(/{{summary}}/g, content.substring(0, 200) + '...');
    result = result.replace(/{{date}}/g, new Date().toLocaleDateString('zh-CN'));
    result = result.replace(/{{project_name}}/g, '知识项目');
    result = result.replace(/{{objectives}}/g, '整理和管理个人知识');
    result = result.replace(/{{technical_approach}}/g, '使用 AI 进行知识分类和检索');
    result = result.replace(/{{expected_results}}/g, '高效的知识管理系统');
    result = result.replace(/{{budget}}/g, '待填写');
    result = result.replace(/{{team}}/g, '待填写');
    result = result.replace(/{{organization}}/g, '待填写');
    result = result.replace(/{{leader}}/g, '待填写');

    // Use AI to intelligently fill the template if content is available
    if (content.length > 0) {
      try {
        const aiResult = await this.aiClient.generateOutput(content, result);
        if (aiResult && aiResult.length > 0) {
          result = aiResult;
        }
      } catch (error) {
        console.warn('AI template filling failed, using basic replacement:', error);
      }
    }

    return result;
  }

  /**
   * Generate output from natural language prompt
   */
  private async generateFromPrompt(
    content: string, 
    prompt: string,
    template?: string
  ): Promise<string> {
    const systemPrompt = template 
      ? `请根据以下模板和用户的要求，将知识内容整理成指定格式。\n\n参考模板：${template}`
      : '请根据用户的要求，将知识内容整理成指定格式。';

    return this.aiClient.generateOutput(
      content,
      systemPrompt,
      prompt
    );
  }

  /**
   * Get output history
   */
  getHistory(userId: number = 1, limit: number = 20) {
    return this.outputHistoryRepo.list(userId, limit);
  }

  /**
   * Get output history by ID
   */
  getHistoryById(id: number, userId: number = 1) {
    return this.outputHistoryRepo.getById(id, userId);
  }
}

// Singleton instance
let outputServiceInstance: OutputService | null = null;

export function getOutputService(): OutputService {
  if (!outputServiceInstance) {
    outputServiceInstance = new OutputService();
  }
  return outputServiceInstance;
}
