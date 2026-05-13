import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type GlosariumStore = {
  selectedGlosariumIds: number[]
  addSelectedId: (id: number) => void
  clearSelectedIds: () => void
}

export const useGlosariumStore = create<GlosariumStore>()(persist((set, get) => ({
  selectedGlosariumIds: [],
  addSelectedId: (id: number) => {
    const { selectedGlosariumIds } = get()

    if (selectedGlosariumIds.includes(id)) {
      const filtered = selectedGlosariumIds.filter(g => g !== id)
      set({
        selectedGlosariumIds: filtered,
      })
    }
    else {
      set({
        selectedGlosariumIds: [...selectedGlosariumIds, id],
      })
    }
  },
  clearSelectedIds: () => {
    set({
      selectedGlosariumIds: [],
    })
  }
}), {name: 'glosarium-store'}))