import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import NovoCliente from "../../components/modals/NovoCliente";
import { clearSession } from "../../services/api";
import { createClient, deleteClient, listClients, updateClient } from "../../services/clientService";
import "../../styles/clientes/clientes.css";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos status" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" },
  { value: "novo", label: "Novos" },
  { value: "risco", label: "Risco alto" },
];

const PROFESSIONAL_OPTIONS = [
  { value: "todos", label: "Todos profissionais" },
  { value: "Dra. Ana", label: "Dra. Ana" },
  { value: "Dra. Rafaela", label: "Dra. Rafaela" },
  { value: "Rodrigo Lunda", label: "Rodrigo Lunda" },
  { value: "Joao Peria", label: "Joao Peria" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30];

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

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6.5 7v-.75c0-2.62 3.58-4.75 8-4.75s8 2.13 8 4.75V19H5.5Zm-1.75-7.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Zm16.5 0a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.02 4.75c.32-.33.8-.43 1.22-.26l2.13.85c.5.2.78.73.68 1.26l-.37 1.95a1 1 0 0 0 .28.92l3.44 3.44a1 1 0 0 0 .92.28l1.95-.37c.53-.1 1.06.18 1.26.68l.85 2.13c.17.42.07.9-.26 1.22l-1.27 1.27c-.76.76-1.88 1.05-2.92.78-2.34-.62-4.78-2.2-7.04-4.46-2.26-2.26-3.84-4.7-4.46-7.04-.27-1.04.02-2.16.78-2.92l1.27-1.27Z"
        fill="currentColor"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 6.25c4.9 0 8.47 3.46 9.72 5.75-1.25 2.29-4.82 5.75-9.72 5.75S3.53 14.29 2.28 12C3.53 9.71 7.1 6.25 12 6.25Zm0 1.5c-3.86 0-6.86 2.57-8.05 4.25 1.19 1.68 4.19 4.25 8.05 4.25s6.86-2.57 8.05-4.25c-1.19-1.68-4.19-4.25-8.05-4.25Zm0 1.5A2.75 2.75 0 1 1 12 14.75 2.75 2.75 0 0 1 12 9.25Z"
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 4.75h6l.6 1.5H19v1.5H5v-1.5h3.4L9 4.75Zm-1.75 5h1.5v8h-1.5v-8Zm4 0h1.5v8h-1.5v-8Zm4 0h1.5v8h-1.5v-8ZM6.25 8.25h11.5V19A1.75 1.75 0 0 1 16 20.75H8A1.75 1.75 0 0 1 6.25 19V8.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronIcon({ direction = "down" }) {
  const rotation = direction === "left" ? "rotate(90 12 12)" : direction === "right" ? "rotate(-90 12 12)" : "rotate(0 12 12)";

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

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusLabel(status) {
  const labels = {
    ativo: "Ativo",
    inativo: "Inativo",
    novo: "Novo",
    risco: "Risco alto",
  };

  return labels[status] || status;
}

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [professional, setProfessional] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
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
        setMeta({
          limit: pageSize,
          page,
          total: 0,
          totalPages: 0,
        });
        setError(requestError.message || "Falha ao carregar clientes.");

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

    loadClientsData();

    return () => {
      active = false;
    };
  }, [deferredSearch, navigate, page, pageSize, reloadKey]);

  const totalPages = Math.max(meta.totalPages || 0, 1);
  const currentPage = Math.min(meta.page || page, totalPages);

  async function handleCreateClient(clientData) {
    try {
      await createClient(clientData);
      setPage(1);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel salvar o cliente.");
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
      alert(requestError.message || "Nao foi possivel atualizar o cliente.");
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

      if (clients.length === 1 && currentPage > 1) {
        setPage((current) => Math.max(1, current - 1));
        return;
      }

      setReloadKey((current) => current + 1);
    } catch (requestError) {
      alert(requestError.message || "Nao foi possivel excluir o cliente.");
    }
  }

  return (
    <section className="clientes-page">
      <Header
        title="Clientes"
        actions={
         <button type="button" className="btn-soft" onClick={() => setIsNewClientOpen(true)}>
          + Novo Cliente
         </button>
        }
      />


      <section className="clientes-board">
        <div className="clientes-toolbar">
          <label className="clientes-search">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, telefone ou e-mail"
            />
          </label>

          <label className="clientes-select">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              disabled
              title="A API ja devolve status por cliente, mas o filtro ainda nao esta ligado na listagem paginada."
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="clientes-select">
            <select
              value={professional}
              onChange={(event) => {
                setProfessional(event.target.value);
                setPage(1);
              }}
              disabled
              title="O backend atual nao expoe profissional principal do cliente."
            >
              {PROFESSIONAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="clientes-summary-pill">
            <UsersIcon />
            Clientes ({meta.total})
            <ChevronIcon />
          </button>
        </div>

        {error ? <p>{error}</p> : null}
        {loading ? <p>Carregando clientes...</p> : null}

        <div className="clientes-table-head">
          <span>Cliente</span>
          <span>Telefone</span>
          <span>Último Atendimento</span>
          <span>Próximo Agendamento</span>
          <span>Total gasto</span>
          <span>Ações</span>
        </div>

        <div className="clientes-table-body">
          {clients.map((client) => (
            <article key={client.id} className="cliente-row">
              <div className="cliente-col cliente-col-main">
                <div className={`cliente-avatar cliente-avatar-${client.avatarTone}`}>{getInitials(client.name)}</div>

                <div className="cliente-main-copy">
                  <strong>{client.name}</strong>
                  <span>{client.email}</span>
                </div>
              </div>

              <div className="cliente-col cliente-col-phone">
                <PhoneIcon />
                <span>{client.phone}</span>
              </div>

              <div className="cliente-col cliente-col-stack">
                <strong>{client.latestVisit}</strong>
                <span>{client.latestVisitNote}</span>
              </div>

              <div className="cliente-col cliente-col-stack">
                <span className={`cliente-mini-pill cliente-mini-pill-${client.status}`}>{client.nextAppointment}</span>
                <span>{client.professional}</span>
              </div>

              <div className="cliente-col cliente-col-price">
                <strong>{formatCurrency(client.totalSpent)}</strong>
              </div>

              <div className="cliente-col cliente-col-actions">
                <span className={`cliente-status-badge cliente-status-badge-${client.status}`}>{statusLabel(client.status)}</span>

                <div className="cliente-actions-group">
                  <button type="button" className="cliente-action-button" aria-label={`Visualizar ${client.name}`}>
                    <EyeIcon />
                  </button>

                  <button
                    type="button"
                    className="cliente-action-button"
                    aria-label={`Editar ${client.name}`}
                    onClick={() => setEditingClient(client)}
                  >
                    <EditIcon />
                  </button>

                  <button
                    type="button"
                    className="cliente-action-button"
                    aria-label={`Remover ${client.name}`}
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="clientes-footer">
          <div className="clientes-pagination">
            <button
              type="button"
              className="clientes-page-button muted"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>

            <span className="clientes-page-index">{currentPage}</span>

            <button
              type="button"
              className="clientes-page-button icon"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
              aria-label="Próxima página"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>

          <div className="clientes-footer-controls">
            <button
              type="button"
              className="clientes-page-button next"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronIcon direction="left" />
              Próxima
            </button>

            <label className="clientes-page-size">
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / página
                  </option>
                ))}
              </select>
            </label>
          </div>
        </footer>
      </section>

      {isNewClientOpen ? (
        <NovoCliente
          onClose={() => setIsNewClientOpen(false)}
          onSave={handleCreateClient}
          professionals={PROFESSIONAL_OPTIONS.filter((option) => option.value !== "todos").map((option) => option.value)}
          showCommercialFields={false}
          description="Cadastre nome, telefone, email, CPF e observacoes basicas do cliente."
        />
      ) : null}

      {editingClient ? (
        <NovoCliente
          title="Editar Cliente"
          submitLabel="Salvar alteracoes"
          initialValues={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleUpdateClient}
          professionals={PROFESSIONAL_OPTIONS.filter((option) => option.value !== "todos").map((option) => option.value)}
          showCommercialFields={false}
          description="Atualize os dados basicos persistidos pelo backend."
        />
      ) : null}
    </section>
  );
}
