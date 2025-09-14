import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import mime from 'mime-types';

export interface ImageProcessingOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  sizes?: { width: number; height: number; suffix: string }[];
}

export interface UploadResult {
  url: string;
  downloadUrl?: string;
  thumbnails?: { size: string; url: string }[];
}

/**
 * Upload file to Vercel Blob with automatic image optimization
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  options: ImageProcessingOptions = {}
): Promise<UploadResult> {
  const mimeType = mime.lookup(filename) || 'application/octet-stream';
  
  let processedBuffer = buffer;
  let finalFilename = filename;
  
  // Process images with Sharp
  if (mimeType.startsWith('image/')) {
    const { quality = 85, format = 'webp' } = options;
    
    processedBuffer = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .resize(2048, 2048, { // Max dimensions
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, { quality })
      .toBuffer();
    
    // Update filename
    const newExtension = format === 'jpeg' ? 'jpg' : format;
    finalFilename = filename.replace(/\\.[^/.]+$/, `.${newExtension}`);
  }
  
  // Upload main file to Vercel Blob
  const blob = await put(finalFilename, processedBuffer, {
    access: 'public',
    addRandomSuffix: true,
  });
  
  // Generate thumbnails if sizes specified and it's an image
  const thumbnails = [];
  if (mimeType.startsWith('image/') && options.sizes && options.sizes.length > 0) {
    for (const size of options.sizes) {
      const thumbnailBuffer = await sharp(buffer)
        .rotate()
        .resize(size.width, size.height, { fit: 'cover' })
        .toFormat(options.format || 'webp', { quality: (options.quality || 85) - 5 })
        .toBuffer();
      
      const thumbnailFilename = `thumb-${size.suffix}-${finalFilename}`;
      const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      
      thumbnails.push({
        size: size.suffix,
        url: thumbnailBlob.url,
      });
    }
  }
  
  return {
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    thumbnails: thumbnails.length > 0 ? thumbnails : undefined,
  };
}

/**
 * Generate thumbnail for video files
 */
export async function generateVideoThumbnail(
  videoBuffer: Buffer,
  filename: string
): Promise<UploadResult> {
  // Create a simple placeholder thumbnail for videos
  const thumbnailBuffer = await sharp({
    create: {
      width: 640,
      height: 360,
      channels: 3,
      background: { r: 30, g: 30, b: 30 }
    }
  })
  .png()
  .composite([{
    input: Buffer.from(
      `<svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
        <rect width="640" height="360" fill="#1e1e1e"/>
        <polygon points="240,120 240,240 360,180" fill="white" opacity="0.8"/>
        <text x="320" y="300" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Video</text>
      </svg>`
    ),
    top: 0,
    left: 0,
  }])
  .toBuffer();
  
  const thumbnailFilename = filename.replace(/\\.[^/.]+$/, '.png');
  return await uploadFile(thumbnailBuffer, `video-thumb-${thumbnailFilename}`);
}

/**
 * Delete file from Vercel Blob
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * Batch upload multiple files
 */
export async function batchUploadFiles(
  files: { buffer: Buffer; filename: string }[],
  options: ImageProcessingOptions = {}
): Promise<UploadResult[]> {
  const results = [];
  
  // Process files in chunks to avoid hitting rate limits
  const chunkSize = 3; // Conservative limit for free tier
  
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    
    const chunkPromises = chunk.map(file => 
      uploadFile(file.buffer, file.filename, options)
    );
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    
    // Small delay between chunks
    if (i + chunkSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Get optimal image processing settings for free tier
 */
export function getOptimalProcessingOptions(
  filename: string,
  size: number
): ImageProcessingOptions {
  const extension = filename.toLowerCase().split('.').pop();
  
  // Conservative thumbnail sizes for free tier
  const thumbnailSizes = [
    { width: 150, height: 150, suffix: 'thumb' },
    { width: 300, height: 300, suffix: 'small' },
  ];
  
  // Only generate thumbnails for larger files to save storage
  const shouldGenerateThumbnails = size > 100 * 1024; // 100KB
  
  switch (extension) {
    case 'png':
      return {
        format: 'webp',
        quality: 85,
        sizes: shouldGenerateThumbnails ? thumbnailSizes : undefined,
      };
      
    case 'jpg':
    case 'jpeg':
      return {
        format: 'webp',
        quality: 80,
        sizes: shouldGenerateThumbnails ? thumbnailSizes : undefined,
      };
      
    case 'webp':
      return {
        format: 'webp',
        quality: 80,
        sizes: shouldGenerateThumbnails ? thumbnailSizes : undefined,
      };
      
    default:
      return {};
  }
}

/**
 * Estimate storage usage for free tier planning
 */
export function estimateStorageUsage(files: { filename: string; size: number }[]) {
  let totalSize = 0;
  let optimizedSize = 0;
  
  files.forEach(file => {
    totalSize += file.size;
    
    const mimeType = mime.lookup(file.filename);
    if (mimeType && mimeType.startsWith('image/')) {
      // Estimate 40% reduction with WebP conversion
      optimizedSize += file.size * 0.6;
      
      // Add thumbnail sizes (conservative estimate)
      if (file.size > 100 * 1024) {
        optimizedSize += 50 * 1024; // ~50KB for thumbnails
      }
    } else {
      optimizedSize += file.size;
    }
  });
  
  return {
    original: Math.round(totalSize / 1024 / 1024 * 100) / 100, // MB
    optimized: Math.round(optimizedSize / 1024 / 1024 * 100) / 100, // MB
    savings: Math.round((totalSize - optimizedSize) / totalSize * 100), // %
  };
}