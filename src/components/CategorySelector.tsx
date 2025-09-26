'use client'

import { useState } from 'react'

// Categories from Prisma schema
export const AI_CATEGORIES = [
  { value: 'ASIAN', label: '아시아계', emoji: '🏯' },
  { value: 'EUROPEAN', label: '유럽계', emoji: '🏰' },
  { value: 'AFRICAN_AMERICAN', label: '아프리카계 미국인', emoji: '🗽' },
  { value: 'HISPANIC', label: '히스패닉', emoji: '🌮' },
  { value: 'SPECIAL', label: '특별 카테고리', emoji: '✨' }
] as const

// Industries from Prisma schema
export const AI_INDUSTRIES = [
  { value: 'FASHION', label: '패션', emoji: '👗' },
  { value: 'COSMETICS', label: '화장품', emoji: '💄' },
  { value: 'LEISURE_SPORTS', label: '레저/스포츠', emoji: '⚽' },
  { value: 'HEALTHCARE', label: '헬스케어', emoji: '🏥' },
  { value: 'TECHNOLOGY', label: '기술', emoji: '💻' },
  { value: 'FOOD_BEVERAGE', label: '식음료', emoji: '🍽️' },
  { value: 'AUTOMOTIVE', label: '자동차', emoji: '🚗' },
  { value: 'REAL_ESTATE', label: '부동산', emoji: '🏠' },
  { value: 'EDUCATION', label: '교육', emoji: '🎓' },
  { value: 'FINANCE', label: '금융', emoji: '💰' },
  { value: 'OTHER', label: '기타', emoji: '🔧' }
] as const

export type CategoryType = typeof AI_CATEGORIES[number]['value']
export type IndustryType = typeof AI_INDUSTRIES[number]['value']

interface CategorySelectorProps {
  selectedCategory?: CategoryType
  selectedIndustry?: IndustryType
  onCategoryChange: (category: CategoryType) => void
  onIndustryChange: (industry: IndustryType | undefined) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function CategorySelector({
  selectedCategory,
  selectedIndustry,
  onCategoryChange,
  onIndustryChange,
  required = false,
  disabled = false,
  className = ''
}: CategorySelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          카테고리 선택 {required && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AI_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              disabled={disabled}
              onClick={() => onCategoryChange(category.value)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${disabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50'
                  : 'hover:shadow-md cursor-pointer'
                }
                ${selectedCategory === category.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.emoji}</span>
                <div>
                  <div className="font-medium text-sm">{category.label}</div>
                  <div className="text-xs opacity-75">{category.value}</div>
                </div>
              </div>

              {selectedCategory === category.value && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={disabled}
          className={`
            flex items-center space-x-2 text-sm font-medium transition-colors
            ${disabled
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>상세 분류 옵션 {showAdvanced ? '접기' : '펼치기'}</span>
        </button>
      </div>

      {/* Industry Selection (Advanced Options) */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              산업 분야 (선택사항)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {/* Clear Selection Button */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onIndustryChange(undefined)}
                className={`
                  p-3 rounded-md border text-center transition-all duration-200
                  ${disabled
                    ? 'opacity-50 cursor-not-allowed bg-gray-100'
                    : 'hover:shadow-sm cursor-pointer'
                  }
                  ${!selectedIndustry
                    ? 'border-gray-400 bg-gray-200 text-gray-800 font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                <div className="text-lg">❌</div>
                <div className="text-xs">선택 안함</div>
              </button>

              {/* Industry Options */}
              {AI_INDUSTRIES.map((industry) => (
                <button
                  key={industry.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onIndustryChange(industry.value)}
                  className={`
                    p-3 rounded-md border text-center transition-all duration-200
                    ${disabled
                      ? 'opacity-50 cursor-not-allowed bg-gray-50'
                      : 'hover:shadow-sm cursor-pointer'
                    }
                    ${selectedIndustry === industry.value
                      ? 'border-green-500 bg-green-50 text-green-900 font-medium'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-lg">{industry.emoji}</div>
                  <div className="text-xs">{industry.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selection Summary */}
          {(selectedCategory || selectedIndustry) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900 mb-1">선택된 분류:</div>
              <div className="text-sm text-blue-800">
                {selectedCategory && (
                  <span className="inline-flex items-center space-x-1">
                    <span>{AI_CATEGORIES.find(c => c.value === selectedCategory)?.emoji}</span>
                    <span>{AI_CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
                  </span>
                )}
                {selectedCategory && selectedIndustry && <span className="mx-2">•</span>}
                {selectedIndustry && (
                  <span className="inline-flex items-center space-x-1">
                    <span>{AI_INDUSTRIES.find(i => i.value === selectedIndustry)?.emoji}</span>
                    <span>{AI_INDUSTRIES.find(i => i.value === selectedIndustry)?.label}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        💡 카테고리는 필수이며, 산업 분야는 선택사항입니다. 나중에 관리자 페이지에서 수정할 수 있습니다.
      </div>
    </div>
  )
}