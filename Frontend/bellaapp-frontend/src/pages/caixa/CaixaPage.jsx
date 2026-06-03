import { useCallback, useEffect, useMemo, useState } from "react";
import KpiCard from "../../components/dashboard/KpiCard";
import Header from "../../components/layout/Header";
import useAuth from "../../hooks/useAuth";
import useUnauthorizedRedirect from "../../hooks/useUnauthorizedRedirect";
import { listProfessionals } from "../../services/professionalService";
import { closeTodayCash, getTodayCash, openTodayCash } from "../../services/cashService";
import "../../styles/dashboard/dashboard.css";
import "../../styles/caixa/caixa.css";
import formatCurrency from "../../utils/formatters";
import { showErrorAlert, showNumberPrompt, showSuccessAlert } from "../../utils/alerts";

export default function CaixaPage() {
  const { user } = useAuth();
  const [cash, setCash] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [selectedScope, setSelectedScope] = useState("clinic");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const redirectToLogin = useUnauthorizedRedirect();
  const canViewAllCash = Boolean(user?.permissions?.viewAllCash);
  const ownProfessionalId = user?.professional?.id || "";

  useEffect(() => {
    if (canViewAllCash) {
      setSelectedScope("clinic");
      return;
    }

    setSelectedScope(ownProfessionalId);
  }, [canViewAllCash, ownProfessionalId]);

  const selectedProfessionalId =
    canViewAllCash && selectedScope === "clinic"
      ? ""
      : canViewAllCash && selectedScope === "mine"
        ? ownProfessionalId
        : canViewAllCash
          ? selectedScope
          : ownProfessionalId;

  const scopeOptions = useMemo(() => {
    if (!canViewAllCash) {
      return [];
    }

    const options = [{ value: "clinic", label: "Caixa da clínica" }];

    if (ownProfessionalId) {
      options.push({ value: "mine", label: "Meu caixa" });
    }

    professionals.forEach((professional) => {
      options.push({ value: professional.id, label: professional.name });
    });

    return options.filter(
      (option, index, collection) => collection.findIndex((item) => item.value === option.value) === index
    );
  }, [canViewAllCash, ownProfessionalId, professionals]);

  const loadCash = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [cashResult, professionalsResponse] = await Promise.all([
        getTodayCash({
          ...(selectedProfessionalId ? { professionalId: selectedProfessionalId } : {}),
        }),
        canViewAllCash
          ? listProfessionals({ limit: 100, page: 1, status: "ativo" })
          : Promise.resolve(null),
      ]);

      setCash(cashResult);
      setProfessionals(professionalsResponse?.items || []);
    } catch (requestError) {
      if (requestError.status === 401) {
        redirectToLogin();
        return;
      }

      setError(requestError.message || "Não foi possível carregar o caixa do dia.");
    } finally {
      setLoading(false);
    }
  }, [canViewAllCash, redirectToLogin, selectedProfessionalId]);

  useEffect(() => {
    loadCash();
  }, [loadCash]);

  async function handleOpenCash() {
    const openingAmount = await showNumberPrompt({
      title: "Abrir caixa",
      text: cash
        ? "Já existe um caixa carregado para este escopo."
        : "Informe o valor inicial disponível neste caixa.",
      inputLabel: "Valor de abertura",
      inputValue: cash?.openingAmount || 0,
      confirmButtonText: "Abrir caixa",
      validationMessage: "Informe um valor de abertura válido.",
    });

    if (openingAmount === null || opening) {
      return;
    }

    try {
      setOpening(true);
      const result = await openTodayCash({
        openingAmount,
        ...(selectedProfessionalId ? { professionalId: selectedProfessionalId } : {}),
      });
      setCash(result);
      await showSuccessAlert("Caixa aberto com sucesso.");
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível abrir o caixa.");
    } finally {
      setOpening(false);
    }
  }

  async function handleCloseCash() {
    if (!cash || cash.status === "fechado" || closing) {
      return;
    }

    const informedClosingAmount = await showNumberPrompt({
      title: "Fechar caixa",
      text: `O fechamento esperado é ${formatCurrency(cash.expectedClosingAmount || 0)}. Informe o valor contado para encerrar o caixa.`,
      inputLabel: "Valor contado no fechamento",
      inputValue: cash.expectedClosingAmount || 0,
      confirmButtonText: "Fechar caixa",
      validationMessage: "Informe um valor válido para o fechamento.",
    });

    if (informedClosingAmount === null) {
      return;
    }

    try {
      setClosing(true);
      const result = await closeTodayCash({
        informedClosingAmount,
        ...(selectedProfessionalId ? { professionalId: selectedProfessionalId } : {}),
      });
      setCash(result);
      await showSuccessAlert("Caixa fechado com sucesso.");
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Não foi possível fechar o caixa.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <section className="dashboard-page cash-page">
      <Header
        title="Caixa"
        subtitle={cash
          ? `Acompanhe o caixa ${cash.scope === "profissional" ? `de ${cash.professionalName || "profissional"}` : "da clínica"} em ${cash.dateLabel}.`
          : "Abra e acompanhe o caixa da clínica ou de um profissional com fechamento conferido."}
        actions={
          <div className="cash-actions">
            {scopeOptions.length > 0 ? (
              <select className="cash-scope-select" value={selectedScope} onChange={(event) => setSelectedScope(event.target.value)}>
                {scopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}

            <button type="button" className="btn-soft" onClick={handleOpenCash} disabled={opening || Boolean(cash)}>
              {opening ? "Abrindo..." : cash ? "Caixa já aberto" : "Abrir caixa"}
            </button>

            <button type="button" className="btn-primary" onClick={handleCloseCash} disabled={!cash || cash.status === "fechado" || closing}>
              {closing ? "Fechando..." : cash?.status === "fechado" ? "Caixa fechado" : "Fechar caixa"}
            </button>
          </div>
        }
      />

      <section className="kpi-grid">
        <KpiCard
          label="Abertura"
          value={formatCurrency(cash?.openingAmount || 0)}
          trend={cash ? "Valor inicial do caixa" : "Abra o caixa para iniciar o dia"}
        />
        <KpiCard
          label="Movimento líquido"
          value={formatCurrency(cash?.totalBalance || 0)}
          trend={cash?.status === "fechado" ? "Snapshot salvo" : "Entradas menos saídas do período"}
        />
        <KpiCard
          label="Fechamento esperado"
          value={formatCurrency(cash?.expectedClosingAmount || 0)}
          trend={cash?.status === "fechado" ? `Diferença: ${formatCurrency(cash?.differenceAmount || 0)}` : "Abertura + saldo líquido"}
        />
        <KpiCard
          label="Total pago"
          value={formatCurrency(cash?.totalPaid || 0)}
          trend={cash?.scope === "profissional" ? "Entradas recebidas pelo profissional" : "Entradas recebidas pela clínica"}
        />
      </section>

      <article className="panel cash-panel">
        <div className="cash-panel-header">
          <div>
            <h2>Movimentações do dia</h2>
            <p>
              {cash
                ? `${cash.movements?.length || 0} movimentações registradas neste caixa. ${cash.scope === "profissional" ? `Escopo atual: ${cash.professionalName || "profissional"}.` : "Escopo atual: clínica."}`
                : "Nenhum caixa foi aberto para o escopo selecionado hoje."}
            </p>
          </div>
          {cash ? <span className={`cash-status-badge cash-status-${cash.status}`}>{cash.status}</span> : null}
        </div>

        {loading ? <p className="agenda-feedback">Carregando caixa...</p> : null}
        {error ? <p className="agenda-feedback agenda-feedback-error">{error}</p> : null}

        {!loading && !error ? (
          !cash ? (
            <p className="agenda-feedback">Abra o caixa para começar a registrar o movimento deste escopo.</p>
          ) : cash?.movements?.length ? (
            <div className="cash-table-wrap">
              <table className="cash-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Profissional</th>
                    <th>Forma</th>
                    <th>Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {cash.movements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.hourLabel}</td>
                      <td>{movement.clientName}</td>
                      <td>{movement.serviceName}</td>
                      <td>{movement.professionalName}</td>
                      <td>{movement.paymentMethodLabel}</td>
                      <td>{formatCurrency(movement.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="agenda-feedback">Nenhuma movimentação paga entrou no caixa hoje.</p>
          )
        ) : null}
      </article>
    </section>
  );
}