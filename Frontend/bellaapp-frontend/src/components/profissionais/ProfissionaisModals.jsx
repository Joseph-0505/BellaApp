import NovoProfissional from "../modals/NovoProfissional";

export default function ProfissionaisModals({
  editingProfessional,
  newProfessionalModal,
  onCloseEditingProfessional,
  onCreateProfessional,
  onUpdateProfessional,
}) {
  return (
    <>
      {newProfessionalModal.isOpen ? (
        <NovoProfissional
          mode="invite"
          title="Adicionar profissional"
          submitLabel="Enviar convite"
          description="Cadastre nome e e-mail para enviar o convite de acesso individual."
          onClose={newProfessionalModal.close}
          onSave={onCreateProfessional}
        />
      ) : null}

      {editingProfessional ? (
        <NovoProfissional
          mode="edit"
          title="Editar profissional"
          submitLabel="Salvar alteracoes"
          initialValues={editingProfessional}
          onClose={onCloseEditingProfessional}
          onSave={onUpdateProfessional}
        />
      ) : null}
    </>
  );
}
