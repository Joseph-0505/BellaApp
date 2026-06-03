import "../styles/SearchStatusFilters.css";

export default function SearchStatusFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  statusValue,
  onStatusChange,
  statusOptions = [],
  statusDisabled = false,
  extraValue,
  onExtraChange,
  extraOptions = [],
  extraDisabled = false,
  extraPlaceholder = "Selecionar",
}) {
  return (
    <div className="filters-bar">
      <input
        className="filters-input"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
      />

      <select
        className="filters-select"
        value={statusValue}
        onChange={(event) => onStatusChange(event.target.value)}
        disabled={statusDisabled}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {extraOptions.length > 0 ? (
        <select
          className="filters-select"
          value={extraValue}
          onChange={(event) => onExtraChange?.(event.target.value)}
          disabled={extraDisabled}
        >
          {!extraOptions.some((option) => option.value === extraValue) ? (
            <option value="">{extraPlaceholder}</option>
          ) : null}

          {extraOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
