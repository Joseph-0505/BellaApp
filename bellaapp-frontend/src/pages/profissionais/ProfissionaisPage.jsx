import { useDeferredValue, useMemo, useState } from "react";
import Header from "../../components/layout/Header";

import "../../styles/profissionais/profissionais.css";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
];

const PAGE_SIZE = 4;

const PROFESSIONALS = [
  {
    id: "professional-1",
    name: "Dra. Mariana Souza",
    specialty: "Fisioterapeuta",
    email: "mariana@clinica.com",
    phone: "(11) 98765-4321",
    status: "ativo",
    initials: "MS",
    tone: "rose",
  },
  {
    id: "professional-2",
    name: "Carlos Mendes",
    specialty: "Esteticista",
    email: "carlos@clinica.com",
    phone: "(21) 91234-5678",
    status: "ativo",
    initials: "CM",
    tone: "sand",
  },
  {
    id: "professional-3",
    name: "Ana Pereira",
    specialty: "Dermatologista",
    email: "ana@clinica.com",
    phone: "(31) 99876-5432",
    status: "ativo",
    initials: "AP",
    tone: "sage",
  },
  {
    id: "professional-4",
    name: "Dr. Ricardo Lima",
    specialty: "Ortopedista",
    email: "ricardo@clinica.com",
    phone: "(41) 8765-4321",
    status: "inativo",
    initials: "RL",
    tone: "mist",
  },
];

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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.25 5h1.5v6.25H19v1.5h-6.25V19h-1.5v-6.25H5v-1.5h6.25V5Z" fill="currentColor" />
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

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function statusLabel(status) {
  return status === "ativo" ? "Ativo" : "Inativo";
}

export default function ProfissionaisPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const filteredProfessionals = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch);

    return PROFESSIONALS.filter((professional) => {
      const matchesStatus = status === "todos" || professional.status === status;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          professional.name,
          professional.specialty,
          professional.email,
          professional.phone,
          statusLabel(professional.status),
        ].some((field) => normalizeText(field).includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [deferredSearch, status]);

  const totalPages = Math.max(Math.ceil(filteredProfessionals.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, totalPages);

  const visibleProfessionals = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProfessionals.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredProfessionals]);

  return (
    <section className="profissionais-page">
       <Header
              title="Profissionais"
              actions={
               <button type="button" className="btn-primary" onClick={() => setIsNewClientOpen(true)}>
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
          {visibleProfessionals.length > 0 ? (
            visibleProfessionals.map((professional) => (
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
                    title={`Conecte a edicao de ${professional.name} ao seu modal ou formulario.`}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="profissional-action-button profissional-action-button-delete"
                    title={`Conecte a exclusao de ${professional.name} ao seu fluxo de confirmacao.`}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="profissionais-empty">
              <strong>Nenhum profissional encontrado.</strong>
              <span>Ajuste a busca ou o filtro para exibir resultados.</span>
            </div>
          )}
        </div>

        <footer className="profissionais-footer">
          <p>
            Mostrando {visibleProfessionals.length} de {filteredProfessionals.length} profissionais
          </p>

          <div className="profissionais-pagination">
            <button
              type="button"
              className="profissionais-page-button profissionais-page-button-muted"
              onClick={() => setPage((currentValue) => Math.max(1, currentValue - 1))}
              disabled={currentPage === 1}
            >
              <ChevronIcon direction="left" />
              Anterior
            </button>

            <span className="profissionais-page-index">{currentPage}</span>

            <button
              type="button"
              className="profissionais-page-button"
              onClick={() => setPage((currentValue) => Math.min(totalPages, currentValue + 1))}
              disabled={currentPage === totalPages || filteredProfessionals.length === 0}
            >
              Proximo
              <ChevronIcon direction="right" />
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}
