import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import NovoProfissional from "../../components/modals/NovoProfissional";
import { clearSession } from "../../services/api";
import {
  createProfessional,
  deleteProfessional,
  listProfessionals,
  updateProfessional,
} from "../../services/professionalService";

import "../../styles/profissionais/profissionais.css";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

const PAGE_SIZE = 4;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.42 1.06-1.06-4.42-4.43A6.5 6.5 0 0 0 10.5 4Zm0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronIcon({ direction = "down" }) {
  const rotation =
    direction === "left"
      ? "rotate(90 12 12)"
      : direction === "right"
        ? "rotate(-90 12 12)"
        : "rotate(0 12 12)";

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m7.41 9.34 4.59 4.58 4.59-4.58 1.06 1.06L12 16.04 6.35 10.4l1.06-1.06Z"
        fill="currentColor"
        transform={rotation}
      />
    </svg>
  );
}

function statusLabel(status) {
  return status === "ativo" ? "Ativo" : "Inativo";
}

export default function ProfissionaisPage() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    limit: PAGE_SIZE,
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isNewProfessionalOpen, setIsNewProfessionalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let active = true;

    async function loadProfessionalsData() {
      try {
        setLoading(true);
        setError("");

        const response = await listProfessionals({
          page,
          limit: PAGE_SIZE,
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
        setMeta({
          limit: PAGE_SIZE,
          page,
          total: 0,
          totalPages: 0,
        });
        setError(requestError.message || "Falha ao carregar profissionais.");

        if (requestError.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
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
  }, [deferredSearch, navigate, page, reloadKey, status]);

  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);

  async function handleCreateProfessional(professionalData) {
    try {
      await createProfessional(professionalData);
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel salvar o profissional.");
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
      alert(requestError.message || "Nao foi possivel atualizar o profissional.");
      return false;
    }

    return true;
  }

  async function handleDeleteProfessional(id) {
    const confirmed = window.confirm("Deseja excluir este profissional?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteProfessional(id);

      if (professionals.length === 1 && currentPage > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel excluir o profissional.");
    }
  }

  return (
    <section className="profissionais-page">
      <Header
        title="Profissionais"
        subtitle="Centralize especialidades, contatos e disponibilidade do seu time em um unico painel."
        actions={
          <button type="button" className="btn-primary" onClick={() => setIsNewProfessionalOpen(true)}>
            + Novo Profissional
          </button>
        }
      />

      <section className="profissionais-board">
        <div className="profissionais-toolbar">
          <label className="profissionais-search">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar..."
            />
          </label>

          <div className="profissionais-filter-group">
            <span>Filtrar:</span>

            <label className="profissionais-select">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronIcon />
            </label>
          </div>
        </div>

        {error ? <p className="agenda-feedback agenda-feedback-error">{error}</p> : null}
        {loading ? <p className="agenda-feedback">Carregando profissionais...</p> : null}

        <div className="profissionais-table-head">
          <span>Foto</span>
          <span>Nome</span>
          <span>Especialidade</span>
          <span>E-mail</span>
          <span>Telefone</span>
          <span>Status</span>
          <span>Acoes</span>
        </div>

        <div className="profissionais-table-body">
          {!loading && professionals.length > 0 ? (
            professionals.map((professional) => (
              <article key={professional.id} className="profissional-row">
                <div className="profissional-col profissional-col-photo" data-label="Foto">
                  <div className={`profissional-avatar profissional-avatar-${professional.tone}`}>
                    <span>{professional.initials}</span>
                  </div>
                </div>

                <div className="profissional-col profissional-col-name" data-label="Nome">
                  <strong>{professional.name}</strong>
                </div>

                <div className="profissional-col" data-label="Especialidade">
                  <span>{professional.specialty}</span>
                </div>

                <div className="profissional-col" data-label="E-mail">
                  <span>{professional.email}</span>
                </div>

                <div className="profissional-col" data-label="Telefone">
                  <span>{professional.phone}</span>
                </div>

                <div className="profissional-col profissional-col-status" data-label="Status">
                  <span className={`profissional-status profissional-status-${professional.status}`}>
                    {statusLabel(professional.status)}
                  </span>
                </div>

                <div className="profissional-col profissional-col-actions" data-label="Acoes">
                  <button
                    type="button"
                    className="profissional-action-button profissional-action-button-edit"
                    onClick={() => setEditingProfessional(professional)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="profissional-action-button profissional-action-button-delete"
                    onClick={() => handleDeleteProfessional(professional.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))
          ) : null}

          {!loading && professionals.length === 0 ? (
            <div className="profissionais-empty">
              <strong>Nenhum profissional encontrado.</strong>
              <span>Ajuste a busca ou o filtro para exibir resultados.</span>
            </div>
          ) : null}
        </div>

        <footer className="profissionais-footer">
          <p>
            Mostrando {professionals.length} de {meta.total} profissionais
          </p>

          <div className="profissionais-pagination">
            <button
              type="button"
              className="profissionais-page-button profissionais-page-button-muted"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              <ChevronIcon direction="left" />
              Anterior
            </button>

            <span className="profissionais-page-index">{currentPage}</span>

            <button
              type="button"
              className="profissionais-page-button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages || meta.total === 0}
            >
              Proximo
              <ChevronIcon direction="right" />
            </button>
          </div>
        </footer>
      </section>

      {isNewProfessionalOpen ? (
        <NovoProfissional
          onClose={() => setIsNewProfessionalOpen(false)}
          onSave={handleCreateProfessional}
        />
      ) : null}

      {editingProfessional ? (
        <NovoProfissional
          title="Editar Profissional"
          submitLabel="Salvar alteracoes"
          initialValues={editingProfessional}
          onClose={() => setEditingProfessional(null)}
          onSave={handleUpdateProfessional}
        />
      ) : null}
    </section>
  );
}
