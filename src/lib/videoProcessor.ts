import { spawn } from 'child_process'
import path from 'path'
import { writeFile, mkdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
  size: number
}

export interface ProcessedVideoResult {
  original: {
    width: number
    height: number
    path: string
    url: string
    duration: number
  }
  compressed: {
    width: number
    height: number
    path: string
    url: string
    duration: number
    size: number
  }
  thumbnail: {
    width: number
    height: number
    path: string
    url: string
  }
  preview: {
    width: number
    height: number
    path: string
    url: string
    duration: number
  }
  metadata: VideoMetadata
}

export interface VideoProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  targetBitrate?: string
  fps?: number
  codec?: 'h264' | 'h265'
  thumbnailTime?: number
  previewDuration?: number
  quality?: 'high' | 'medium' | 'low'
}

export class VideoProcessor {
  // 🎯 성능 및 용량 최적화 설정
  private static readonly DEFAULT_MAX_WIDTH = 1920
  private static readonly DEFAULT_MAX_HEIGHT = 1080
  private static readonly DEFAULT_BITRATE = '2M'      // 2Mbps
  private static readonly DEFAULT_FPS = 30
  private static readonly THUMBNAIL_TIME = 1         // 1초 지점
  private static readonly PREVIEW_DURATION = 10      // 10초 미리보기
  private static readonly MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

