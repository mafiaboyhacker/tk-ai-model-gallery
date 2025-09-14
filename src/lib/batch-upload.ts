import { prisma } from './prisma';
import { parseFilename, validateFile, type ParsedFileMetadata } from './file-parser';
import { uploadFile, generateVideoThumbnail } from './blob-storage';
import { FileType, Category, ProcessingStatus, BatchStatus } from '@prisma/client';

export interface BatchUploadConfig {
  batchName: string;
  sourceDirectory?: string;
  uploadedById: string;
  autoClassify?: boolean;
  autoExtractMeta?: boolean;
  autoGenerateTags?: boolean;
  defaultCategory?: Category;
}

export interface FileUploadData {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

export interface BatchUploadResult {
  batchId: string;
  totalFiles: number;
  processedFiles: number;
  successfulFiles: number;
  failedFiles: number;
  errors: string[];
}

/**
 * Create a new batch upload session
 */
export async function createUploadBatch(
  files: FileUploadData[],
  config: BatchUploadConfig
): Promise<string> {
  const batch = await prisma.uploadBatch.create({
    data: {
      batchName: config.batchName,
      totalFiles: files.length,
      uploadedById: config.uploadedById,
      sourceDirectory: config.sourceDirectory,
      autoClassify: config.autoClassify ?? true,
      autoExtractMeta: config.autoExtractMeta ?? true,
      autoGenerateTags: config.autoGenerateTags ?? true,
      status: BatchStatus.PROCESSING,
    },
  });
  
  return batch.id;
}

/**
 * Process batch upload with intelligent categorization
 */
export async function processBatchUpload(
  files: FileUploadData[],
  config: BatchUploadConfig
): Promise<BatchUploadResult> {
  const batchId = await createUploadBatch(files, config);
  
  const result: BatchUploadResult = {
    batchId,
    totalFiles: files.length,
    processedFiles: 0,
    successfulFiles: 0,
    failedFiles: 0,
    errors: [],
  };
  
  try {
    // Process files in chunks to avoid overwhelming the system
    const chunkSize = 10;
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      
      await Promise.all(
        chunk.map(async (file) => {
          try {
            await processSingleFile(file, config, batchId);
            result.successfulFiles++;
          } catch (error) {
            result.failedFiles++;
            result.errors.push(`${file.filename}: ${error}`);
          }
          result.processedFiles++;
        })
      );
      
      // Update batch progress
      await prisma.uploadBatch.update({
        where: { id: batchId },
        data: {
          processedFiles: result.processedFiles,
          successfulFiles: result.successfulFiles,
          failedFiles: result.failedFiles,
        },
      });
    }
    
    // Mark batch as completed
    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.COMPLETED,
        completedAt: new Date(),
        errorLog: result.errors.length > 0 ? result.errors.join('\\n') : null,
      },
    });
    
  } catch (error) {
    // Mark batch as failed
    await prisma.uploadBatch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.FAILED,
        errorLog: `Batch processing failed: ${error}`,
      },
    });
    
    throw error;
  }
  
  return result;
}

/**
 * Process a single file upload
 */
async function processSingleFile(
  file: FileUploadData,
  config: BatchUploadConfig,
  batchId: string
): Promise<void> {
  // Validate file
  const validation = validateFile(file.filename, file.size);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Parse filename for metadata
  const metadata = parseFilename(file.filename);
  
  // Generate slug from filename
  const slug = generateSlug(file.filename);
  
  // Auto-classify category if enabled
  const category = config.autoClassify 
    ? await autoClassifyFile(metadata, file.buffer)
    : config.defaultCategory ?? Category.SPECIAL;
  
  // Generate tags if enabled
  const tags = config.autoGenerateTags
    ? await generateTags(metadata)
    : [];
  
  // Upload file to Vercel Blob
  let fileUrl: string;
  let thumbnailUrl: string | null = null;
  
  if (metadata.fileType === FileType.VIDEO) {
    // Upload video and generate thumbnail
    const videoResult = await uploadFile(file.buffer, file.filename);
    const thumbnailResult = await generateVideoThumbnail(file.buffer, file.filename);
    
    fileUrl = videoResult.url;
    thumbnailUrl = thumbnailResult.url;
  } else {
    // Upload image with optimization
    const imageResult = await uploadFile(file.buffer, file.filename, {
      format: 'webp',
      quality: 85,
      sizes: [
        { width: 150, height: 150, suffix: 'thumb' },
        { width: 300, height: 300, suffix: 'small' },
      ],
    });
    
    fileUrl = imageResult.url;
    // Use first thumbnail as the main thumbnail
    thumbnailUrl = imageResult.thumbnails?.[0]?.url || null;
  }
  
  // Create AI model record
  await prisma.aIModel.create({
    data: {
      name: metadata.extractedPrompt || file.filename.replace(/\\.[^/.]+$/, ''),
      slug,
      fileType: metadata.fileType,
      originalFilename: metadata.originalFilename,
      fileUrl,
      thumbnailUrl,
      fileSize: file.size,
      aiGenerationTool: metadata.aiGenerationTool,
      extractedPrompt: metadata.extractedPrompt,
      seriesUuid: metadata.seriesUuid,
      variationNumber: metadata.variationNumber,
      category,
      tags,
      uploadedById: config.uploadedById,
      uploadBatchId: batchId,
      processingStatus: ProcessingStatus.COMPLETED, // Will be PROCESSING when we add actual file upload
      altText: `AI generated ${metadata.fileType.toLowerCase()}: ${metadata.extractedPrompt || 'model'}`,
    },
  });
}

