// Cache busting utility - Force deployment refresh
// This file exists to force Vercel to completely rebuild the deployment
// Timestamp: ${new Date().toISOString()}
// Random ID: ${Math.random().toString(36).substring(7)}
// Build ID: ${Date.now()}

export const CACHE_BUST_VERSION = '${Date.now()}'
export const BUILD_TIMESTAMP = '${new Date().toISOString()}'

console.log('🔄 Cache Buster Active - Version:', CACHE_BUST_VERSION)