import ServicoRow from "./ServicoRow";
import ServicosEmptyState from "./ServicosEmptyState";

const SERVICE_TABLE_COLUMNS = ["Serviço", "Preço", "Duração", "Status", "Ações"];

export default function ServicosTable({ actions = [], onAction, services = [] }) {
  return (
    <div className="services-table">
      <div className="services-table-head">
        {SERVICE_TABLE_COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      <div className="services-table-body">
        {services.length > 0 ? (
          services.map((service) => (
            <ServicoRow key={service.id} actions={actions} onAction={onAction} service={service} />
          ))
        ) : (
          <ServicosEmptyState />
        )}
      </div>
    </div>
  );
}
