import { useDeferredValue, useEffect, useMemo, useState } from "react";
import useDisclosure from "./useDisclosure";
import useUnauthorizedRedirect from "./useUnauthorizedRedirect";
import {
  deleteProfessional,
  inviteProfessional,
  listProfessionals,
  resendProfessionalInvite,
  updateProfessional,
} from "../services/professionalService";
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from "../utils/alerts";

const PAGE_SIZE_OPTIONS = [4, 8, 12];
const BASE_PROFESSIONAL_ROW_ACTIONS = ["Editar", "Excluir"];

function buildEmptyMeta(page, limit) {
  return {
    limit,
    page,
    total: 0,
    totalPages: 0,
  };
}

function getRowActions(professional) {
  return professional?.canResendInvite
    ? ["Reenviar convite", ...BASE_PROFESSIONAL_ROW_ACTIONS]
    : BASE_PROFESSIONAL_ROW_ACTIONS;
}

export default function useProfissionaisPage() {
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [meta, setMeta] = useState(() => buildEmptyMeta(1, PAGE_SIZE_OPTIONS[0]));
  const newProfessionalModal = useDisclosure();
  const deferredSearch = useDeferredValue(search);
  const redirectToLogin = useUnauthorizedRedirect();

  useEffect(() => {
    let active = true;

    async function loadProfessionalsData() {
      try {
        setLoading(true);
        setError("");

        const response = await listProfessionals({
          page,
          limit: pageSize,
          search: deferredSearch,
          status: status === "todos" ? undefined : status,
        });

        if (!active) {
          return;
        }

        setProfessionals(response.items);
        setMeta(response.meta);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setProfessionals([]);
        setMeta(buildEmptyMeta(page, pageSize));
        setError(requestError.message || "Falha ao carregar profissionais.");

        if (requestError.status === 401) {
          redirectToLogin();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfessionalsData();

    return () => {
      active = false;
    };
  }, [deferredSearch, page, pageSize, redirectToLogin, reloadKey, status]);

  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);
  const footerLabel = meta.total === 1 ? "1 profissional cadastrado" : `${meta.total} profissionais cadastrados`;
  const isEmptyDatabase = meta.total === 0;
  const visibleProfessionals = useMemo(() => professionals, [professionals]);

  async function handleCreateProfessional(professionalData) {
    try {
      const invitedProfessional = await inviteProfessional(professionalData);
      setPage(1);
      setReloadKey((current) => current + 1);

      await showSuccessAlert(
        invitedProfessional?.email
          ? `Convite enviado para ${invitedProfessional.email}.`
          : "Convite enviado com sucesso.",
        {
          title: "Profissional adicionado",
          confirmButtonText: "Continuar",
        }
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        redirectToLogin();
        return false;
      }

      await showErrorAlert(requestError.message || "Nao foi possivel enviar o convite.");
      return false;
    }

    return true;
  }

  async function handleUpdateProfessional(professionalData) {
    if (!editingProfessional) {
      return false;
    }

    try {
      await updateProfessional(editingProfessional.id, professionalData);
      setEditingProfessional(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      if (requestError.status === 401) {
        redirectToLogin();
        return false;
      }

      await showErrorAlert(requestError.message || "Nao foi possivel atualizar o profissional.");
      return false;
    }

    return true;
  }

  async function handleResendInvite(professional) {
    const confirmed = await showConfirmAlert({
      title: "Reenviar convite?",
      text: `Deseja reenviar o convite de acesso para ${professional.name}?`,
      confirmButtonText: "Reenviar",
      cancelButtonText: "Cancelar",
      icon: "question",
    });

    if (!confirmed) {
      return;
    }

    try {
      await resendProfessionalInvite(professional.id);
      setReloadKey((current) => current + 1);

      await showSuccessAlert(
        professional.email
          ? `Novo convite enviado para ${professional.email}.`
          : "Novo convite enviado com sucesso.",
        {
          title: "Convite reenviado",
          confirmButtonText: "Continuar",
        }
      );
    } catch (requestError) {
      if (requestError.status === 401) {
        redirectToLogin();
        return;
      }

      await showErrorAlert(requestError.message || "Nao foi possivel reenviar o convite.");
    }
  }

  async function handleDeleteProfessional(professional) {
    const confirmed = await showConfirmAlert({
      title: "Excluir profissional?",
      text: `Deseja excluir o profissional ${professional.name}?`,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteProfessional(professional.id);

      if (editingProfessional?.id === professional.id) {
        setEditingProfessional(null);
      }

      if (visibleProfessionals.length === 1 && currentPage > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      if (requestError.status === 401) {
        redirectToLogin();
        return;
      }

      await showErrorAlert(requestError.message || "Nao foi possivel excluir o profissional.");
    }
  }

  function handleProfessionalAction(professional, action) {
    if (action === "Editar") {
      setEditingProfessional(professional);
      return;
    }

    if (action === "Reenviar convite") {
      handleResendInvite(professional);
      return;
    }

    if (action === "Excluir") {
      handleDeleteProfessional(professional);
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
    closeEditingProfessional: () => setEditingProfessional(null),
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
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    professionals: visibleProfessionals,
    rowActions: getRowActions,
    search,
    status,
    totalProfessionals: meta.total,
    totalPages,
  };
}
