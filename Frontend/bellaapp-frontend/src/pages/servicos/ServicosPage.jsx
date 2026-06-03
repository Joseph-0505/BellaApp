import Header from "../../components/layout/Header";
import ServicosModals from "../../components/servico/ServicosModals";
import ServicosPagination from "../../components/servico/ServicosPagination";
import ServicosTable from "../../components/servico/ServicosTable";
import ServicosToolbar from "../../components/servico/ServicosToolbar";
import useServicosPage from "../../hooks/useServicosPage";
import "../../styles/servicos/servicos.css";

export default function ServicosPage() {
  const {
    closeEditingService,
    closeSelectedService,
    currentPage,
    duration,
    editingService,
    error,
    footerLabel,
    goToNextPage,
    goToPrevPage,
    handleCreateService,
    handleDurationChange,
    handlePageSizeChange,
    handlePriceRangeChange,
    handleSearchChange,
    handleServiceAction,
    handleStartEdit,
    handleStatusChange,
    handleToggleServiceStatus,
    handleUpdateService,
    loading,
    newServiceModal,
    pageSize,
    pageSizeOptions,
    priceRange,
    rowActions,
    search,
    selectedService,
    status,
    totalPages,
    visibleServices,
  } = useServicosPage();

  return (
    <section className="services-page">
      <Header
        title="Serviços"
        subtitle="Gerencie seus serviços, valores e duração de forma simples e eficiente"
        actions={
          <button type="button" className="btn-primary" onClick={newServiceModal.open}>
            + Novo Serviço
          </button>
        }
      />

      <section className="services-main-panel">
        <ServicosToolbar
          duration={duration}
          loading={loading}
          onDurationChange={handleDurationChange}
          onPriceRangeChange={handlePriceRangeChange}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          priceRange={priceRange}
          search={search}
          status={status}
        />

        {error ? <p className="agenda-feedback agenda-feedback-error">{error}</p> : null}
  {loading ? <p className="agenda-feedback">Carregando serviços...</p> : null}

        {!loading && !error ? (
          <>
            <ServicosTable actions={rowActions} onAction={handleServiceAction} services={visibleServices} />

            <ServicosPagination
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

      <ServicosModals
        editingService={editingService}
        newServiceModal={newServiceModal}
        onCloseEditingService={closeEditingService}
        onCloseSelectedService={closeSelectedService}
        onCreateService={handleCreateService}
        onEditService={handleStartEdit}
        onToggleServiceStatus={handleToggleServiceStatus}
        onUpdateService={handleUpdateService}
        selectedService={selectedService}
        statusBusy={loading}
      />
    </section>
  );
}
