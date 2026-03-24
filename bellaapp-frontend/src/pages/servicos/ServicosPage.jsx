import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import NovoServico from "../../components/modals/NovoServico";
import { clearSession } from "../../services/api";
import { createService, listServices, updateService } from "../../services/serviceService";
import "../../styles/servicos/servicos.css";

const STATUS_OPTIONS = [
  { value: "ativos", label: "Status: Ativos" },
  { value: "inativos", label: "Status: Inativos" },
  { value: "todos", label: "Status: Todos" },
];

const RISK_OPTIONS = [
  { value: "todos", label: "Risco: Todos" },
  { value: "baixo", label: "Risco: Baixo" },
  { value: "medio", label: "Risco: Medio" },
  { value: "alto", label: "Risco: Alto" },
];

const PAGE_SIZE_OPTIONS = [5, 10, 15];

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

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.25a6.25 6.25 0 0 0-3.83 11.19c.5.4.83.98.95 1.61l.08.45h5.6l.08-.45c.12-.63.45-1.2.95-1.61A6.25 6.25 0 0 0 12 4.25Zm-2.9 14.5h5.8V20A1.75 1.75 0 0 1 13.15 21h-2.3A1.75 1.75 0 0 1 9.1 20v-1.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.75A7.25 7.25 0 1 0 19.25 12 7.26 7.26 0 0 0 12 4.75Zm0 1.5A5.75 5.75 0 1 1 6.25 12 5.76 5.76 0 0 1 12 6.25Zm-.75 2.5h1.5V12l2.2 1.32-.77 1.28-2.93-1.76V8.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m17.19 3.75 3.06 3.06-9.94 9.94-3.94.88.88-3.94 9.94-9.94Zm-10.8 10.8-.4 1.78 1.78-.4 8.92-8.92-1.38-1.38-8.92 8.92Zm10.8-10.8-.73.73 1.38 1.38.73-.73-1.38-1.38ZM5 19h14v1.5H5V19Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 6.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0-3.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.67 3.75c.35 2.13-.4 3.3-1.2 4.54-.79 1.22-1.63 2.53-1.3 4.71.18 1.17.84 2.24 1.84 3.02-.02-1.02.22-2.15.85-3.43.54-1.08 1.31-2.01 2.06-2.92.7-.84 1.36-1.63 1.78-2.44 2.05 2.16 2.84 5.25 2.05 8.06A7.25 7.25 0 1 1 7.2 8.73c.36-.78.84-1.49 1.42-2.12.52 1.73 1.75 2.57 2.4 2.87-.38-2.08.58-3.81 2.65-5.73Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.25 3h1.5v2h6.5V3h1.5v2H19A1.75 1.75 0 0 1 20.75 6.75V19A1.75 1.75 0 0 1 19 20.75H5A1.75 1.75 0 0 1 3.25 19V6.75A1.75 1.75 0 0 1 5 5h2.25V3Zm12 6.25h-14v9.75c0 .14.11.25.25.25h13.5a.25.25 0 0 0 .25-.25V9.25Zm-14-1.5h14v-1c0-.14-.11-.25-.25-.25H5a.25.25 0 0 0-.25.25v1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6.25 7v-.75c0-2.54 3.42-4.5 7.25-4.5s7.25 1.96 7.25 4.5V19h-14.5Zm-2-7.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.75 5h14.5A1.75 1.75 0 0 1 21 6.75v2.5A1.75 1.75 0 0 1 19.25 11H18.5v6.25A1.75 1.75 0 0 1 16.75 19H7.25A1.75 1.75 0 0 1 5.5 17.25V11h-.75A1.75 1.75 0 0 1 3 9.25v-2.5A1.75 1.75 0 0 1 4.75 5Zm.25 4.5h14V6.75a.25.25 0 0 0-.25-.25H4.75a.25.25 0 0 0-.25.25V9.5Zm2 1.5v6.25c0 .14.11.25.25.25h9.5a.25.25 0 0 0 .25-.25V11h-10Zm2.75 2h4.5v1.5h-4.5V13Z"
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

