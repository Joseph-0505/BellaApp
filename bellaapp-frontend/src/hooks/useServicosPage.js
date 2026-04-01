import { useDeferredValue, useEffect, useMemo, useState } from "react";
import useDisclosure from "./useDisclosure";
import useUnauthorizedRedirect from "./useUnauthorizedRedirect";
import { createService, deleteService, listServices, updateService } from "../services/serviceService";

const PAGE_SIZE_OPTIONS = [5, 10, 15];

function buildEmptyMeta(page, limit) {
  return {
    limit,
    page,
    total: 0,
    totalPages: 0,
  };
}

export default function useServicosPage() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [risk, setRisk] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [meta, setMeta] = useState(() => buildEmptyMeta(1, 10));
  const newServiceModal = useDisclosure();
  const deferredSearch = useDeferredValue(search);
  const redirectToLogin = useUnauthorizedRedirect();

  useEffect(() => {
    let active = true;

    async function loadServicesData() {
      try {
        setLoading(true);
        setError("");

        const response = await listServices({
          page,
          limit: pageSize,
          search: deferredSearch,
          active: status === "todos" ? undefined : status === "ativo",
          risk: risk === "todos" ? undefined : risk,
        });

        if (!active) {
          return;
        }

        setServices(response.items);
        setMeta(response.meta);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setServices([]);
        setMeta(buildEmptyMeta(page, pageSize));
        setError(requestError.message || "Falha ao carregar servicos.");

        if (requestError.status === 401) {
          redirectToLogin();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadServicesData();

    return () => {
      active = false;
    };
  }, [deferredSearch, page, pageSize, redirectToLogin, reloadKey, risk, status]);

  const visibleServices = useMemo(() => services, [services]);
  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);

  const averageTicket = useMemo(() => {
    if (!visibleServices.length) {
      return 0;
    }

    return visibleServices.reduce((total, service) => total + service.price, 0) / visibleServices.length;
  }, [visibleServices]);

  const averageDuration = useMemo(() => {
    if (!visibleServices.length) {
      return 0;
    }

    return Math.round(
      visibleServices.reduce((total, service) => total + service.durationMinutes, 0) / visibleServices.length
    );
  }, [visibleServices]);

  const topService = useMemo(() => {
    return visibleServices.reduce((currentTop, service) => {
      if (!currentTop || service.soldCount > currentTop.soldCount) {
        return service;
      }

      return currentTop;
    }, null);
  }, [visibleServices]);

  const riskCounters = useMemo(() => {
    return visibleServices.reduce(
      (accumulator, service) => {
        accumulator[service.risk] = (accumulator[service.risk] || 0) + 1;
        return accumulator;
      },
      { baixo: 0, medio: 0, alto: 0 }
    );
  }, [visibleServices]);

  async function handleCreateService(serviceData) {
    try {
      await createService(serviceData);
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel salvar o servico.");
      return false;
    }

    return true;
  }

  async function handleUpdateService(serviceData) {
    if (!editingService) {
      return false;
    }

    try {
      await updateService(editingService.id, serviceData);
      setEditingService(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel atualizar o servico.");
      return false;
    }

    return true;
  }

  async function handleToggleServiceStatus(service, nextActive) {
    try {
      await updateService(service.id, {
        ...service,
        active: nextActive,
      });
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel atualizar o status do servico.");
    }
  }

  async function handleDeleteService(service) {
    const confirmed = window.confirm(`Deseja excluir o servico ${service.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteService(service.id);

      if (services.length === 1 && currentPage > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel excluir o servico.");
    }
  }

  async function handleServiceAction(service, action) {
    if (action === "Editar") {
      setEditingService(service);
      return;
    }

    if (action === "Ativar") {
      await handleToggleServiceStatus(service, true);
      return;
    }

    if (action === "Excluir") {
      await handleDeleteService(service);
    }
  }

  function getServiceRowActions(service) {
    return ["Editar", ...(service.status === "inativo" ? ["Ativar"] : []), "Excluir"];
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handleRiskChange(value) {
    setRisk(value);
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
    averageDuration,
    averageTicket,
    closeEditingService: () => setEditingService(null),
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
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    risk,
    riskCounters,
    rowActions: getServiceRowActions,
    search,
    status,
    topService,
    totalPages,
    totalServices: meta.total,
    visibleServices,
  };
}
