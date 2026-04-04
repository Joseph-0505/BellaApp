import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ServicosPagination({
  currentPage,
  onNextPage,
  onPageSizeChange,
  onPrevPage,
  pageSize,
  pageSizeOptions = [],
  totalPages,
}) {
  return (
    <footer className="services-footer">
      <div className="services-pagination">
        <button
          type="button"
          className="services-page-button muted"
          onClick={onPrevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
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
          <ChevronRight size={18} />
        </button>
      </div>

      <label className="services-page-size">
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / página
            </option>
          ))}
        </select>
      </label>
    </footer>
  );
}
