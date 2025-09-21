/**
 * Railway 환경에서 모든 비디오 삭제 API
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    console.log('🗑️ Railway: 모든 비디오 삭제 시작')

    // PostgreSQL에서 비디오 타입 모델만 삭제
    const deleteResult = await prisma.aIModel.deleteMany({
      where: {
        fileType: 'VIDEO'
      }
    })
    console.log(`🎥 PostgreSQL: ${deleteResult.count}개 비디오 삭제 완료`)

    // Media 테이블에서도 비디오 삭제 (있는 경우)
    try {
      const mediaDeleteResult = await prisma.media.deleteMany({
        where: {
          type: 'video'
        }
      })
      console.log(`📂 Media 테이블: ${mediaDeleteResult.count}개 비디오 항목 삭제 완료`)
    } catch (error) {
      console.log('ℹ️ Media 테이블 비디오 삭제 건너뜀 (테이블이 없거나 데이터 없음)')
    }

    console.log('✅ Railway: 모든 비디오 삭제 완료')

    return NextResponse.json({
      success: true,
      message: 'All videos deleted successfully',
      deletedVideos: deleteResult.count,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Railway: 비디오 삭제 실패:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}