import ClientePreviewModal from "../modals/ClientePreviewModal";
import NovoAgendamento from "../modals/NovoAgendamento";
import NovoCliente from "../modals/NovoCliente";

export default function ClientesModals({
  appointmentCatalog,
  appointmentCatalogLoading = false,
  appointmentClient,
  createClientModal,
  editingClient,
  onCloseAppointmentClient,
  onCloseEditingClient,
  onCloseSelectedClient,
  onCreateAppointment,
  onCreateClient,
  onEditClient,
  onOpenAppointmentFlow,
  onUpdateClient,
  pendingAppointmentClientId = "",
  selectedClient,
}) {
  return (
    <>
      {createClientModal.isOpen ? (
        <NovoCliente
          description="Cadastre nome, telefone, e-mail, CPF e observações básicas do cliente."
          onClose={createClientModal.close}
          onSave={onCreateClient}
        />
      ) : null}

      {editingClient ? (
        <NovoCliente
          title="Editar Cliente"
          submitLabel="Salvar alterações"
          initialValues={editingClient}
          onClose={onCloseEditingClient}
          onSave={onUpdateClient}
        />
      ) : null}

      {selectedClient ? (
        <ClientePreviewModal
          client={selectedClient}
          onClose={onCloseSelectedClient}
          onEdit={onEditClient}
          onSchedule={onOpenAppointmentFlow}
          scheduling={appointmentCatalogLoading && pendingAppointmentClientId === selectedClient.id}
        />
      ) : null}

      {appointmentClient ? (
        <NovoAgendamento
          clients={[
            {
              id: appointmentClient.id,
              name: appointmentClient.name,
            },
          ]}
          initialValues={{
            clientId: appointmentClient.id,
            observacoes: appointmentClient.notes,
          }}
          onClose={onCloseAppointmentClient}
          onSave={onCreateAppointment}
          professionals={appointmentCatalog.professionals}
          services={appointmentCatalog.services}
          description={`Agende o próximo passo de ${appointmentClient.name} sem sair da tela de clientes.`}
        />
      ) : null}
    </>
  );
}
