'use client'

import { useState, useEffect } from 'react'
import { useImageStore } from '@/store/imageStore'

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [backupCount, setBackupCount] = useState(0)
  const { images, isInitialized, clearImages } = useImageStore()

  useEffect(() => {
    // Check backup count
    if (typeof window !== 'undefined') {
      try {
        const backup = localStorage.getItem('tk-gallery-images-backup')
        if (backup) {
          const backupImages = JSON.parse(backup)
          setBackupCount(backupImages.length)
        }
      } catch (error) {
        setBackupCount(0)
      }
    }
  }, [images.length])

  const forceRestore = () => {
    if (typeof window !== 'undefined') {
      try {
        const backup = localStorage.getItem('tk-gallery-images-backup')
        if (backup) {
          const backupImages = JSON.parse(backup)
          console.log('Force restoring from backup:', backupImages.length, 'images')
          clearImages()
          useImageStore.getState().addImages(backupImages)
        }
      } catch (error) {
        console.error('Force restore failed:', error)
      }
    }
  }

  const forceBackup = () => {
    if (typeof window !== 'undefined' && images.length > 0) {
      localStorage.setItem('tk-gallery-images-backup', JSON.stringify(images))
      setBackupCount(images.length)
      console.log('Force backup completed:', images.length, 'images')
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      {/* Debug Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-2 rounded-full text-xs hover:opacity-80 transition-colors ${
            isInitialized ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
          }`}
        >
          Debug ({images.length}/{backupCount}) {isInitialized ? '✓' : '⏳'}
        </button>
      </div>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-80 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="font-semibold text-sm">Image Store Debug</h3>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-80">
            <div className="mb-3">
              <p className="text-sm text-gray-600">
                <strong>Store Images:</strong> {images.length}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Backup Images:</strong> {backupCount}
              </p>
              <p className="text-sm text-gray-600">
                <strong>IndexedDB Initialized:</strong> {isInitialized ? '✅ Yes' : '❌ No'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Keys:</strong> tk-gallery-images, tk-gallery-images-backup
              </p>
            </div>

            <div className="mb-3 space-y-1">
              <button
                onClick={forceBackup}
                className="w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                disabled={images.length === 0}
              >
                Force Backup ({images.length})
              </button>
              
              <button
                onClick={forceRestore}
                className="w-full bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                disabled={backupCount === 0}
              >
                Force Restore ({backupCount})
              </button>
              
              <button
                onClick={clearImages}
                className="w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                disabled={images.length === 0}
              >
                Clear All Images
              </button>
            </div>

            <div className="space-y-2">
              {images.map((image) => (
                <div key={image.id} className="border border-gray-200 rounded p-2">
                  <div className="text-xs text-gray-600 mb-1">
                    <strong>ID:</strong> {image.id}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    <strong>File:</strong> {image.fileName}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    <strong>Size:</strong> {image.width}x{image.height}
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>URL:</strong> {image.url.substring(0, 30)}...
                  </div>
                </div>
              ))}
            </div>

            {images.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No images in store
                {backupCount > 0 && (
                  <span className="block text-xs mt-1">
                    ({backupCount} images in backup)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}