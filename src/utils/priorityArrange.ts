import type { Media } from '@/types'

/**
 * 🎯 상단 우선 배치 시스템
 * - 상단 6개 슬롯을 미리 확정하여 안정적인 레이아웃 구성
 * - 비디오/이미지 황금비율 (2:4) 적용
 * - 다양한 aspect ratio 믹스로 시각적 균형
 */

interface PriorityArrangement {
  priority: Media[]    // 상단 6개 확정 아이템
  remaining: Media[]   // 나머지 아이템들
}

export function arrangeWithPriority(media: Media[]): PriorityArrangement {
  if (media.length === 0) {
    return { priority: [], remaining: [] }
  }

  // 타입별 분리
  const videos = media.filter(item => item.type === 'video')
  const images = media.filter(item => item.type === 'image')

  // Aspect ratio별 이미지 분류
  const landscapes = images.filter(img => (img.width / img.height) > 1.5)
  const portraits = images.filter(img => (img.width / img.height) < 0.8)
  const squares = images.filter(img => {
    const ratio = img.width / img.height
    return ratio >= 0.8 && ratio <= 1.5
  })

  // 상단 6개 황금 배치 패턴
  const priority: Media[] = []

  // 1번 슬롯: 비디오 (가장 eye-catching)
  if (videos.length > 0) {
    priority.push(videos[0])
  } else if (landscapes.length > 0) {
    priority.push(landscapes[0])
  } else if (images.length > 0) {
    priority.push(images[0])
  }

  // 2번 슬롯: 세로 이미지 (높이로 시각적 균형)
  if (portraits.length > 0 && priority.length < 6) {
    priority.push(portraits[0])
  } else if (squares.length > 0 && priority.length < 6) {
    priority.push(squares[0])
  } else if (images.length > priority.filter(p => p.type === 'image').length && priority.length < 6) {
    const usedImageIds = priority.filter(p => p.type === 'image').map(p => p.id)
    const availableImages = images.filter(img => !usedImageIds.includes(img.id))
    if (availableImages.length > 0) {
      priority.push(availableImages[0])
    }
  }

  // 3번 슬롯: 가로 이미지 (안정감)
  if (landscapes.length > 0 && priority.length < 6) {
    const usedIds = priority.map(p => p.id)
    const availableLandscapes = landscapes.filter(img => !usedIds.includes(img.id))
    if (availableLandscapes.length > 0) {
      priority.push(availableLandscapes[0])
    } else if (squares.length > 0) {
      const availableSquares = squares.filter(img => !usedIds.includes(img.id))
      if (availableSquares.length > 0) {
        priority.push(availableSquares[0])
      }
    }
  }

  // 4번 슬롯: 두 번째 비디오 (동적 요소)
  if (videos.length > 1 && priority.length < 6) {
    priority.push(videos[1])
  } else if (priority.length < 6) {
    const usedIds = priority.map(p => p.id)
    const availableMedia = media.filter(item => !usedIds.includes(item.id))
    if (availableMedia.length > 0) {
      priority.push(availableMedia[0])
    }
  }

  // 5-6번 슬롯: 나머지 이미지들로 채우기
  while (priority.length < 6 && priority.length < media.length) {
    const usedIds = priority.map(p => p.id)
    const availableMedia = media.filter(item => !usedIds.includes(item.id))

    if (availableMedia.length === 0) break

    // 다양성을 위해 squares > portraits > landscapes 순서로 선호
    const nextItem =
      squares.find(img => !usedIds.includes(img.id)) ||
      portraits.find(img => !usedIds.includes(img.id)) ||
      landscapes.find(img => !usedIds.includes(img.id)) ||
      availableMedia[0]

    if (nextItem) {
      priority.push(nextItem)
    }
  }

  // 나머지 아이템들
  const priorityIds = priority.map(p => p.id)
  const remaining = media.filter(item => !priorityIds.includes(item.id))

  // 나머지는 골고루 분산 배치 (기존 로직 활용)
  const shuffledRemaining = shuffleRemainingMedia(remaining)

  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 우선 배치 완료:`, {
      priority: priority.length,
      remaining: shuffledRemaining.length,
      videoCount: priority.filter(p => p.type === 'video').length,
      imageCount: priority.filter(p => p.type === 'image').length
    })
  }

  return {
    priority,
    remaining: shuffledRemaining
  }
}

/**
 * 나머지 미디어들을 골고루 분산 배치
 */
function shuffleRemainingMedia(media: Media[]): Media[] {
  const videos = media.filter(item => item.type === 'video')
  const images = media.filter(item => item.type === 'image')

  // 비디오가 골고루 분산되도록 배치
  const result: Media[] = []
  const maxLength = Math.max(videos.length, images.length)

  // 이미지 3개당 비디오 1개 비율로 섞기
  let videoIndex = 0
  let imageIndex = 0

  for (let i = 0; i < maxLength * 4; i++) {
    if (i % 4 === 0 && videoIndex < videos.length) {
      result.push(videos[videoIndex++])
    } else if (imageIndex < images.length) {
      result.push(images[imageIndex++])
    }
  }

  // 남은 아이템들 추가
  while (videoIndex < videos.length) {
    result.push(videos[videoIndex++])
  }
  while (imageIndex < images.length) {
    result.push(images[imageIndex++])
  }

  return result
}

/**
 * 우선 아이템들의 메타데이터 보강
 * - 미드저니 스타일: 원본 비율 유지
 * - Chrome 안정성을 위한 메타데이터 추가만
 */
export function optimizePriorityLayout(priority: Media[], columnWidth: number) {
  return priority.map((item, index) => {
    // 원본 비율 유지 - 높이는 컴포넌트에서 계산
    return {
      ...item,
      isPriority: true,
      priorityIndex: index
    }
  })
}