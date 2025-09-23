'use client'

import { useState, useEffect, useRef } from 'react'
import { useMediaStore } from '@/store/imageStore'

interface VideoProcessingProgress {
  sessionId: string
  stage: string
  percent: number
  message: string
  totalFiles?: number
  currentFile?: number
  fileName?: string
  elapsed: number
}

interface VideoProcessingModalProps {
  isOpen: boolean
  onClose: () => void
  files: File[]
  onComplete?: (results: any[]) => void
}

export default function VideoProcessingModal({
  isOpen,
  onClose,
  files,
  onComplete
}: VideoProcessingModalProps) {
  const [progress, setProgress] = useState<VideoProcessingProgress | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [processingOptions, setProcessingOptions] = useState({
    enableProcessing: true,
    quality: 'medium' as 'high' | 'medium' | 'low',
    maxWidth: 1920,
    maxHeight: 1080,
    generateThumbnail: true,
    generatePreview: true
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const sessionIdRef = useRef<string>('')
  const { addMedia } = useMediaStore()

  // 세션 ID 생성
  useEffect(() => {
    if (isOpen && files.length > 0) {
      sessionIdRef.current = `video-processing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }, [isOpen, files])

  // 진행률 스트림 연결
  const connectProgressStream = () => {
    if (!sessionIdRef.current) return

    const eventSource = new EventSource(`/api/railway/storage/progress?sessionId=${sessionIdRef.current}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress(data)

        if (data.stage === 'completed' && data.percent >= 100) {
          setIsProcessing(false)
          eventSource.close()
        }
      } catch (error) {
        console.error('Progress parsing error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
      eventSource.close()
    }

    eventSourceRef.current = eventSource
  }

  // 진행률 업데이트 함수
  const updateProgress = async (stage: string, percent: number, message: string, additionalData?: any) => {
    try {
      await fetch('/api/railway/storage/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          stage,
          percent,
          message,
          ...additionalData
        })
      })
    } catch (error) {
      console.error('Progress update failed:', error)
    }
  }

  // 비디오 처리 시작
  const startProcessing = async () => {
    if (!files.length || isProcessing) return

    setIsProcessing(true)
    setResults([])
    setProgress(null)

    // 진행률 스트림 연결
    connectProgressStream()

    const videoFiles = files.filter(file => file.type.startsWith('video/'))
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const totalFiles = videoFiles.length + imageFiles.length

    try {
      await updateProgress('starting', 0, 'Initializing processing...', {
        totalFiles,
        currentFile: 0
      })

      const uploadResults: any[] = []

      // 파일별 순차 처리
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isVideo = file.type.startsWith('video/')

        await updateProgress(
          'uploading',
          Math.round((i / totalFiles) * 100),
          `Processing ${file.name}...`,
          {
            totalFiles,
            currentFile: i + 1,
            fileName: file.name
          }
        )

        try {
          // FormData 준비
          const formData = new FormData()
          formData.append('file', file)
          formData.append('enableProcessing', processingOptions.enableProcessing.toString())
          formData.append('metadata', JSON.stringify({
            enableProcessing: processingOptions.enableProcessing,
            quality: processingOptions.quality,
            maxWidth: processingOptions.maxWidth,
            maxHeight: processingOptions.maxHeight,
            thumbnailTime: 1
          }))

          // 업로드 요청
          const response = await fetch('/api/railway/storage?action=upload', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`)
          }

          const result = await response.json()

          if (result.success) {
            uploadResults.push(result.data)
            console.log(`✅ ${file.name} 처리 완료:`, result.data)
          } else {
            throw new Error(result.error || 'Upload failed')
          }

        } catch (fileError) {
          console.error(`❌ ${file.name} 처리 실패:`, fileError)
          uploadResults.push({
            fileName: file.name,
            error: fileError instanceof Error ? fileError.message : 'Unknown error',
            success: false
          })
        }
      }

      // 완료 처리
      await updateProgress('completed', 100, `Processing completed! ${uploadResults.length} files processed.`)

      setResults(uploadResults)
      onComplete?.(uploadResults)

      // 성공한 파일들을 스토어에 추가
      const successfulResults = uploadResults.filter(r => r.success !== false)
      if (successfulResults.length > 0) {
        await addMedia(files) // 전체 목록 새로고침
      }

    } catch (error) {
      console.error('❌ Processing failed:', error)
      await updateProgress('error', 0, `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsProcessing(false)
    }
  }

  // 모달 닫기
  const handleClose = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (sessionIdRef.current) {
      // 진행률 데이터 정리
      fetch(`/api/railway/storage/progress?sessionId=${sessionIdRef.current}`, {
        method: 'DELETE'
      }).catch(console.error)
    }

    setProgress(null)
    setIsProcessing(false)
    setResults([])
    onClose()
  }

  // 진행률 바 컴포넌트
  const ProgressBar = ({ percent }: { percent: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
      <div
        className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  )

  // 시간 포맷팅
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Video Processing</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* 처리 옵션 */}
        {!isProcessing && results.length === 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Processing Options</h3>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={processingOptions.enableProcessing}
                  onChange={(e) => setProcessingOptions(prev => ({
                    ...prev,
                    enableProcessing: e.target.checked
                  }))}
                  className="mr-2"
                />
                <span>Enable video/image processing (compression, thumbnails)</span>
              </label>

              {processingOptions.enableProcessing && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quality</label>
                    <select
                      value={processingOptions.quality}
                      onChange={(e) => setProcessingOptions(prev => ({
                        ...prev,
                        quality: e.target.value as 'high' | 'medium' | 'low'
                      }))}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="high">High (slower, better quality)</option>
                      <option value="medium">Medium (balanced)</option>
                      <option value="low">Low (faster, smaller size)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Width</label>
                      <input
                        type="number"
                        value={processingOptions.maxWidth}
                        onChange={(e) => setProcessingOptions(prev => ({
                          ...prev,
                          maxWidth: parseInt(e.target.value) || 1920
                        }))}
                        className="w-full border rounded px-3 py-2"
                        min="720"
                        max="3840"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Height</label>
                      <input
                        type="number"
                        value={processingOptions.maxHeight}
                        onChange={(e) => setProcessingOptions(prev => ({
                          ...prev,
                          maxHeight: parseInt(e.target.value) || 1080
                        }))}
                        className="w-full border rounded px-3 py-2"
                        min="480"
                        max="2160"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 파일 목록 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Files to Process ({files.length})</h3>
          <div className="max-h-32 overflow-y-auto border rounded p-2">
            {files.map((file, index) => (
              <div key={index} className="flex justify-between items-center py-1 text-sm">
                <span className="truncate">{file.name}</span>
                <span className="text-gray-500 ml-2">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 진행률 표시 */}
        {progress && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {progress.stage} ({progress.percent}%)
              </span>
              <span className="text-sm text-gray-500">
                {formatTime(progress.elapsed)}
              </span>
            </div>

            <ProgressBar percent={progress.percent} />

            <div className="text-sm text-gray-600 mb-2">
              {progress.message}
            </div>

            {progress.totalFiles && progress.currentFile && (
              <div className="text-sm text-gray-500">
                File {progress.currentFile} of {progress.totalFiles}
                {progress.fileName && `: ${progress.fileName}`}
              </div>
            )}
          </div>
        )}

        {/* 결과 표시 */}
        {results.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Processing Results</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    result.success !== false ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="font-medium">
                    {result.originalFileName || result.fileName || `File ${index + 1}`}
                  </div>
                  {result.success !== false ? (
                    <div className="text-sm text-green-600">
                      ✅ Processed successfully
                      {result.processed && result.processingInfo?.compression && (
                        <span className="ml-2">
                          (Compressed by {result.processingInfo.compression.compressionRatio}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ❌ {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3">
          {!isProcessing && results.length === 0 && (
            <button
              onClick={startProcessing}
              disabled={files.length === 0}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Start Processing
            </button>
          )}

          {results.length > 0 && (
            <button
              onClick={handleClose}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Complete
            </button>
          )}

          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}