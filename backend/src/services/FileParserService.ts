import fs from 'fs';
import { parsePDF } from './PdfParser.js';
import { parseWord } from './WordParser.js';
import { parseImage } from './ImageParser.js';
import { getAIClient } from './AIClient.js';
import { TagRepository } from '../repositories/TagRepository.js';
import { FileType } from '../models/KnowledgeFile.js';

export interface FileParseResult {
  content_markdown: string;
  content_structured: string | null;
  summary: string | null;
  tagIds: number[];
}

export class FileParserService {
  private tagRepo = new TagRepository();

  async parse(filePath: string, fileType: FileType): Promise<FileParseResult> {
    switch (fileType) {
      case 'md':
        return this.parseMarkdown(filePath);
      case 'docx':
        return this.parseDocx(filePath);
      case 'pdf':
        return this.parsePdf(filePath);
      case 'image':
        return this.parseImageFile(filePath);
      default:
        return { content_markdown: '', content_structured: null, summary: null, tagIds: [] };
    }
  }

  async enrichWithAI(content: string): Promise<{ summary: string | null; tagIds: number[] }> {
    try {
      const aiClient = getAIClient();

      const [tags, summary] = await Promise.all([
        aiClient.generateTags(content),
        aiClient.generateSummary(content),
      ]);

      const tagIds = await this.ensureTagsExist(tags);

      return { summary: summary || null, tagIds };
    } catch (error) {
      console.error('AI enrichment for file failed:', error);
      return { summary: null, tagIds: [] };
    }
  }

  private parseMarkdown(filePath: string): FileParseResult {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { content_markdown: content, content_structured: null, summary: null, tagIds: [] };
  }

  private async parseDocx(filePath: string): Promise<FileParseResult> {
    const result = await parseWord(filePath);
    const structured = {
      title: result.title,
      headings: result.structure.headings,
      paragraphs: result.structure.paragraphs.slice(0, 20),
      tablesCount: result.structure.tablesCount,
      imagesCount: result.structure.imagesCount,
    };
    return {
      content_markdown: result.text,
      content_structured: JSON.stringify(structured),
      summary: null,
      tagIds: [],
    };
  }

  private async parsePdf(filePath: string): Promise<FileParseResult> {
    const result = await parsePDF(filePath);
    const structured = {
      title: result.metadata?.Title || result.headings[0],
      metadata: result.metadata,
      headings: result.structure.headings,
      paragraphs: result.structure.paragraphs.slice(0, 20),
      pageCount: result.pageCount,
      tablesCount: result.structure.tablesCount,
      imagesCount: result.structure.imagesCount,
    };
    return {
      content_markdown: result.text,
      content_structured: JSON.stringify(structured),
      summary: null,
      tagIds: [],
    };
  }

  private async parseImageFile(filePath: string): Promise<FileParseResult> {
    const result = await parseImage(filePath);
    return {
      content_markdown: result.text,
      content_structured: JSON.stringify({
        confidence: result.confidence,
        width: result.metadata?.width,
        height: result.metadata?.height,
        format: result.metadata?.format,
      }),
      summary: null,
      tagIds: [],
    };
  }

  private async ensureTagsExist(tagNames: string[]): Promise<number[]> {
    const tagIds: number[] = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

    for (const tagName of tagNames) {
      let tag = this.tagRepo.getByName(tagName);
      if (!tag) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        tag = this.tagRepo.create({ name: tagName, color });
      }
      if (tag) tagIds.push(tag.id);
    }

    return tagIds;
  }
}

let fileParserInstance: FileParserService | null = null;

export function getFileParserService(): FileParserService {
  if (!fileParserInstance) {
    fileParserInstance = new FileParserService();
  }
  return fileParserInstance;
}
