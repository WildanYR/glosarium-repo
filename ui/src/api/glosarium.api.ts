import type { GlosariumData } from "#/types/glosarium.type"
import type { PaginationData } from "#/types/pagination.type"

export async function apiGetGlosariumWithPagination(page: number, wordFilter?: string, sync?: Date, origin?: string): Promise<PaginationData<GlosariumData>> {
  const url = new URL('/api/glosarium', origin || window.location.origin)
  const params = new URLSearchParams()
  params.append('page', page.toString())

  if (wordFilter) {
    params.append('word', wordFilter)
  }

  if (sync) {
    params.append('sync', sync.toISOString())
  }

  url.search = params.toString()

  const res = await fetch(url.toString())
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'Failed to get glosarium with pagination')
  }

  const data: PaginationData<GlosariumData> = await res.json()

  return {
    items: data.items.map(g => ({
      ...g,
      created_at: g.created_at ? new Date(g.created_at) : undefined,
      updated_at: g.updated_at ? new Date(g.updated_at) : undefined,
    })),
    pagination: data.pagination,
  }
}

export async function apiGetGlosariumMeaning(ids: number[]): Promise<{ items: GlosariumData[] }> {
  const url = new URL('/api/glosarium/meaning', window.location.origin)
  const params = new URLSearchParams()
  params.append('ids', ids.join(','))

  url.search = params.toString()

  const res = await fetch(url.toString())
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'Failed to get glosarium meaning')
  }

  const data: { items: GlosariumData[] } = await res.json()
  return { items: data.items.map(g => ({
    ...g,
    created_at: g.created_at ? new Date(g.created_at) : undefined,
    updated_at: g.updated_at ? new Date(g.updated_at) : undefined,
  })) }
}

export async function apiSearchGlosariumMeaning(page: number, wordFilter?: string) {
  const url = new URL('/api/glosarium/meaning-search', window.location.origin)
  const params = new URLSearchParams()
  params.append('page', page.toString())

  if (wordFilter) {
    params.append('word', wordFilter)
  }

  url.search = params.toString()

  const res = await fetch(url.toString())
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.message || 'Failed to get glosarium with pagination')
  }

  const data: PaginationData<GlosariumData> = await res.json()

  return {
    items: data.items.map(g => ({
      ...g,
      created_at: g.created_at ? new Date(g.created_at) : undefined,
      updated_at: g.updated_at ? new Date(g.updated_at) : undefined,
    })),
    pagination: data.pagination,
  }
}