/**
 * Generate URL-safe slug from filename
 */
function generateSlug(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Auto-classify file based on metadata and content analysis
 */
async function autoClassifyFile(
  metadata: ParsedFileMetadata,
  buffer: Buffer
): Promise<Category> {
  // Basic classification based on prompt content
  if (!metadata.extractedPrompt) {
    return Category.SPECIAL;
  }
  
  const prompt = metadata.extractedPrompt.toLowerCase();
  
  // Simple keyword-based classification
  if (prompt.includes('korean') || prompt.includes('asian') || prompt.includes('japanese') || prompt.includes('chinese')) {
    return Category.ASIAN;
  }
  
  if (prompt.includes('european') || prompt.includes('western') || prompt.includes('caucasian')) {
    return Category.EUROPEAN;
  }
  
  if (prompt.includes('african') || prompt.includes('black')) {
    return Category.AFRICAN_AMERICAN;
  }
  
  if (prompt.includes('hispanic') || prompt.includes('latino') || prompt.includes('latina')) {
    return Category.HISPANIC;
  }
  
  return Category.SPECIAL; // Default fallback
}

/**
 * Generate tags based on extracted prompt and metadata
 */
async function generateTags(metadata: ParsedFileMetadata): Promise<string[]> {
  const tags: string[] = [];
  
  // Add AI tool as tag
  if (metadata.aiGenerationTool) {
    tags.push(metadata.aiGenerationTool);
  }
  
  // Add file type tag
  tags.push(metadata.fileType.toLowerCase());
  
  // Extract tags from prompt
  if (metadata.extractedPrompt) {
    const prompt = metadata.extractedPrompt.toLowerCase();
    
    // Common descriptors
    const descriptors = [
      'beautiful', 'stunning', 'cute', 'pretty', 'elegant', 'gorgeous',
      'professional', 'casual', 'formal', 'trendy', 'vintage',
      'portrait', 'headshot', 'full body', 'close up',
      'fashion', 'beauty', 'makeup', 'hair', 'style',
      'indoor', 'outdoor', 'studio', 'natural', 'urban',
    ];
    
    descriptors.forEach(desc => {
      if (prompt.includes(desc)) {
        tags.push(desc);
      }
    });
    
    // Age-related tags
    if (prompt.includes('20s') || prompt.includes('twenties')) tags.push('young-adult');
    if (prompt.includes('30s') || prompt.includes('thirties')) tags.push('adult');
    if (prompt.includes('teenager') || prompt.includes('teen')) tags.push('teen');
  }
  
  // Series indicator
  if (metadata.seriesUuid) {
    tags.push('series');
  }
  
  // Remove duplicates and limit to reasonable number
  return [...new Set(tags)].slice(0, 10);
}

/**
 * Get batch upload status
 */
export async function getBatchStatus(batchId: string) {
  return await prisma.uploadBatch.findUnique({
    where: { id: batchId },
  });
}

/**
 * Get all models from a specific batch
 */
export async function getBatchModels(batchId: string) {
  return await prisma.aIModel.findMany({
    where: { uploadBatchId: batchId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Retry failed batch processing
 */
export async function retryFailedBatch(batchId: string): Promise<BatchUploadResult> {
  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
  });
  
  if (!batch || batch.status !== BatchStatus.FAILED) {
    throw new Error('Batch not found or not in failed state');
  }
  
  // Reset batch status
  await prisma.uploadBatch.update({
    where: { id: batchId },
    data: {
      status: BatchStatus.PROCESSING,
      processedFiles: 0,
      successfulFiles: 0,
      failedFiles: 0,
      errorLog: null,
    },
  });
  
  // This would require re-processing logic - placeholder for now
  throw new Error('Retry functionality not yet implemented');
}