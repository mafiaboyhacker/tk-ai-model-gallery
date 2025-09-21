'use client'

import { useEffect } from 'react'

const shouldRegisterServiceWorker = () => {
  if (typeof window === 'undefined') return false
  const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return 'serviceWorker' in navigator && isSecureContext
}

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (!shouldRegisterServiceWorker()) {
      console.log('🛑 Service Worker registration skipped (insecure context or unsupported).')
      return
    }

    let isMounted = true

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })

        if (!isMounted) {
          return
        }

        console.log('✅ Service Worker registered:', registration.scope)

        if (registration.waiting) {
          console.log('ℹ️ A new Service Worker is waiting to activate.')
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) return

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 Service Worker update installed. Content will refresh after closing all tabs.')
              } else {
                console.log('🎉 Service Worker installed for the first time.')
              }
            }
          })
        })
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }

    register()

    const onControllerChange = () => {
      console.log('⚡ Service Worker controller changed. New content is active.')
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      isMounted = false
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  return null
}

export default ServiceWorkerRegister
