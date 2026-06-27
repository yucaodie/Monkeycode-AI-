import pdfParse from 'pdf-parse';
import fs from 'fs';

export interface ParsedDocument {
  text: string;
  title?: string;
  headings: string[];
  pageCount: number;
  metadata?: {
    Author?: string;
    Title?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
  };
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
 * Parse PDF file and extract text and structure
 */
export async function parsePDF(filePath: string): Promise<ParsedDocument & { structure: DocumentStructure }> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  // Extract metadata
  const metadata: ParsedDocument['metadata'] = {};
  if (data.info) {
    if (data.info.Title) metadata.Title = data.info.Title;
    if (data.info.Author) metadata.Author = data.info.Author;
    if (data.info.Subject) metadata.Subject = data.info.Subject;
    if (data.info.Creator) metadata.Creator = data.info.Creator;
    if (data.info.Producer) metadata.Producer = data.info.Producer;
    if (data.info.CreationDate) metadata.CreationDate = data.info.CreationDate;
  }

  // Parse structure (headings and paragraphs)
  const structure = parseDocumentStructure(data.text);

  return {
    text: data.text,
    title: metadata.Title || structure.headings[0]?.text,
    headings: structure.headings.map(h => h.text),
    pageCount: data.numpages,
    metadata,
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
    
    // Detect headings (short lines, often with numbering)
    if (isHeading(trimmed)) {
      // Save current paragraph if exists
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = '';
      }
      
      // Add heading
      const level = detectHeadingLevel(trimmed);
      headings.push({
        level,
        text: trimmed,
      });
    } else {
      // Accumulate paragraph
      if (currentParagraph.length > 0) {
        currentParagraph += ' ' + trimmed;
      } else {
        currentParagraph = trimmed;
      }
    }
  }
  
  // Save last paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }
  
  // Estimate tables and images (PDF parse doesn't provide this directly)
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
  if (line.length > 100) return false;
  
  const headingPatterns = [
    /^\d+(\.\d+)*\s+/,
    /^[A-Z][^.!?]*$/,
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
    return numberedMatch.length - 1;
  }
  
  if (/^第 [一二三四五六七八九十百]+[章节条]/.test(line)) {
    return 1;
  }
  
  if (line.length < 20) {
    return 1;
  }
  
  return 2;
}

/**
 * Count table references in text
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
 * Count image references in text
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