  /**
   * FFmpeg 설치 확인
   */
  static async checkFFmpegInstallation(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version'])

      ffmpeg.on('error', () => resolve(false))
      ffmpeg.on('close', (code) => resolve(code === 0))

      // 타임아웃 설정 (5초)
      setTimeout(() => {
        ffmpeg.kill()
        resolve(false)
      }, 5000)
    })
  }

  /**
   * 비디오 메타데이터 추출
   */
  static async getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        inputPath
      ])

      let stdout = ''
      let stderr = ''

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFprobe failed: ${stderr}`))
          return
        }

        try {
          const metadata = JSON.parse(stdout)
          const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video')

          if (!videoStream) {
            reject(new Error('No video stream found'))
            return
          }

          resolve({
            duration: parseFloat(metadata.format.duration) || 0,
            width: parseInt(videoStream.width) || 0,
            height: parseInt(videoStream.height) || 0,
            fps: this.parseFPS(videoStream.r_frame_rate) || 30,
            bitrate: parseInt(metadata.format.bit_rate) || 0,
            codec: videoStream.codec_name || 'unknown',
            size: parseInt(metadata.format.size) || 0
          })
        } catch (error) {
          reject(new Error(`Failed to parse metadata: ${error}`))
        }
      })

      ffprobe.on('error', (error) => {
        reject(new Error(`FFprobe error: ${error.message}`))
      })

      // 타임아웃 설정
      setTimeout(() => {
        ffprobe.kill()
        reject(new Error('FFprobe timeout'))
      }, 30000)
    })
  }

  /**
   * 비디오 압축 및 최적화
   */
  static async compressVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions = {},
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const {
      maxWidth = this.DEFAULT_MAX_WIDTH,
      maxHeight = this.DEFAULT_MAX_HEIGHT,
      targetBitrate = this.DEFAULT_BITRATE,
      fps = this.DEFAULT_FPS,
      codec = 'h264',
      quality = 'medium'
    } = options

    // 품질별 설정
    const qualityPresets = {
      high: { crf: '18', preset: 'slow' },
      medium: { crf: '23', preset: 'medium' },
      low: { crf: '28', preset: 'fast' }
    }

    const preset = qualityPresets[quality]

    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-c:v', codec === 'h265' ? 'libx265' : 'libx264',
        '-crf', preset.crf,
        '-preset', preset.preset,
        '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
        '-r', fps.toString(),
        '-b:v', targetBitrate,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart', // 웹 스트리밍 최적화
        '-y', // 덮어쓰기
        outputPath
      ]

      console.log(`🎬 FFmpeg 압축 시작: ${inputPath} → ${outputPath}`)
      console.log(`📋 FFmpeg 명령어: ffmpeg ${args.join(' ')}`)

      const ffmpeg = spawn('ffmpeg', args)

      let stderr = ''
      let duration = 0

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString()
        stderr += output

        // Duration 파싱
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/)
        if (durationMatch && duration === 0) {
          duration = this.parseTimeToSeconds(durationMatch[1], durationMatch[2], durationMatch[3])
        }

        // Progress 파싱
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
        if (timeMatch && duration > 0 && onProgress) {
          const currentTime = this.parseTimeToSeconds(timeMatch[1], timeMatch[2], timeMatch[3])
          const percent = Math.min(Math.round((currentTime / duration) * 100), 100)
          onProgress(percent)
        }
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ FFmpeg 압축 완료: ${outputPath}`)
          resolve()
        } else {
          console.error(`❌ FFmpeg 압축 실패 (code ${code}):`, stderr)
          reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        console.error(`❌ FFmpeg 프로세스 오류:`, error)
        reject(new Error(`FFmpeg process error: ${error.message}`))
      })

      // 타임아웃 설정 (30분)
      setTimeout(() => {
        ffmpeg.kill('SIGKILL')
        reject(new Error('Video compression timeout (30 minutes)'))
      }, 30 * 60 * 1000)
    })
  }

  /**
   * 비디오 썸네일 생성
   */
  static async generateThumbnail(
    inputPath: string,
    outputPath: string,
    timeInSeconds: number = this.THUMBNAIL_TIME
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-ss', timeInSeconds.toString(),
        '-vframes', '1',
        '-vf', 'scale=400:300:force_original_aspect_ratio=decrease',
        '-q:v', '2',
        '-y',
        outputPath
      ]

      console.log(`📸 썸네일 생성 시작: ${inputPath} → ${outputPath}`)

      const ffmpeg = spawn('ffmpeg', args)

      let stderr = ''

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ 썸네일 생성 완료: ${outputPath}`)
          resolve()
        } else {
          console.error(`❌ 썸네일 생성 실패 (code ${code}):`, stderr)
          reject(new Error(`Thumbnail generation failed: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        reject(new Error(`Thumbnail generation error: ${error.message}`))
      })

      // 타임아웃 설정 (2분)
      setTimeout(() => {
        ffmpeg.kill()
        reject(new Error('Thumbnail generation timeout'))
      }, 2 * 60 * 1000)
    })
  }

  /**
   * 비디오 미리보기 생성 (짧은 클립)
   */
  static async generatePreview(
    inputPath: string,
    outputPath: string,
    startTime: number = 0,
    duration: number = this.PREVIEW_DURATION
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-vf', 'scale=640:480:force_original_aspect_ratio=decrease',
        '-c:v', 'libx264',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '64k',
        '-y',
        outputPath
      ]

      console.log(`🎞️ 미리보기 생성 시작: ${inputPath} → ${outputPath}`)

      const ffmpeg = spawn('ffmpeg', args)

      let stderr = ''

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ 미리보기 생성 완료: ${outputPath}`)
          resolve()
        } else {
          console.error(`❌ 미리보기 생성 실패 (code ${code}):`, stderr)
          reject(new Error(`Preview generation failed: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        reject(new Error(`Preview generation error: ${error.message}`))
      })

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        ffmpeg.kill()
        reject(new Error('Preview generation timeout'))
      }, 5 * 60 * 1000)
    })
  }

  /**
   * 완전한 비디오 처리 파이프라인
   */
  static async processVideo(
    file: File,
    uploadDir: string,
    fileName: string,
    options: VideoProcessingOptions = {},
    onProgress?: (stage: string, percent: number) => void
  ): Promise<ProcessedVideoResult> {
    // FFmpeg 설치 확인
    const hasFFmpeg = await this.checkFFmpegInstallation()
    if (!hasFFmpeg) {
      throw new Error('FFmpeg is not installed or not accessible')
    }

    // 파일 크기 검증
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit: ${(file.size / 1024 / 1024).toFixed(1)}MB > 500MB`)
    }

    // 디렉토리 생성
    await this.ensureDirectoryExists(uploadDir)
    await this.ensureDirectoryExists(path.join(uploadDir, 'compressed'))
    await this.ensureDirectoryExists(path.join(uploadDir, 'thumbnails'))
    await this.ensureDirectoryExists(path.join(uploadDir, 'previews'))

    const baseName = path.parse(fileName).name
    const originalFileName = fileName
    const compressedFileName = `${baseName}_compressed.mp4`
    const thumbnailFileName = `${baseName}_thumb.jpg`
    const previewFileName = `${baseName}_preview.mp4`

    // 파일 경로 설정
    const originalPath = path.join(uploadDir, originalFileName)
    const compressedPath = path.join(uploadDir, 'compressed', compressedFileName)
    const thumbnailPath = path.join(uploadDir, 'thumbnails', thumbnailFileName)
    const previewPath = path.join(uploadDir, 'previews', previewFileName)

    try {
      // 1. 원본 파일 저장
      onProgress?.('원본 파일 저장', 0)
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(originalPath, buffer)
      onProgress?.('원본 파일 저장', 100)

      // 2. 메타데이터 추출
      onProgress?.('메타데이터 추출', 0)
      const metadata = await this.getVideoMetadata(originalPath)
      onProgress?.('메타데이터 추출', 100)

      // 3. 비디오 압축
      onProgress?.('비디오 압축', 0)
      await this.compressVideo(
        originalPath,
        compressedPath,
        options,
        (percent) => onProgress?.('비디오 압축', percent)
      )

      // 4. 썸네일 생성
      onProgress?.('썸네일 생성', 0)
      await this.generateThumbnail(originalPath, thumbnailPath, options.thumbnailTime)
      onProgress?.('썸네일 생성', 100)

      // 5. 미리보기 생성
      onProgress?.('미리보기 생성', 0)
      await this.generatePreview(
        originalPath,
        previewPath,
        0,
        options.previewDuration || this.PREVIEW_DURATION
      )
      onProgress?.('미리보기 생성', 100)

      // 6. 최종 파일 정보 수집
      const compressedStats = await stat(compressedPath)
      const thumbnailStats = await stat(thumbnailPath)

      return {
        original: {
          width: metadata.width,
          height: metadata.height,
          path: originalPath,
          url: `/uploads/videos/${originalFileName}`,
          duration: metadata.duration
        },
        compressed: {
          width: metadata.width,
          height: metadata.height,
          path: compressedPath,
          url: `/uploads/videos/compressed/${compressedFileName}`,
          duration: metadata.duration,
          size: compressedStats.size
        },
        thumbnail: {
          width: 400,
          height: 300,
          path: thumbnailPath,
          url: `/uploads/videos/thumbnails/${thumbnailFileName}`
        },
        preview: {
          width: 640,
          height: 480,
          path: previewPath,
          url: `/uploads/videos/previews/${previewFileName}`,
          duration: options.previewDuration || this.PREVIEW_DURATION
        },
        metadata
      }

    } catch (error) {
      // 실패 시 생성된 파일들 정리
      await this.cleanupFiles([originalPath, compressedPath, thumbnailPath, previewPath])
      throw error
    }
  }

  /**
   * 배치 비디오 처리
   */
  static async processBatchVideos(
    files: File[],
    uploadDir: string,
    options: VideoProcessingOptions = {},
    onProgress?: (current: number, total: number, fileName: string, stage: string, percent: number) => void
  ): Promise<ProcessedVideoResult[]> {
    const results: ProcessedVideoResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!file.type.startsWith('video/')) {
        continue
      }

      try {
        // 고유 파일명 생성
        const timestamp = Date.now() + i
        const randomId = Math.random().toString(36).substr(2, 9)
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${randomId}-${sanitizedName}`

        const result = await this.processVideo(
          file,
          uploadDir,
          fileName,
          options,
          (stage, percent) => {
            onProgress?.(i + 1, files.length, file.name, stage, percent)
          }
        )

        results.push(result)

      } catch (error) {
        console.error(`Error processing video ${file.name}:`, error)
        // 개별 파일 실패 시에도 계속 진행
      }
    }

    return results
  }

  // 유틸리티 메서드들
  private static parseFPS(rFrameRate: string): number {
    if (!rFrameRate) return 30

    const parts = rFrameRate.split('/')
    if (parts.length === 2) {
      return Math.round(parseInt(parts[0]) / parseInt(parts[1]))
    }
    return parseInt(rFrameRate) || 30
  }

  private static parseTimeToSeconds(hours: string, minutes: string, seconds: string): number {
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)
  }

  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true })
    } catch (error) {
      // 이미 존재하는 경우 무시
    }
  }

  private static async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (existsSync(filePath)) {
          await unlink(filePath)
        }
      } catch (error) {
        console.error(`Failed to cleanup file: ${filePath}`, error)
      }
    }
  }
}

// 타입 정의
export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov'
export type VideoCodec = 'h264' | 'h265' | 'vp9'
export type VideoQuality = 'high' | 'medium' | 'low'

export interface VideoProcessingProgress {
  stage: 'upload' | 'metadata' | 'compress' | 'thumbnail' | 'preview' | 'complete'
  percent: number
  message: string
  currentFile?: string
  totalFiles?: number
}