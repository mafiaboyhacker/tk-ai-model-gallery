'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import { useImageStore } from '@/store/imageStore'

// 데모 데이터 제거됨 - 실제 업로드된 이미지만 사용
const createDemoModels = () => []

export default function ModelDetailPage() {
  const params = useParams()
  const modelId = params.id as string
  const [model, setModel] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const uploadedImages = useImageStore((state) => state.images)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // 업로드된 이미지에서 찾기
    const uploadedModel = uploadedImages.find(img => img.id === modelId)
    
    if (uploadedModel) {
      setModel({
        id: uploadedModel.id,
        name: uploadedModel.fileName || 'Uploaded Image',
        imageUrl: uploadedModel.url,
        imageAlt: `Uploaded: ${uploadedModel.fileName}`,
        category: 'uploaded',
        width: uploadedModel.width,
        height: uploadedModel.height,
        description: 'User uploaded AI model'
      })
    }
  }, [modelId, uploadedImages, mounted])

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
              className="text-gray-600 hover:text-black transition-colors inline-flex items-center"
            >
              ← Back to Gallery
            </Link>
          </div>

          {/* Model Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image */}
            <div className="relative">
              <Image
                src={model.imageUrl}
                alt={model.imageAlt}
                width={model.width}
                height={model.height}
                className="w-full h-auto rounded-lg shadow-lg"
                priority
              />
            </div>

            {/* Information */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 font-serif">
                  {model.name}
                </h1>
                <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  {model.category}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{model.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">Width:</span>
                  <span className="ml-2 text-gray-600">{model.width}px</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Height:</span>
                  <span className="ml-2 text-gray-600">{model.height}px</span>
                </div>
              </div>

              {/* Contact Button */}
              <div className="pt-4">
                <button className="w-full bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors">
                  Contact for Licensing
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}