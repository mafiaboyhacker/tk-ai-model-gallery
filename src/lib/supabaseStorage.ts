/**
 * Supabase Storage 통합 관리 시스템 (API Route 전용)
 * 클라이언트 사이드에서는 API Route를 통해서만 Supabase Storage에 접근
 */

import { supabase, validateSupabaseConfig } from './supabase'
import { shouldUseSupabase } from './environment'

// Storage 버킷 이름 상수
export const STORAGE_BUCKETS = {
  IMAGES: 'images',
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails'
} as const

export interface SupabaseMedia {
  id: string
  fileName: string
  url: string          // Public URL (예: /uploads/filename.jpg)
  originalUrl: string  // 원본 URL (동일)
  type: 'image' | 'video'
  width: number
  height: number
  fileSize: number
  bucketPath: string   // 파일 경로 (예: uploads/filename.jpg)
  uploadedAt: string
  duration?: number    // 비디오용
  resolution?: string  // 비디오용
  metadata?: Record<string, any>
}

/**
 * Supabase Storage 초기화 및 버킷 생성 (API Route 사용)
 */
export async function initializeSupabaseStorage(): Promise<boolean> {
  try {
    if (!shouldUseSupabase()) {
      console.log('🏠 로컬 환경: Supabase Storage 초기화 생략')
      return true
    }

    console.log('🔄 API Route를 통한 Supabase Storage 초기화...')

    const response = await fetch('/api/supabase/storage?action=init')
    const result = await response.json()

    if (result.success) {
      console.log('✅ Supabase Storage 초기화 성공:', result.message)
      return true
    } else {
      console.error('❌ Supabase Storage 초기화 실패:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Supabase Storage 초기화 API 호출 실패:', error)
    return false
  }
}

/**
 * API Route를 통한 Supabase Storage 파일 업로드
 */
export async function uploadToSupabaseStorage(
  file: File,
  metadata: any = {}
): Promise<SupabaseMedia> {
  try {
    if (!shouldUseSupabase()) {
      throw new Error('Supabase가 활성화되지 않았습니다.')
    }

    console.log(`🚀 API Route를 통한 파일 업로드: ${file.name} (${file.type})`)

    // FormData 생성
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))

    // API Route로 업로드 요청
    const response = await fetch('/api/supabase/storage?action=upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`업로드 실패: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    if (result.success) {
      console.log(`✅ API Route 업로드 성공: ${file.name}`)
      return result.data
    } else {
      throw new Error(`업로드 실패: ${result.error}`)
    }

  } catch (error) {
    console.error('❌ API Route 파일 업로드 실패:', error)
    throw error
  }
}

/**
 * 모든 업로드된 미디어 목록 가져오기 (API Route 사용)
 */
export async function getAllSupabaseMedia(): Promise<SupabaseMedia[]> {
  // 로컬 환경에서는 빈 배열 반환
  if (!shouldUseSupabase()) {
    console.log('🏠 로컬 환경: Supabase 미디어 목록 조회 생략')
    return []
  }

  try {
    console.log('🔄 API Route를 통한 Supabase 미디어 목록 조회...')

    const response = await fetch('/api/supabase/storage?action=list')
    const result = await response.json()

    if (result.success) {
      console.log(`✅ API Route 미디어 조회 성공: ${result.data.length}개`)
      return result.data
    } else {
      console.error('❌ API Route 미디어 조회 실패:', result.error)
      return []
    }
  } catch (error) {
    console.error('❌ API Route 미디어 조회 요청 실패:', error)
    return []
  }
}

/**
 * 미디어 파일 삭제 (API Route 사용)
 */
export async function deleteSupabaseMedia(mediaId: string): Promise<boolean> {
  try {
    console.log(`🗑️ API Route를 통한 Supabase 파일 삭제 중: ${mediaId}`)

    // API Route를 통한 삭제 요청
    const response = await fetch(`/api/supabase/storage?id=${mediaId}`, {
      method: 'DELETE'
    })

    console.log(`📡 삭제 API 응답 상태: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API 삭제 요청 실패: ${response.status} ${errorText}`)
      return false
    }

    const result = await response.json()

    if (result.success) {
      console.log(`✅ API Route 삭제 성공: ${mediaId}`)
      return true
    } else {
      console.error(`❌ API 삭제 실패:`, result.error)
      return false
    }
  } catch (error) {
    console.error('❌ API Route 삭제 요청 실패:', error)
    return false
  }
}

/**
 * Storage 사용량 통계 조회 (현재는 기본값 반환)
 */
export async function getSupabaseStorageUsage() {
  try {
    if (!shouldUseSupabase()) {
      return { totalFiles: 0, mediaCount: 0, usagePercent: 0 }
    }

    // 현재는 미디어 개수만 반환 (향후 개선 가능)
    const mediaList = await getAllSupabaseMedia()
    return {
      totalFiles: mediaList.length,
      mediaCount: mediaList.length,
      usagePercent: Math.min((mediaList.length / 100) * 100, 100) // 임시 계산
    }
  } catch (error) {
    console.error('❌ Storage 사용량 조회 실패:', error)
    return { totalFiles: 0, mediaCount: 0, usagePercent: 0 }
  }
}

/**
 * Supabase Storage 상태 확인 (API Route 기반)
 */
export async function checkSupabaseStorageStatus() {
  try {
    if (!shouldUseSupabase()) {
      return {
        isConnected: false,
        bucketExists: false,
        error: 'Local environment - Supabase disabled'
      }
    }

    console.log('🔍 Supabase Storage 상태 확인 중...')

    // 초기화 API Route 호출
    const response = await fetch('/api/supabase/storage?action=init')
    const result = await response.json()

    if (result.success) {
      return {
        isConnected: true,
        bucketExists: true,
        message: result.message
      }
    } else {
      return {
        isConnected: false,
        bucketExists: false,
        error: result.error
      }
    }
  } catch (error) {
    console.error('❌ Supabase Storage 상태 확인 실패:', error)
    return {
      isConnected: false,
      bucketExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}