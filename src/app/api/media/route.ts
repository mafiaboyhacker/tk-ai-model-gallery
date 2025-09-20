import { NextRequest, NextResponse } from 'next/server'
import { isProduction, shouldUseRailway } from '@/lib/environment'

/**
 * 🚀 통합 미디어 API 라우터
 * 환경에 따라 자동으로 IndexedDB(로컬) 또는 Railway Storage(프로덕션)로 라우팅
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action') || 'list'

  console.log(`🔄 통합 미디어 API GET 요청 - Action: ${action}`)
  console.log(`🌍 환경 감지: ${isProduction() ? 'Production' : 'Local'} - Railway 사용: ${shouldUseRailway()}`)

  try {
    if (shouldUseRailway()) {
      // Railway 환경에서는 Railway Storage API 직접 import
      console.log('🚂 Railway Storage API 직접 호출')

      // Railway Storage API를 직접 import해서 호출
      const { GET: railwayStorageGET } = await import('../railway/storage/route')

      // 새로운 요청 객체 생성 (기존 쿼리 파라미터 유지)
      const modifiedRequest = new NextRequest(request.url, {
        method: 'GET',
        headers: request.headers,
      })

      const railwayResponse = await railwayStorageGET(modifiedRequest)
      const data = await railwayResponse.json()

      return NextResponse.json(data, { status: railwayResponse.status })

    } else {
      // 로컬 환경에서는 IndexedDB 데이터 반환
      console.log('💻 로컬 IndexedDB 데이터 반환')

      return NextResponse.json({
        success: true,
        data: [],
        message: '로컬 환경에서는 클라이언트 사이드 IndexedDB를 사용합니다.',
        environment: 'local',
        storage_type: 'indexeddb'
      })
    }

  } catch (error) {
    console.error('❌ 통합 미디어 API 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 데이터 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: isProduction() ? 'production' : 'local',
      storage_type: shouldUseRailway() ? 'railway' : 'indexeddb'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  console.log('🔄 통합 미디어 API PATCH 요청')
  console.log(`🌍 환경 감지: ${isProduction() ? 'Production' : 'Local'} - Railway 사용: ${shouldUseRailway()}`)

  try {
    if (shouldUseRailway()) {
      // Railway 환경에서는 Railway Storage API 직접 import
      console.log('🚂 Railway Storage API 직접 호출 (PATCH)')

      // Railway Storage API를 직접 import해서 호출
      const { PATCH: railwayStoragePATCH } = await import('../railway/storage/route')

      const railwayResponse = await railwayStoragePATCH(request)
      const data = await railwayResponse.json()

      return NextResponse.json(data, { status: railwayResponse.status })

    } else {
      // 로컬 환경에서는 클라이언트 사이드 처리 안내
      console.log('💻 로컬 환경: 클라이언트 사이드 IndexedDB 처리 안내')

      return NextResponse.json({
        success: false,
        error: '로컬 환경에서는 클라이언트 사이드 IndexedDB를 사용해주세요.',
        message: 'useEnvironmentStore의 업데이트 함수를 사용하세요.',
        environment: 'local',
        storage_type: 'indexeddb'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ 통합 미디어 API 업데이트 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 업데이트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: isProduction() ? 'production' : 'local',
      storage_type: shouldUseRailway() ? 'railway' : 'indexeddb'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 통합 미디어 API POST 요청')
  console.log(`🌍 환경 감지: ${isProduction() ? 'Production' : 'Local'} - Railway 사용: ${shouldUseRailway()}`)

  try {
    if (shouldUseRailway()) {
      // Railway 환경에서는 Railway Storage API 직접 import
      console.log('🚂 Railway Storage API 직접 호출 (POST)')

      // Railway Storage API를 직접 import해서 호출
      const { POST: railwayStoragePOST } = await import('../railway/storage/route')

      // 쿼리 파라미터 추가
      const url = new URL(request.url)
      url.searchParams.set('action', 'bulk-upload')

      const modifiedRequest = new NextRequest(url.toString(), {
        method: 'POST',
        headers: request.headers,
        body: request.body,
      })

      const railwayResponse = await railwayStoragePOST(modifiedRequest)
      const data = await railwayResponse.json()

      if (data.success) {
        console.log(`✅ Railway 업로드 성공: ${data.uploadedFiles?.length || 0}개 파일`)
      } else {
        console.error('❌ Railway 업로드 실패:', data.error)
      }

      return NextResponse.json(data, { status: railwayResponse.status })

    } else {
      // 로컬 환경에서는 클라이언트 사이드 처리 안내
      console.log('💻 로컬 환경: 클라이언트 사이드 IndexedDB 처리 안내')

      return NextResponse.json({
        success: false,
        error: '로컬 환경에서는 클라이언트 사이드 IndexedDB를 사용해주세요.',
        message: 'useEnvironmentStore의 addMedia 함수를 사용하여 업로드하세요.',
        environment: 'local',
        storage_type: 'indexeddb'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ 통합 미디어 API 업로드 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 업로드 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: isProduction() ? 'production' : 'local',
      storage_type: shouldUseRailway() ? 'railway' : 'indexeddb'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🔄 통합 미디어 API DELETE 요청')
  console.log(`🌍 환경 감지: ${isProduction() ? 'Production' : 'Local'} - Railway 사용: ${shouldUseRailway()}`)

  try {
    if (shouldUseRailway()) {
      // Railway 환경에서는 Railway Storage API 직접 import
      console.log('🚂 Railway Storage API 직접 호출 (DELETE)')

      // Railway Storage API를 직접 import해서 호출
      const { DELETE: railwayStorageDELETE } = await import('../railway/storage/route')

      const railwayResponse = await railwayStorageDELETE(request)
      const data = await railwayResponse.json()

      return NextResponse.json(data, { status: railwayResponse.status })

    } else {
      // 로컬 환경에서는 클라이언트 사이드 처리 안내
      console.log('💻 로컬 환경: 클라이언트 사이드 IndexedDB 처리 안내')

      return NextResponse.json({
        success: false,
        error: '로컬 환경에서는 클라이언트 사이드 IndexedDB를 사용해주세요.',
        message: 'useEnvironmentStore의 삭제 함수를 사용하세요.',
        environment: 'local',
        storage_type: 'indexeddb'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ 통합 미디어 API 삭제 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: isProduction() ? 'production' : 'local',
      storage_type: shouldUseRailway() ? 'railway' : 'indexeddb'
    }, { status: 500 })
  }
}