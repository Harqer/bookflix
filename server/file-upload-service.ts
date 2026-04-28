import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';

/**
 * FileUploadService - Handles PDF, EPUB, DOCX file parsing and text extraction
 * Supports full-book processing with automatic chapter detection
 */

interface ExtractedBook {
  title: string;
  author: string;
  rawText: string;
  chapters: Array<{
    number: number;
    title: string;
    content: string;
  }>;
  metadata: {
    wordCount: number;
    estimatedPages: number;
    fileType: string;
    extractedAt: Date;
  };
}

interface ChapterDetectionResult {
  chapters: Array<{ title: string; startIndex: number; endIndex: number }>;
  confidence: number;
}

/**
 * Extract text from PDF using pdfjs-dist
 */
export async function extractPDF(filePath: string): Promise<string> {
  try {
    // Dynamic import to avoid bundling issues
    const pdfParse = require('pdf-parse');
    const fileBuffer = await fs.readFile(filePath);
    const pdfData = await pdfParse(fileBuffer);
    
    // Extract text from all pages
    const text = pdfData.text || '';
    return normalizeText(text);
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from EPUB using epub library
 */
export async function extractEPUB(filePath: string): Promise<string> {
  try {
    const EPub = require('epub');
    
    return new Promise((resolve, reject) => {
      const epub = new EPub(filePath);
      
      epub.on('end', () => {
        const chapters: string[] = [];
        
        // Extract text from each chapter
        epub.spine.contents.forEach((chapter: any) => {
          epub.getChapter(chapter, (error: any, text: string) => {
            if (!error) {
              chapters.push(text);
            }
          });
        });
        
        const fullText = chapters.join('\n\n');
        resolve(normalizeText(fullText));
      });
      
      epub.on('error', (error: any) => {
        reject(new Error(`Failed to extract EPUB: ${error.message}`));
      });
      
      epub.parse();
    });
  } catch (error) {
    console.error('EPUB extraction error:', error);
    throw new Error(`Failed to extract EPUB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX using docx library
 */
export async function extractDOCX(filePath: string): Promise<string> {
  try {
    const { Document } = require('docx');
    const { readFile } = require('docx');
    
    const buffer = await fs.readFile(filePath);
    const doc = await readFile(buffer);
    
    // Extract paragraphs
    const paragraphs = doc.sections
      .flatMap((section: any) => section.children)
      .filter((child: any) => child.type === 'paragraph')
      .map((para: any) => para.text || '')
      .join('\n');
    
    return normalizeText(paragraphs);
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize extracted text - remove extra whitespace, fix encoding issues
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
    .replace(/[ \t]{2,}/g, ' ') // Remove excessive spaces
    .trim();
}

/**
 * Detect chapters in raw text using heuristics
 * Looks for common chapter patterns: "Chapter 1", "CHAPTER 1", "1.", etc.
 */
export function detectChapters(text: string): ChapterDetectionResult {
  const chapterPatterns = [
    /^CHAPTER\s+(\d+):\s*(.+?)$/gim,
    /^Chapter\s+(\d+):\s*(.+?)$/gm,
    /^(\d+)\.\s+(.+?)$/gm,
    /^PART\s+(\d+):\s*(.+?)$/gim,
    /^Part\s+(\d+):\s*(.+?)$/gm,
  ];

  const chapters: Array<{ title: string; startIndex: number; endIndex: number }> = [];
  const lines = text.split('\n');
  
  let chapterCount = 0;
  let lastChapterIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const pattern of chapterPatterns) {
      const match = pattern.exec(line);
      if (match) {
        const chapterNum = parseInt(match[1]);
        const chapterTitle = match[2] || `Chapter ${chapterNum}`;
        
        // Calculate character indices
        const startIndex = text.indexOf(line);
        
        if (chapters.length > 0) {
          chapters[chapters.length - 1].endIndex = startIndex;
        }
        
        chapters.push({
          title: chapterTitle,
          startIndex,
          endIndex: text.length // Will be updated when next chapter is found
        });
        
        chapterCount++;
        pattern.lastIndex = 0; // Reset regex
      }
    }
  }

  // Calculate confidence based on chapter regularity
  const confidence = chapterCount > 0 ? Math.min(chapterCount / 50, 1.0) : 0;

  return { chapters, confidence };
}

/**
 * Extract chapters from detected chapter boundaries
 */
export function extractChapters(
  text: string,
  detectionResult: ChapterDetectionResult
): Array<{ number: number; title: string; content: string }> {
  return detectionResult.chapters.map((chapter, index) => ({
    number: index + 1,
    title: chapter.title,
    content: text.substring(chapter.startIndex, chapter.endIndex).trim()
  }));
}

/**
 * Main function to process uploaded book file
 */
export async function processBookFile(
  filePath: string,
  fileName: string,
  title?: string,
  author?: string
): Promise<ExtractedBook> {
  try {
    const fileExtension = path.extname(fileName).toLowerCase();
    let rawText = '';

    // Extract text based on file type
    switch (fileExtension) {
      case '.pdf':
        rawText = await extractPDF(filePath);
        break;
      case '.epub':
        rawText = await extractEPUB(filePath);
        break;
      case '.docx':
      case '.doc':
        rawText = await extractDOCX(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    if (!rawText || rawText.length < 100) {
      throw new Error('Extracted text is too short or empty');
    }

    // Detect chapters
    const detectionResult = detectChapters(rawText);
    const chapters = extractChapters(rawText, detectionResult);

    // If no chapters detected, create single chapter
    if (chapters.length === 0) {
      chapters.push({
        number: 1,
        title: 'Chapter 1',
        content: rawText
      });
    }

    // Calculate metadata
    const wordCount = rawText.split(/\s+/).length;
    const estimatedPages = Math.ceil(wordCount / 250); // ~250 words per page

    return {
      title: title || path.basename(fileName, fileExtension),
      author: author || 'Unknown',
      rawText,
      chapters,
      metadata: {
        wordCount,
        estimatedPages,
        fileType: fileExtension,
        extractedAt: new Date()
      }
    };
  } catch (error) {
    console.error('Book file processing error:', error);
    throw error;
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Validate file before processing
 */
export async function validateFile(
  filePath: string,
  maxSizeMB: number = 100
): Promise<{ valid: boolean; error?: string }> {
  try {
    const stats = await fs.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      return { valid: false, error: `File size ${fileSizeMB.toFixed(1)}MB exceeds limit of ${maxSizeMB}MB` };
    }

    const supportedExtensions = ['.pdf', '.epub', '.docx', '.doc'];
    const fileExtension = path.extname(filePath).toLowerCase();

    if (!supportedExtensions.includes(fileExtension)) {
      return { valid: false, error: `Unsupported file type: ${fileExtension}` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
