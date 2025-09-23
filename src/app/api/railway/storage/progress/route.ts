/**
 * 비디오/이미지 처리 진행률 추적 API
 * Server-Sent Events (SSE)를 통한 실시간 진행률 스트리밍
 */

import { NextRequest, NextResponse } from 'next/server'

// 전역 진행률 저장소 (프로덕션에서는 Redis 사용 권장)
const progressStore = new Map<string, {
  stage: string
  percent: number
  message: string
  totalFiles?: number
  currentFile?: number
  fileName?: string
  startTime: number
  lastUpdate: number
}>()

// 진행률 정리 (30분 후 자동 삭제)
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of progressStore.entries()) {
    if (now - value.lastUpdate > 30 * 60 * 1000) { // 30분
      progressStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // 5분마다 정리

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: 'Session ID required'
    }, { status: 400 })
  }

  // Server-Sent Events 설정
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // 헤더 전송
      const sendData = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // 초기 상태 전송
      const progress = progressStore.get(sessionId)
      if (progress) {
        sendData({
          sessionId,
          stage: progress.stage,
          percent: progress.percent,
          message: progress.message,
          totalFiles: progress.totalFiles,
          currentFile: progress.currentFile,
          fileName: progress.fileName,
          elapsed: Date.now() - progress.startTime
        })
      } else {
        sendData({
          sessionId,
          stage: 'waiting',
          percent: 0,
          message: 'Waiting for upload to start...',
          elapsed: 0
        })
      }

      // 주기적으로 진행률 확인 및 전송
      const intervalId = setInterval(() => {
        const currentProgress = progressStore.get(sessionId)

        if (currentProgress) {
          sendData({
            sessionId,
            stage: currentProgress.stage,
            percent: currentProgress.percent,
            message: currentProgress.message,
            totalFiles: currentProgress.totalFiles,
            currentFile: currentProgress.currentFile,
            fileName: currentProgress.fileName,
            elapsed: Date.now() - currentProgress.startTime
          })

          // 완료되면 연결 종료
          if (currentProgress.percent >= 100 && currentProgress.stage === 'completed') {
            clearInterval(intervalId)
            controller.close()
            // 완료된 세션 정리 (1분 후)
            setTimeout(() => {
              progressStore.delete(sessionId)
            }, 60000)
          }
        } else {
          // 세션이 없으면 연결 종료
          clearInterval(intervalId)
          controller.close()
        }
      }, 1000) // 1초마다 업데이트

      // 연결 종료 시 정리
      request.signal?.addEventListener('abort', () => {
        clearInterval(intervalId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, stage, percent, message, totalFiles, currentFile, fileName } = await request.json()

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID required'
      }, { status: 400 })
    }

    const now = Date.now()
    const existing = progressStore.get(sessionId)

    // 진행률 업데이트
    progressStore.set(sessionId, {
      stage: stage || 'processing',
      percent: Math.min(Math.max(percent || 0, 0), 100),
      message: message || 'Processing...',
      totalFiles,
      currentFile,
      fileName,
      startTime: existing?.startTime || now,
      lastUpdate: now
    })

    console.log(`📊 진행률 업데이트 [${sessionId}]: ${stage} ${percent}% - ${message}`)

    return NextResponse.json({
      success: true,
      sessionId,
      timestamp: now
    })

  } catch (error) {
    console.error('❌ 진행률 업데이트 실패:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: 'Session ID required'
    }, { status: 400 })
  }

  // 진행률 데이터 삭제
  const deleted = progressStore.delete(sessionId)

  return NextResponse.json({
    success: true,
    deleted,
    sessionId
  })
}

// 진행률 업데이트 유틸리티 함수
export function updateProgress(
  sessionId: string,
  stage: string,
  percent: number,
  message: string,
  additionalData?: {
    totalFiles?: number
    currentFile?: number
    fileName?: string
  }
) {
  const now = Date.now()
  const existing = progressStore.get(sessionId)

  progressStore.set(sessionId, {
    stage,
    percent: Math.min(Math.max(percent, 0), 100),
    message,
    totalFiles: additionalData?.totalFiles,
    currentFile: additionalData?.currentFile,
    fileName: additionalData?.fileName,
    startTime: existing?.startTime || now,
    lastUpdate: now
  })

  console.log(`📊 [${sessionId}] ${stage}: ${percent}% - ${message}`)
}

// 진행률 완료 표시
export function completeProgress(sessionId: string, message: string = 'Processing completed') {
  updateProgress(sessionId, 'completed', 100, message)
}

// 진행률 오류 표시
export function errorProgress(sessionId: string, error: string) {
  updateProgress(sessionId, 'error', 0, `Error: ${error}`)
}