import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ServicosPagination({
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
    <footer className="services-footer">
      {footerLabel ? <p className="services-footer-copy">{footerLabel}</p> : <span />}

      <div className="services-footer-controls">
        <div className="services-pagination">
          <button
            type="button"
            className="services-page-button muted"
            onClick={onPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Anterior
          </button>

          <span className="services-page-index">{currentPage}</span>

          <button
            type="button"
            className="services-page-button"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="services-page-size">
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
