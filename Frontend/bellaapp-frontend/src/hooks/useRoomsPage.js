import { useDeferredValue, useEffect, useMemo, useState } from "react";
import useDisclosure from "./useDisclosure";
import useUnauthorizedRedirect from "./useUnauthorizedRedirect";
import { createRoom, deleteRoom, getRooms, toggleRoomStatus, updateRoom } from "../services/roomService";
import { showConfirmAlert, showErrorAlert } from "../utils/alerts";

const PAGE_SIZE_OPTIONS = [5, 10, 15];

function buildEmptyMeta(page, limit) {
  return {
    limit,
    page,
    total: 0,
    totalPages: 0,
  };
}

export default function useRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [meta, setMeta] = useState(() => buildEmptyMeta(1, PAGE_SIZE_OPTIONS[1]));
  const newRoomModal = useDisclosure();
  const deferredSearch = useDeferredValue(search);
  const redirectToLogin = useUnauthorizedRedirect();

  useEffect(() => {
    let active = true;

    async function loadRoomsData() {
      try {
        setLoading(true);
        setError("");

        const response = await getRooms({
          page,
          limit: pageSize,
          search: deferredSearch,
          active: status === "todos" ? undefined : status === "ativo",
        });

        if (!active) {
          return;
        }

        setRooms(response.items);
        setMeta(response.meta);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setRooms([]);
        setMeta(buildEmptyMeta(page, pageSize));
        setError(requestError.message || "Falha ao carregar salas.");

        if (requestError.status === 401) {
          redirectToLogin();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRoomsData();

    return () => {
      active = false;
    };
  }, [deferredSearch, page, pageSize, redirectToLogin, reloadKey, status]);

  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);
  const footerLabel = meta.total === 1 ? "1 sala cadastrada" : `${meta.total} salas cadastradas`;
  const isEmptyDatabase = meta.total === 0;
  const visibleRooms = useMemo(() => rooms, [rooms]);

  async function handleCreateRoom(roomData) {
    try {
      await createRoom(roomData);
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível salvar a sala.");
      return false;
    }

    return true;
  }

  async function handleUpdateRoom(roomData) {
    if (!editingRoom) {
      return false;
    }

    try {
      await updateRoom(editingRoom.id, roomData);
      setEditingRoom(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível atualizar a sala.");
      return false;
    }

    return true;
  }

  async function handleDeleteRoom(room) {
    const confirmed = await showConfirmAlert({
      title: "Excluir sala?",
      text: `Deseja excluir a sala ${room.name}?`,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteRoom(room.id);

      if (editingRoom?.id === room.id) {
        setEditingRoom(null);
      }

      if (visibleRooms.length === 1 && currentPage > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível excluir a sala.");
    }
  }

  async function handleToggleRoom(room) {
    try {
      await toggleRoomStatus(room.id, room);

      if (editingRoom?.id === room.id) {
        setEditingRoom((current) =>
          current
            ? {
                ...current,
                active: !room.active,
                status: room.active ? "inativo" : "ativo",
              }
            : null
        );
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível atualizar o status da sala.");
    }
  }

  function handleRoomAction(room, action) {
    if (action === "Editar") {
      setEditingRoom(room);
      return;
    }

    if (action === "Ativar" || action === "Inativar") {
      handleToggleRoom(room);
      return;
    }

    if (action === "Excluir") {
      handleDeleteRoom(room);
    }
  }

  function getRoomRowActions(room) {
    return ["Editar", room.active ? "Inativar" : "Ativar", "Excluir"];
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handlePageSizeChange(size) {
    setPageSize(size);
    setPage(1);
  }

  function goToPrevPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goToNextPage() {
    setPage((current) => Math.min(totalPages, current + 1));
  }

  return {
    closeEditingRoom: () => setEditingRoom(null),
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
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    rooms: visibleRooms,
    rowActions: getRoomRowActions,
    search,
    status,
    totalPages,
  };
}
