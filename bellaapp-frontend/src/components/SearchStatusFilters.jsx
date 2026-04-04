import "../styles/SearchStatusFilters.css";

export default function SearchStatusFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  statusValue,
  onStatusChange,
  statusOptions = [],
  statusDisabled = false,
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
    </div>
  );
}
