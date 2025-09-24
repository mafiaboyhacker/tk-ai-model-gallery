import { NextRequest, NextResponse } from 'next/server'

/**
 * 🚀 Railway 미디어 API 라우터
 * 모든 요청을 Railway Storage API로 직접 라우팅
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action') || 'list'

  console.log(`🔄 Railway 미디어 API GET 요청 - Action: ${action}`)

  try {
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

  } catch (error) {
    console.error('❌ Railway 미디어 API 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 데이터 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      storage_type: 'railway'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  console.log('🔄 Railway 미디어 API PATCH 요청')

  try {
    // Railway Storage API를 직접 import해서 호출
    const { PATCH: railwayStoragePATCH } = await import('../railway/storage/route')

    const railwayResponse = await railwayStoragePATCH(request)
    const data = await railwayResponse.json()

    return NextResponse.json(data, { status: railwayResponse.status })

  } catch (error) {
    console.error('❌ Railway 미디어 API 업데이트 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 업데이트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      storage_type: 'railway'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 Railway 미디어 API POST 요청')

  try {
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

  } catch (error) {
    console.error('❌ Railway 미디어 API 업로드 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 업로드 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      storage_type: 'railway'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🔄 Railway 미디어 API DELETE 요청')

  try {
    // Railway Storage API를 직접 import해서 호출
    const { DELETE: railwayStorageDELETE } = await import('../railway/storage/route')

    const railwayResponse = await railwayStorageDELETE(request)
    const data = await railwayResponse.json()

    return NextResponse.json(data, { status: railwayResponse.status })

  } catch (error) {
    console.error('❌ Railway 미디어 API 삭제 오류:', error)

    return NextResponse.json({
      success: false,
      error: '미디어 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      storage_type: 'railway'
    }, { status: 500 })
  }
}