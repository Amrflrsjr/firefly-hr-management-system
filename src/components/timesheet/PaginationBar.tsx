import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

function getPages(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  const pages: (number | "gap")[] = [1];
  if (start > 2) pages.push("gap");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("gap");
  pages.push(total);
  return pages;
}

const btn =
  "grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary) disabled:cursor-not-allowed disabled:opacity-40";

export default function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5"
    >
      <span className="text-xs text-slate-500">
        Page {page} of {totalPages}
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className={`${btn} border-slate-300 bg-white text-slate-600 hover:bg-slate-50`}
        >
          <ChevronLeft size={15} />
        </button>

        <div className="hidden items-center gap-1.5 sm:flex">
          {getPages(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`${btn} ${
                  p === page
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-transparent text-slate-600 hover:bg-white hover:border-slate-200"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
          className={`${btn} border-slate-300 bg-white text-slate-600 hover:bg-slate-50`}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </nav>
  );
}
