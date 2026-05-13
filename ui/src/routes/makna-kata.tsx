import { GlosariumLoading } from '#/components/glosarium-loading'
import { GlosariumNoData } from '#/components/glosarium-no-data'
import { getGlosariumMeaning } from '#/services/glosarium.service'
import { useGlosariumStore } from '#/stores/glosarium.store'
import type { GlosariumData } from '#/types/glosarium.type'
import { handleGlosariumServiceError } from '#/utils/errors.util'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/makna-kata')({
  validateSearch: (search: { from?: string }) => search,
  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const selectedGlosariumIds = useGlosariumStore(s => s.selectedGlosariumIds)

  const [loadingGetGlosarium, setLoadingGetGlosarium] = useState(false)

  const [glosarium, setGlosarium] = useState<GlosariumData[]>([])

  const handleGetData = useCallback(() => {
    setLoadingGetGlosarium(true)
    getGlosariumMeaning(selectedGlosariumIds)
      .then((data) => {
        setGlosarium(data.items)
      })
      .catch((e) => {
        handleGlosariumServiceError(e)
      })
      .finally(() => {
        setLoadingGetGlosarium(false)
      })
  }, [selectedGlosariumIds])

  const handleNavigateBack = () => {
    const to = search.from || '/'
    navigate({ to })
  }

  const handleCopyText = () => {
    if (!glosarium.length)
      return
    const glosariumText = glosarium
      .map(item => `${item.word} ${item.meaning}`)
      .join('\n\n')
    navigator.clipboard
      .writeText(glosariumText)
      .then(() => {
        toast.success('Makna kata berhasil disalin')
      })
      .catch((error) => {
        console.error(error)
        toast.error('Makna Kata gagal disalin')
      })
  }

  useEffect(() => {
    handleGetData()
  }, [handleGetData])

  return (
    <div className="py-6 px-5 space-y-4">
      <button onClick={() => { handleNavigateBack() }} className="flex items-center justify-center py-1 pl-1 pr-3 text-sm bg-gray-200 rounded-md w-max">
        <span>
          <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14 8-4 4 4 4"></path>
          </svg>
        </span>
        Kembali
      </button>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold tracking-wide">
          Makna Kata
        </h1>
        <button onClick={() => { handleCopyText() }} className="px-3 py-1 text-sm rounded-md bg-blue-200">Salin</button>
      </div>
      <div className="w-full p-2 border-t border-gray-400"></div>
      {loadingGetGlosarium
        ? (
            <GlosariumLoading />
          )
        : glosarium.length > 0
          ? (
              <div className="flex flex-col gap-8">
                {glosarium.map(g => (
                  <p key={g.id}>
                    <span className="font-bold text-xl">{g.word}</span>
                    {' '}
                    <span>{g.meaning}</span>
                  </p>
                ))}
              </div>
            )
          : (
              <GlosariumNoData />
            )}
    </div>
  )
}
