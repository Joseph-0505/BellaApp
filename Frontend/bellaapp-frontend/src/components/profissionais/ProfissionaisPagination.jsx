import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProfissionaisPagination({
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
    <footer className="profissionais-footer">
      {footerLabel ? <p className="profissionais-footer-copy">{footerLabel}</p> : <span />}

      <div className="profissionais-footer-controls">
        <div className="profissionais-pagination">
          <button
            type="button"
            className="profissionais-page-button profissionais-page-button-muted"
            onClick={onPrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            Anterior
          </button>

          <span className="profissionais-page-index">{currentPage}</span>

          <button
            type="button"
            className="profissionais-page-button"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
          >
            Próxima
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="profissionais-page-size">
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
