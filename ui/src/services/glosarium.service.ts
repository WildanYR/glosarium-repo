import { apiGetGlosariumMeaning, apiGetGlosariumWithPagination, apiSearchGlosariumMeaning } from "#/api/glosarium.api"
import { SQLITE_STATUS, SYNC_STATUS } from "#/constants/localstorage-key.const"
import type { GlosariumData } from "#/types/glosarium.type"
import type { PaginationData } from "#/types/pagination.type"
import { getGlosariumWorker } from "#/workers/glosarium-wrapper.worker"

export async function getGlosariumWithPagination(page: number, wordFilter?: string): Promise<PaginationData<GlosariumData>> {
  const sqliteStatus = sessionStorage.getItem(SQLITE_STATUS)
  const syncStatus = sessionStorage.getItem(SYNC_STATUS)
  const glosariumWorker = getGlosariumWorker()

  if (glosariumWorker && sqliteStatus === 'ready' && syncStatus === 'ready') {
    try {
      const data = await glosariumWorker.getGlosariumWithPagination(page, wordFilter)
      return data
    } catch(error) {
      console.error('getGlosariumWithPagination error', (error as Error).message)
    }
  }

  return await apiGetGlosariumWithPagination(page, wordFilter)
}

export async function getGlosariumMeaning(ids: number[]): Promise<{ items: GlosariumData[] }> {
  const sqliteStatus = sessionStorage.getItem(SQLITE_STATUS)
  const syncStatus = sessionStorage.getItem(SYNC_STATUS)
  const glosariumWorker = getGlosariumWorker()

  if (glosariumWorker && sqliteStatus === 'ready' && syncStatus === 'ready') {
    try {
      const data = await glosariumWorker.getGlosariumMeaning(ids)
      return data
    } catch(error) {
      console.error('getGlosariumMeaning error', (error as Error).message)
    }
  }

  return await apiGetGlosariumMeaning(ids)
}

export async function searchGlosariumMeaning(page: number, wordFilter?: string): Promise<PaginationData<GlosariumData>> {
  const sqliteStatus = sessionStorage.getItem(SQLITE_STATUS)
  const syncStatus = sessionStorage.getItem(SYNC_STATUS)
  const glosariumWorker = getGlosariumWorker()

  if (glosariumWorker && sqliteStatus === 'ready' && syncStatus === 'ready') {
    try {
      const data = await glosariumWorker.searchGlosariumMeaning(page, wordFilter)
      return data
    } catch(error) {
      console.error('searchGlosariumMeaning error', (error as Error).message)
    }
  }

  return await apiSearchGlosariumMeaning(page, wordFilter)
}