import Header from "../../components/layout/Header";
import ServicosModals from "../../components/servico/ServicosModals";
import ServicosPagination from "../../components/servico/ServicosPagination";
import ServicosSidebar from "../../components/servico/ServicosSidebar";
import ServicosTable from "../../components/servico/ServicosTable";
import ServicosToolbar from "../../components/servico/ServicosToolbar";
import useServicosPage from "../../hooks/useServicosPage";
import "../../styles/servicos/servicos.css";

export default function ServicosPage() {
  const {
    averageDuration,
    averageTicket,
    closeEditingService,
    currentPage,
    editingService,
    error,
    goToNextPage,
    goToPrevPage,
    handleCreateService,
    handlePageSizeChange,
    handleRiskChange,
    handleSearchChange,
    handleServiceAction,
    handleStatusChange,
    handleUpdateService,
    loading,
    newServiceModal,
    pageSize,
    pageSizeOptions,
    risk,
    riskCounters,
    rowActions,
    search,
    status,
    topService,
    totalPages,
    totalServices,
    visibleServices,
  } = useServicosPage();

  return (
    <section className="services-page">
      <Header
        title="Servicos"
        subtitle="Gerencie seus servicos, valores e duracao de forma simples e eficiente"
        actions={
          <button type="button" className="btn-primary" onClick={newServiceModal.open}>
            + Novo Servico
          </button>
        }
      />

      <div className="services-content-grid">
        <section className="services-main-panel">
          <ServicosToolbar
            loading={loading}
            onRiskChange={handleRiskChange}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            risk={risk}
            search={search}
            status={status}
          />

          {error ? <p className="agenda-feedback agenda-feedback-error">{error}</p> : null}
          {loading ? <p className="agenda-feedback">Carregando servicos...</p> : null}

          {!loading && !error ? (
            <>
              <ServicosTable actions={rowActions} onAction={handleServiceAction} services={visibleServices} />

              <ServicosPagination
                currentPage={currentPage}
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

        <ServicosSidebar
          averageDuration={averageDuration}
          averageTicket={averageTicket}
          riskCounters={riskCounters}
          topService={topService}
          totalServices={totalServices}
          visibleServicesCount={visibleServices.length}
        />
      </div>

      <ServicosModals
        editingService={editingService}
        newServiceModal={newServiceModal}
        onCloseEditingService={closeEditingService}
        onCreateService={handleCreateService}
        onUpdateService={handleUpdateService}
      />
    </section>
  );
}
