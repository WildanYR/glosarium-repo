import type { Remote } from "comlink";
import { wrap } from "comlink";
import type { GlosariumWorker } from "./glosarium.worker";

import { SQLITE_STATUS, SYNC_STATUS } from "#/constants/localstorage-key.const";
import { toast } from "sonner";
import { apiGetGlosariumVersion } from "#/api/glosarium-updater.api";
import { useVersionStore } from "#/stores/version.store";

let glosariumWorker: Remote<GlosariumWorker> | null = null

export async function initGlosariumWorker() {
  const worker = new Worker(new URL('./glosarium.worker.ts', import.meta.url), {type: 'module'})
  const wrappedWorker = wrap<GlosariumWorker>(worker)

  const initStatus = await wrappedWorker.initDB()
  if (initStatus.status === 'success') {
    glosariumWorker = wrappedWorker
    sessionStorage.setItem(SQLITE_STATUS, 'ready')
  }
  
  if (initStatus.status === 'unsupported') {
    sessionStorage.setItem(SQLITE_STATUS, 'unsupported')
  }
  
  if (initStatus.status === ' error') {
    toast.error('Database Offline Error', {description: 'Fallback ke mode online', duration: 5000})
    sessionStorage.setItem(SQLITE_STATUS, 'error')
  }
}

export async function sqliteSyncDatabase() {
  const sqliteStatus = sessionStorage.getItem(SQLITE_STATUS)
  const { version } = await apiGetGlosariumVersion()
  if (version === 'initial') {
    return
  }

  if (glosariumWorker && sqliteStatus === 'ready') {
    const { version: versionStore } = useVersionStore.getState()
    const syncDate = versionStore === 'initial' ? undefined : versionStore
    sessionStorage.setItem(SYNC_STATUS, 'pending')

    await glosariumWorker.syncDatabase(window.location.origin, syncDate || undefined)

    const {version: newVersion} = await apiGetGlosariumVersion()
    useVersionStore.setState({ version: newVersion })

    sessionStorage.setItem(SYNC_STATUS, 'ready')
  }
}

export function getGlosariumWorker() {
  return glosariumWorker
}