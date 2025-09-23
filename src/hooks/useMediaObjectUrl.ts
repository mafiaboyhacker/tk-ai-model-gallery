'use client'

import { useEffect, useState } from 'react'
// MediaDB 의존성 완전 제거 - 직접 URL 사용

type MediaVariant = 'original' | 'thumbnail'

type Options = {
  id?: string
  originalUrl?: string
  variant?: MediaVariant
  enabled?: boolean
}

/**
 * 미디어 URL을 환경에 맞게 처리하여 반환 (blob URL 제거, 직접 파일 경로 사용)
 */
export const useMediaObjectUrl = ({
  id,
  originalUrl,
  variant = 'original',
  enabled = true
}: Options) => {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!enabled || !originalUrl) {
      setObjectUrl(undefined)
      return
    }

    // 🔧 항상 API 경로를 그대로 사용 (환경 감지 없음)
    console.log('🖼️ useMediaObjectUrl 처리:', {
      originalUrl,
      enabled,
      id
    })

    // 모든 환경에서 API 경로를 그대로 사용
    setObjectUrl(originalUrl)
  }, [originalUrl, enabled, id])

  return objectUrl
}

export default useMediaObjectUrl
