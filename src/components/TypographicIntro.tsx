'use client'

import { useEffect, useState } from 'react'

interface TypographicIntroProps {
  onComplete: () => void
  duration?: number
}

/**
 * 🎨 타이포그래픽 인트로 컴포넌트
 * - 브랜드 강화를 위한 "TK AI GALLERY" 애니메이션
 * - Libre Bodoni 폰트로 프리미엄 느낌
 * - 백그라운드에서 우선 로딩 진행
 */
export default function TypographicIntro({ onComplete, duration = 1500 }: TypographicIntroProps) {
  const [visibleLetters, setVisibleLetters] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // TK AI GALLERY를 분리하여 애니메이션
  const words = [
    { text: 'TK', className: 'text-4xl md:text-6xl font-bold' },
    { text: 'AI', className: 'text-3xl md:text-5xl font-medium' },
    { text: 'GALLERY', className: 'text-2xl md:text-4xl font-light tracking-wider' }
  ]

  const totalLetters = words.reduce((acc, word) => acc + word.text.length, 0)

  useEffect(() => {
    // 문자별 순차 페이드인
    const letterInterval = (duration * 0.6) / totalLetters // 60%를 문자 애니메이션에 할당
    let currentLetter = 0

    const interval = setInterval(() => {
      currentLetter++
      setVisibleLetters(currentLetter)

      if (currentLetter >= totalLetters) {
        clearInterval(interval)

        // 완성 후 잠시 유지 후 페이드아웃
        setTimeout(() => {
          setIsComplete(true)
          setTimeout(onComplete, 300) // 페이드아웃 시간
        }, duration * 0.4) // 나머지 40%는 유지 시간
      }
    }, letterInterval)

    return () => clearInterval(interval)
  }, [duration, totalLetters, onComplete])

  // 현재까지 표시할 문자 계산
  const renderWords = () => {
    let letterCount = 0

    return words.map((word, wordIndex) => {
      const wordStart = letterCount
      const wordEnd = letterCount + word.text.length
      letterCount = wordEnd

      const visibleInWord = Math.max(0, Math.min(word.text.length, visibleLetters - wordStart))

      return (
        <div
          key={wordIndex}
          className={`${word.className} overflow-hidden whitespace-nowrap`}
          style={{
            fontFamily: 'var(--font-libre-bodoni), serif',
          }}
        >
          {word.text.split('').map((letter, letterIndex) => (
            <span
              key={letterIndex}
              className={`inline-block transition-all duration-200 ease-out ${
                letterIndex < visibleInWord
                  ? 'opacity-100 transform translate-y-0'
                  : 'opacity-0 transform translate-y-4'
              }`}
              style={{
                transitionDelay: `${letterIndex * 50}ms`
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>
      )
    })
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-white flex flex-col items-center justify-center transition-opacity duration-300 ${
        isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 메인 타이포그래피 */}
      <div className="text-center space-y-2 md:space-y-4">
        {renderWords()}
      </div>

      {/* 서브텍스트 - 전체 완성 후 페이드인 */}
      <div
        className={`mt-8 text-sm md:text-base text-gray-500 text-center transition-opacity duration-500 ${
          visibleLetters >= totalLetters ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          fontFamily: 'var(--font-jost), sans-serif',
        }}
      >
        <div>Premium AI Generated</div>
        <div className="mt-1">Images & Videos</div>
      </div>

      {/* 미니멀 로딩 인디케이터 */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}