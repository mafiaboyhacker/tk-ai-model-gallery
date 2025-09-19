/**
 * Railway 환경에서 모든 미디어 삭제 API
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    console.log('🗑️ Railway: 모든 미디어 삭제 시작')

    // PostgreSQL에서 모든 AIModel 삭제
    const deleteResult = await prisma.aIModel.deleteMany({})
    console.log(`🗄️ PostgreSQL: ${deleteResult.count}개 모델 삭제 완료`)

    // Media 테이블도 삭제 (있는 경우)
    try {
      const mediaDeleteResult = await prisma.media.deleteMany({})
      console.log(`📂 Media 테이블: ${mediaDeleteResult.count}개 항목 삭제 완료`)
    } catch (error) {
      console.log('ℹ️ Media 테이블 삭제 건너뜀 (테이블이 없거나 데이터 없음)')
    }

    console.log('✅ Railway: 모든 미디어 삭제 완료')

    return NextResponse.json({
      success: true,
      message: 'All media deleted successfully',
      deletedModels: deleteResult.count,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Railway: 미디어 삭제 실패:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}