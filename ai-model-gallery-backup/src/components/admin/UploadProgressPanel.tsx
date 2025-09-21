'use client'

import type { UploadStatus } from '@/types'

interface UploadProgressPanelProps {
  queue: UploadStatus[]
  overallProgress: number
  onClear?: () => void
  className?: string
}

const statusLabel: Record<UploadStatus['status'], string> = {
  pending: '대기 중',
  uploading: '업로드 중',
  processing: '처리 중',
  completed: '완료',
  failed: '실패'
}

const statusColor: Record<UploadStatus['status'], string> = {
  pending: 'text-gray-500',
  uploading: 'text-blue-600',
  processing: 'text-amber-600',
  completed: 'text-emerald-600',
  failed: 'text-red-600'
}

const statusBar: Record<UploadStatus['status'], string> = {
  pending: 'bg-gray-300',
  uploading: 'bg-blue-500',
  processing: 'bg-amber-500',
  completed: 'bg-emerald-500',
  failed: 'bg-red-500'
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
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

export default function UploadProgressPanel({ queue, overallProgress, onClear, className }: UploadProgressPanelProps) {
  if (!queue?.length) return null

  const completed = queue.filter((item) => item.status === 'completed').length
  const failed = queue.filter((item) => item.status === 'failed').length
  const totalSize = queue.reduce((sum, item) => sum + (item.size || 0), 0)

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className ?? ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">대량 업로드 진행 상황</p>
          <p className="text-xs text-gray-500 mt-1">
            완료 {completed}/{queue.length}
            {failed > 0 ? ` · 실패 ${failed}` : ''}
            {' · '}총 {formatBytes(totalSize)}
          </p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
          >
            기록 초기화
          </button>
        )}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${overallProgress}%` }}
        ></div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {queue.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div className="text-sm font-medium text-gray-800 truncate max-w-[65%]">
                {item.fileName}
              </div>
              <span className={`text-xs font-semibold ${statusColor[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>
                {item.type.toUpperCase()} · {formatBytes(item.size)}
              </span>
              <span>
                {formatDuration(item.startedAt, item.completedAt)}
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div
                className={`${statusBar[item.status]} h-2 rounded-full transition-all duration-300 ease-out`}
                style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
              ></div>
            </div>

            {item.error && (
              <p className="text-xs text-red-600 mt-2">❌ {item.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
