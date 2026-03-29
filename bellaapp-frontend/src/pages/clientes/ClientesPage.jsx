import Header from "../../components/layout/Header";
import ClientesModals from "../../components/clientes/ClientesModals";
import ClientesPagination from "../../components/clientes/ClientesPagination";
import ClientesTable from "../../components/clientes/ClientesTable";
import ClientesToolbar from "../../components/clientes/ClientesToolbar";
import useClientesPage from "../../hooks/useClientesPage";
import "../../styles/clientes/clientes-page.css";
import "../../styles/botoes/novo-cliente.css";

export default function ClientesPage() {
  const {
    appointmentCatalog,
    appointmentCatalogLoading,
    appointmentClient,
    closeAppointmentClient,
    closeEditingClient,
    closeSelectedClient,
    currentPage,
    editingClient,
    error,
    footerLabel,
    goToNextPage,
    goToPrevPage,
    handleClientAction,
    handleCreateAppointment,
    handleCreateClient,
    handlePageSizeChange,
    handleSearchChange,
    handleStartEdit,
    handleStatusChange,
    handleUpdateClient,
    isEmptyDatabase,
    loading,
    newClientModal,
    openClientPreview,
    openAppointmentFlow,
    pageSize,
    pageSizeOptions,
    pendingAppointmentClientId,
    rowActions,
    search,
    selectedClient,
    status,
    totalPages,
    visibleClients,
  } = useClientesPage();

  return (
    <section className="clientes-page">
      <Header
        title="Clientes"
        subtitle="Centralize contatos, histórico e próximos passos dos seus clientes em um único painel."
        actions={
          <button type="button" className="btn-soft" onClick={newClientModal.open}>
            + Novo Cliente
          </button>
        }
      />

      <section className="clientes-board">
        <ClientesToolbar
          currentPage={currentPage}
          loading={loading}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          search={search}
          status={status}
         
        />

        {error ? <p className="clientes-feedback clientes-feedback-error">{error}</p> : null}
        {loading ? <p className="clientes-feedback">Carregando clientes...</p> : null}

        {!loading && !error ? (
          <>
            <ClientesTable
              actions={rowActions}
              appointmentCatalogLoading={appointmentCatalogLoading}
              clients={visibleClients}
              isEmptyDatabase={isEmptyDatabase}
              onAction={handleClientAction}
              onCreateClient={newClientModal.open}
              onOpenClient={openClientPreview}
              onScheduleClient={openAppointmentFlow}
              pendingAppointmentClientId={pendingAppointmentClientId}
            />

            <ClientesPagination
              currentPage={currentPage}
              footerLabel={footerLabel}
              onNextPage={goToNextPage}
              onPageSizeChange={handlePageSizeChange}
              onPrevPage={goToPrevPage}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              totalPages={totalPages}
            />
          </>
        ) : null}
      </section>

      <ClientesModals
        appointmentCatalog={appointmentCatalog}
        appointmentCatalogLoading={appointmentCatalogLoading}
        appointmentClient={appointmentClient}
        createClientModal={newClientModal}
        editingClient={editingClient}
        onCloseAppointmentClient={closeAppointmentClient}
        onCloseEditingClient={closeEditingClient}
        onCloseSelectedClient={closeSelectedClient}
        onCreateAppointment={handleCreateAppointment}
        onCreateClient={handleCreateClient}
        onEditClient={handleStartEdit}
        onOpenAppointmentFlow={openAppointmentFlow}
        onUpdateClient={handleUpdateClient}
        pendingAppointmentClientId={pendingAppointmentClientId}
        selectedClient={selectedClient}
      />
    </section>
  );
}
