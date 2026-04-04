import { useDeferredValue, useEffect, useMemo, useState } from "react";
import useDisclosure from "./useDisclosure";
import useUnauthorizedRedirect from "./useUnauthorizedRedirect";
import { createAppointment } from "../services/appointmentService";
import { createClient, deleteClient, listClients, updateClient } from "../services/clientService";
import { listProfessionals } from "../services/professionalService";
import { listServices } from "../services/serviceService";

const PAGE_SIZE_OPTIONS = [10, 20, 30];
const APPOINTMENT_CATALOG_LIMIT = 100;
const CLIENT_ROW_ACTIONS = ["Visualizar", "Editar", "Excluir"];

function buildEmptyMeta(page, limit) {
  return {
    limit,
    page,
    total: 0,
    totalPages: 0,
  };
}

export default function useClientesPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [appointmentClient, setAppointmentClient] = useState(null);
  const [appointmentCatalog, setAppointmentCatalog] = useState({
    loaded: false,
    professionals: [],
    services: [],
  });
  const [appointmentCatalogLoading, setAppointmentCatalogLoading] = useState(false);
  const [pendingAppointmentClientId, setPendingAppointmentClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [meta, setMeta] = useState(() => buildEmptyMeta(1, 10));
  const newClientModal = useDisclosure();
  const deferredSearch = useDeferredValue(search);
  const redirectToLogin = useUnauthorizedRedirect();

  useEffect(() => {
    let active = true;

    async function loadClientsData() {
      try {
        setLoading(true);
        setError("");

        const response = await listClients({
          page,
          limit: pageSize,
          search: deferredSearch,
        });

        if (!active) {
          return;
        }

        setClients(response.items);
        setMeta(response.meta);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setClients([]);
        setMeta(buildEmptyMeta(page, pageSize));
        setError(requestError.message || "Falha ao carregar clientes.");

        if (requestError.status === 401) {
          redirectToLogin();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadClientsData();

    return () => {
      active = false;
    };
  }, [deferredSearch, page, pageSize, redirectToLogin, reloadKey]);

  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);
  const visibleClients = useMemo(() => {
    if (status === "todos") {
      return clients;
    }

    return clients.filter((client) => client.status === status);
  }, [clients, status]);
  const isEmptyDatabase = meta.total === 0;
  const footerLabel = meta.total === 1 ? "1 cliente cadastrado" : `${meta.total} clientes cadastrados`;
  

  async function ensureAppointmentCatalog() {
    if (appointmentCatalog.loaded) {
      return true;
    }

    try {
      setAppointmentCatalogLoading(true);

      const [servicesResponse, professionalsResponse] = await Promise.all([
        listServices({
          active: true,
          page: 1,
          limit: APPOINTMENT_CATALOG_LIMIT,
        }),
        listProfessionals({
          page: 1,
          limit: APPOINTMENT_CATALOG_LIMIT,
          status: "ativo",
        }),
      ]);

      const services = servicesResponse.items
        .filter((service) => service.active)
        .map((service) => ({
          id: service.id,
          name: service.name,
        }));

      if (services.length === 0) {
        alert("Cadastre ao menos um serviço ativo antes de agendar.");
        return false;
      }

      const professionals = professionalsResponse.items
        .filter((professional) => professional.status === "ativo")
        .map((professional) => ({
          id: professional.id,
          name: professional.name,
        }));

      setAppointmentCatalog({
        loaded: true,
        professionals,
        services,
      });

      return true;
    } catch (requestError) {
      if (requestError.status === 401) {
        redirectToLogin();
      }

      alert(requestError.message || "Não foi possível carregar o catálogo de agendamento.");
      return false;
    } finally {
      setAppointmentCatalogLoading(false);
    }
  }

  async function openAppointmentFlow(client) {
    setPendingAppointmentClientId(client.id);

    const catalogReady = await ensureAppointmentCatalog();

    if (!catalogReady) {
      setPendingAppointmentClientId("");
      return;
    }

    setSelectedClient(null);
    setAppointmentClient(client);
    setPendingAppointmentClientId("");
  }

  async function handleCreateClient(clientData) {
    try {
      await createClient(clientData);
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível salvar o cliente.");
      return false;
    }

    return true;
  }

  async function handleUpdateClient(clientData) {
    if (!editingClient) {
      return false;
    }

    try {
      await updateClient(editingClient.id, clientData);
      setEditingClient(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível atualizar o cliente.");
      return false;
    }

    return true;
  }

  async function handleCreateAppointment(appointmentData) {
    try {
      await createAppointment(appointmentData);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível criar o agendamento.");
      return false;
    }

    return true;
  }

  async function handleDeleteClient(id) {
    const confirmed = window.confirm("Deseja excluir este cliente?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteClient(id);

      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }

      if (editingClient?.id === id) {
        setEditingClient(null);
      }

      if (appointmentClient?.id === id) {
        setAppointmentClient(null);
      }

      if (clients.length === 1 && currentPage > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível excluir o cliente.");
    }
  }

  function handleOpenClient(client) {
    setSelectedClient(client);
  }

  function handleStartEdit(client) {
    setSelectedClient(null);
    setEditingClient(client);
  }

  function handleClientAction(client, action) {
    if (action === "Visualizar") {
      handleOpenClient(client);
      return;
    }

    if (action === "Editar") {
      handleStartEdit(client);
      return;
    }

    if (action === "Excluir") {
      handleDeleteClient(client.id);
    }
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
    appointmentCatalog,
    appointmentCatalogLoading,
    appointmentClient,
    closeAppointmentClient: () => setAppointmentClient(null),
    closeEditingClient: () => setEditingClient(null),
    closeSelectedClient: () => setSelectedClient(null),
    currentPage,
    editingClient,
    error,
    footerLabel,
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
    openClientPreview: handleOpenClient,
    openAppointmentFlow,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    pendingAppointmentClientId,
    rowActions: CLIENT_ROW_ACTIONS,
    search,
    selectedClient,
    status,
    totalPages,
    visibleClients,
    goToNextPage,
    goToPrevPage,
  };
}
