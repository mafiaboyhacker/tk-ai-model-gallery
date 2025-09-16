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
 * 비율 기반 미디어 배치 (비디오 우선 상단 배치)
 * @param media 전체 미디어 배열
 * @param videoRatio 비디오 비율 (0.0 ~ 1.0, 기본값: 0.15 = 15%)
 * @param topVideoCount 상단에 배치할 비디오 개수 (기본값: 3)
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

  // 각각 랜덤 셔플
  const shuffledVideos = shuffleArray(videos)
  const shuffledImages = shuffleArray(images)

  // 전체 배열 길이 기준으로 비디오 개수 계산
  const totalVideoCount = Math.max(
    Math.floor(media.length * videoRatio),
    Math.min(topVideoCount, shuffledVideos.length) // 최소 topVideoCount개 또는 실제 비디오 개수
  )

  // 상단 비디오 배치
  const topVideos = shuffledVideos.slice(0, topVideoCount)
  const remainingVideos = shuffledVideos.slice(topVideoCount)

  // 나머지 비디오 개수 계산 (전체 비율에서 상단 비디오 제외)
  const remainingVideoCount = Math.max(0, totalVideoCount - topVideoCount)
  const additionalVideos = remainingVideos.slice(0, remainingVideoCount)

  // 사용되지 않은 비디오들은 이미지로 처리 (비율 초과분)
  const unusedVideos = remainingVideos.slice(remainingVideoCount)

  // 이미지 개수 계산 (전체 - 사용된 비디오)
  const usedVideoCount = topVideos.length + additionalVideos.length
  const imageCount = media.length - usedVideoCount
  const finalImages = [...shuffledImages, ...unusedVideos].slice(0, imageCount)

  // 최종 배치: 상단 비디오 + 나머지 섞어서 배치
  const middleSection = shuffleArray([...additionalVideos, ...finalImages])

  return [...topVideos, ...middleSection]
}

/**
 * 조절 가능한 비율 설정
 */
export interface MediaRatioConfig {
  videoRatio: number      // 전체 비디오 비율 (0.0 ~ 1.0)
  topVideoCount: number   // 상단 고정 비디오 개수
  shuffleMode: 'full' | 'ratio-based' // 전체 셔플 vs 비율 기반 배치
}