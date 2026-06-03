import { useDeferredValue, useEffect, useState } from "react";
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

function getDurationRange(duration) {
  if (duration === "ate-30") {
    return { maxDurationMinutes: 30 };
  }

  if (duration === "30-60") {
    return {
      minDurationMinutes: 31,
      maxDurationMinutes: 60,
    };
  }

  if (duration === "60+") {
    return { minDurationMinutes: 61 };
  }

  return {};
}

function getPriceRange(priceRange) {
  if (priceRange === "ate-100") {
    return { maxPrice: 100 };
  }

  if (priceRange === "100-200") {
    return {
      minPrice: 100.01,
      maxPrice: 200,
    };
  }

  if (priceRange === "200+") {
    return { minPrice: 200.01 };
  }

  return {};
}

export default function useServicosPage() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [duration, setDuration] = useState("todos");
  const [priceRange, setPriceRange] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingService, setEditingService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
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
          ...getDurationRange(duration),
          ...getPriceRange(priceRange),
        });

        if (!active) {
          return;
        }

        setServices(response.items);
        setMeta(response.meta);
        setEditingService((current) => {
          if (!current) {
            return current;
          }

          return response.items.find((service) => service.id === current.id) || current;
        });
        setSelectedService((current) => {
          if (!current) {
            return current;
          }

          return response.items.find((service) => service.id === current.id) || current;
        });
      } catch (requestError) {
        if (!active) {
          return;
        }

        setServices([]);
        setMeta(buildEmptyMeta(page, pageSize));
        setError(requestError.message || "Falha ao carregar serviços.");

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
  }, [deferredSearch, duration, page, pageSize, priceRange, redirectToLogin, reloadKey, status]);

  const visibleServices = services;
  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);
  const footerLabel = meta.total === 1 ? "1 serviço cadastrado" : `${meta.total} serviços cadastrados`;

  async function handleCreateService(serviceData) {
    try {
      await createService(serviceData);
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível salvar o serviço.");
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
      alert(requestError.message || "Não foi possível atualizar o serviço.");
      return false;
    }

    return true;
  }

  async function handleToggleServiceStatus(service, nextActive = !service.active) {
    const nextStatus = nextActive ? "ativo" : "inativo";

    try {
      await updateService(service.id, {
        ...service,
        active: nextActive,
        status: nextStatus,
      });

      setSelectedService((current) => {
        if (!current || current.id !== service.id) {
          return current;
        }

        return {
          ...current,
          active: nextActive,
          status: nextStatus,
        };
      });

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível atualizar o status do serviço.");
    }
  }

  async function handleDeleteService(service) {
    const confirmed = window.confirm(`Deseja excluir o serviço ${service.name}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteService(service.id);

      if (selectedService?.id === service.id) {
        setSelectedService(null);
      }

      if (editingService?.id === service.id) {
        setEditingService(null);
      }

      if (services.length === 1 && currentPage > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Não foi possível excluir o serviço.");
    }
  }

  function openServicePreview(service) {
    setSelectedService(service);
  }

  function handleStartEdit(service) {
    setSelectedService(null);
    setEditingService(service);
  }

  async function handleServiceAction(service, action) {
    if (action === "Visualizar") {
      openServicePreview(service);
      return;
    }

    if (action === "Editar") {
      handleStartEdit(service);
      return;
    }

    if (action === "Ativar") {
      await handleToggleServiceStatus(service, true);
      return;
    }

    if (action === "Inativar") {
      await handleToggleServiceStatus(service, false);
      return;
    }

    if (action === "Excluir") {
      await handleDeleteService(service);
    }
  }

  function getServiceRowActions(service) {
    return ["Visualizar", "Editar", service.status === "inativo" ? "Ativar" : "Inativar", "Excluir"];
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handleDurationChange(value) {
    setDuration(value);
    setPage(1);
  }

  function handlePriceRangeChange(value) {
    setPriceRange(value);
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
    closeEditingService: () => setEditingService(null),
    closeSelectedService: () => setSelectedService(null),
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
    openServicePreview,
    pageSize,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    priceRange,
    rowActions: getServiceRowActions,
    search,
    selectedService,
    status,
    totalPages,
    visibleServices,
  };
}
