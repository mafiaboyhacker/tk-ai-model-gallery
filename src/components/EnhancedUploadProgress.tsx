'use client'

import { useState, useEffect } from 'react'

interface ProcessingStage {
  stage: 'upload' | 'storage-decision' | 'compression' | 'database' | 'complete'
  label: string
  description: string
  icon: string
  color: string
}

interface EnhancedUploadStatus {
  id: string
  fileName: string
  originalFileName: string
  size: number
  type: 'image' | 'video'
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  currentStage: ProcessingStage['stage']
  startedAt: number
  completedAt?: number
  error?: string
  storageType?: 'database' | 'filesystem'
  compressionSavings?: number
  finalSize?: number
  processingDetails?: {
    uploadProgress: number
    compressionProgress: number
    databaseProgress: number
  }
}

interface EnhancedUploadProgressProps {
  queue: EnhancedUploadStatus[]
  overallProgress: number
  onClear?: () => void
  isClearing?: boolean
  className?: string
}

const PROCESSING_STAGES: Record<ProcessingStage['stage'], ProcessingStage> = {
  upload: {
    stage: 'upload',
    label: '업로드',
    description: '파일을 서버로 전송하는 중...',
    icon: '📤',
    color: 'blue'
  },
  'storage-decision': {
    stage: 'storage-decision',
    label: '저장소 결정',
    description: '파일 크기에 따라 저장 방식 결정 중...',
    icon: '🤔',
    color: 'purple'
  },
  compression: {
    stage: 'compression',
    label: '압축/변환',
    description: 'WebP 변환 및 썸네일 생성 중...',
    icon: '🎨',
    color: 'amber'
  },
  database: {
    stage: 'database',
    label: '데이터베이스',
    description: '메타데이터를 데이터베이스에 저장 중...',
    icon: '💾',
    color: 'green'
  },
  complete: {
    stage: 'complete',
    label: '완료',
    description: '업로드가 성공적으로 완료되었습니다',
    icon: '✅',
    color: 'emerald'
  }
}

const statusLabel: Record<EnhancedUploadStatus['status'], string> = {
  pending: '대기 중',
  uploading: '업로드 중',
  processing: '처리 중',
  completed: '완료',
  failed: '실패'
}

