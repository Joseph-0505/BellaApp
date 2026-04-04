import { Search } from "lucide-react";
import { CLIENT_STATUS_OPTIONS, SERVICE_RISK_OPTIONS } from "../../utils/StatusUtils";

export default function ServicosToolbar({
  loading = false,
  onSearchChange,
  onRiskChange,
  onStatusChange,
  risk = "todos",
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

      <label className="services-select">
        <select
          value={status}
          onChange={(event) => onStatusChange?.(event.target.value)}
          disabled={loading}
        >
          {CLIENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="services-select">
        <select value={risk} onChange={(event) => onRiskChange?.(event.target.value)} disabled={loading}>
          {SERVICE_RISK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
