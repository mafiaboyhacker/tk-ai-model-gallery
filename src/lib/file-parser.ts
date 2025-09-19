import { FileType } from '@prisma/client';

// File parsing utility based on real user data patterns
export interface ParsedFileMetadata {
  aiGenerationTool: string | null;
  extractedPrompt: string | null;
  seriesUuid: string | null;
  variationNumber: number | null;
  fileType: FileType;
  originalFilename: string;
}

// Pattern matching for different AI generation tools
export const AI_TOOL_PATTERNS = {
  u3934589919: /^u3934589919_(.+?)_([a-f0-9-]{36})_(\d+)\.(png|mp4)$/i,
  social_u3934589919: /^social_u3934589919_(.+?)_([a-f0-9-]{36})_(\d+)\.(mp4)$/i,
  generation: /^generation-([a-f0-9-]{36})\.(png|jpeg|jpg)$/i,
  imgvnf: /^imgvnf_(.+?)_([a-f0-9-]{36})_(\d+)\.(png|jpeg|jpg)$/i,
};

/**
 * Parse filename to extract AI model metadata
 * Based on real user data analysis of 601 files
 */
export function parseFilename(filename: string): ParsedFileMetadata {
  const lowerFilename = filename.toLowerCase();
  
  // Determine file type
  const fileType: FileType = /\.(mp4|mov|avi)$/i.test(filename) ? 'VIDEO' : 'IMAGE';
  
  // Try to match against known patterns
  for (const [toolName, pattern] of Object.entries(AI_TOOL_PATTERNS)) {
    const match = filename.match(pattern);
    
    if (match) {
      switch (toolName) {
        case 'u3934589919':
          return {
            aiGenerationTool: 'u3934589919',
            extractedPrompt: cleanPromptText(match[1]),
            seriesUuid: match[2],
            variationNumber: parseInt(match[3]),
            fileType,
            originalFilename: filename,
          };
          
        case 'social_u3934589919':
          return {
            aiGenerationTool: 'social_u3934589919',
            extractedPrompt: cleanPromptText(match[1]),
            seriesUuid: match[2],
            variationNumber: parseInt(match[3]),
            fileType,
            originalFilename: filename,
          };
          
        case 'generation':
          return {
            aiGenerationTool: 'generation',
            extractedPrompt: null, // Generation pattern doesn't include prompt
            seriesUuid: match[1],
            variationNumber: null,
            fileType,
            originalFilename: filename,
          };
          
        case 'imgvnf':
          return {
            aiGenerationTool: 'imgvnf',
            extractedPrompt: cleanPromptText(match[1]),
            seriesUuid: match[2],
            variationNumber: parseInt(match[3]),
            fileType,
            originalFilename: filename,
          };
      }
    }
  }
  
  // Fallback for unrecognized patterns
  return {
    aiGenerationTool: null,
    extractedPrompt: extractGenericPrompt(filename),
    seriesUuid: null,
    variationNumber: null,
    fileType,
    originalFilename: filename,
  };
}

/**
 * Clean and format prompt text extracted from filenames
 */
function cleanPromptText(promptText: string): string {
  return promptText
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .trim();
}

/**
 * Extract prompt from generic filenames
 */
function extractGenericPrompt(filename: string): string | null {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Skip if it looks like a generic filename
  if (/^(img|image|photo|video|file)\d*$/i.test(nameWithoutExt)) {
    return null;
  }
  
  // Clean up generic filename
  return cleanPromptText(nameWithoutExt);
}

/**
 * Batch process multiple files
 */
export function batchParseFiles(filenames: string[]): ParsedFileMetadata[] {
  return filenames.map(parseFilename);
}

/**
 * Group files by series UUID
 */
export function groupFilesBySeries(parsedFiles: ParsedFileMetadata[]): Map<string, ParsedFileMetadata[]> {
  const groups = new Map<string, ParsedFileMetadata[]>();
  
  parsedFiles.forEach(file => {
    if (file.seriesUuid) {
      if (!groups.has(file.seriesUuid)) {
        groups.set(file.seriesUuid, []);
      }
      groups.get(file.seriesUuid)!.push(file);
    }
  });
  
  return groups;
}

/**
 * Get file statistics
 */
export function getFileStatistics(parsedFiles: ParsedFileMetadata[]) {
  const stats = {
    total: parsedFiles.length,
    images: parsedFiles.filter(f => f.fileType === 'IMAGE').length,
    videos: parsedFiles.filter(f => f.fileType === 'VIDEO').length,
    withPrompts: parsedFiles.filter(f => f.extractedPrompt).length,
    withSeries: parsedFiles.filter(f => f.seriesUuid).length,
    tools: {} as Record<string, number>,
  };
  
  // Count by AI generation tool
  parsedFiles.forEach(file => {
    const tool = file.aiGenerationTool || 'unknown';
    stats.tools[tool] = (stats.tools[tool] || 0) + 1;
  });
  
  return stats;
}

/**
 * Validate file for upload
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFile(filename: string, size?: number): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };
  
  // Check file extension
  const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.mov', '.avi'];
  const hasValidExtension = supportedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExtension) {
    result.errors.push(`Unsupported file type. Supported: ${supportedExtensions.join(', ')}`);
    result.isValid = false;
  }
  
  // Check file size if provided (default 100MB limit)
  const maxSizeBytes = 100 * 1024 * 1024; // 100MB
  if (size && size > maxSizeBytes) {
    result.errors.push(`File size exceeds 100MB limit`);
    result.isValid = false;
  }
  
  // Check filename length
  if (filename.length > 255) {
    result.errors.push('Filename too long (max 255 characters)');
    result.isValid = false;
  }
  
  // Warnings for optimization
  if (filename.toLowerCase().endsWith('.jpeg') || filename.toLowerCase().endsWith('.jpg')) {
    result.warnings.push('JPEG files will be converted to WebP for optimization');
  }
  
  return result;
}