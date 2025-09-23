'use client'

import { useEffect, useState } from 'react'

interface TypographicIntroProps {
  onComplete: () => void
}

export default function TypographicIntro({ onComplete }: TypographicIntroProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [showSubtitle, setShowSubtitle] = useState(false)

  const words = [
    { text: 'TK', className: 'text-4xl md:text-6xl font-bold' },
    { text: 'AI', className: 'text-3xl md:text-5xl font-medium' },
    { text: 'GALLERY', className: 'text-2xl md:text-4xl font-light tracking-wider' }
  ]

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const animateSequence = async () => {
      // Phase 1: Animate words letter by letter
      for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        setCurrentWordIndex(wordIndex)
        setCurrentLetterIndex(0)

        const word = words[wordIndex]
        for (let letterIndex = 0; letterIndex <= word.text.length; letterIndex++) {
          setCurrentLetterIndex(letterIndex)
          await new Promise(resolve => {
            timeoutId = setTimeout(resolve, 120)
          })
        }

        // Pause between words
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, 300)
        })
      }

      // Phase 2: Show subtitle
      setShowSubtitle(true)
      await new Promise(resolve => {
        timeoutId = setTimeout(resolve, 1200)
      })

      // Phase 3: Complete and transition
      onComplete()
    }

    animateSequence()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center pointer-events-none">
      <div className="text-center space-y-2 md:space-y-4">
        {words.map((word, wordIndex) => (
          <div
            key={wordIndex}
            className={word.className}
            style={{ fontFamily: 'Libre Bodoni, serif' }}
          >
            {word.text.split('').map((letter, letterIndex) => {
              const shouldShow = wordIndex < currentWordIndex ||
                (wordIndex === currentWordIndex && letterIndex < currentLetterIndex)

              return (
                <span
                  key={letterIndex}
                  className={`inline-block transition-opacity duration-200 ${
                    shouldShow ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {letter}
                </span>
              )
            })}
          </div>
        ))}
      </div>

      {showSubtitle && (
        <div
          className="mt-8 text-sm md:text-base text-gray-500 text-center animate-fade-in"
          style={{ fontFamily: 'Libre Bodoni, serif' }}
        >
          <div>Premium AI Generated</div>
          <div className="mt-1">Images & Videos</div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}