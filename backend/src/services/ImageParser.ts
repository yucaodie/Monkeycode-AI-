import Tesseract from 'tesseract.js';
import fs from 'fs';
import sharp from 'sharp';

export interface ParsedImage {
  text: string;
  confidence: number;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

/**
 * Parse image with OCR and extract text
 */
export async function parseImage(filePath: string): Promise<ParsedImage> {
  try {
    // Get image metadata first
    const metadata = await sharp(filePath).metadata();
    
    // Preprocess image for better OCR
    const processedPath = await preprocessImage(filePath);
    
    // Perform OCR
    const result = await Tesseract.recognize(processedPath, 'chi_sim+eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${((m.progress || 0) * 100).toFixed(0)}%`);
        }
      },
    });
    
    // Clean up processed file
    if (processedPath !== filePath) {
      fs.unlinkSync(processedPath);
    }
    
    return {
      text: result.text.trim(),
      confidence: result.confidence || 0,
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
      },
    };
  } catch (error) {
    console.error('OCR failed:', error);
    throw new Error(`Image OCR failed: ${error}`);
  }
}

/**
 * Preprocess image for better OCR results
 */
async function preprocessImage(filePath: string): Promise<string> {
  try {
    const metadata = await sharp(filePath).metadata();
    const outputDir = require('path').dirname(filePath);
    const outputFilename = require('path').basename(filePath, require('path').extname(filePath)) + '_processed.png';
    const outputPath = require('path').join(outputDir, outputFilename);
    
    // Convert to PNG and enhance contrast
    await sharp(filePath)
      .toColorspace('srgb')
      .normalise()
      .png()
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Image preprocessing failed, using original:', error);
    return filePath;
  }
}
