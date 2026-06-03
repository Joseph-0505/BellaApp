import RoomRow from "./RoomRow";
import RoomsEmptyState from "./RoomsEmptyState";

const ROOM_TABLE_COLUMNS = ["Sala", "Status", "Atendimentos/mês", "Ações"];

export default function RoomsTable({
  actions = [],
  isEmptyDatabase = false,
  onAction,
  onCreateRoom,
  rooms = [],
}) {
  return (
    <>
      <div className="rooms-table-head">
        {ROOM_TABLE_COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      <div className="rooms-table-body">
        {rooms.length > 0 ? (
          rooms.map((room) => <RoomRow key={room.id} actions={actions} onAction={onAction} room={room} />)
        ) : (
          <RoomsEmptyState isEmptyDatabase={isEmptyDatabase} onCreateRoom={onCreateRoom} />
        )}
      </div>
    </>
  );
}
