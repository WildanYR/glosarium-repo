export function GlosariumSearch({ defaultValue, placeholder, onChange}: { defaultValue: string, placeholder: string, onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 flex items-center pointer-events-none inset-s-0 ps-3">
        <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"></path>
        </svg>
      </div>
      <input type="text" placeholder={placeholder} defaultValue={defaultValue} onChange={(e) => { onChange(e.target.value) }} className="block w-full p-2 text-sm text-gray-900 bg-gray-200 rounded-md ps-10 focus:ring-1 focus:ring-blue-500 focus:outline-none" />
    </div>
  )
}
