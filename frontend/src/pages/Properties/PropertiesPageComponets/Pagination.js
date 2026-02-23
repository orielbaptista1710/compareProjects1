import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

const Pagination = ({ page, totalPages, onPageChange, isFetching }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Always show first
    pages.push(1);

    if (page > 3) pages.push("...");

    // Window around current page
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("...");

    // Always show last
    pages.push(totalPages);

    return pages;
  };

  return (
    <nav className="pagination" aria-label="Property results pages">
      <button
        className="pagination-btn pagination-prev"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1 || isFetching}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
        <span>Prev</span>
      </button>

      <div className="pagination-pages">
        {getPageNumbers().map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`pagination-page ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
              disabled={isFetching}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        className="pagination-btn pagination-next"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages || isFetching}
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default Pagination;