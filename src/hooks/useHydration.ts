import { useEffect, useState } from 'react'

/**
 * Safe hydration hook that prevents hydration mismatches
 * Only returns true after client-side hydration is complete
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}