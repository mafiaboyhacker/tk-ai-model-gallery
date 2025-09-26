/**
 * 미디어 최적화 유틸리티
 * CDN, 압축, 캐싱 전략 구현
 */

import { NextRequest } from 'next/server'

export interface OptimizationOptions {
  enableCompression: boolean
  enableCDN: boolean
  enableWebP: boolean
  enableResponsiveImages: boolean
  cacheMaxAge: number
  compressionQuality: number
}

export interface OptimizedResponse {
  headers: Record<string, string>
  shouldCompress: boolean
  format: string
  quality: number
}

export class MediaOptimizer {
  private static readonly DEFAULT_OPTIONS: OptimizationOptions = {
    enableCompression: true,
    enableCDN: true,
    enableWebP: true,
    enableResponsiveImages: true,
    cacheMaxAge: 60 * 60 * 24 * 30, // 30일
    compressionQuality: 85
  }

  /**
   * 클라이언트 요청 분석하여 최적화 전략 결정
   */
  static analyzeRequest(request: NextRequest): {
    supportsWebP: boolean
    supportsAVIF: boolean
    preferredFormat: string
    devicePixelRatio: number
    viewportWidth: number
    isBot: boolean
  } {
    const userAgent = request.headers.get('user-agent') || ''
    const accept = request.headers.get('accept') || ''
    const dpr = request.headers.get('dpr') || '1'
    const viewportWidth = request.headers.get('viewport-width') || '1920'

    // WebP 지원 확인
    const supportsWebP = accept.includes('image/webp')
    const supportsAVIF = accept.includes('image/avif')

    // 봇 탐지
    const isBot = /bot|crawl|spider|facebook|twitter|whatsapp/i.test(userAgent)

    // 선호 포맷 결정
    let preferredFormat = 'jpeg'
    if (supportsAVIF) {
      preferredFormat = 'avif'
    } else if (supportsWebP) {
      preferredFormat = 'webp'
    }

    return {
      supportsWebP,
      supportsAVIF,
      preferredFormat,
      devicePixelRatio: parseFloat(dpr),
      viewportWidth: parseInt(viewportWidth),
      isBot
    }
  }

  /**
   * 최적화된 응답 헤더 생성
   */
  static generateOptimizedHeaders(
    filePath: string,
    fileSize: number,
    request: NextRequest,
    options: Partial<OptimizationOptions> = {}
  ): OptimizedResponse {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const clientInfo = this.analyzeRequest(request)
    const isImage = /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(filePath)
    const isVideo = /\.(mp4|webm|mov|avi)$/i.test(filePath)

    const headers: Record<string, string> = {
      // 기본 캐싱 헤더
      'Cache-Control': opts.enableCDN
        ? `public, max-age=${opts.cacheMaxAge}, stale-while-revalidate=${Math.floor(opts.cacheMaxAge / 4)}`
        : `private, max-age=${Math.floor(opts.cacheMaxAge / 2)}`,

      // CDN 및 프록시 헤더
      'Vary': 'Accept, Accept-Encoding, Width, DPR',
      'X-Content-Type-Options': 'nosniff',

      // 성능 헤더
      'X-Optimized-By': 'Railway-Media-Optimizer',
      'X-Cache-Strategy': opts.enableCDN ? 'cdn-edge' : 'server-cache'
    }

    // 이미지별 최적화 헤더
    if (isImage) {
      headers['Accept-CH'] = 'Width, DPR, Viewport-Width, Downlink'
      headers['Vary'] += ', Width, DPR'

      if (opts.enableResponsiveImages) {
        headers['X-Responsive-Images'] = 'enabled'
      }

      // WebP/AVIF 변환 힌트
      if (opts.enableWebP && !clientInfo.supportsWebP) {
        headers['Link'] = `</uploads/webp/${filePath.replace(/\.[^.]+$/, '.webp')}>; rel=preload; as=image`
      }
    }

    // 비디오별 최적화 헤더
    if (isVideo) {
      headers['Accept-Ranges'] = 'bytes'
      headers['X-Video-Optimized'] = 'true'
    }

    // 압축 설정
    const shouldCompress = opts.enableCompression && fileSize > 1024 && !isVideo

    // 봇에 대한 특별 처리
    if (clientInfo.isBot) {
      headers['Cache-Control'] = `public, max-age=${opts.cacheMaxAge * 2}, immutable`
      headers['X-Bot-Optimized'] = 'true'
    }

    // 저속 연결 감지 및 최적화
    const connection = request.headers.get('downlink')
    if (connection && parseFloat(connection) < 1.5) {
      headers['X-Low-Bandwidth'] = 'true'
      // 저속 연결시 더 적극적인 압축
      return {
        headers,
        shouldCompress: true,
        format: 'webp',
        quality: Math.max(opts.compressionQuality - 15, 60)
      }
    }

    return {
      headers,
      shouldCompress,
      format: clientInfo.preferredFormat,
      quality: opts.compressionQuality
    }
  }

