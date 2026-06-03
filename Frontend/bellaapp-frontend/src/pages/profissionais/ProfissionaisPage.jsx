import Header from "../../components/layout/Header";
import ProfissionaisModals from "../../components/profissionais/ProfissionaisModals";
import ProfissionaisPagination from "../../components/profissionais/ProfissionaisPagination";
import ProfissionaisTable from "../../components/profissionais/ProfissionaisTable";
import ProfissionaisToolbar from "../../components/profissionais/ProfissionaisToolbar";
import useAuth from "../../hooks/useAuth";
import useProfissionaisPage from "../../hooks/useProfissionaisPage";
import "../../styles/botoes/novo-agendamento.css";
import "../../styles/botoes/novo-cliente.css";
import "../../styles/profissionais/profissionais.css";

export default function ProfissionaisPage() {
  const { user } = useAuth();
  const {
    closeEditingProfessional,
    currentPage,
    editingProfessional,
    error,
    footerLabel,
    goToNextPage,
    goToPrevPage,
    handleCreateProfessional,
    handlePageSizeChange,
    handleProfessionalAction,
    handleSearchChange,
    handleStatusChange,
    handleUpdateProfessional,
    isEmptyDatabase,
    loading,
    newProfessionalModal,
    pageSize,
    pageSizeOptions,
    professionals,
    rowActions,
    search,
    status,
    totalProfessionals,
    totalPages,
  } = useProfissionaisPage();

  const canManageProfessionals = Boolean(user?.permissions?.manageProfessionals);
  const isIndividualPlan = user?.clinic?.plan === "INDIVIDUAL";
  const planLimitReached = isIndividualPlan && totalProfessionals >= 1;
  const disableCreateProfessional = !canManageProfessionals || planLimitReached;
  const createProfessionalLabel = planLimitReached ? "Plano Individual: 1 profissional" : "Adicionar profissional";
  const planHint = planLimitReached
    ? "Seu plano atual permite apenas 1 profissional. Faca upgrade para o plano Team para liberar equipe e agenda multi-profissional."
    : !canManageProfessionals
      ? "Apenas administradores da clinica podem gerenciar profissionais."
      : "";

  return (
    <section className="profissionais-page">
      <Header
        title="Profissionais"
        subtitle="Gerencie o time da clinica, acompanhe convites e mantenha cada profissional com acesso proprio."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={newProfessionalModal.open}
            disabled={disableCreateProfessional}
            title={planHint || undefined}
          >
            {createProfessionalLabel}
          </button>
        }
      />

      <section className="profissionais-board">
        {planHint ? <p className="profissionais-feedback profissionais-feedback-warning">{planHint}</p> : null}

        <ProfissionaisToolbar
          loading={loading}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          search={search}
          status={status}
        />

        {error ? <p className="profissionais-feedback profissionais-feedback-error">{error}</p> : null}
        {loading ? <p className="profissionais-feedback">Carregando profissionais...</p> : null}

        {!loading && !error ? (
          <>
            <ProfissionaisTable
              actions={canManageProfessionals ? rowActions : []}
              createDisabled={disableCreateProfessional}
              createLabel={planLimitReached ? "Fazer upgrade para cadastrar outro profissional" : undefined}
              isEmptyDatabase={isEmptyDatabase}
              onAction={canManageProfessionals ? handleProfessionalAction : undefined}
              onCreateProfessional={disableCreateProfessional ? undefined : newProfessionalModal.open}
              professionals={professionals}
            />

            <ProfissionaisPagination
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

      <ProfissionaisModals
        editingProfessional={editingProfessional}
        newProfessionalModal={newProfessionalModal}
        onCloseEditingProfessional={closeEditingProfessional}
        onCreateProfessional={handleCreateProfessional}
        onUpdateProfessional={handleUpdateProfessional}
      />
    </section>
  );
}