const statusColor: Record<EnhancedUploadStatus['status'], string> = {
  pending: 'text-gray-500',
  uploading: 'text-blue-600',
  processing: 'text-amber-600',
  completed: 'text-emerald-600',
  failed: 'text-red-600'
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const formatDuration = (start: number, end?: number) => {
  if (!start) return ''
  const finished = end ?? Date.now()
  const seconds = Math.max(0, Math.round((finished - start) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return `${minutes}m ${remain}s`
}

const ProgressStageIndicator = ({ item }: { item: EnhancedUploadStatus }) => {
  const stages = Object.values(PROCESSING_STAGES)
  const currentStageIndex = stages.findIndex(s => s.stage === item.currentStage)

  return (
    <div className="flex items-center space-x-2 mt-2">
      {stages.map((stage, index) => {
        const isActive = index === currentStageIndex
        const isCompleted = index < currentStageIndex || item.status === 'completed'
        const isFailed = item.status === 'failed' && index === currentStageIndex

        return (
          <div
            key={stage.stage}
            className={`flex items-center ${index < stages.length - 1 ? 'flex-1' : ''}`}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${isCompleted ? 'bg-green-500 text-white' :
                isFailed ? 'bg-red-500 text-white' :
                isActive ? `bg-${stage.color}-500 text-white animate-pulse` :
                'bg-gray-200 text-gray-500'}
            `}>
              {isCompleted ? '✓' : isFailed ? '✗' : stage.icon}
            </div>

            {index < stages.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-2
                ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const DetailedProgressBar = ({ item }: { item: EnhancedUploadStatus }) => {
  const currentStage = PROCESSING_STAGES[item.currentStage]

  // 비디오 파일인 경우 압축 단계 설명을 다르게 표시
  const getStageDescription = () => {
    if (item.currentStage === 'compression' && item.type === 'video') {
      return '비디오 압축, 썸네일 추출 및 메타데이터 처리 중...'
    }
    return currentStage.description
  }

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{currentStage.icon} {currentStage.label}</span>
        <span>{Math.round(item.progress)}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`bg-${currentStage.color}-500 h-2 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1">{getStageDescription()}</p>
    </div>
  )
}

const CompressionInfo = ({ item }: { item: EnhancedUploadStatus }) => {
  if (!item.compressionSavings || !item.finalSize) return null

  const savingsPercent = Math.round(item.compressionSavings)
  const originalSize = formatBytes(item.size)
  const finalSize = formatBytes(item.finalSize)

  // 비디오와 이미지에 따라 다른 아이콘과 텍스트 표시
  const getCompressionText = () => {
    if (item.type === 'video') {
      return {
        icon: '🎬',
        label: '비디오 최적화 완료',
        description: '압축, 썸네일 추출 및 메타데이터 처리 완료'
      }
    }
    return {
      icon: '🎨',
      label: '이미지 최적화 완료',
      description: 'WebP 변환 및 압축 완료'
    }
  }

  const compressionText = getCompressionText()

  return (
    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
      <div className="flex items-center justify-between text-xs">
        <span className="text-green-700 font-medium">{compressionText.icon} {compressionText.label}</span>
        <span className="text-green-600">{savingsPercent}% 절약</span>
      </div>
      <div className="text-xs text-green-600 mt-1">
        {originalSize} → {finalSize}
      </div>
      <div className="text-xs text-green-500 mt-1">
        {compressionText.description}
      </div>
    </div>
  )
}

const StorageTypeIndicator = ({ item }: { item: EnhancedUploadStatus }) => {
  if (!item.storageType) return null

  const isDatabase = item.storageType === 'database'

  return (
    <div className={`
      inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium
      ${isDatabase ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
    `}>
      <span>{isDatabase ? '🗃️' : '💽'}</span>
      <span>{isDatabase ? 'Database' : 'Filesystem'}</span>
    </div>
  )
}

export default function EnhancedUploadProgress({
  queue,
  overallProgress,
  onClear,
  isClearing = false,
  className
}: EnhancedUploadProgressProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  if (!queue?.length) return null

  const completed = queue.filter((item) => item.status === 'completed').length
  const failed = queue.filter((item) => item.status === 'failed').length
  const processing = queue.filter((item) => ['uploading', 'processing'].includes(item.status)).length
  const totalSize = queue.reduce((sum, item) => sum + (item.size || 0), 0)
  const totalSavings = queue.reduce((sum, item) => sum + (item.compressionSavings || 0), 0)

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className ?? ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">📊 업로드 진행 상황</h3>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
            <span>📁 총 {queue.length}개 파일 ({formatBytes(totalSize)})</span>
            <span className="text-green-600">✅ {completed}개 완료</span>
            {processing > 0 && <span className="text-blue-600">🔄 {processing}개 처리 중</span>}
            {failed > 0 && <span className="text-red-600">❌ {failed}개 실패</span>}
            {totalSavings > 0 && <span className="text-purple-600">🎨 {Math.round(totalSavings)}% 압축됨</span>}
          </div>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            disabled={isClearing}
            className={`px-3 py-1 text-sm border border-gray-300 rounded transition-colors ${
              isClearing
                ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {isClearing ? '🔄 삭제 중...' : '🗑️ 기록 초기화'}
          </button>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>전체 진행률</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* File List */}
      <div className="max-h-96 overflow-y-auto">
        {queue.map((item) => {
          const isExpanded = expandedItems.has(item.id)

          return (
            <div key={item.id} className="border-b border-gray-100 last:border-0">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.fileName}
                      </h4>
                      <StorageTypeIndicator item={item} />
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        {isExpanded ? '🔼' : '🔽'}
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <span>{item.type === 'video' ? '🎬' : '🖼️'}</span>
                        <span>{item.type.toUpperCase()}</span>
                      </span>
                      <span>{formatBytes(item.size)}</span>
                      <span>{formatDuration(item.startedAt, item.completedAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-sm font-medium ${statusColor[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </div>
                </div>

                {/* Basic Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'failed' ? 'bg-red-500' :
                        item.status === 'processing' ? 'bg-amber-500' :
                        item.status === 'uploading' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                    />
                  </div>
                </div>

                {/* Stage Indicator */}
                {(item.status === 'uploading' || item.status === 'processing') && (
                  <ProgressStageIndicator item={item} />
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 space-y-3 bg-gray-50 rounded p-3">
                    {/* Detailed Progress */}
                    {item.status !== 'completed' && item.status !== 'failed' && (
                      <DetailedProgressBar item={item} />
                    )}

                    {/* Compression Info */}
                    <CompressionInfo item={item} />

                    {/* Processing Details */}
                    {item.processingDetails && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-gray-600">📤 업로드</div>
                          <div className="font-medium">{item.processingDetails.uploadProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">
                            {item.type === 'video' ? '🎬 비디오 처리' : '🎨 이미지 압축'}
                          </div>
                          <div className="font-medium">{item.processingDetails.compressionProgress}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">💾 저장</div>
                          <div className="font-medium">{item.processingDetails.databaseProgress}%</div>
                        </div>
                      </div>
                    )}

                    {/* Error Info */}
                    {item.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-sm text-red-700">❌ {item.error}</p>
                      </div>
                    )}

                    {/* Success Info */}
                    {item.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-sm text-green-700">
                          ✅ {item.type === 'video' ? '비디오' : '이미지'} 업로드 완료 • {item.storageType === 'database' ? 'DB 저장' : '파일시스템 저장'}
                          {item.finalSize && ` • 최종 크기: ${formatBytes(item.finalSize)}`}
                          {item.type === 'video' && ' • 썸네일 및 메타데이터 추출 완료'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}