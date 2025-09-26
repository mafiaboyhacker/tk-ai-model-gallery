/**
 * 미디어 업로드 보안 검증 시스템
 * 파일 검증, 권한 확인, 위협 탐지
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { config as authOptions } from '@/lib/auth'

export interface SecurityValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  riskScore: number
  sanitizedFileName: string
}

export interface RateLimitInfo {
  isAllowed: boolean
  remainingRequests: number
  resetTime: Date
  currentRequests: number
}

export class SecurityValidator {
  // 허용된 MIME 타입
  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ])

  // 파일 시그니처 (매직 넘버) 검증
  private static readonly FILE_SIGNATURES: Record<string, number[][]> = {
    'image/jpeg': [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0xFF, 0xD8, 0xFF, 0xE0], // JPEG/JFIF
      [0xFF, 0xD8, 0xFF, 0xE1] // JPEG/Exif
    ],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP)
    'image/gif': [
      [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
      [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ],
    'video/mp4': [
      [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // MP4
      [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]  // MP4
    ]
  }

  // 위험한 파일명 패턴
  private static readonly DANGEROUS_PATTERNS = [
    /\.php$/i,
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.sh$/i,
    /\.ps1$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.html$/i,
    /\.htm$/i,
    /\.svg$/i, // SVG can contain JS
    /\.\./,     // Path traversal
    /[<>:"|?*]/  // Invalid characters
  ]

  // 레이트 리미팅 (메모리 기반 - 실제로는 Redis 등 사용 권장)
  private static rateLimitStore = new Map<string, { count: number, resetTime: Date }>()

  /**
   * 관리자 권한 확인
   */
  static async validateAdminAccess(request: NextRequest): Promise<boolean> {
    try {
      const session = await getServerSession(authOptions)

      if (!session || !session.user) {
        return false
      }

      // 관리자 역할 확인
      const userRole = (session.user as any)?.role
      return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

    } catch (error) {
      console.error('권한 확인 실패:', error)
      return false
    }
  }

  /**
   * 파일 보안 검증
   */
  static async validateFile(file: File): Promise<SecurityValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    let riskScore = 0

    // 1. 기본 파일 검증
    if (!file || !file.name || file.size === 0) {
      errors.push('유효하지 않은 파일')
      riskScore += 10
    }

    // 2. 파일명 보안 검증
    const fileNameValidation = this.validateFileName(file.name)
    if (!fileNameValidation.isValid) {
      errors.push(...fileNameValidation.errors)
      riskScore += 5
    }

    // 3. MIME 타입 검증
    if (!this.ALLOWED_MIME_TYPES.has(file.type)) {
      errors.push(`허용되지 않는 파일 형식: ${file.type}`)
      riskScore += 8
    }

    // 4. 파일 시그니처 검증 (매직 넘버)
    try {
      const buffer = await this.getFileHeader(file, 32)
      const signatureValid = this.validateFileSignature(buffer, file.type)
      if (!signatureValid) {
        errors.push('파일 내용과 확장자가 일치하지 않음')
        riskScore += 7
      }
    } catch (error) {
      warnings.push('파일 시그니처 검증 실패')
      riskScore += 2
    }

    // 5. 파일 크기 검증
    const maxSize = file.type.startsWith('video/') ? 500 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      errors.push(`파일 크기 초과: ${Math.round(file.size / 1024 / 1024)}MB`)
      riskScore += 5
    }

    // 6. 비정상적으로 작은 파일 검사
    if (file.size < 100) {
      warnings.push('비정상적으로 작은 파일 크기')
      riskScore += 1
    }

    // 7. 파일명 길이 검증
    if (file.name.length > 255) {
      errors.push('파일명이 너무 길음')
      riskScore += 3
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore,
      sanitizedFileName: this.sanitizeFileName(file.name)
    }
  }

  /**
   * 파일명 검증 및 정리
   */
  private static validateFileName(fileName: string): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    // 위험한 패턴 검사
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(fileName)) {
        errors.push(`위험한 파일명 패턴: ${fileName}`)
        break
      }
    }

    // 널 바이트 검사
    if (fileName.includes('\0')) {
      errors.push('파일명에 널 바이트 포함')
    }

    // 유니코드 제어 문자 검사
    if (/[\u0000-\u001F\u007F-\u009F]/.test(fileName)) {
      errors.push('파일명에 제어 문자 포함')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 파일명 안전하게 정리
   */
  private static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"|?*]/g, '') // 위험한 문자 제거
      .replace(/\.\./g, '.') // Path traversal 방지
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
      .substring(0, 255) // 길이 제한
      .trim()
  }

  /**
   * 파일 헤더 읽기
   */
  private static async getFileHeader(file: File, bytes: number): Promise<Uint8Array> {
    const slice = file.slice(0, bytes)
    const buffer = await slice.arrayBuffer()
    return new Uint8Array(buffer)
  }

  /**
   * 파일 시그니처 검증
   */
  private static validateFileSignature(header: Uint8Array, mimeType: string): boolean {
    const signatures = this.FILE_SIGNATURES[mimeType]
    if (!signatures) {
      // 시그니처가 정의되지 않은 타입은 통과
      return true
    }

    return signatures.some(signature => {
      return signature.every((byte, index) => {
        return index < header.length && header[index] === byte
      })
    })
  }

  /**
   * 레이트 리미팅 검사
   */
  static checkRateLimit(clientIP: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): RateLimitInfo {
    const now = new Date()
    const clientKey = `rate_limit_${clientIP}`
    const current = this.rateLimitStore.get(clientKey)

    if (!current || now > current.resetTime) {
      // 새로운 윈도우 시작
      const resetTime = new Date(now.getTime() + windowMs)
      this.rateLimitStore.set(clientKey, { count: 1, resetTime })

      return {
        isAllowed: true,
        remainingRequests: maxRequests - 1,
        resetTime,
        currentRequests: 1
      }
    }

    // 기존 윈도우 내에서 요청 증가
    const newCount = current.count + 1
    this.rateLimitStore.set(clientKey, { count: newCount, resetTime: current.resetTime })

    return {
      isAllowed: newCount <= maxRequests,
      remainingRequests: Math.max(0, maxRequests - newCount),
      resetTime: current.resetTime,
      currentRequests: newCount
    }
  }

  /**
   * 클라이언트 IP 추출
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('x-remote-addr')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    return realIP || remoteAddr || 'unknown'
  }

  /**
   * CSP 헤더 생성
   */
  static generateCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }

  /**
   * 악성 콘텐츠 패턴 검사 (기본 구현)
   */
  static async scanForMaliciousContent(file: File): Promise<{ isSafe: boolean, threats: string[] }> {
    const threats: string[] = []

    try {
      // 텍스트 기반 위협 검사 (이미지 메타데이터 등)
      if (file.type.startsWith('image/')) {
        const buffer = await this.getFileHeader(file, 1024)
        const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer)

        // 스크립트 태그 검사
        if (/<script|javascript:|data:text\/html/i.test(content)) {
          threats.push('이미지에 스크립트 코드 발견')
        }

        // PHP 코드 검사
        if (/<\?php|<\%/i.test(content)) {
          threats.push('이미지에 서버사이드 코드 발견')
        }
      }
    } catch (error) {
      console.error('콘텐츠 스캔 실패:', error)
    }

    return {
      isSafe: threats.length === 0,
      threats
    }
  }

  /**
   * 종합 보안 검증
   */
  static async performComprehensiveValidation(
    file: File,
    request: NextRequest
  ): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    riskScore: number
    sanitizedFileName: string
    rateLimit: RateLimitInfo
    hasAdminAccess: boolean
  }> {
    // 1. 관리자 권한 확인
    const hasAdminAccess = await this.validateAdminAccess(request)

    // 2. 레이트 리미팅 확인
    const clientIP = this.getClientIP(request)
    const rateLimit = this.checkRateLimit(clientIP)

    // 3. 파일 검증
    const fileValidation = await this.validateFile(file)

    // 4. 악성 콘텐츠 검사
    const maliciousContent = await this.scanForMaliciousContent(file)

    const errors = [...fileValidation.errors]
    const warnings = [...fileValidation.warnings]
    let riskScore = fileValidation.riskScore

    if (!hasAdminAccess) {
      errors.push('관리자 권한이 필요합니다')
      riskScore += 10
    }

    if (!rateLimit.isAllowed) {
      errors.push('요청 한도를 초과했습니다')
      riskScore += 5
    }

    if (!maliciousContent.isSafe) {
      errors.push(...maliciousContent.threats)
      riskScore += 8
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore,
      sanitizedFileName: fileValidation.sanitizedFileName,
      rateLimit,
      hasAdminAccess
    }
  }
}