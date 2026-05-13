export function ProgressBar({ progress, message }: { progress: number, message: string }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div>
      <p className="font-medium mb-1">Progres:</p>
      <p className="text-sm text-body mb-1">{message}</p>
      <div className="w-full bg-neutral-300 rounded-full overflow-hidden">
        <div 
          className="bg-blue-600 text-xs font-medium text-white text-center p-0.5 leading-none rounded-full flex items-center justify-center transition-all duration-500 ease-out" 
          style={{ width: `${clampedProgress}%` }}
        >
          {clampedProgress}%
        </div>
      </div>
    </div>
  )
}
