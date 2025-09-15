/**
 * Supabase 연결 테스트 API
 * 프로덕션 배포 후 Supabase 연결 상태를 확인하는 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin, validateSupabaseConfig } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Supabase 연결 테스트 시작...')

    // 1. 환경변수 검증
    console.log('📋 1단계: 환경변수 검증')
    validateSupabaseConfig()

    // 2. 클라이언트 연결 테스트
    console.log('🔌 2단계: 클라이언트 연결 테스트')
    const { data: clientTest, error: clientError } = await supabase
      .from('test')
      .select('*')
      .limit(1)

    console.log('클라이언트 테스트 결과:', { data: clientTest, error: clientError })

    // 3. 어드민 연결 테스트
    console.log('🔧 3단계: 어드민 연결 테스트')
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('test')
      .select('*')
      .limit(1)

    console.log('어드민 테스트 결과:', { data: adminTest, error: adminError })

    // 4. Storage 버킷 확인
    console.log('📦 4단계: Storage 버킷 확인')
    const { data: buckets, error: bucketError } = await supabaseAdmin
      .storage
      .listBuckets()

    console.log('버킷 목록:', { buckets, error: bucketError })

    // 5. 데이터베이스 상태 확인
    console.log('🗄️ 5단계: 데이터베이스 상태 확인')
    const { data: dbTest } = await supabaseAdmin
      .rpc('version')
      .single()

    console.log('데이터베이스 버전:', dbTest)

    // 결과 반환
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      tests: {
        client: {
          success: !clientError,
          error: clientError?.message,
          data: clientTest
        },
        admin: {
          success: !adminError,
          error: adminError?.message,
          data: adminTest
        },
        storage: {
          success: !bucketError,
          error: bucketError?.message,
          buckets: buckets?.map(b => b.name)
        },
        database: {
          success: !!dbTest,
          version: dbTest
        }
      }
    }

    console.log('✅ Supabase 연결 테스트 완료:', testResults)

    return NextResponse.json({
      success: true,
      message: 'Supabase 연결 테스트 완료',
      results: testResults
    })

  } catch (error) {
    console.error('❌ Supabase 연결 테스트 실패:', error)

    return NextResponse.json({
      success: false,
      message: 'Supabase 연결 테스트 실패',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}