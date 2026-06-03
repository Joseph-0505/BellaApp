import { Search, SlidersHorizontal } from "lucide-react";
import { CLIENT_STATUS_OPTIONS } from "../../utils/StatusUtils";

export default function RoomsToolbar({
  loading = false,
  onSearchChange,
  onStatusChange,
  search,
  status,
}) {
  return (
    <div className="rooms-toolbar">
      <label className="rooms-toolbar-search">
        <Search size={18} aria-hidden="true" />
        <input
          className="rooms-toolbar-input"
          type="text"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Buscar por nome da sala"
        />
      </label>

      <div className="rooms-toolbar-filter">
        <SlidersHorizontal size={18} aria-hidden="true" />

        <label className="rooms-toolbar-select">
          <select
            className="rooms-toolbar-control"
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
