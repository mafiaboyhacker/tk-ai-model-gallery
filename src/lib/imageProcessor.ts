import sharp from 'sharp'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
}

export interface ProcessedImageResult {
  original: {
    width: number
    height: number
    path: string
    url: string
  }
  thumbnail: {
    width: number
    height: number  
    path: string
    url: string
  }
  webp: {
    width: number
    height: number
    path: string
    url: string
  }
  metadata: {
    format: string
    size: number
    hasAlpha: boolean
    colorSpace: string
  }
}

export class ImageProcessor {
  private static readonly MAX_WIDTH = 1920
  private static readonly MAX_HEIGHT = 1080
  private static readonly THUMBNAIL_WIDTH = 400
  private static readonly WEBP_QUALITY = 85
  private static readonly JPEG_QUALITY = 90

  /**
   * 이미지 메타데이터 추출
   */
  static async getImageDimensions(buffer: Buffer): Promise<ImageDimensions> {
    try {
      const metadata = await sharp(buffer).metadata()
      const width = metadata.width || 0
      const height = metadata.height || 0
      const aspectRatio = width > 0 && height > 0 ? width / height : 1

      return { width, height, aspectRatio }
    } catch (error) {
      console.error('Error getting image dimensions:', error)
      return { width: 800, height: 600, aspectRatio: 1.33 }
    }
  }

  /**
   * 이미지 리사이징 (최대 크기 제한)
   */
  static async resizeImage(
    buffer: Buffer, 
    maxWidth: number = this.MAX_WIDTH,
    maxHeight: number = this.MAX_HEIGHT
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: this.JPEG_QUALITY, progressive: true })
        .toBuffer()
    } catch (error) {
      console.error('Error resizing image:', error)
      throw error
    }
  }

  /**
   * 썸네일 생성
   */
  static async generateThumbnail(
    buffer: Buffer,
    width: number = this.THUMBNAIL_WIDTH
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(width, null, {
          fit: 'inside',
          withoutEnlargement: false
        })
        .webp({ quality: this.WEBP_QUALITY })
        .toBuffer()
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      throw error
    }
  }

  /**
   * WebP 변환
   */
  static async convertToWebP(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .webp({ 
          quality: this.WEBP_QUALITY,
          effort: 4,
          nearLossless: false
        })
        .toBuffer()
    } catch (error) {
      console.error('Error converting to WebP:', error)
      throw error
    }
  }

  /**
   * 완전한 이미지 처리 파이프라인
   */
  static async processImage(
    file: File,
    uploadDir: string,
    fileName: string
  ): Promise<ProcessedImageResult> {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // 디렉토리 생성
    await this.ensureDirectoryExists(uploadDir)
    await this.ensureDirectoryExists(path.join(uploadDir, 'thumbnails'))
    await this.ensureDirectoryExists(path.join(uploadDir, 'webp'))

    // 메타데이터 추출
    const metadata = await sharp(buffer).metadata()
    const dimensions = await this.getImageDimensions(buffer)

    // 파일명 준비
    const baseName = path.parse(fileName).name
    const originalFileName = fileName
    const thumbnailFileName = `${baseName}_thumb.webp`
    const webpFileName = `${baseName}.webp`

    // 원본 이미지 리사이징 (필요시)
    let processedBuffer = buffer
    if (dimensions.width > this.MAX_WIDTH || dimensions.height > this.MAX_HEIGHT) {
      processedBuffer = Buffer.from(await this.resizeImage(buffer))
    }

    // 썸네일 생성
    const thumbnailBuffer = await this.generateThumbnail(buffer)
    
    // WebP 변환
    const webpBuffer = await this.convertToWebP(processedBuffer)

    // 파일 저장
    const originalPath = path.join(uploadDir, originalFileName)
    const thumbnailPath = path.join(uploadDir, 'thumbnails', thumbnailFileName)
    const webpPath = path.join(uploadDir, 'webp', webpFileName)

    await writeFile(originalPath, processedBuffer)
    await writeFile(thumbnailPath, thumbnailBuffer) 
    await writeFile(webpPath, webpBuffer)

    // 최종 크기 정보 (리사이징된 경우)
    const finalDimensions = await this.getImageDimensions(processedBuffer)
    const thumbnailDimensions = await this.getImageDimensions(thumbnailBuffer)
    const webpDimensions = await this.getImageDimensions(webpBuffer)

    return {
      original: {
        width: finalDimensions.width,
        height: finalDimensions.height,
        path: originalPath,
        url: `/uploads/${originalFileName}`
      },
      thumbnail: {
        width: thumbnailDimensions.width,
        height: thumbnailDimensions.height,
        path: thumbnailPath,
        url: `/uploads/thumbnails/${thumbnailFileName}`
      },
      webp: {
        width: webpDimensions.width,
        height: webpDimensions.height,
        path: webpPath,
        url: `/uploads/webp/${webpFileName}`
      },
      metadata: {
        format: metadata.format || 'unknown',
        size: buffer.length,
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'sRGB'
      }
    }
  }

  /**
   * 이미지 압축 및 최적화
   */
  static async optimizeImage(buffer: Buffer, format: 'jpeg' | 'png' | 'webp' = 'jpeg'): Promise<Buffer> {
    try {
      const sharpInstance = sharp(buffer)

      switch (format) {
        case 'jpeg':
          return await sharpInstance
            .jpeg({ 
              quality: this.JPEG_QUALITY, 
              progressive: true,
              mozjpeg: true 
            })
            .toBuffer()

        case 'png':
          return await sharpInstance
            .png({ 
              compressionLevel: 9,
              palette: true,
              quality: 90
            })
            .toBuffer()

        case 'webp':
          return await sharpInstance
            .webp({ 
              quality: this.WEBP_QUALITY,
              effort: 6,
              nearLossless: false
            })
            .toBuffer()

        default:
          throw new Error(`Unsupported format: ${format}`)
      }
    } catch (error) {
      console.error('Error optimizing image:', error)
      throw error
    }
  }

  /**
   * 배치 이미지 처리
   */
  static async processBatchImages(
    files: File[],
    uploadDir: string,
    onProgress?: (current: number, total: number, fileName: string) => void
  ): Promise<ProcessedImageResult[]> {
    const results: ProcessedImageResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (!file.type.startsWith('image/')) {
        continue
      }

      // 진행 상황 콜백
      onProgress?.(i + 1, files.length, file.name)

      try {
        // 고유 파일명 생성
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substr(2, 9)
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${randomId}-${sanitizedName}`

        const result = await this.processImage(file, uploadDir, fileName)
        results.push(result)

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        // 개별 파일 실패 시에도 계속 진행
      }
    }

    return results
  }

  /**
   * 디렉토리 존재 확인 및 생성
   */
  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true })
    } catch (error) {
      // 이미 존재하는 경우 무시
    }
  }

  /**
   * 색상 팔레트 추출 (옵션)
   */
  static async extractColorPalette(buffer: Buffer, colors: number = 5): Promise<string[]> {
    try {
      const { data } = await sharp(buffer)
        .resize(100, 100)
        .raw()
        .toBuffer({ resolveWithObject: true })

      // 간단한 도미넌트 컬러 추출 (실제로는 더 복잡한 알고리즘 필요)
      return ['#000000'] // 플레이스홀더
    } catch (error) {
      console.error('Error extracting color palette:', error)
      return ['#000000']
    }
  }
}

// 타입 정의
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'gif'

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  thumbnailWidth?: number
  quality?: number
  format?: ImageFormat
  generateWebP?: boolean
  generateThumbnail?: boolean
}