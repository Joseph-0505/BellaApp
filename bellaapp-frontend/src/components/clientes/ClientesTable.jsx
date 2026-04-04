import "../../styles/clientes/clientes-table.css";
import ClienteRow from "./ClienteRow";
import ClientesEmptyState from "./ClientesEmptyState";

const CLIENT_TABLE_COLUMNS = [
  "Cliente",
  "Telefone",
  "Último atendimento",
  "Próximo agendamento",
  "Total gasto",
  "Status",
  "Ações",
];

export default function ClientesTable({
  actions,
  appointmentCatalogLoading = false,
  clients = [],
  isEmptyDatabase = false,
  onAction,
  onCreateClient,
  onOpenClient,
  onScheduleClient,
  pendingAppointmentClientId = "",
}) {
  return (
    <>
      <div className="clientes-table-head">
        {CLIENT_TABLE_COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      <div className="clientes-table-body">
        {clients.length > 0 ? (
          clients.map((client) => (
            <ClienteRow
              key={client.id}
              actions={actions}
              appointmentLoading={appointmentCatalogLoading && pendingAppointmentClientId === client.id}
              client={client}
              onAction={onAction}
              onOpen={onOpenClient}
              onSchedule={onScheduleClient}
            />
          ))
        ) : (
          <ClientesEmptyState isEmptyDatabase={isEmptyDatabase} onCreateClient={onCreateClient} />
        )}
      </div>
    </>
  );
}
