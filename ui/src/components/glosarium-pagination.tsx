export function GlosariumPagination({
  showPrevious,
  showNext,
  onPreviousPage,
  onNextPage,
}: {
  showPrevious: boolean
  showNext: boolean
  onPreviousPage: () => void
  onNextPage: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Previous Button */}
      {showPrevious
        ? (
            <button
              onClick={() => onPreviousPage()}
              className="p-1 text-gray-400 rounded-md hover:bg-gray-200"
            >
              <span>
                <svg
                  className="w-8 h-8"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m14 8-4 4 4 4"
                  />
                </svg>
              </span>
            </button>
          )
        : null}
      {/* Next Button */}
      {showNext
        ? (
            <button
              onClick={() => onNextPage()}
              className="p-1 text-gray-400 rounded-md hover:bg-gray-200"
            >
              <span>
                <svg
                  className="w-8 h-8"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m10 16 4-4-4-4"
                  />
                </svg>
              </span>
            </button>
          )
        : null}
    </div>
  )
}
