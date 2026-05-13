import { GlosariumItem } from '#/components/glosarium-item'
import { GlosariumLoading } from '#/components/glosarium-loading'
import { GlosariumNoData } from '#/components/glosarium-no-data'
import { GlosariumPagination } from '#/components/glosarium-pagination'
import { GlosariumSearch } from '#/components/glosarium-search'
import { useGlosariumStore } from '#/stores/glosarium.store'
import type { GlosariumData } from '#/types/glosarium.type'
import type { Pagination } from '#/types/pagination.type'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDebouncedCallback } from 'use-debounce'
import { handleGlosariumServiceError } from '#/utils/errors.util'
import { getGlosariumWithPagination } from '#/services/glosarium.service'

export const Route = createFileRoute('/_glosarium/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { selectedGlosariumIds, addSelectedId } = useGlosariumStore(useShallow(state => ({
    selectedGlosariumIds: state.selectedGlosariumIds,
    addSelectedId: state.addSelectedId,
  })))

  const [loadingGetGlosarium, setLoadingGetGlosarium] = useState(false)

  const [glosarium, setGlosarium] = useState<GlosariumData[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    maxPage: 1,
    totalItem: 0,
  })

  const [search, setSearch] = useState('')

  const handleGetData = useCallback((wordFilter?: string) => {
    setLoadingGetGlosarium(true)
    getGlosariumWithPagination(pagination.page, wordFilter || undefined)
      .then((data) => {
        setGlosarium(data.items)
        setPagination(data.pagination)
      })
      .catch((e) => {
        handleGlosariumServiceError(e)
      })
      .finally(() => {
        setLoadingGetGlosarium(false)
      })
  }, [pagination.page])

  const handleSearchWord = useDebouncedCallback((value: string) => {
    setSearch(value)
    handleGetData(value || undefined)
  }, 700)

  const isWordSelected = (id: number) => {
    return selectedGlosariumIds.includes(id)
  }

  const handlePagination = (index: number) => {
    setPagination({
      ...pagination,
      page: pagination.page + index,
    })
  }

  useEffect(() => {
    handleGetData(search || undefined)
  }, [handleGetData])

  return (
    <div className="mt-2 space-y-2">
      <GlosariumSearch placeholder="Cari Kata" defaultValue={search} onChange={(value) => { handleSearchWord(value) }} />
      {loadingGetGlosarium
        ? (
            <GlosariumLoading />
          )
        : glosarium.length > 0
          ? (
              <div className="flex flex-col gap-1 divide-y divide-gray-200">
                {glosarium.map(g => (
                  <GlosariumItem key={g.id} item={g} isSelected={isWordSelected(g.id)} onSelect={addSelectedId} />
                ))}
                <GlosariumPagination
                  showPrevious={pagination.page > 1}
                  showNext={pagination.page < pagination.maxPage}
                  onPreviousPage={() => { handlePagination(-1) }}
                  onNextPage={() => { handlePagination(1) }}
                />
              </div>
            )
          : (
              <GlosariumNoData />
            )}
    </div>
  )
}

