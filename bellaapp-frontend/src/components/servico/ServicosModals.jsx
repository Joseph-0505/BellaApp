import NovoServico from "../modals/NovoServico";

export default function ServicosModals({
  editingService,
  newServiceModal,
  onCloseEditingService,
  onCreateService,
  onUpdateService,
}) {
  return (
    <>
      {newServiceModal.isOpen ? (
        <NovoServico
          onClose={newServiceModal.close}
          onSave={onCreateService}
          showCatalogExtras
          description="Cadastre nome, preço, duração, risco, ícone e status do serviço."
        />
      ) : null}

      {editingService ? (
        <NovoServico
          title="Editar Serviço"
          submitLabel="Salvar alterações"
          initialValues={editingService}
          onClose={onCloseEditingService}
          onSave={onUpdateService}
          showCatalogExtras
        />
      ) : null}
    </>
  );
}
