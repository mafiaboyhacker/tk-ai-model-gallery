/**
 * 모든 데이터 완전 초기화 스크립트
 * - Railway Volume 스토리지 정리
 * - PostgreSQL 데이터베이스 초기화
 * - 로컬 스토리지 정리
 */

const fs = require('fs').promises
const path = require('path')

// Railway Volume 경로
const VOLUME_PATH = '/data'

async function clearRailwayVolume() {
  console.log('🗑️ Railway Volume 정리 시작...')

  try {
    // /data 디렉토리 확인
    const volumeExists = await fs.access(VOLUME_PATH).then(() => true).catch(() => false)

    if (!volumeExists) {
      console.log('ℹ️ Railway Volume이 마운트되지 않았습니다 (로컬 환경)')
      return
    }

    // /data 디렉토리의 모든 파일/폴더 삭제
    const files = await fs.readdir(VOLUME_PATH)
    console.log(`📂 발견된 파일/폴더: ${files.length}개`)

    for (const file of files) {
      const filePath = path.join(VOLUME_PATH, file)
      const stat = await fs.stat(filePath)

      if (stat.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true })
        console.log(`🗂️ 폴더 삭제: ${file}`)
      } else {
        await fs.unlink(filePath)
        console.log(`📄 파일 삭제: ${file}`)
      }
    }

    console.log('✅ Railway Volume 정리 완료!')

  } catch (error) {
    console.error('❌ Railway Volume 정리 실패:', error.message)
  }
}

async function clearDatabase() {
  console.log('🗑️ 데이터베이스 정리 시작...')

  try {
    // Prisma Client를 통해 데이터베이스 정리
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()

    // 모든 모델 삭제
    await prisma.aIModel.deleteMany({})
    console.log('🗄️ AIModel 테이블 정리 완료')

    // 사용자 데이터 유지 (필요시 삭제)
    // await prisma.user.deleteMany({})

    await prisma.$disconnect()
    console.log('✅ 데이터베이스 정리 완료!')

  } catch (error) {
    console.error('❌ 데이터베이스 정리 실패:', error.message)
  }
}

async function main() {
  console.log('🚀 전체 데이터 초기화 시작!')
  console.log('=' * 50)

  // Railway Volume 정리
  await clearRailwayVolume()
  console.log('')

  // 데이터베이스 정리
  await clearDatabase()
  console.log('')

  console.log('🎉 모든 데이터 초기화 완료!')
  console.log('📋 정리된 항목:')
  console.log('  ✅ Railway Volume 스토리지')
  console.log('  ✅ PostgreSQL 데이터베이스')
  console.log('  ⚠️ 브라우저 localStorage는 /api/clear-storage에서 정리하세요')
}

main().catch(console.error)