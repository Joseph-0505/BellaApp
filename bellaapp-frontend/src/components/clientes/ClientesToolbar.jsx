import "../../styles/clientes/clientes-toolbar.css";
import SearchStatusFilters from "../SearchStatusFilters";
import { CLIENT_STATUS_OPTIONS } from "../../utils/StatusUtils";

export default function ClientesToolbar({
  loading = false,
  onSearchChange,
  onStatusChange,
  search,
  status,
  
}) {
  return (
    <div className="clientes-toolbar">
      <div className="clientes-toolbar-filters">
        <SearchStatusFilters
          searchValue={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Buscar por nome, telefone ou e-mail"
          statusValue={status}
          onStatusChange={onStatusChange}
          statusOptions={CLIENT_STATUS_OPTIONS}
          statusDisabled={loading}
        />
      </div>
    </div>
  );
}
