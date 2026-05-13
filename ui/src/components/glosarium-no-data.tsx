export function GlosariumNoData() {
  return (
    <div className="flex flex-col items-center justify-center flex-1">
      {/* Book Icon */}
      <svg
        className="w-24 h-24 text-gray-300"
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
          strokeWidth="1"
          d="M12 6.03v13m0-13c-2.819-.831-4.715-1.076-8.029-1.023A.99.99 0 0 0 3 6v11c0 .563.466 1.014 1.03 1.007 3.122-.043 5.018.212 7.97 1.023m0-13c2.819-.831 4.715-1.076 8.029-1.023A.99.99 0 0 1 21 6v11c0 .563-.466 1.014-1.03 1.007-3.122-.043-5.018.212-7.97 1.023"
        />
      </svg>

      <p className="text-2xl font-medium text-gray-300">
        Kata Tidak Ditemukan
      </p>
    </div>
  )
}
