/**
 * Enhanced Railway Health Check API - Enterprise Grade Monitoring
 */

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { existsSync } from 'fs'

export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, boolean | string | number> = {}
  let overallHealth = true

  console.log('🏥 Enterprise Health Check Starting...', new Date().toISOString())

  // 1. Environment Variables Check
  const requiredEnvs = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'RAILWAY_VOLUME_MOUNT_PATH']
  for (const env of requiredEnvs) {
    checks[`env_${env.toLowerCase()}`] = !!process.env[env]
    if (!process.env[env]) overallHealth = false
  }

  // 2. Volume Mount Comprehensive Check
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH
  if (volumePath) {
    checks.volume_mounted = existsSync(volumePath)
    checks.uploads_dir = existsSync(`${volumePath}/uploads`)
    checks.images_dir = existsSync(`${volumePath}/uploads/images`)
    checks.videos_dir = existsSync(`${volumePath}/uploads/videos`)
    checks.thumbnails_dir = existsSync(`${volumePath}/uploads/thumbnails`)

    if (!checks.volume_mounted || !checks.uploads_dir) {
      overallHealth = false
    }
  } else {
    checks.volume_mounted = false
    overallHealth = false
  }

  // 3. Database Connection with Performance Metrics
  let dbResponseTime = 0
  try {
    const dbStartTime = Date.now()
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    await prisma.$connect()
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`
    dbResponseTime = Date.now() - dbStartTime

    checks.database_connected = true
    checks.database_response_time = dbResponseTime
    checks.database_performance = dbResponseTime < 1000 ? 'excellent' : dbResponseTime < 3000 ? 'good' : 'slow'

    await prisma.$disconnect()
  } catch (error) {
    checks.database_connected = false
    checks.database_error = error.message.substring(0, 100)
    overallHealth = false
  }

  // 4. Railway-Specific Health Checks
  checks.railway_environment = process.env.RAILWAY_ENVIRONMENT === 'production'
  checks.railway_static_url = !!process.env.RAILWAY_STATIC_URL
  checks.railway_deployment_id = !!process.env.RAILWAY_DEPLOYMENT_ID

  // 5. System Performance Metrics
  const totalResponseTime = Date.now() - startTime
  checks.response_time_ms = totalResponseTime
  checks.performance_grade = totalResponseTime < 500 ? 'A' : totalResponseTime < 1000 ? 'B' : totalResponseTime < 2000 ? 'C' : 'D'

  // 6. Application Status
  const status = overallHealth ? 'healthy' : 'unhealthy'
  const httpStatus = overallHealth ? 200 : 503

  const response = {
    status,
    timestamp: new Date().toISOString(),
    message: `AI Model Gallery - Enterprise Health Check v4.0`,
    environment: process.env.NODE_ENV || 'unknown',
    version: 'v4.0-enterprise-optimized',
    performance: {
      total_response_time_ms: totalResponseTime,
      database_response_time_ms: dbResponseTime,
      grade: checks.performance_grade
    },
    checks,
    railway: {
      volume_path: process.env.RAILWAY_VOLUME_MOUNT_PATH,
      environment: process.env.RAILWAY_ENVIRONMENT,
      static_url: process.env.RAILWAY_STATIC_URL,
      deployment_id: process.env.RAILWAY_DEPLOYMENT_ID
    },
    recommendations: overallHealth ? [] : generateRecommendations(checks)
  }

  console.log(`🏥 Health Check Complete: ${status.toUpperCase()} (${totalResponseTime}ms)`)

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': status,
      'X-Response-Time': totalResponseTime.toString()
    }
  })
}

function generateRecommendations(checks: Record<string, boolean | string | number>): string[] {
  const recommendations: string[] = []

  if (!checks.database_connected) {
    recommendations.push('Check DATABASE_URL and PostgreSQL service status')
  }
  if (!checks.volume_mounted) {
    recommendations.push('Verify Railway volume is mounted to /data')
  }
  if (!checks.env_database_url) {
    recommendations.push('Set DATABASE_URL environment variable')
  }
  if (!checks.env_nextauth_secret) {
    recommendations.push('Set NEXTAUTH_SECRET environment variable')
  }
  if (!checks.railway_environment) {
    recommendations.push('Set RAILWAY_ENVIRONMENT=production')
  }

  return recommendations
}