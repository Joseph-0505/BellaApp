import { Search, SlidersHorizontal } from "lucide-react";
import { CLIENT_STATUS_OPTIONS } from "../../utils/StatusUtils";

export default function ProfissionaisToolbar({
  loading = false,
  onSearchChange,
  onStatusChange,
  search,
  status,
}) {
  return (
    <div className="profissionais-toolbar">
      <label className="profissionais-toolbar-search">
        <Search size={18} aria-hidden="true" />
        <input
          className="profissionais-toolbar-input"
          type="text"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Buscar por nome, especialidade, e-mail ou telefone"
        />
      </label>

      <div className="profissionais-toolbar-filter">
        <SlidersHorizontal size={18} aria-hidden="true" />

        <label className="profissionais-toolbar-select">
          <select
            className="profissionais-toolbar-control"
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
      </div>
    </div>
  );
}