  /**
   * CDN 통합을 위한 헤더 추가
   */
  static addCDNHeaders(headers: Record<string, string>): Record<string, string> {
    return {
      ...headers,
      // Cloudflare 최적화
      'CF-Cache-Tag': 'media,uploads',
      'CF-Polish': 'lossy',

      // AWS CloudFront 최적화
      'CloudFront-Compress': 'true',

      // 일반 CDN 헤더
      'Edge-Cache-Tag': 'media',
      'Surrogate-Control': 'max-age=31536000',
      'Surrogate-Key': 'media uploads'
    }
  }

  /**
   * 반응형 이미지 URL 생성
   */
  static generateResponsiveImageUrls(
    originalPath: string,
    availableSizes: number[] = [320, 640, 960, 1280, 1600, 1920]
  ): { size: number, url: string }[] {
    const basePath = originalPath.replace(/\.[^.]+$/, '')
    const extension = originalPath.match(/\.[^.]+$/)?.[0] || '.jpg'

    return availableSizes.map(size => ({
      size,
      url: `/api/uploads/resize/${size}${basePath}${extension}`
    }))
  }

  /**
   * 이미지 포맷 변환 URL 생성
   */
  static generateFormatUrls(originalPath: string): {
    original: string
    webp: string
    avif?: string
    thumbnail: string
  } {
    const basePath = originalPath.replace(/\.[^.]+$/, '')
    const pathParts = originalPath.split('/')
    const typeDir = pathParts[2] // 'images' or 'videos'

    return {
      original: originalPath,
      webp: `/uploads/${typeDir}/webp${basePath}.webp`,
      avif: `/uploads/${typeDir}/avif${basePath}.avif`,
      thumbnail: `/uploads/${typeDir}/thumbnails${basePath}_thumb.webp`
    }
  }

  /**
   * 성능 메트릭 수집
   */
  static collectPerformanceMetrics(
    request: NextRequest,
    responseTime: number,
    fileSize: number,
    optimizedSize: number
  ): {
    compressionRatio: number
    bandwidthSaved: number
    responseTime: number
    cacheHit: boolean
  } {
    const compressionRatio = fileSize > 0 ? (1 - optimizedSize / fileSize) * 100 : 0
    const bandwidthSaved = fileSize - optimizedSize
    const cacheHit = request.headers.get('if-none-match') !== null

    return {
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      bandwidthSaved,
      responseTime,
      cacheHit
    }
  }

  /**
   * 동적 품질 조정
   */
  static calculateDynamicQuality(
    request: NextRequest,
    baseQuality: number = 85
  ): number {
    const clientInfo = this.analyzeRequest(request)
    const connection = request.headers.get('downlink')
    const saveData = request.headers.get('save-data')

    let quality = baseQuality

    // 저속 연결 또는 데이터 절약 모드
    if (saveData === 'on' || (connection && parseFloat(connection) < 1.0)) {
      quality = Math.max(baseQuality - 20, 50)
    }

    // 고해상도 디스플레이 조정
    if (clientInfo.devicePixelRatio > 2) {
      quality = Math.min(baseQuality + 5, 95)
    }

    // 봇에 대한 최적화
    if (clientInfo.isBot) {
      quality = Math.max(baseQuality - 10, 60)
    }

    return Math.round(quality)
  }

  /**
   * 파일 압축 여부 결정
   */
  static shouldCompressFile(
    filePath: string,
    fileSize: number,
    mimeType: string
  ): boolean {
    // 이미 압축된 포맷은 재압축 안함
    const precompressedFormats = [
      'image/jpeg', 'image/webp', 'image/avif',
      'video/mp4', 'video/webm',
      'application/gzip', 'application/zip'
    ]

    if (precompressedFormats.includes(mimeType)) {
      return false
    }

    // 작은 파일은 압축 오버헤드가 클 수 있음
    if (fileSize < 1024) {
      return false
    }

    // SVG, CSS, JS 등은 압축 효과가 좋음
    const compressibleFormats = [
      'image/svg+xml', 'text/css', 'application/javascript',
      'text/javascript', 'application/json', 'text/plain'
    ]

    return compressibleFormats.includes(mimeType)
  }

  /**
   * ETag 생성 (캐싱 최적화)
   */
  static generateETag(
    filePath: string,
    fileSize: number,
    lastModified: Date,
    format?: string
  ): string {
    const content = `${filePath}-${fileSize}-${lastModified.getTime()}`
    const formatSuffix = format ? `-${format}` : ''

    // 간단한 해시 (실제로는 crypto 사용 권장)
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32bit 정수로 변환
    }

    return `"${Math.abs(hash).toString(36)}${formatSuffix}"`
  }
}