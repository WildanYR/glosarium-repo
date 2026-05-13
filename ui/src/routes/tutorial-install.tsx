import { HAS_OPEN_INSTALL_TUTORIAL, HIDE_INSTALL_TUTORIAL } from '#/constants/localstorage-key.const'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/tutorial-install')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem(HIDE_INSTALL_TUTORIAL, 'true')
    }
    sessionStorage.setItem(HAS_OPEN_INSTALL_TUTORIAL, 'true')
    router.invalidate()
      .then(() => {
        navigate({ to: '/' })
      })
  }

  return (
    <div className="flex-1 flex flex-col p-5 justify-center items-center text-center gap-6">
      <img src="/logo.svg" className="size-10" />
      <h1 className="text-2xl font-bold font-serif">Install Glosarium</h1>

      <p className="text-gray-600">
        Agar Glosarium bisa berjalan
        {' '}
        <b>Full Offline</b>
        {' '}
        silakan install ke layar utama Anda.
      </p>

      {/* Konten Dinamis Berdasarkan OS */}
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
        <div className="space-y-2">
          <p className="font-semibold">Pengguna Android/Chrome:</p>
          <ol className="text-sm text-left list-decimal list-inside space-y-2">
            <li>
              Tekan ikon
              {' '}
              <b>Titik Tiga</b>
              {' '}
              di pojok kanan atas browser (posisi tombol ini bisa berbeda tergantung browser yang dipakai).
            </li>
            <li>
              Pilih menu
              {' '}
              <b>"Install App"</b>
              {' '}
              atau
              {' '}
              <b>"Add to Home Screen"</b>
              .
            </li>
            <li>Konfirmasi instalasi.</li>
          </ol>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
        <div className="space-y-2">
          <p className="font-semibold">Pengguna Safari (Iphone/Ipad):</p>
          <ol className="text-sm text-left list-decimal list-inside space-y-2">
            <li>
              Tekan tombol
              {' '}
              <b>Share</b>
              {' '}
              (kotak panah ke atas) di browser safari bawah.
            </li>
            <li>
              Geser ke bawah dan pilih
              {' '}
              <b>"Add to Home Screen"</b>
              .
            </li>
            <li>
              Tekan
              {' '}
              <b>Add</b>
              {' '}
              di pojok kanan atas.
            </li>
          </ol>
        </div>
      </div>

      <div className="pt-8 space-y-4">
        <label className="flex items-center justify-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            checked={dontShowAgain}
            onChange={e => setDontShowAgain(e.target.checked)}
          />
          <span className="text-sm text-gray-500">Jangan tampilkan halaman ini lagi</span>
        </label>

        <button
          onClick={handleContinue}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Lanjut ke Aplikasi
        </button>
      </div>
    </div>
  )
}
