// SERVER COMPONENT ONLY
export const dynamic = 'force-dynamic'
export const revalidate = 0

import HomeClient from './HomeClient'

export default async function HomePage() {
  return <HomeClient />
}
