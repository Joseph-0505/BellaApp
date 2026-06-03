import Header from "../../components/layout/Header";
import RoomsModals from "../../components/rooms/RoomsModals";
import RoomsPagination from "../../components/rooms/RoomsPagination";
import RoomsTable from "../../components/rooms/RoomsTable";
import RoomsToolbar from "../../components/rooms/RoomsToolbar";
import useRoomsPage from "../../hooks/useRoomsPage";
import "../../styles/rooms/rooms.css";

export default function RoomsPage() {
  const {
    closeEditingRoom,
    currentPage,
    editingRoom,
    error,
    footerLabel,
    goToNextPage,
    goToPrevPage,
    handleCreateRoom,
    handlePageSizeChange,
    handleRoomAction,
    handleSearchChange,
    handleStatusChange,
    handleUpdateRoom,
    isEmptyDatabase,
    loading,
    newRoomModal,
    pageSize,
    pageSizeOptions,
    rooms,
    rowActions,
    search,
    status,
    totalPages,
  } = useRoomsPage();

  return (
    <section className="rooms-page">
      <Header
        title="Salas"
        subtitle="Gerencie as salas disponíveis para atendimento"
        actions={
          <button type="button" className="btn-primary" onClick={newRoomModal.open}>
            + Nova Sala
          </button>
        }
      />

      <section className="rooms-board">
        <RoomsToolbar
          loading={loading}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          search={search}
          status={status}
        />

        {error ? <p className="rooms-feedback rooms-feedback-error">{error}</p> : null}
        {loading ? <p className="rooms-feedback">Carregando salas...</p> : null}

        {!loading && !error ? (
          <>
            <RoomsTable
              actions={rowActions}
              isEmptyDatabase={isEmptyDatabase}
              onAction={handleRoomAction}
              onCreateRoom={newRoomModal.open}
              rooms={rooms}
            />

            <RoomsPagination
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

      <RoomsModals
        editingRoom={editingRoom}
        newRoomModal={newRoomModal}
        onCloseEditingRoom={closeEditingRoom}
        onCreateRoom={handleCreateRoom}
        onUpdateRoom={handleUpdateRoom}
      />
    </section>
  );
}
