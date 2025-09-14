import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import mime from 'mime-types';

// S3 Client Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET!;
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN;

export interface ImageProcessingOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  sizes?: { width: number; height: number; suffix: string }[];
}

export interface UploadResult {
  key: string;
  url: string;
  cdnUrl?: string;
  thumbnails?: { size: string; url: string; cdnUrl?: string }[];
}

/**
 * Upload file to S3 with automatic image optimization
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  directory: string = 'models',
  options: ImageProcessingOptions = {}
): Promise<UploadResult> {
  const key = `${directory}/${Date.now()}-${filename}`;
  const mimeType = mime.lookup(filename) || 'application/octet-stream';
  
  let processedBuffer = buffer;
  let finalMimeType = mimeType;
  
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
    
    // Update filename and mime type
    const newExtension = format === 'jpeg' ? 'jpg' : format;
    const newFilename = filename.replace(/\\.[^/.]+$/, `.${newExtension}`);
    const newKey = `${directory}/${Date.now()}-${newFilename}`;
    
    finalMimeType = `image/${format}`;
    
    // Upload main image
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: newKey,
      Body: processedBuffer,
      ContentType: finalMimeType,
      CacheControl: 'public, max-age=31536000', // 1 year
    }));
    
    // Generate thumbnails if sizes specified
    const thumbnails = [];
    if (options.sizes && options.sizes.length > 0) {
      for (const size of options.sizes) {
        const thumbnailBuffer = await sharp(buffer)
          .rotate()
          .resize(size.width, size.height, { fit: 'cover' })
          .toFormat(format, { quality: quality - 5 })
          .toBuffer();
        
        const thumbnailKey = `${directory}/thumbs/${Date.now()}-${size.suffix}-${newFilename}`;
        
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: finalMimeType,
          CacheControl: 'public, max-age=31536000',
        }));
        
        const thumbnailUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;
        const thumbnailCdnUrl = CLOUDFRONT_DOMAIN ? `https://${CLOUDFRONT_DOMAIN}/${thumbnailKey}` : undefined;
        
        thumbnails.push({
          size: size.suffix,
          url: thumbnailUrl,
          cdnUrl: thumbnailCdnUrl,
        });
      }
    }
    
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newKey}`;
    const cdnUrl = CLOUDFRONT_DOMAIN ? `https://${CLOUDFRONT_DOMAIN}/${newKey}` : undefined;
    
    return {
      key: newKey,
      url,
      cdnUrl,
      thumbnails: thumbnails.length > 0 ? thumbnails : undefined,
    };
  } else {
    // Upload non-image files as-is
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: processedBuffer,
      ContentType: finalMimeType,
      CacheControl: 'public, max-age=31536000',
    }));
    
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    const cdnUrl = CLOUDFRONT_DOMAIN ? `https://${CLOUDFRONT_DOMAIN}/${key}` : undefined;
    
    return {
      key,
      url,
      cdnUrl,
    };
  }
}

/**
 * Generate thumbnail for video files
 */
export async function generateVideoThumbnail(
  videoBuffer: Buffer,
  filename: string,
  timeOffset: number = 1
): Promise<UploadResult> {
  // This is a placeholder - in production you'd use FFmpeg
  // For now, we'll create a simple placeholder thumbnail
  const thumbnailBuffer = await sharp({
    create: {
      width: 640,
      height: 360,
      channels: 3,
      background: { r: 50, g: 50, b: 50 }
    }
  })
  .jpeg({ quality: 90 })
  .toBuffer();
  
  const thumbnailFilename = filename.replace(/\\.[^/.]+$/, '.jpg');
  return await uploadFile(thumbnailBuffer, thumbnailFilename, 'video-thumbs', {
    format: 'jpeg',
    quality: 90
  });
}

/**
 * Delete file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }));
}

/**
 * Get presigned URL for secure downloads
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Batch upload multiple files
 */
export async function batchUploadFiles(
  files: { buffer: Buffer; filename: string }[],
  directory: string = 'models',
  options: ImageProcessingOptions = {}
): Promise<UploadResult[]> {
  const uploads = files.map(file => 
    uploadFile(file.buffer, file.filename, directory, options)
  );
  
  // Process in parallel but limit concurrency
  const results = [];
  const chunkSize = 5; // Process 5 files at a time
  
  for (let i = 0; i < uploads.length; i += chunkSize) {
    const chunk = uploads.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk);
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * Get optimal image processing settings based on file type and size
 */
export function getOptimalProcessingOptions(
  filename: string,
  size: number
): ImageProcessingOptions {
  const extension = filename.toLowerCase().split('.').pop();
  
  // Default thumbnail sizes
  const thumbnailSizes = [
    { width: 150, height: 150, suffix: 'thumb' },
    { width: 300, height: 300, suffix: 'small' },
    { width: 600, height: 600, suffix: 'medium' },
  ];
  
  switch (extension) {
    case 'png':
      // PNG with transparency - convert to WebP with higher quality
      return {
        format: 'webp',
        quality: 90,
        sizes: thumbnailSizes,
      };
      
    case 'jpg':
    case 'jpeg':
      // JPEG - convert to WebP with good quality
      return {
        format: 'webp',
        quality: 85,
        sizes: thumbnailSizes,
      };
      
    case 'webp':
      // Already WebP - just optimize
      return {
        format: 'webp',
        quality: 85,
        sizes: thumbnailSizes,
      };
      
    default:
      return {
        sizes: thumbnailSizes,
      };
  }
}