import { ChevronLeft, ChevronRight } from "lucide-react";

export default function RoomsPagination({
  currentPage,
  footerLabel = "",
  onNextPage,
  onPageSizeChange,
  onPrevPage,
  pageSize,
  pageSizeOptions = [],
  totalPages,
}) {
  return (
    <footer className="rooms-footer">
      {footerLabel ? <p className="rooms-footer-copy">{footerLabel}</p> : <span />}

      <div className="rooms-footer-controls">
        <div className="rooms-pagination">
          <button
            type="button"
            className="rooms-page-button rooms-page-button-muted"
            onClick={onPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Anterior
          </button>

          <span className="rooms-page-index">{currentPage}</span>

          <button
            type="button"
            className="rooms-page-button"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="rooms-page-size">
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / Página
              </option>
            ))}
          </select>
        </label>
      </div>
    </footer>
  );
}
