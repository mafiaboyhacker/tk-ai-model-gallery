'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import { useEnvironmentStore } from '@/hooks/useEnvironmentStore'
import VideoPlayer from '@/components/VideoPlayer'

export default function ModelDetailPage() {
  const params = useParams()
  const modelId = params.id as string
  const [model, setModel] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  // 이름 편집 기능은 어드민 페이지에서만 가능 (보안상 메인 페이지에서 제거)
  const [userInteracted, setUserInteracted] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)
  const { media: uploadedMedia, loadMedia } = useEnvironmentStore()
  // updateCustomName은 어드민 페이지에서만 사용 (메인 페이지에서 제거)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setIsContactOpen(false)
      }
    }

    if (isContactOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isContactOpen])

  // 사용자 인터랙션 감지
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true)
      console.log('🎵 사용자 인터랙션 감지됨 - 오디오 재생 가능')
    }

    // 다양한 사용자 이벤트 감지
    const events = ['click', 'touchstart', 'keydown', 'scroll']
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [])

  // 미디어 데이터 로드
  useEffect(() => {
    if (!mounted) return

    const initializeMedia = async () => {
      try {
        console.log('🔄 모델 상세 페이지: 환경 감지 시스템으로 미디어 로드 중...')
        await loadMedia()
      } catch (error) {
        console.error('❌ 모델 상세 페이지: 미디어 로드 실패:', error)
      }
    }

    initializeMedia()
  }, [mounted, loadMedia])

  useEffect(() => {
    if (!mounted || !uploadedMedia.length) return

    // 로컬 업로드된 미디어에서 찾기
    const uploadedModel = uploadedMedia.find(media => media.id === modelId)

    console.log('🔍 모델 상세 페이지: 검색 중...', { modelId, totalMedia: uploadedMedia.length })

    if (uploadedModel) {
      console.log('🔍 Found local media data:', uploadedModel)

      // 비디오 URL 디버깅
      if (uploadedModel.type === 'video') {
        console.log('🎬 비디오 URL 디버깅:', {
          thumbnailUrl: uploadedModel.url?.substring(0, 50) + '...',
          originalUrl: uploadedModel.originalUrl?.substring(0, 50) + '...',
          hasOriginalUrl: !!uploadedModel.originalUrl
        })
      }

      // 파일명에서 확장자 제거
      const getCleanFileName = (fileName: string) => {
        return fileName.replace(/\.(mp4|mov|avi|png|jpg|jpeg|webp)$/i, '')
      }

      setModel({
        id: uploadedModel.id,
        name: (uploadedModel as any).customName || uploadedModel.fileName || (uploadedModel.type === 'video' ? 'Video #1' : 'Model #1'),
        originalFileName: uploadedModel.fileName,
        mediaUrl: uploadedModel.type === 'video' ? uploadedModel.originalUrl : uploadedModel.url,
        type: uploadedModel.type || 'image',
        category: (uploadedModel.type === 'video') ? 'Video' : 'Image',
        width: uploadedModel.width,
        height: uploadedModel.height,
        duration: uploadedModel.duration, // 실제 비디오 재생시간 (초)
        resolution: `${uploadedModel.width} × ${uploadedModel.height}`,
        description: (uploadedModel.type === 'video')
          ? `High-quality video content generated using TKLABEL Persona-ver.02 AI model.`
          : `High-resolution image content generated using TKLABEL Persona-ver.02 AI model.`,
        aiModelDescription: `TKLABEL Persona-ver.02 represents a breakthrough in AI-driven persona generation and realistic character implementation. This advanced model follows a sophisticated two-stage process: first generating detailed personas with unique characteristics, backgrounds, and personalities, then training specialized image synthesis algorithms to bring these personas to life through photorealistic visual representations. The result is an unprecedented level of authenticity and emotional depth in AI-generated content, making each character feel genuinely human and relatable.`
      })
    }
  }, [modelId, uploadedMedia, mounted])

  // 이름 편집 관련 함수들은 보안상 어드민 페이지에서만 제공
  // 메인 페이지에서는 읽기 전용으로만 제공

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] pt-16">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Model Not Found</h1>
          <p className="text-gray-600 mb-6">The model you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/" 
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
          >
            Back to Gallery
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Navigation */}
          <div className="mb-6">
            <Link
              href="/"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors inline-flex items-center"
            >
              ← Back to Gallery
            </Link>
          </div>

          {/* Model Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Media Display - Image or Video */}
            <div className="relative">
              {model.type === 'video' ? (
                <VideoPlayer
                  src={model.mediaUrl}
                  width={model.width}
                  height={model.height}
                  className="w-full h-auto rounded-lg shadow-lg"
                  controls
                  autoPlay={true}
                  muted={!userInteracted}
                  playsInline
                />
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <Image
                    src={model.mediaUrl}
                    alt={model.name}
                    width={model.width}
                    height={model.height}
                    className="w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Information */}
            <div className="space-y-4">
              <div>
                {/* 메인 페이지에서는 읽기 전용 - 편집은 어드민 페이지에서만 가능 */}
                <div className="mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 font-serif">
                    {model.name}
                  </h1>
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-black text-white border border-gray-300">
                  {model.category}
                </span>

              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 mb-3">{model.description}</p>

                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">
                    About TKLABEL Persona-ver.02
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {model.aiModelDescription}
                  </p>
                </div>
              </div>

              {/* Media Information Grid */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Media Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {/* AI Model */}
                  <div className="md:col-span-2 mb-2">
                    <div className="flex items-center mb-2">
                      <span className="font-semibold text-gray-700">AI Model:</span>
                      <span className="ml-2 text-gray-600 font-bold">TKLABEL Persona-ver.02</span>
                      <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Advanced</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      Specialized in persona generation and realistic character implementation
                    </p>
                  </div>

                  {/* Media Type */}
                  <div>
                    <span className="font-semibold text-gray-900">Type:</span>
                    <span className="ml-2 text-gray-600 capitalize">
                      {model.type === 'video' ? 'Video' : 'Image'}
                    </span>
                  </div>

                  {/* Quality Level */}
                  <div>
                    <span className="font-semibold text-gray-900">Quality:</span>
                    <span className="ml-2 text-gray-600">Professional Grade</span>
                  </div>

                  {/* Generation Method */}
                  <div className="whitespace-nowrap">
                    <span className="font-semibold text-gray-900">Generation:</span>
                    <span className="ml-2 text-gray-600">Persona-based AI Training</span>
                  </div>
                </div>
              </div>

              {/* Contact for Licensing Button - Media Information 아래에 배치 */}
              <div className="relative" ref={contactRef}>
                <button
                  onClick={() => setIsContactOpen(!isContactOpen)}
                  className="w-full bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors"
                >
                  Contact for Licensing
                </button>

                {/* 말풍선 스타일 드롭다운 - 위로 올라오도록 */}
                {isContactOpen && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-10">
                    {/* 말풍선 화살표 - 아래쪽 */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white/90 backdrop-blur-xl border-r border-b border-gray-200 rotate-45"></div>

                    {/* 내용 */}
                    <div className="p-6 relative">
                      {/* 닫기 버튼 */}
                      <button
                        onClick={() => setIsContactOpen(false)}
                        className="absolute top-3 right-3 text-gray-700 hover:text-gray-900 transition-colors text-xl w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full"
                      >
                        ×
                      </button>

                      {/* Coming Soon 내용 */}
                      <div className="text-center font-sans">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">
                          COMING SOON
                        </h3>
                        <div className="text-sm text-gray-700">
                          <p className="mb-2">문의는</p>
                          <p className="font-semibold text-gray-800">김태은</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* 이미지 모달 */}
      {model && model.type === 'image' && isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative w-full h-full max-w-7xl max-h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center">
              <Image
                src={model.mediaUrl}
                alt={`${model.name} (원본 크기)`}
                width={model.width}
                height={model.height}
                className="max-w-full max-h-[80vh] object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* 글래스 디자인 닫기 버튼 - 이미지 아래 중앙 */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="mt-4 text-white text-sm hover:text-white/80 transition-all duration-300 z-50 bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:scale-105 rounded-xl px-4 py-2 flex items-center justify-center space-x-2 shadow-lg"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium text-xs">Close</span>
            </button>

          </div>
        </div>
      )}

    </div>
  )
}