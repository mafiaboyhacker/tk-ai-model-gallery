/**
 * 중앙집중식 에러 핸들링 시스템
 * 전역 에러 관리, 로깅, 사용자 친화적 에러 메시지 제공
 */

import type { ErrorEvent, Logger, ValidationResult } from '@/types'

// 🚨 에러 타입 정의
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  AUTH = 'AUTH',
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ApplicationError extends Error {
  type: ErrorType
  severity: ErrorSeverity
  code?: string
  context?: Record<string, unknown>
  timestamp: Date
  recoverable: boolean
  userMessage: string
  technicalMessage: string
}

// 📊 에러 통계
interface ErrorStats {
  total: number
  byType: Record<ErrorType, number>
  bySeverity: Record<ErrorSeverity, number>
  recent: ApplicationError[]
}

// 🎯 에러 핸들러 클래스
class ErrorHandler {
  private errors: ApplicationError[] = []
  private maxErrors = 100
  private logger?: Logger

  constructor(logger?: Logger) {
    this.logger = logger
    this.setupGlobalErrorHandlers()
  }

  /**
   * 전역 에러 핸들러 설정
   */
  private setupGlobalErrorHandlers(): void {
    // React 에러 경계에서 포착되지 않은 에러
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(new Error(event.message), {
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.HIGH,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
          }
        })
      })

      // Promise 거부 에러
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(new Error(String(event.reason)), {
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          context: {
            reason: event.reason,
            promise: 'Promise rejection'
          }
        })
      })
    }
  }

  /**
   * 에러 생성 및 처리
   */
  createError(
    message: string,
    options: {
      type?: ErrorType
      severity?: ErrorSeverity
      code?: string
      context?: Record<string, unknown>
      cause?: Error
      recoverable?: boolean
    } = {}
  ): ApplicationError {
    const {
      type = ErrorType.UNKNOWN,
      severity = ErrorSeverity.MEDIUM,
      code,
      context = {},
      cause,
      recoverable = true
    } = options

    const error = new Error(message) as ApplicationError
    error.type = type
    error.severity = severity
    error.code = code
    error.context = context
    error.timestamp = new Date()
    error.recoverable = recoverable
    error.userMessage = this.getUserMessage(type, message)
    error.technicalMessage = message

    if (cause) {
      error.cause = cause
      error.stack = cause.stack
    }

    return error
  }

  /**
   * 에러 처리 메인 함수
   */
  handleError(
    error: Error | ApplicationError,
    options?: {
      type?: ErrorType
      severity?: ErrorSeverity
      context?: Record<string, unknown>
      notify?: boolean
      log?: boolean
    }
  ): ApplicationError {
    const {
      type = ErrorType.UNKNOWN,
      severity = ErrorSeverity.MEDIUM,
      context = {},
      notify = true,
      log = true
    } = options || {}

    let appError: ApplicationError

    if (this.isApplicationError(error)) {
      appError = error
    } else {
      appError = this.createError(error.message, {
        type,
        severity,
        context: { ...context, originalError: error.message, stack: error.stack },
        cause: error
      })
    }

    // 에러 저장
    this.addError(appError)

    // 로깅
    if (log && this.logger) {
      this.logError(appError)
    }

    // 사용자 알림 (높은 심각도만)
    if (notify && severity >= ErrorSeverity.HIGH) {
      this.notifyUser(appError)
    }

    // 복구 시도
    if (appError.recoverable) {
      this.attemptRecovery(appError)
    }

    return appError
  }

  /**
   * 사용자 친화적 메시지 생성
   */
  private getUserMessage(type: ErrorType, technicalMessage: string): string {
    const messageMap: Record<ErrorType, string> = {
      [ErrorType.VALIDATION]: '입력한 정보를 다시 확인해 주세요.',
      [ErrorType.NETWORK]: '네트워크 연결을 확인하고 다시 시도해 주세요.',
      [ErrorType.STORAGE]: '저장 공간에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      [ErrorType.AUTH]: '로그인이 필요합니다. 다시 로그인해 주세요.',
      [ErrorType.UPLOAD]: '파일 업로드에 실패했습니다. 파일을 확인하고 다시 시도해 주세요.',
      [ErrorType.PROCESSING]: '처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      [ErrorType.UNKNOWN]: '예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해 주세요.'
    }

    return messageMap[type] || messageMap[ErrorType.UNKNOWN]
  }

  /**
   * ApplicationError 타입 가드
   */
  private isApplicationError(error: Error | ApplicationError): error is ApplicationError {
    return 'type' in error && 'severity' in error
  }

  /**
   * 에러 저장
   */
  private addError(error: ApplicationError): void {
    this.errors.unshift(error)

    // 최대 에러 수 제한
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }
  }

  /**
   * 에러 로깅
   */
  private logError(error: ApplicationError): void {
    const logData = {
      type: error.type,
      severity: error.severity,
      code: error.code,
      context: error.context,
      timestamp: error.timestamp,
      stack: error.stack
    }

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger?.error(error.technicalMessage, error, logData)
        break
      case ErrorSeverity.HIGH:
        this.logger?.error(error.technicalMessage, error, logData)
        break
      case ErrorSeverity.MEDIUM:
        this.logger?.warn(error.technicalMessage, logData)
        break
      case ErrorSeverity.LOW:
        this.logger?.info(error.technicalMessage, logData)
        break
    }
  }

  /**
   * 사용자 알림
   */
  private notifyUser(error: ApplicationError): void {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      // 개발 환경에서는 console에 출력
      if (process.env.NODE_ENV === 'development') {
        console.error('🚨 User Error Notification:', {
          message: error.userMessage,
          technical: error.technicalMessage,
          type: error.type,
          severity: error.severity
        })
      }

      // 토스트 알림 시스템이 있다면 여기서 호출
      // toast.error(error.userMessage)
    }
  }

  /**
   * 에러 복구 시도
   */
  private attemptRecovery(error: ApplicationError): void {
    switch (error.type) {
      case ErrorType.NETWORK:
        // 네트워크 재연결 시도
        this.retryNetworkOperation(error)
        break
      case ErrorType.STORAGE:
        // 캐시 정리 시도
        this.clearStorageCache()
        break
      case ErrorType.AUTH:
        // 토큰 갱신 시도
        this.refreshAuthToken()
        break
      default:
        // 기본 복구 작업 없음
        break
    }
  }

  /**
   * 네트워크 재시도
   */
  private async retryNetworkOperation(error: ApplicationError): Promise<void> {
    // 구체적인 재시도 로직은 각 컴포넌트에서 구현
    console.log('🔄 Network retry attempted for:', error.context)
  }

  /**
   * 스토리지 캐시 정리
   */
  private clearStorageCache(): void {
    try {
      if (typeof window !== 'undefined') {
        // localStorage 정리
        const itemsToKeep = ['user-preferences', 'auth-token']
        const keys = Object.keys(localStorage)

        keys.forEach(key => {
          if (!itemsToKeep.includes(key)) {
            localStorage.removeItem(key)
          }
        })

        console.log('🧹 Storage cache cleared')
      }
    } catch (clearError) {
      console.error('Failed to clear storage cache:', clearError)
    }
  }

  /**
   * 인증 토큰 갱신
   */
  private async refreshAuthToken(): Promise<void> {
    try {
      // NextAuth 세션 갱신 로직
      console.log('🔑 Auth token refresh attempted')
    } catch (refreshError) {
      console.error('Failed to refresh auth token:', refreshError)
    }
  }

  /**
   * 에러 통계 반환
   */
  getStats(): ErrorStats {
    const byType = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = this.errors.filter(error => error.type === type).length
      return acc
    }, {} as Record<ErrorType, number>)

    const bySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = this.errors.filter(error => error.severity === severity).length
      return acc
    }, {} as Record<ErrorSeverity, number>)

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      recent: this.errors.slice(0, 10)
    }
  }

  /**
   * 에러 목록 반환
   */
  getErrors(limit = 50): ApplicationError[] {
    return this.errors.slice(0, limit)
  }

  /**
   * 에러 지우기
   */
  clearErrors(): void {
    this.errors = []
  }

  /**
   * 특정 타입 에러 필터링
   */
  getErrorsByType(type: ErrorType): ApplicationError[] {
    return this.errors.filter(error => error.type === type)
  }

  /**
   * 심각도별 에러 필터링
   */
  getErrorsBySeverity(severity: ErrorSeverity): ApplicationError[] {
    return this.errors.filter(error => error.severity === severity)
  }
}

