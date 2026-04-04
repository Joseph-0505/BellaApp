import "../../styles/clientes/clientes-pagination.css";

export default function ClientesPagination({
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
    <footer className="clientes-footer">
      {footerLabel ? <p className="clientes-footer-copy">{footerLabel}</p> : <span />}

      <div className="clientes-footer-controls">
        <div className="clientes-pagination">
          <button
            type="button"
            className="clientes-page-button muted"
            onClick={onPrevPage}
            disabled={currentPage === 1}
          >
            Anterior
          </button>

          <span className="clientes-page-index">{currentPage}</span>

          <button
            type="button"
            className="clientes-page-button"
            onClick={onNextPage}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>

        <label className="clientes-page-size">
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / página
              </option>
            ))}
          </select>
        </label>
      </div>
    </footer>
  );
}
