import { Outlet, createRootRoute, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'
import { isPWAInstalled } from '#/utils/install-status.util'
import { HAS_OPEN_INSTALL_TUTORIAL, HIDE_INSTALL_TUTORIAL } from '#/constants/localstorage-key.const'

export const Route = createRootRoute({
  beforeLoad: () => {
    const isInstalled = isPWAInstalled()
    const hideTutorial = localStorage.getItem(HIDE_INSTALL_TUTORIAL) === 'true'
    const hasOpenInstallTutorial = sessionStorage.getItem(HAS_OPEN_INSTALL_TUTORIAL) === 'true'
    if (!isInstalled && !hideTutorial && !hasOpenInstallTutorial && location.pathname !== '/tutorial-install') {
      throw redirect({ to: '/tutorial-install' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <div className="flex justify-center items-start bg-gray-100">
        <div className="flex-1 flex flex-col w-full max-w-md shadow-lg min-h-screen space-y-2">
          <Outlet />
        </div>
      </div>
      <Toaster position="top-center" richColors />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}
