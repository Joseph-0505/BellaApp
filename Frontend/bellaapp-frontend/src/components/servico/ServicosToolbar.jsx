import { Search } from "lucide-react";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

const DURATION_OPTIONS = [
  { value: "todos", label: "Todas durações" },
  { value: "ate-30", label: "Até 30min" },
  { value: "30-60", label: "30-60min" },
  { value: "60+", label: "60min+" },
];

const PRICE_RANGE_OPTIONS = [
  { value: "todos", label: "Todos os preços" },
  { value: "ate-100", label: "Até R$100" },
  { value: "100-200", label: "R$100-R$200" },
  { value: "200+", label: "R$200+" },
];

export default function ServicosToolbar({
  duration = "todos",
  loading = false,
  onDurationChange,
  onPriceRangeChange,
  onSearchChange,
  onStatusChange,
  priceRange = "todos",
  search,
  status,
}) {
  return (
    <div className="services-toolbar">
      <label className="services-search">
        <Search size={18} />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Buscar serviço..."
        />
      </label>

      <div className="services-filter-group">
        <span className="services-filter-label">Status</span>

        <div className="services-chip-group" role="group" aria-label="Filtrar por status">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`services-chip${status === option.value ? " is-active" : ""}`}
              onClick={() => onStatusChange?.(option.value)}
              disabled={loading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="services-select">
        <select
          value={duration}
          onChange={(event) => onDurationChange?.(event.target.value)}
          disabled={loading}
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="services-select">
        <select
          value={priceRange}
          onChange={(event) => onPriceRangeChange?.(event.target.value)}
          disabled={loading}
        >
          {PRICE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
