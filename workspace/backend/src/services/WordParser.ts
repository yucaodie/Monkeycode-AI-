import mammoth from 'mammoth';
import fs from 'fs';

export interface ParsedWordDocument {
  text: string;
  title?: string;
  headings: string[];
}

export interface DocumentStructure {
  headings: Array<{
    level: number;
    text: string;
  }>;
  paragraphs: string[];
  tablesCount: number;
  imagesCount: number;
}

/**
 * Parse Word document (.docx) and extract text and structure
 */
export async function parseWord(filePath: string): Promise<ParsedWordDocument & { structure: DocumentStructure }> {
  const arrayBuffer = fs.readFileSync(filePath);
  
  // Parse with style map to preserve headings
  const result = await mammoth.extractRawText({
    arrayBuffer,
  });
  
  const text = result.value;
  const warnings = result.messages;
  
  if (warnings.length > 0) {
    console.warn('Word parsing warnings:', warnings);
  }
  
  // Parse structure
  const structure = parseDocumentStructure(text);
  
  // Extract title from first heading
  const title = structure.headings[0]?.text || extractTitleFromText(text);
  
  return {
    text,
    title,
    headings: structure.headings.map(h => h.text),
    structure,
  };
}

/**
 * Parse document structure from text
 */
function parseDocumentStructure(text: string): DocumentStructure {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const headings: DocumentStructure['headings'] = [];
  const paragraphs: string[] = [];
  
  let currentParagraph = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect headings
    if (isHeading(trimmed)) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      
      const level = detectHeadingLevel(trimmed);
      headings.push({
        level,
        text: trimmed,
      });
    } else {
      if (currentParagraph.length > 0) {
        currentParagraph += ' ' + trimmed;
      } else {
        currentParagraph = trimmed;
      }
    }
  }
  
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }
  
  const tablesCount = countTableReferences(text);
  const imagesCount = countImageReferences(text);
  
  return {
    headings,
    paragraphs,
    tablesCount,
    imagesCount,
  };
}

/**
 * Check if a line is likely a heading
 */
function isHeading(line: string): boolean {
  if (line.length > 150) return false;
  
  const headingPatterns = [
    /^\d+(\.\d+)*\s+/,
    /^#+\s+/,
    /^[A-Z][^.!?]{0,80}$/,
    /^第 [一二三四五六七八九十百]+[章节条]/,
  ];
  
  return headingPatterns.some(pattern => pattern.test(line));
}

/**
 * Detect heading level
 */
function detectHeadingLevel(line: string): number {
  const numberedMatch = line.match(/^(\d+)(?:\.(\d+))*/);
  if (numberedMatch) {
    const parts = numberedMatch[0].split('.');
    return parts.length;
  }
  
  const markdownMatch = line.match(/^(#+)\s+/);
  if (markdownMatch) {
    return markdownMatch[1].length;
  }
  
  if (/^第 [一二三四五六七八九十百]+[章节条]/.test(line)) {
    return 1;
  }
  
  if (line.length < 30) {
    return 1;
  }
  
  return 2;
}

/**
 * Extract title from text
 */
function extractTitleFromText(text: string): string | undefined {
  const firstLine = text.split('\n').find(line => line.trim().length > 0);
  return firstLine?.trim();
}

/**
 * Count table references
 */
function countTableReferences(text: string): number {
  const patterns = [/表\s*\d+/g, /table\s*\d+/gi, /表格\s*\d+/g];
  let count = 0;
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  
  return Math.min(count, 20);
}

/**
 * Count image references
 */
function countImageReferences(text: string): number {
  const patterns = [/图\s*\d+/g, /figure\s*\d+/gi, /图片\s*\d+/g, /插图\s*\d+/g];
  let count = 0;
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  
  return Math.min(count, 50);
}
