import { create } from "zustand"

type UpdaterStore = {
  progress: number
  message: string
  isError: boolean
  statTotal: number
  statChanged: number
}

export const useUpdaterStore = create<UpdaterStore>(() => ({
  progress: 0,
  message: '',
  isError: false,
  statTotal: 0,
  statChanged: 0
}))