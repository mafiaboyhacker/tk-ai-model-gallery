import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          Could not find the requested page.
        </p>
        <Link
          href="/"
          className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}