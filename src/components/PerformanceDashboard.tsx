'use client'

import { useState, useEffect } from 'react'
import { usePerformanceMetrics, type PerformanceMetrics } from '@/hooks/usePerformanceMetrics'

interface PerformanceDashboardProps {
  isVisible: boolean
  onClose: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

// 📊 Performance Dashboard Component
export default function PerformanceDashboard({
  isVisible,
  onClose,
  position = 'bottom-right'
}: PerformanceDashboardProps) {
  const { metrics, isCollecting, getPerformanceGrade } = usePerformanceMetrics()
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoHide, setAutoHide] = useState(true)

  // 자동 숨김 타이머
  useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setTimeout(() => {
        onClose()
      }, 10000) // 10초 후 자동 숨김

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHide, onClose])

  if (!isVisible) return null

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6'
  }

  const performanceGrade = getPerformanceGrade()

  return (
    <div className={`fixed ${positionClasses[position]} z-50 animate-in slide-in-from-bottom-4 duration-500`}>
      <div className="bg-gray-900/95 backdrop-blur-sm text-white rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
        {/* 헤더 */}
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isCollecting ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className="text-sm font-medium">Performance Metrics</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoHide(!autoHide)}
                className={`text-xs px-2 py-1 rounded ${autoHide ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}
              >
                Auto
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
              >
                {isExpanded ? 'Compact' : 'Detail'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* 성능 등급 */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-800/30 to-gray-700/30">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{performanceGrade}</div>
            <div className="text-xs text-gray-400">Overall Performance</div>
          </div>
        </div>

        {/* 기본 메트릭스 */}
        <div className="px-4 py-3 space-y-2">
          <MetricRow
            label="Page Load"
            value={`${metrics.pageLoadTime.toFixed(0)}ms`}
            status={getLoadTimeStatus(metrics.pageLoadTime)}
          />
          <MetricRow
            label="Data Load"
            value={`${metrics.dataLoadTime.toFixed(0)}ms`}
            status={getLoadTimeStatus(metrics.dataLoadTime)}
          />
          <MetricRow
            label="Images"
            value={`${metrics.imageLoadCount} loaded`}
            status={metrics.imageErrorCount === 0 ? 'good' : 'warning'}
            detail={metrics.imageErrorCount > 0 ? `${metrics.imageErrorCount} errors` : undefined}
          />
          <MetricRow
            label="Gallery"
            value={`${metrics.galleryItemCount} items`}
            status={metrics.renderEfficiency > 85 ? 'good' : metrics.renderEfficiency > 70 ? 'warning' : 'bad'}
            detail={`${metrics.renderEfficiency.toFixed(0)}% efficiency`}
          />
        </div>

        {/* 상세 메트릭스 (확장시) */}
        {isExpanded && (
          <div className="border-t border-gray-700/50">
            <div className="px-4 py-3 space-y-2">
              <div className="text-xs font-medium text-gray-300 mb-2">Core Web Vitals</div>

              {metrics.firstContentfulPaint && (
                <MetricRow
                  label="FCP"
                  value={`${metrics.firstContentfulPaint.toFixed(0)}ms`}
                  status={getLoadTimeStatus(metrics.firstContentfulPaint)}
                />
              )}

              {metrics.largestContentfulPaint && (
                <MetricRow
                  label="LCP"
                  value={`${metrics.largestContentfulPaint.toFixed(0)}ms`}
                  status={getLCPStatus(metrics.largestContentfulPaint)}
                />
              )}

              {metrics.cumulativeLayoutShift !== undefined && (
                <MetricRow
                  label="CLS"
                  value={metrics.cumulativeLayoutShift.toFixed(3)}
                  status={getCLSStatus(metrics.cumulativeLayoutShift)}
                />
              )}

              <div className="text-xs font-medium text-gray-300 mb-2 mt-4">System Info</div>

              <MetricRow
                label="Breakpoint"
                value={metrics.currentBreakpoint}
                status="neutral"
              />

              {metrics.memoryUsage && (
                <MetricRow
                  label="Memory"
                  value={`${metrics.memoryUsage.toFixed(1)}MB`}
                  status={getMemoryStatus(metrics.memoryUsage)}
                />
              )}

              <MetricRow
                label="Network"
                value={`${metrics.networkRequests} requests`}
                status={metrics.networkErrors === 0 ? 'good' : 'warning'}
                detail={metrics.networkErrors > 0 ? `${metrics.networkErrors} errors` : undefined}
              />
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="px-4 py-2 bg-gray-800/30 border-t border-gray-700/50">
          <div className="text-xs text-gray-400 text-center">
            {isCollecting ? '📊 Live monitoring active' : '⏸️ Monitoring paused'}
          </div>
        </div>
      </div>
    </div>
  )
}

// 메트릭 행 컴포넌트
function MetricRow({
  label,
  value,
  status,
  detail
}: {
  label: string
  value: string
  status: 'good' | 'warning' | 'bad' | 'neutral'
  detail?: string
}) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    bad: 'text-red-400',
    neutral: 'text-gray-400'
  }

  const statusIcons = {
    good: '✅',
    warning: '⚠️',
    bad: '❌',
    neutral: '📊'
  }

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-300">{label}</span>
      <div className="flex items-center space-x-1">
        <span className={statusColors[status]}>{value}</span>
        <span className="text-xs">{statusIcons[status]}</span>
        {detail && <span className="text-gray-500 text-xs">({detail})</span>}
      </div>
    </div>
  )
}

// 상태 판정 함수들
function getLoadTimeStatus(time: number): 'good' | 'warning' | 'bad' {
  if (time < 1000) return 'good'
  if (time < 3000) return 'warning'
  return 'bad'
}

function getLCPStatus(lcp: number): 'good' | 'warning' | 'bad' {
  if (lcp < 2500) return 'good'
  if (lcp < 4000) return 'warning'
  return 'bad'
}

function getCLSStatus(cls: number): 'good' | 'warning' | 'bad' {
  if (cls < 0.1) return 'good'
  if (cls < 0.25) return 'warning'
  return 'bad'
}

function getMemoryStatus(memory: number): 'good' | 'warning' | 'bad' {
  if (memory < 50) return 'good'
  if (memory < 100) return 'warning'
  return 'bad'
}