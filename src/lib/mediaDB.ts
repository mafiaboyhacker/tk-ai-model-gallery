// IndexedDB를 사용한 대용량 미디어 저장 시스템 (이미지 + 비디오)
// localStorage 5-10MB 한계를 극복하여 수백 GB까지 저장 가능

interface MediaData {
  id: string
  type: 'image' | 'video' // 미디어 타입 구분
  thumbnailUrl: string // 갤러리용 압축된 썸네일 (base64)
  originalUrl: string  // 모달용 원본 파일 (base64)
  thumbnailBlob?: Blob // 썸네일 Blob
  originalBlob?: Blob  // 원본 Blob
  originalWidth: number // 원본 크기
  originalHeight: number
  thumbnailWidth: number // 썸네일 크기 (masonry용)
  thumbnailHeight: number
  fileName: string
  customName?: string // 사용자 지정 이름 (Model #1, Video #1 등)
  uploadedAt: number
  fileSize: number // 원본 파일 크기
  // 비디오 전용 필드
  duration?: number    // 비디오 재생 시간 (초)
  resolution?: string  // 해상도 "1920x1080"
}

// 하위 호환성을 위한 ImageData 타입 별칭
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ImageData extends MediaData {}

class MediaDB {
  private dbName = 'tk-gallery-media-db'
  private dbVersion = 2 // 비디오 지원을 위한 버전 업
  private storeName = 'media'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = async () => {
        this.db = request.result
        console.log('✅ MediaDB 초기화 완료')

        // 기존 ImageDB에서 데이터 마이그레이션 시도
        await this.migrateFromImageDB()

        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 미디어 저장소 생성/업그레이드
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false })
          store.createIndex('fileName', 'fileName', { unique: false })
          store.createIndex('type', 'type', { unique: false }) // 미디어 타입별 인덱스
          console.log('✅ MediaDB 저장소 생성 완료')
        }
      }
    })
  }

  // 미디어 파일 처리 (이미지 + 비디오)
  private async processMedia(file: File): Promise<{
    type: 'image' | 'video'
    original: { blob: Blob; dataUrl: string; width: number; height: number }
    thumbnail: { blob: Blob; dataUrl: string; width: number; height: number }
    duration?: number
    resolution?: string
  }> {
    if (file.type.startsWith('image/')) {
      return this.processImage(file)
    } else if (file.type.startsWith('video/')) {
      return this.processVideo(file)
    } else {
      throw new Error(`지원하지 않는 파일 형식: ${file.type}`)
    }
  }

  // 이미지 처리 (기존 로직)
  private async processImage(file: File): Promise<{
    type: 'image' | 'video'
    original: { blob: Blob; dataUrl: string; width: number; height: number }
    thumbnail: { blob: Blob; dataUrl: string; width: number; height: number }
  }> {
    return new Promise((resolve) => {
      const img = new Image()

      img.onload = async () => {
        const originalWidth = img.width
        const originalHeight = img.height

        // 1. 원본 이미지 (화질 무손실, 크기만 제한)
        const originalResult = await this.createImageVersion(img, {
          maxSize: 2400, // 4K급 해상도까지 허용
          quality: 0.98,  // 거의 무손실
          suffix: 'original'
        })

        // 2. 썸네일 (웹 갤러리용)
        const thumbnailResult = await this.createImageVersion(img, {
          maxSize: 800,   // 갤러리용 적정 크기
          quality: 0.85,  // 웹 최적화
          suffix: 'thumbnail'
        })

        resolve({
          type: 'image',
          original: {
            ...originalResult,
            width: originalWidth > 2400 ? 2400 : originalWidth,
            height: originalHeight > 2400 ? Math.round(originalHeight * (2400 / originalWidth)) : originalHeight
          },
          thumbnail: thumbnailResult
        })
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // 비디오 처리 로직
  private async processVideo(file: File): Promise<{
    type: 'image' | 'video'
    original: { blob: Blob; dataUrl: string; width: number; height: number }
    thumbnail: { blob: Blob; dataUrl: string; width: number; height: number }
    duration?: number
    resolution?: string
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true // 자동 재생을 위해 음소거

      video.onloadedmetadata = async () => {
        try {
          const width = video.videoWidth
          const height = video.videoHeight
          const duration = video.duration
          const resolution = `${width}x${height}`

          // 첫 프레임에서 썸네일 추출
          video.currentTime = 0.1 // 0.1초 지점의 프레임
        } catch (error) {
          reject(error)
        }
      }

      video.onseeked = async () => {
        try {
          // Canvas로 첫 프레임 캡처
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            // 원본과 썸네일 생성
            const originalBlob = await this.canvasToBlob(canvas, 0.95)
            const originalDataUrl = canvas.toDataURL('image/jpeg', 0.95)

            // 썸네일 생성 (800px 제한)
            const thumbnailCanvas = document.createElement('canvas')
            const thumbnailCtx = thumbnailCanvas.getContext('2d')

            let { width, height } = { width: canvas.width, height: canvas.height }
            const maxSize = 800

            if (width > height) {
              if (width > maxSize) {
                height = Math.round(height * (maxSize / width))
                width = maxSize
              }
            } else {
              if (height > maxSize) {
                width = Math.round(width * (maxSize / height))
                height = maxSize
              }
            }

            thumbnailCanvas.width = width
            thumbnailCanvas.height = height

            if (thumbnailCtx) {
              thumbnailCtx.imageSmoothingEnabled = true
              thumbnailCtx.imageSmoothingQuality = 'high'
              thumbnailCtx.drawImage(canvas, 0, 0, width, height)
            }

            const thumbnailBlob = await this.canvasToBlob(thumbnailCanvas, 0.85)
            const thumbnailDataUrl = thumbnailCanvas.toDataURL('image/jpeg', 0.85)

            // 원본 비디오도 base64로 변환 (모달용)
            const originalVideoDataUrl = await this.fileToDataUrl(file)

            resolve({
              type: 'video',
              original: {
                blob: file, // 원본 비디오 파일
                dataUrl: originalVideoDataUrl,
                width: canvas.width,
                height: canvas.height
              },
              thumbnail: {
                blob: thumbnailBlob,
                dataUrl: thumbnailDataUrl,
                width,
                height
              },
              duration: video.duration,
              resolution: `${canvas.width}x${canvas.height}`
            })
          }

          // 메모리 해제
          URL.revokeObjectURL(video.src)
        } catch (error) {
          reject(error)
        }
      }

      video.onerror = () => reject(new Error('비디오 로딩 실패'))
      video.src = URL.createObjectURL(file)
    })
  }

  // Canvas를 Blob으로 변환하는 헬퍼 함수
  private async canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/jpeg', quality)
    })
  }

  // File을 DataUrl로 변환하는 헬퍼 함수
  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 이미지 버전 생성 헬퍼 함수
  private async createImageVersion(
    img: HTMLImageElement,
    options: { maxSize: number; quality: number; suffix: string }
  ): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let { width, height } = img
      const { maxSize, quality } = options

      // 비율 유지하면서 크기 조정
      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * (maxSize / width))
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round(width * (maxSize / height))
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // 고화질 렌더링 설정
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const dataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve({ blob, dataUrl, width, height })
        }
      }, 'image/jpeg', quality)
    })
  }

  // 순차적 이름 생성 (Model #1, Video #1 등)
  private async generateSequentialName(type: 'image' | 'video'): Promise<string> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction([this.storeName], 'readonly')
    const store = transaction.objectStore(this.storeName)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const allMedia = request.result
        // 해당 타입의 미디어 개수 계산
        const sameTypeMedia = allMedia.filter(media => media.type === type)
        const nextNumber = sameTypeMedia.length + 1
        resolve(type === 'video' ? `Video #${nextNumber}` : `Model #${nextNumber}`)
      }
    })
  }

  // 여러 미디어 추가 (배치 처리) - 이미지와 비디오 모두 지원
  async addMedia(files: File[]): Promise<MediaData[]> {
    console.log('📂 MediaDB.addMedia 시작:', files.length, '개 파일')

    try {
      if (!this.db) {
        console.log('🔧 MediaDB 초기화 필요...')
        await this.init()
      }
      console.log('✅ MediaDB 준비 완료')

      const processedMedia: MediaData[] = []

      // 배치 처리로 성능 최적화
      for (const file of files) {
        console.log(`📁 파일 처리 시작: ${file.name} (${file.type}, ${this.formatBytes(file.size)})`)

        // 이미지와 비디오만 처리
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          console.warn(`⚠️ 지원하지 않는 파일 형식: ${file.name} (${file.type})`)
          continue
        }

        try {
          const mediaType = file.type.startsWith('video/') ? '비디오' : '이미지'
          console.log(`🔄 ${mediaType} 처리 시작: ${file.name} (${this.formatBytes(file.size)})`)

          // 미디어 파일 처리 (이미지 또는 비디오)
          console.log(`🛠️ processMedia 호출...`)
          const processed = await this.processMedia(file)
          console.log(`✅ processMedia 완료:`, processed.id)

        // 순차적 이름 생성 (Model #1, Video #1 등)
        const customName = await this.generateSequentialName(processed.type)

        const mediaData: MediaData = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: processed.type,
          thumbnailUrl: processed.thumbnail.dataUrl,    // 갤러리용 썸네일
          originalUrl: processed.original.dataUrl,      // 모달용 원본
          thumbnailBlob: processed.thumbnail.blob,
          originalBlob: processed.original.blob,
          originalWidth: processed.original.width,
          originalHeight: processed.original.height,
          thumbnailWidth: processed.thumbnail.width,
          thumbnailHeight: processed.thumbnail.height,
          fileName: file.name,
          customName: customName,
          uploadedAt: Date.now(),
          fileSize: file.size,
          // 비디오 전용 필드
          duration: processed.duration,
          resolution: processed.resolution
        }

        // IndexedDB에 저장
        await this.saveMedia(mediaData)
        processedMedia.push(mediaData)

        if (processed.type === 'video') {
          console.log(`✅ 비디오 저장 완료: ${file.name}`)
          console.log(`   해상도: ${processed.resolution}, 재생시간: ${Math.round(processed.duration || 0)}초`)
          console.log(`   썸네일: ${processed.thumbnail.width}x${processed.thumbnail.height}`)
        } else {
          console.log(`✅ 이미지 저장 완료: ${file.name}`)
          console.log(`   원본: ${processed.original.width}x${processed.original.height}`)
          console.log(`   썸네일: ${processed.thumbnail.width}x${processed.thumbnail.height}`)
        }

      } catch (error) {
        console.error(`❌ 미디어 처리 실패: ${file.name}`, error)
      }
    }

      console.log(`✅ 총 ${processedMedia.length}개 미디어 파일 처리 완료`)
      return processedMedia

    } catch (error) {
      console.error('❌ MediaDB.addMedia 전체 실패:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }

  // 하위 호환성을 위한 addImages 메서드 (deprecated)
  async addImages(files: File[]): Promise<ImageData[]> {
    console.warn('⚠️ addImages는 deprecated입니다. addMedia를 사용하세요.')
    return this.addMedia(files) as Promise<ImageData[]>
  }

  // 단일 미디어 저장
  private async saveMedia(mediaData: MediaData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(mediaData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 모든 미디어 조회
  async getAllMedia(): Promise<MediaData[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // 타입별 미디어 조회
  async getMediaByType(type: 'image' | 'video'): Promise<MediaData[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('type')
      const request = index.getAll(type)

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  // 미디어 삭제
  async removeMedia(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 모든 미디어 삭제
  async clearAllMedia(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 커스텀 이름 업데이트
  async updateCustomName(id: string, customName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'))

      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      // 먼저 기존 데이터를 가져오기
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const mediaData = getRequest.result
        if (!mediaData) {
          reject(new Error('Media not found'))
          return
        }

        // customName 업데이트
        mediaData.customName = customName

        // 업데이트된 데이터 저장
        const putRequest = store.put(mediaData)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // 하위 호환성을 위한 메서드들
  async getAllImages(): Promise<ImageData[]> {
    return this.getAllMedia() as Promise<ImageData[]>
  }

  async removeImage(id: string): Promise<void> {
    return this.removeMedia(id)
  }

  async clearAllImages(): Promise<void> {
    return this.clearAllMedia()
  }

  // 저장 용량 통계 (미디어별 분석 포함)
  async getStorageStats(): Promise<{
    count: number
    estimatedSize: string
    images: number
    videos: number
  }> {
    const allMedia = await this.getAllMedia()
    const images = allMedia.filter(m => m.type === 'image')
    const videos = allMedia.filter(m => m.type === 'video')

    const totalSize = allMedia.reduce((sum, media) => {
      // 1. 원본 파일 크기를 우선 사용 (가장 정확)
      if (media.fileSize && media.fileSize > 0) {
        return sum + media.fileSize
      }

      // 2. Blob 크기 사용 (정확한 크기)
      const thumbnailSize = media.thumbnailBlob?.size || 0
      const originalSize = media.originalBlob?.size || 0

      if (thumbnailSize > 0 || originalSize > 0) {
        return sum + thumbnailSize + originalSize
      }

      // 3. Base64 길이로 추정 (가장 부정확하지만 fallback)
      const base64ThumbnailSize = media.thumbnailUrl ? media.thumbnailUrl.length * 0.75 : 0
      const base64OriginalSize = media.originalUrl ? media.originalUrl.length * 0.75 : 0

      return sum + base64ThumbnailSize + base64OriginalSize
    }, 0)

    return {
      count: allMedia.length,
      estimatedSize: this.formatBytes(totalSize),
      images: images.length,
      videos: videos.length
    }
  }

  // 데이터 정합성 검증 및 정리 함수
  async validateAndCleanData(): Promise<{
    checkedCount: number
    repairedCount: number
    removedCount: number
    issues: string[]
  }> {
    const allMedia = await this.getAllMedia()
    let repairedCount = 0
    let removedCount = 0
    const issues: string[] = []
    const validMedia: MediaData[] = []

    console.log(`🔍 데이터 정합성 검증 시작: ${allMedia.length}개 항목 검사`)

    for (const media of allMedia) {
      let shouldRemove = false
      let hasIssues = false

      // 1. 필수 필드 검증
      if (!media.id || !media.type || !media.fileName) {
        issues.push(`${media.id || 'Unknown'}: 필수 필드 누락`)
        shouldRemove = true
      }

      // 2. 타입 검증
      if (media.type && !['image', 'video'].includes(media.type)) {
        issues.push(`${media.id}: 잘못된 타입 - ${media.type}`)
        shouldRemove = true
      }

      // 3. URL 및 Blob 검증
      if (!media.thumbnailUrl && !media.thumbnailBlob) {
        issues.push(`${media.id}: 썸네일 데이터 누락`)
        hasIssues = true
      }

      if (!media.originalUrl && !media.originalBlob) {
        issues.push(`${media.id}: 원본 데이터 누락`)
        hasIssues = true
      }

      // 4. 크기 정보 검증
      if (!media.originalWidth || !media.originalHeight || media.originalWidth <= 0 || media.originalHeight <= 0) {
        issues.push(`${media.id}: 잘못된 크기 정보`)
        hasIssues = true
      }

      // 5. 비디오 필드 검증
      if (media.type === 'video') {
        if (!media.duration || media.duration <= 0) {
          issues.push(`${media.id}: 비디오 재생시간 누락`)
          hasIssues = true
        }
        if (!media.resolution) {
          issues.push(`${media.id}: 비디오 해상도 정보 누락`)
          hasIssues = true
        }
      }

      // 6. 타임스탬프 검증
      if (!media.uploadedAt || media.uploadedAt <= 0) {
        issues.push(`${media.id}: 업로드 시간 정보 누락`)
        hasIssues = true
      }

      if (shouldRemove) {
        // 심각한 오류가 있는 데이터는 삭제
        await this.removeMedia(media.id)
        removedCount++
        console.log(`🗑️ 손상된 데이터 삭제: ${media.id}`)
      } else {
        validMedia.push(media)
        if (hasIssues) {
          repairedCount++
        }
      }
    }

    console.log(`✅ 데이터 정합성 검증 완료:`)
    console.log(`   - 검사된 항목: ${allMedia.length}개`)
    console.log(`   - 문제가 있었던 항목: ${repairedCount}개`)
    console.log(`   - 삭제된 항목: ${removedCount}개`)
    console.log(`   - 최종 유효 항목: ${validMedia.length}개`)

    return {
      checkedCount: allMedia.length,
      repairedCount,
      removedCount,
      issues
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 기존 ImageDB에서 MediaDB로 데이터 마이그레이션
  private async migrateFromImageDB(): Promise<void> {
    try {
      // 기존 ImageDB 확인
      const imageDBRequest = indexedDB.open('tk-gallery-image-db', 1)

      imageDBRequest.onsuccess = async () => {
        const imageDB = imageDBRequest.result

        if (!imageDB.objectStoreNames.contains('images')) {
          console.log('ℹ️  기존 ImageDB 데이터 없음 - 마이그레이션 생략')
          return
        }

        console.log('🔄 ImageDB에서 MediaDB로 데이터 마이그레이션 시작...')

        const transaction = imageDB.transaction(['images'], 'readonly')
        const store = transaction.objectStore('images')
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = async () => {
          const oldImages = getAllRequest.result

          if (oldImages.length === 0) {
            console.log('ℹ️  마이그레이션할 이미지 데이터 없음')
            return
          }

          console.log(`📦 ${oldImages.length}개의 기존 이미지를 MediaDB로 마이그레이션 중...`)

          // 기존 이미지 데이터를 MediaData 형식으로 변환
          const migratedMedia: MediaData[] = oldImages.map((oldImage: any) => ({
            id: oldImage.id,
            type: 'image' as const, // 기존 데이터는 모두 이미지
            thumbnailUrl: oldImage.thumbnailUrl,
            originalUrl: oldImage.originalUrl,
            thumbnailBlob: oldImage.thumbnailBlob,
            originalBlob: oldImage.originalBlob,
            originalWidth: oldImage.originalWidth,
            originalHeight: oldImage.originalHeight,
            thumbnailWidth: oldImage.thumbnailWidth,
            thumbnailHeight: oldImage.thumbnailHeight,
            fileName: oldImage.fileName,
            uploadedAt: oldImage.uploadedAt,
            fileSize: oldImage.fileSize,
            // 비디오 필드는 undefined (이미지이므로)
            duration: undefined,
            resolution: undefined
          }))

          // MediaDB에 저장
          if (this.db) {
            const mediaTransaction = this.db.transaction(['media'], 'readwrite')
            const mediaStore = mediaTransaction.objectStore('media')

            for (const media of migratedMedia) {
              try {
                await new Promise<void>((resolve, reject) => {
                  const addRequest = mediaStore.add(media)
                  addRequest.onsuccess = () => resolve()
                  addRequest.onerror = () => {
                    // 이미 존재하는 데이터는 건너뛰기
                    if (addRequest.error?.name === 'ConstraintError') {
                      resolve()
                    } else {
                      reject(addRequest.error)
                    }
                  }
                })
              } catch (error) {
                console.warn('⚠️  데이터 마이그레이션 중 오류 (건너뛰기):', error)
              }
            }

            console.log(`✅ ${migratedMedia.length}개 이미지 마이그레이션 완료!`)

            // 기존 ImageDB는 유지 (사용자가 수동으로 삭제할 수 있도록)
            console.log('ℹ️  기존 ImageDB는 백업으로 보관됩니다')
          }
        }

        getAllRequest.onerror = () => {
          console.error('❌ ImageDB 데이터 읽기 실패:', getAllRequest.error)
        }
      }

      imageDBRequest.onerror = () => {
        // ImageDB가 없는 것은 정상 (처음 사용하는 경우)
        console.log('ℹ️  기존 ImageDB 없음 - 새로운 사용자')
      }
    } catch (error) {
      console.error('❌ 마이그레이션 중 오류:', error)
    }
  }
}

// 싱글톤 인스턴스 (하위 호환성을 위해 imageDB 이름 유지)
export const imageDB = new MediaDB()
export const mediaDB = imageDB // 새로운 이름으로도 접근 가능

// 타입 내보내기
export type { MediaData, ImageData }