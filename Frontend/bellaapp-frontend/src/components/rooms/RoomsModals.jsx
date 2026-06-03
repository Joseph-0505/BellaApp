import RoomFormModal from "../modals/RoomFormModal";

export default function RoomsModals({
  editingRoom,
  newRoomModal,
  onCloseEditingRoom,
  onCreateRoom,
  onUpdateRoom,
}) {
  return (
    <>
      {newRoomModal.isOpen ? (
        <RoomFormModal onClose={newRoomModal.close} onSave={onCreateRoom} />
      ) : null}

      {editingRoom ? (
        <RoomFormModal
          title="Editar Sala"
          submitLabel="Salvar alterações"
          initialValues={editingRoom}
          onClose={onCloseEditingRoom}
          onSave={onUpdateRoom}
        />
      ) : null}
    </>
  );
}
