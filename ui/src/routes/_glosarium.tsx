import { GlosariumStickySelected } from '#/components/glosarium-sticky-selected'
import { useGlosariumStore } from '#/stores/glosarium.store'
import { useVersionStore } from '#/stores/version.store'
import { formatDateIdStandard } from '#/utils/date.util'
import { isPWAInstalled } from '#/utils/install-status.util'
import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'

export const Route = createFileRoute('/_glosarium')({
  component: RouteComponent,
})

function RouteComponent() {
  const { selectedGlosariumIds, clearSelectedIds } = useGlosariumStore(useShallow(state => ({
    selectedGlosariumIds: state.selectedGlosariumIds,
    clearSelectedIds: state.clearSelectedIds,
  })))
  const { version } = useVersionStore()
  const navigate = Route.useNavigate()
  const location = useLocation()
  const pwaInstalled = isPWAInstalled()

  const updateRouteHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNavigateInstallTutorial = () => {
    navigate({ to: '/tutorial-install' })
  }

  const handleNavigateToMeaning = () => {
    if (selectedGlosariumIds.length === 0) return;
    navigate({ to: '/makna-kata', search: { from: location.pathname } })
  }

  const startUpdateRouteTimer = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (updateRouteHoldTimerRef.current) {
      clearTimeout(updateRouteHoldTimerRef.current)
    }

    updateRouteHoldTimerRef.current = setTimeout(() => {
      navigate({to: '/updater'})
    }, 10000);
  };

  const cancelUpdateRouteTimer = () => {
    if (updateRouteHoldTimerRef.current) {
      clearTimeout(updateRouteHoldTimerRef.current);
      updateRouteHoldTimerRef.current = null
    }
  };

  const getDataVersion = () => {
    if (version === 'initial') return 'Initial'
    return formatDateIdStandard(new Date(version))
  }

  useEffect(() => {
    return () => {
      if (updateRouteHoldTimerRef.current) {
        clearTimeout(updateRouteHoldTimerRef.current)
      }
    };
  }, []);

  return (
    <>
      <div className="flex-1 flex flex-col gap-2 pt-5 px-5">
        <div className="flex items-center justify-between gap-2">
          <div className='flex flex-col'>
            <button
              onMouseDown={startUpdateRouteTimer}
              onMouseUp={cancelUpdateRouteTimer}
              onMouseLeave={cancelUpdateRouteTimer}
              onTouchStart={startUpdateRouteTimer}
              onTouchEnd={cancelUpdateRouteTimer}
              className="flex items-center gap-2"
            >
              <img src="/logo.svg" className="size-6" />
              <h1 className="font-serif font-bold text-4xl tracking-wide">Glosarium</h1>
            </button>
            <p className='text-sm text-gray-400'>versi data: {getDataVersion()}</p>
          </div>
          {!pwaInstalled
            ? (
                <button onClick={() => { handleNavigateInstallTutorial() }} className="flex items-center justify-center gap-2 px-2 py-1 text-sm bg-blue-200 rounded-md w-max">
                  <span>
                    <svg className="size-(--text-sm)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 15V3" />
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <path d="m7 10 5 5 5-5" />
                    </svg>
                  </span>
                  Install
                </button>
              )
            : null}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Mode Pencarian</p>
          <div className="flex gap-2">
            <Link to="/" className="w-full text-sm text-center p-2 rounded-lg" activeProps={{ className: 'bg-blue-400 text-white font-bold' }} inactiveProps={{ className: 'bg-gray-200' }}>
              Kata
            </Link>
            <Link to="/cari-makna" className="w-full text-sm text-center p-2 rounded-lg" activeProps={{ className: 'bg-blue-400 text-white' }} inactiveProps={{ className: 'bg-gray-200' }}>
              Makna
            </Link>
          </div>
        </div>
        <Outlet />
      </div>
      {selectedGlosariumIds.length > 0
        ? (
            <GlosariumStickySelected
              totalSelected={selectedGlosariumIds.length}
              onShowMeaning={handleNavigateToMeaning}
              onClearSelected={clearSelectedIds}
            />
          )
        : null}
    </>
  )
}
