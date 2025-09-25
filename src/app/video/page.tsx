// SERVER COMPONENT ONLY
export const dynamic = 'force-dynamic'
export const revalidate = 0

import VideoClient from './VideoClient'

export default async function VideoPage() {
  return <VideoClient />
}