import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import NovoCliente from "../../components/modals/NovoCliente";
import useDisclosure from "../../hooks/useDisclosure";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import { createClient, deleteClient, listClients, updateClient } from "../../services/clientService";
import { Phone, Users, Eye, Pencil, Trash, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import formatCurrency from "../../utils/formatters";
import { CLIENT_STATUS_OPTIONS, statusLabel } from "../../utils/StatusUtils";
import SearchStatusFilters from "../../components/SearchStatusFilters";


import "../../styles/clientes/clientes.css";


const PAGE_SIZE_OPTIONS = [10, 20, 30];


function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}


export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const newClientModal = useDisclosure();
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
      alert(requestError.message || "Não foi possível excluir o cliente.");
    }
  }

  return (
    <section className="clientes-page">
      <Header
        title="Clientes"
        subtitle="Centralize e gerencie todas as informações dos seus clientes com facilidade"
        actions={
         <button type="button" className="btn-soft" onClick={newClientModal.open}>
          + Novo Cliente
         </button>
        }
      />


      <section className="clientes-board">
        <div className="clientes-toolbar">
          <SearchStatusFilters
            searchValue={search}
            onSearchChange={(value) => {
              setSearch(value);
                setPage(1);
              }}
            searchPlaceholder="Buscar por nome, telefone ou e-mail"
            statusValue={status}
            onStatusChange={(value) => {
              setStatus(value);
                setPage(1);
              }}
            statusOptions={CLIENT_STATUS_OPTIONS}
          />

          <button type="button" className="clientes-summary-pill">
            <Users size={18} />
            Clientes ({meta.total})
            <ChevronDown size={18} />
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
          {visibleClients.map((client) => (
            <article key={client.id} className="cliente-row">
              <div className="cliente-col cliente-col-main">
                <div className={`cliente-avatar cliente-avatar-${client.avatarTone}`}>{getInitials(client.name)}</div>

                <div className="cliente-main-copy">
                  <strong>{client.name}</strong>
                  <span>{client.email}</span>
                </div>
              </div>

              <div className="cliente-col cliente-col-phone">
               <Phone size={18}/>
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
                    <Eye size={18} />
                  </button>

                  <button
                    type="button"
                    className="cliente-action-button"
                    aria-label={`Editar ${client.name}`}
                    onClick={() => setEditingClient(client)}
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    type="button"
                    className="cliente-action-button"
                    aria-label={`Remover ${client.name}`}
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <Trash size={18} />
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
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="clientes-footer-controls">
            <button
              type="button"
              className="clientes-page-button next"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronLeft size={18} />
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

      {newClientModal.isOpen ? (
        <NovoCliente
          onClose={newClientModal.close}
          onSave={handleCreateClient}
          description="Cadastre nome, telefone, email, CPF e observações básicas do cliente."
        />
      ) : null}

      {editingClient ? (
        <NovoCliente
          title="Editar Cliente"
          submitLabel="Salvar alterações"
          initialValues={editingClient}
          onClose={() => setEditingClient(null)}
          onSave={handleUpdateClient}
          description="Atualize os dados básicos persistidos pelo backend."
        />
      ) : null}
    </section>
  );
}
