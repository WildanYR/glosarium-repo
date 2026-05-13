import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type versionStore = {
  version: string
}

export const useVersionStore = create<versionStore>()(persist(() => ({
  version: 'initial',
}), {name: 'glosarium-version'}))