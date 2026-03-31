import { useDeferredValue, useEffect, useMemo, useState } from "react";
import NovoServico from "../../components/modals/NovoServico";
import Header from "../../components/layout/Header";
import useDisclosure from "../../hooks/useDisclosure";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import { createService, listServices, updateService } from "../../services/serviceService";
import formatCurrency from "../../utils/formatters";
import {Search, Clock, Edit, Users, Flame, Calendar, Archive, ChevronRight, ChevronLeft} from "lucide-react";
import {CLIENT_STATUS_OPTIONS, riskLabel} from "../../utils/StatusUtils"
import formatDuration from "../../utils/formatters";
import "../../styles/servicos/servicos.css";


const PAGE_SIZE_OPTIONS = [5, 10, 15];

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

function statusLabel(status) {
  return status === "ativo" ? "Ativo" : "Inativo";
}

export default function ServicosPage() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ativos");
  const [risk, setRisk] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const newServiceModal = useDisclosure();
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
          active: status === "todos" ? undefined : status === "ativos",
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
        setMeta({
          limit: pageSize,
          page,
          total: 0,
          totalPages: 0,
        });
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

  return (
    <section className="services-page">
       <Header
              title="Serviços"
              subtitle="Gerencie seus serviços, valores e duração de forma simples e eficiente"
              actions={
               <button type="button" className="btn-primary" onClick={newServiceModal.open}>
                + Novo Serviço
               </button>
              }
            />

      <div className="services-content-grid">
        <section className="services-main-panel">
          <div className="services-toolbar">
            <label className="services-search">
              <Search size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar serviço..."
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
                {CLIENT_STATUS_OPTIONS.map((item) => ["Todos", "Ativos", "Inativos"].includes(item.value) && (
                  <option key={item.value} value={item.value}>
                    {item.label}
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
              >
                {riskLabel.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
                      <span>{service.description || "Sem descrição cadastrada."}</span>
                    </div>
                  </div>

                  <div className="service-col">
                    <strong>{formatCurrency(service.price)}</strong>
                  </div>

                  <div className="service-col service-col-duration">
                    <Clock size={18} />
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
                      <Edit size={18} />
                    </button>

                    <button
                      type="button"
                      className="service-action-button"
                      aria-label={`Mais acoes para ${service.name}`}
                    >
                     
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
                <ChevronLeft size={18} direction="left" />
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
                <ChevronRight size={18} direction="right" />
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
                <strong>{riskCounters.baixo}</strong>
              </div>

              <div className="services-stat-row">
                <span className="services-dot services-dot-medio" />
                <span>Medio risco</span>
                <strong>{riskCounters.medio}</strong>
              </div>

              <div className="services-stat-row">
                <span className="services-dot services-dot-alto" />
                <span>Alto risco</span>
                <strong>{riskCounters.alto}</strong>
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
              <Flame size={18} />
              <h2>Serviço mais vendido</h2>
            </div>

            {!visibleServices.length ? (
              <p>Nenhum serviço disponivel.</p>
            ) : topService?.soldCount > 0 ? (
              <>
                <strong className="services-top-service-name">{topService.name}</strong>
                <p>
                  {formatCurrency(topService.price)} · {formatDuration(topService.durationMinutes)}
                </p>
                <button type="button" className="services-secondary-button">
                  <Calendar size={18} />
                  Agendar
                </button>
              </>
            ) : (
              <p>Sem agendamentos vinculados aos servicos ainda.</p>
            )}
          </article>

          <article className="services-sidecard">
            <div className="services-sidecard-title">
             
              <h2>Ações rápidas</h2>
            </div>

            <button type="button" className="services-quick-action">
              <Calendar size={18} />
              Agendar com serviço
            </button>

            <button type="button" className="services-quick-action">
              <Users size={18} />
              Gerenciar profissionais
            </button>

            <button type="button" className="services-quick-action">
              <Archive size={18} />
              Ver arquivados
            </button>
          </article>
        </aside>
      </div>

      {newServiceModal.isOpen ? (
        <NovoServico
          onClose={newServiceModal.close}
          onSave={handleCreateService}
          showCatalogExtras
          description="Cadastre nome, descricao, preco, duracao, risco, icone e status do servico."
        />
      ) : null}

      {editingService ? (
        <NovoServico
          title="Editar Servico"
          submitLabel="Salvar alteracoes"
          initialValues={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleUpdateService}
          showCatalogExtras
          description="Atualize os campos persistidos pelo backend de servicos."
        />
      ) : null}
    </section>
  );
}
