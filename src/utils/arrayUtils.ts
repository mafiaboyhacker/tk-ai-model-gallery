/**
 * 배열 셔플 유틸리티 함수
 * Fisher-Yates 셔플 알고리즘을 사용하여 배열을 랜덤하게 섞습니다.
 */

/**
 * 배열을 랜덤하게 섞어서 새로운 배열을 반환합니다.
 * 원본 배열은 수정되지 않습니다.
 *
 * @param array 셔플할 배열
 * @returns 셔플된 새로운 배열
 */
export function shuffleArray<T>(array: T[]): T[] {
  // 원본 배열을 복사하여 수정하지 않도록 함
  const shuffled = [...array];

  // Fisher-Yates 셔플 알고리즘
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * 시드 값을 기반으로 배열을 섞습니다.
 * 동일한 시드 값으로는 항상 동일한 결과를 반환합니다.
 *
 * @param array 셔플할 배열
 * @param seed 시드 값 (선택적)
 * @returns 셔플된 새로운 배열
 */
export function shuffleArrayWithSeed<T>(array: T[], seed?: number): T[] {
  const shuffled = [...array];

  // 시드가 제공되지 않으면 현재 시간을 시드로 사용
  const seedValue = seed ?? Date.now();

  // 간단한 의사 난수 생성기 (시드 기반)
  let random = seedValue;
  const pseudoRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * 배열의 처음 n개 요소를 랜덤하게 선택합니다.
 *
 * @param array 선택할 배열
 * @param count 선택할 요소 개수
 * @returns 랜덤하게 선택된 요소들의 배열
 */
export function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * 랜덤 인덱스를 생성합니다.
 *
 * @param length 배열의 길이
 * @returns 0부터 length-1 사이의 랜덤 인덱스
 */
export function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

/**
 * 배열에서 랜덤한 요소 하나를 선택합니다.
 *
 * @param array 선택할 배열
 * @returns 랜덤하게 선택된 요소 (배열이 비어있으면 undefined)
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[getRandomIndex(array.length)];
}

/**
 * 비율 기반 미디어 배치 - 모든 비디오 표시 + 골고루 분산
 * @param media 전체 미디어 배열
 * @param videoRatio 사용되지 않음 (모든 비디오 표시)
 * @param topVideoCount 사용되지 않음 (하위 호환성 유지)
 */
export function arrangeMediaByRatio<T extends { type: 'image' | 'video' }>(
  media: T[],
  videoRatio: number = 0.15,
  topVideoCount: number = 3
): T[] {
  if (media.length === 0) return []

  // 이미지와 비디오 분리
  const videos = media.filter(item => item.type === 'video')
  const images = media.filter(item => item.type === 'image')

  console.log(`📊 미디어 분석: 총 ${media.length}개 (비디오 ${videos.length}개, 이미지 ${images.length}개)`)

  // 모든 비디오를 사용 (제한 없음)
  const shuffledVideos = shuffleArray(videos)
  const shuffledImages = shuffleArray(images)

  // 비디오가 골고루 분산되도록 배치
  const result: T[] = []
  const totalItems = videos.length + images.length

  if (videos.length === 0) {
    // 비디오가 없으면 이미지만 반환
    console.log('🖼️ 비디오 없음: 이미지만 표시')
    return shuffledImages
  }

  // 비디오 간격 계산 (전체 길이를 비디오 개수로 나누어 균등 분배)
  const videoInterval = Math.floor(totalItems / videos.length)

  let videoIndex = 0
  let imageIndex = 0

  for (let i = 0; i < totalItems; i++) {
    // 비디오를 일정 간격으로 배치
    const shouldPlaceVideo = (i % videoInterval === 0) && videoIndex < videos.length

    if (shouldPlaceVideo && videoIndex < shuffledVideos.length) {
      result.push(shuffledVideos[videoIndex])
      videoIndex++
    } else if (imageIndex < shuffledImages.length) {
      result.push(shuffledImages[imageIndex])
      imageIndex++
    }
  }

  // 남은 비디오나 이미지가 있으면 추가
  while (videoIndex < shuffledVideos.length) {
    result.push(shuffledVideos[videoIndex])
    videoIndex++
  }
  while (imageIndex < shuffledImages.length) {
    result.push(shuffledImages[imageIndex])
    imageIndex++
  }

  console.log(`🎯 골고루 분산 배치 완료: 비디오 ${videos.length}개, 이미지 ${images.length}개`)

  return result
}

/**
 * 조절 가능한 비율 설정
 */
export interface MediaRatioConfig {
  videoRatio: number      // 전체 비디오 비율 (0.0 ~ 1.0)
  topVideoCount: number   // 상단 고정 비디오 개수 (모바일)
  topVideoCountDesktop?: number   // 상단 고정 비디오 개수 (데스크탑)
  shuffleMode: 'random' | 'ratio-based' | 'featured' // 셔플 모드
}