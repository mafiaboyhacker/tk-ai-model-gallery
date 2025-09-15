'use client'

/**
 * Supabase 연결 테스트 페이지
 * 프로덕션 배포 후 Supabase 연결 상태를 확인하는 클라이언트 페이지
 */

import { useState, useEffect } from 'react'

interface TestResult {
  success: boolean
  message: string
  results?: any
  error?: string
  timestamp: string
}

export default function SupabaseTestPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      console.log('🔍 Supabase 연결 테스트 시작...')

      const response = await fetch('/api/supabase/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      console.log('테스트 결과:', result)

      setTestResult(result)
    } catch (error) {
      console.error('테스트 실패:', error)
      setTestResult({
        success: false,
        message: '테스트 요청 실패',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 페이지 로드시 자동 테스트
  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Supabase 연결 테스트
          </h1>
          <p className="text-gray-600">
            프로덕션 환경에서 Supabase 데이터베이스 연결 상태를 확인합니다.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">테스트 결과</h2>
            <button
              onClick={runTest}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>테스트 중...</span>
                </>
              ) : (
                <span>다시 테스트</span>
              )}
            </button>
          </div>

          {testResult && (
            <div className="space-y-4">
              {/* 전체 결과 상태 */}
              <div className={`p-4 rounded-lg ${
                testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    testResult.success ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {testResult.timestamp}
                </div>
              </div>

              {/* 상세 테스트 결과 */}
              {testResult.results && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">상세 결과</h3>

                  {/* 환경설정 */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">환경 설정</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>환경: {testResult.results.environment}</div>
                      <div>URL: {testResult.results.config?.url}</div>
                      <div>Anon Key: {testResult.results.config?.hasAnonKey ? '✅ 설정됨' : '❌ 누락'}</div>
                      <div>Service Key: {testResult.results.config?.hasServiceKey ? '✅ 설정됨' : '❌ 누락'}</div>
                    </div>
                  </div>

                  {/* 개별 테스트 결과 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(testResult.results.tests || {}).map(([testName, result]: [string, any]) => (
                      <div key={testName} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            result.success ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <h4 className="font-medium text-gray-800 capitalize">
                            {testName} 테스트
                          </h4>
                        </div>

                        {result.success ? (
                          <div className="text-sm text-green-600">
                            ✅ 연결 성공
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            ❌ {result.error || '연결 실패'}
                          </div>
                        )}

                        {/* 추가 정보 */}
                        {result.buckets && (
                          <div className="text-xs text-gray-500 mt-1">
                            버킷: {result.buckets.join(', ') || '없음'}
                          </div>
                        )}
                        {result.version && (
                          <div className="text-xs text-gray-500 mt-1">
                            버전: {result.version}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 에러 정보 */}
              {testResult.error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">오류 정보</h4>
                  <pre className="text-sm text-red-600 whitespace-pre-wrap">
                    {testResult.error}
                  </pre>
                </div>
              )}

              {/* 원시 결과 (개발용) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="bg-gray-50 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-gray-800">
                    원시 데이터 (개발용)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* 도움말 */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">테스트 정보</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Client 테스트</strong>: 클라이언트 사이드 Supabase 연결</li>
            <li>• <strong>Admin 테스트</strong>: 서버 사이드 관리자 권한 연결</li>
            <li>• <strong>Storage 테스트</strong>: Supabase Storage 버킷 접근</li>
            <li>• <strong>Database 테스트</strong>: PostgreSQL 데이터베이스 연결</li>
          </ul>
        </div>
      </div>
    </div>
  )
}