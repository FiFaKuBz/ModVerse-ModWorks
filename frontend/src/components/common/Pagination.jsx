export default function Pagination({ totalPages, currentPage, onChange }) {
  if (totalPages <= 1) return null;

  // show up to 10 pages like Google, centered around the current page
  const windowSize = 10;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + windowSize - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center gap-4 select-none">
      {/* Prev */}
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        className="text-sm underline underline-offset-4 disabled:opacity-40"
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-2">
        {pages.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`text-sm w-7 h-7 rounded-full grid place-items-center
              ${n === currentPage ? "bg-black text-white" : "hover:underline"}
            `}
            aria-current={n === currentPage ? "page" : undefined}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Next */}
      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        className="text-sm underline underline-offset-4 disabled:opacity-40"
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}