function ServiceGlyph({ kind }) {
  const glyphs = {
    face: (
      <path
        d="M12 4.5c4.28 0 7.75 3.47 7.75 7.75S16.28 20 12 20s-7.75-3.47-7.75-7.75S7.72 4.5 12 4.5Zm0 1.5a6.25 6.25 0 1 0 0 12.5A6.25 6.25 0 0 0 12 6Zm-2.25 4a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.5 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm-5.05 4.06.96-.7c.42.57 1.08.89 1.84.89s1.42-.32 1.84-.89l.96.7c-.64.88-1.66 1.39-2.8 1.39s-2.16-.51-2.8-1.39Z"
        fill="currentColor"
      />
    ),
    syringe: (
      <path
        d="m17.86 5.08 1.06 1.06-1.42 1.42 1.14 1.14-1.06 1.06-1.14-1.14-5.3 5.3.69.7-1.06 1.06-.7-.7-1.36 1.36-.88 2.64-1.42-.47.87-2.63 1.37-1.36-.7-.7 1.06-1.06.7.69 5.3-5.3-1.14-1.14 1.06-1.06 1.14 1.14 1.42-1.41Z"
        fill="currentColor"
      />
    ),
    wand: (
      <path
        d="M16.57 4.37 19.63 7.43l-1.06 1.06-3.06-3.06 1.06-1.06ZM6.4 14.54 7.46 15.6 4.53 18.53 3.47 17.47l2.93-2.93Zm6.01-8.59 1.06 1.06-1.77 1.77-1.06-1.06 1.77-1.77ZM8.2 9.1l6.7 6.7-1.06 1.06-6.7-6.7L8.2 9.1Z"
        fill="currentColor"
      />
    ),
    drop: (
      <path
        d="M12 4.75c2.26 2.55 4.75 5.7 4.75 8.5A4.75 4.75 0 1 1 7.25 13.25c0-2.8 2.49-5.95 4.75-8.5Zm0 2.31c-1.77 2.12-3.25 4.34-3.25 6.19a3.25 3.25 0 1 0 6.5 0c0-1.85-1.48-4.07-3.25-6.19Z"
        fill="currentColor"
      />
    ),
    lotus: (
      <path
        d="M12 7.25c1.45 1.32 2.18 2.72 2.18 4.17 0 1.1-.43 2.07-1.18 2.83v1h3.22a5.44 5.44 0 0 0 1.53-3.83c0-1.9-.78-3.67-2.16-4.97-.74.32-1.81.72-3.59.8Zm-1.18 8v-1c-.75-.76-1.18-1.73-1.18-2.83 0-1.45.73-2.85 2.18-4.17-1.78-.08-2.85-.48-3.6-.8a6.87 6.87 0 0 0-2.15 4.97c0 1.45.54 2.74 1.52 3.83h3.23Z"
        fill="currentColor"
      />
    ),
    flask: (
      <path
        d="M10 3.75h4v1.5h-.5v4.14l3.87 6.45A2.25 2.25 0 0 1 15.44 19H8.56a2.25 2.25 0 0 1-1.93-3.16l3.87-6.45V5.25H10v-1.5Zm1.5 6.06-3.58 5.97a.75.75 0 0 0 .64 1.12h6.88a.75.75 0 0 0 .64-1.12L12.5 9.81h-1Z"
        fill="currentColor"
      />
    ),
  };

  return (
    <span className={`service-row-icon service-row-icon-${kind}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {glyphs[kind] || glyphs.face}
      </svg>
    </span>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDuration(minutes) {
  if (minutes % 60 === 0) {
    return `${minutes / 60}h`;
  }

  return `${minutes}min`;
}

function statusLabel(status) {
  return status === "ativo" ? "Ativo" : "Inativo";
}

export default function ServicosPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ativos");
  const [risk, setRisk] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [meta, setMeta] = useState({
    limit: 10,
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const deferredSearch = useDeferredValue(search);

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
          active: status === "todos" ? undefined : status === "ativos",
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
        setMeta({
          limit: pageSize,
          page,
          total: 0,
          totalPages: 0,
        });
        setError(requestError.message || "Falha ao carregar servicos.");

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

    loadServicesData();

    return () => {
      active = false;
    };
  }, [deferredSearch, navigate, page, pageSize, reloadKey, status]);

  const visibleServices = useMemo(() => services, [services]);
  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);

  const averageTicket = visibleServices.length
    ? visibleServices.reduce((total, service) => total + service.price, 0) / visibleServices.length
    : 0;

  const averageDuration = visibleServices.length
    ? Math.round(visibleServices.reduce((total, service) => total + service.durationMinutes, 0) / visibleServices.length)
    : 0;

  const topService = useMemo(() => {
    return visibleServices.reduce((currentTop, service) => {
      if (!currentTop || service.soldCount > currentTop.soldCount) {
        return service;
      }

      return currentTop;
    }, null);
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

  return (
    <section className="services-page">
      <header className="services-topbar">
        <h1>Servicos</h1>

        <button type="button" className="services-primary-button" onClick={() => setIsNewServiceOpen(true)}>
          <PlusIcon />
          Novo Servico
        </button>
      </header>

      <div className="services-content-grid">
        <section className="services-main-panel">
          <div className="services-toolbar">
            <label className="services-search">
              <SearchIcon />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar servico..."
              />
            </label>

            <label className="services-select">
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
            </label>

            <label className="services-select">
              <select
                value={risk}
                onChange={(event) => {
                  setRisk(event.target.value);
                  setPage(1);
                }}
                disabled
                title="O backend atual nao expoe nivel de risco do servico."
              >
                {RISK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="services-tip">
            <BulbIcon />
            <p>
              <strong>Dica:</strong> nome, descricao, preco, duracao e status ja estao vindo do backend. Risco,
              profissionais e metricas comerciais ainda dependem de suporte adicional da API.
            </p>
          </div>

          {error ? <p className="agenda-feedback agenda-feedback-error">{error}</p> : null}
          {loading ? <p className="agenda-feedback">Carregando servicos...</p> : null}

          <div className="services-table">
            <div className="services-table-head">
              <span>Servico</span>
              <span>Preco</span>
              <span>Duracao</span>
              <span>Risco</span>
              <span>Status</span>
              <span>Acoes</span>
            </div>

            <div className="services-table-body">
              {visibleServices.map((service) => (
                <article key={service.id} className="service-row">
                  <div className="service-col service-col-main">
                    <ServiceGlyph kind={service.icon} />

                    <div className="service-main-copy">
                      <strong>{service.name}</strong>
                      <span>{service.description || "Sem descricao cadastrada."}</span>
                    </div>
                  </div>

                  <div className="service-col">
                    <strong>{formatCurrency(service.price)}</strong>
                  </div>

                  <div className="service-col service-col-duration">
                    <ClockIcon />
                    <span>{formatDuration(service.durationMinutes)}</span>
                  </div>

                  <div className="service-col">
                    <span className={`service-badge service-badge-risk-${service.riskTone}`}>
                      <span className="service-badge-dot" />
                      {service.riskLabel}
                    </span>
                  </div>

                  <div className="service-col">
                    <span className={`service-badge service-badge-status-${service.status}`}>
                      {statusLabel(service.status)}
                    </span>
                  </div>

                  <div className="service-col service-col-actions">
                    <button
                      type="button"
                      className="service-action-button"
                      aria-label={`Editar ${service.name}`}
                      onClick={() => setEditingService(service)}
                    >
                      <EditIcon />
                    </button>

                    <button
                      type="button"
                      className="service-action-button"
                      aria-label={`Mais acoes para ${service.name}`}
                    >
                      <MoreIcon />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <footer className="services-footer">
            <div className="services-pagination">
              <button
                type="button"
                className="services-page-button muted"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
              >
                <ChevronIcon direction="left" />
                Anterior
              </button>

              <span className="services-page-index">{currentPage}</span>

              <button
                type="button"
                className="services-page-button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
              >
                Proxima
                <ChevronIcon direction="right" />
              </button>
            </div>

            <label className="services-page-size">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / pagina
                  </option>
                ))}
              </select>
            </label>
          </footer>
        </section>

        <aside className="services-sidebar">
          <article className="services-sidecard">
            <h2>Servicos ({meta.total})</h2>

            <div className="services-stat-list">
              <div className="services-stat-row">
                <span className="services-dot services-dot-baixo" />
                <span>Baixo risco</span>
                <strong>-</strong>
              </div>

              <div className="services-stat-row">
                <span className="services-dot services-dot-medio" />
                <span>Medio risco</span>
                <strong>-</strong>
              </div>

              <div className="services-stat-row">
                <span className="services-dot services-dot-alto" />
                <span>Alto risco</span>
                <strong>-</strong>
              </div>
            </div>

            <div className="services-metric-row">
              <span>Ticket medio:</span>
              <strong>{formatCurrency(averageTicket)}</strong>
            </div>

            <div className="services-metric-row">
              <span>Duracao media:</span>
              <strong>{averageDuration}min</strong>
            </div>
          </article>

          <article className="services-sidecard services-sidecard-highlight">
            <div className="services-sidecard-title">
              <FireIcon />
              <h2>Servico mais vendido</h2>
            </div>

            {!visibleServices.length ? (
              <p>Nenhum servico disponivel.</p>
            ) : topService?.soldCount > 0 ? (
              <>
                <strong className="services-top-service-name">{topService.name}</strong>
                <p>
                  {formatCurrency(topService.price)} · {formatDuration(topService.durationMinutes)}
                </p>
                <button type="button" className="services-secondary-button">
                  <CalendarIcon />
                  Agendar
                </button>
              </>
            ) : (
              <p>Sem metricas de vendas no backend atual.</p>
            )}
          </article>

          <article className="services-sidecard">
            <div className="services-sidecard-title">
              <MoreIcon />
              <h2>Acoes rapidas</h2>
            </div>

            <button type="button" className="services-quick-action">
              <CalendarIcon />
              Agendar com servico
            </button>

            <button type="button" className="services-quick-action">
              <TeamIcon />
              Gerenciar profissionais
            </button>

            <button type="button" className="services-quick-action">
              <ArchiveIcon />
              Ver arquivados
            </button>
          </article>
        </aside>
      </div>

      {isNewServiceOpen ? (
        <NovoServico
          onClose={() => setIsNewServiceOpen(false)}
          onSave={handleCreateService}
          showCatalogExtras={false}
          description="Cadastre nome, descricao, preco, duracao e status do servico."
        />
      ) : null}

      {editingService ? (
        <NovoServico
          title="Editar Servico"
          submitLabel="Salvar alteracoes"
          initialValues={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleUpdateService}
          showCatalogExtras={false}
          description="Atualize os campos que existem no backend de servicos."
        />
      ) : null}
    </section>
  );
}