// 🎯 유틸리티 함수들

/**
 * 파일 유효성 검사 에러 생성
 */
export function createValidationError(
  message: string,
  field?: string,
  value?: unknown
): ApplicationError {
  return errorHandler.createError(message, {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    context: { field, value },
    recoverable: true
  })
}

/**
 * 네트워크 에러 생성
 */
export function createNetworkError(
  message: string,
  url?: string,
  status?: number
): ApplicationError {
  return errorHandler.createError(message, {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    context: { url, status },
    recoverable: true
  })
}

/**
 * 업로드 에러 생성
 */
export function createUploadError(
  message: string,
  fileName?: string,
  fileSize?: number
): ApplicationError {
  return errorHandler.createError(message, {
    type: ErrorType.UPLOAD,
    severity: ErrorSeverity.MEDIUM,
    context: { fileName, fileSize },
    recoverable: true
  })
}

/**
 * 스토리지 에러 생성
 */
export function createStorageError(
  message: string,
  operation?: string,
  storageType?: string
): ApplicationError {
  return errorHandler.createError(message, {
    type: ErrorType.STORAGE,
    severity: ErrorSeverity.HIGH,
    context: { operation, storageType },
    recoverable: true
  })
}

/**
 * Try-catch 래퍼 함수
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    type?: ErrorType
    severity?: ErrorSeverity
    context?: Record<string, unknown>
  } = {}
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    errorHandler.handleError(error as Error, context)
    return null
  }
}

/**
 * 검증 결과 생성 헬퍼
 */
export function createValidationResult(
  isValid: boolean,
  errors: string[] = [],
  warnings: string[] = []
): ValidationResult {
  return {
    isValid,
    errors,
    warnings
  }
}

/**
 * 에러 메시지 형식화
 */
export function formatErrorMessage(error: ApplicationError): string {
  const timestamp = error.timestamp.toLocaleString('ko-KR')
  return `[${timestamp}] ${error.type}: ${error.userMessage}`
}

/**
 * 에러 컨텍스트 문자열화
 */
export function stringifyErrorContext(context: Record<string, unknown>): string {
  try {
    return JSON.stringify(context, null, 2)
  } catch {
    return String(context)
  }
}

// 🎯 전역 에러 핸들러 인스턴스
export const errorHandler = new ErrorHandler()

// 개발 환경에서 디버깅을 위한 전역 접근
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as unknown as { errorHandler: ErrorHandler }).errorHandler = errorHandler
}

export default errorHandler