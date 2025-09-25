// SERVER COMPONENT ONLY
export const dynamic = 'force-dynamic'
export const revalidate = 0

import ModelClient from './ModelClient'

export default async function ModelPage() {
  return <ModelClient />
}