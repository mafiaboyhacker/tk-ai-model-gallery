import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import mime from 'mime-types';

// 🔒 Security Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov'];

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
 * 🔒 Security validation for file uploads
 */
function validateFileUpload(buffer: Buffer, filename: string): void {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`);
  }

  // Check file extension
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`지원하지 않는 파일 형식입니다. 허용된 확장자: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check MIME type
  const mimeType = mime.lookup(filename);
  if (!mimeType) {
    throw new Error('파일 형식을 확인할 수 없습니다.');
  }

  const isAllowedType = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(mimeType);
  if (!isAllowedType) {
    throw new Error(`지원하지 않는 MIME 타입입니다: ${mimeType}`);
  }

  // Check for suspicious patterns in filename
  const suspiciousPatterns = ['.php', '.js', '.html', '.exe', '.bat', '.sh', '<script', 'javascript:'];
  const lowerFilename = filename.toLowerCase();
  if (suspiciousPatterns.some(pattern => lowerFilename.includes(pattern))) {
    throw new Error('보안상 위험한 파일명 패턴이 감지되었습니다.');
  }
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
  // 🔒 Security validation
  validateFileUpload(buffer, filename);

  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${directory}/${Date.now()}-${sanitizedFilename}`;
  const mimeType = mime.lookup(filename) || 'application/octet-stream';
  
  let processedBuffer = buffer;
  let finalMimeType = mimeType;
  
  // 🚀 Optimized image processing with Sharp
  if (mimeType.startsWith('image/')) {
    const { quality = 85, format = 'webp' } = options;

    // Create Sharp instance once for reuse
    const sharpInstance = sharp(buffer, {
      failOn: 'error',
      limitInputPixels: 268402689, // Prevent DoS attacks (limit ~16K x 16K)
    });

    // Get metadata first for optimization decisions
    const metadata = await sharpInstance.metadata();
    const isLargeImage = (metadata.width || 0) * (metadata.height || 0) > 4000000; // >4MP

    // Adaptive quality based on image size - 더 보수적인 품질 조정
    const adaptiveQuality = isLargeImage ? Math.max(quality - 5, 80) : quality;

    processedBuffer = await sharpInstance
      .rotate() // Auto-rotate based on EXIF
      .resize(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3 // High-quality resizing
      })
      .toFormat(format, {
        quality: adaptiveQuality,
        progressive: true, // Progressive JPEG/WebP for faster loading
        effort: 4 // WebP compression effort (0-6, 4 is good balance)
      })
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
    
    // 🚀 Optimized parallel thumbnail generation
    const thumbnails = [];
    if (options.sizes && options.sizes.length > 0) {
      // Generate all thumbnails in parallel for better performance
      const thumbnailPromises = options.sizes.map(async (size) => {
        const thumbnailBuffer = await sharp(buffer, {
          failOn: 'error',
          limitInputPixels: 268402689
        })
          .rotate()
          .resize(size.width, size.height, {
            fit: 'cover',
            kernel: sharp.kernel.lanczos3
          })
          .toFormat(format, {
            quality: Math.max(adaptiveQuality - 3, 75), // 🎨 썸네일도 고품질 유지
            progressive: true,
            effort: 4 // 썸네일도 동일한 압축 효율성
          })
          .toBuffer();

        const thumbnailKey = `${directory}/thumbs/${Date.now()}-${size.suffix}-${sanitizedFilename}`;

        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: finalMimeType,
          CacheControl: 'public, max-age=31536000',
        }));

        const thumbnailUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;
        const thumbnailCdnUrl = CLOUDFRONT_DOMAIN ? `https://${CLOUDFRONT_DOMAIN}/${thumbnailKey}` : undefined;

        return {
          size: size.suffix,
          url: thumbnailUrl,
          cdnUrl: thumbnailCdnUrl,
        };
      });

      // Wait for all thumbnails to complete in parallel
      const thumbnailResults = await Promise.all(thumbnailPromises);
      thumbnails.push(...thumbnailResults);
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
      // PNG with transparency - convert to WebP with premium quality
      return {
        format: 'webp',
        quality: 95, // 🎨 최고급 품질 (거의 무손실)
        sizes: thumbnailSizes,
      };

    case 'jpg':
    case 'jpeg':
      // JPEG - convert to WebP with premium quality
      return {
        format: 'webp',
        quality: 90, // 🎨 프리미엄 품질 (완전 무손실 체감)
        sizes: thumbnailSizes,
      };

    case 'webp':
      // Already WebP - optimize with premium quality
      return {
        format: 'webp',
        quality: 90, // 🎨 기존 WebP도 프리미엄 품질로
        sizes: thumbnailSizes,
      };
      
    default:
      return {
        sizes: thumbnailSizes,
      };
  }
}