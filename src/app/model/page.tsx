import dynamic from 'next/dynamic'

// 🛡️ SSR Safe: Dynamic import for client component
const ModelPageClient = dynamic(
  () => import('@/components/ModelPageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        </div>
      </div>
    )
  }
)

// Disable static generation to prevent build-time prerendering errors
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ModelPage() {
  return <ModelPageClient />
}