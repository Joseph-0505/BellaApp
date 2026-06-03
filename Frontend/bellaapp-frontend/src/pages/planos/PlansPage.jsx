import { useEffect, useMemo, useState } from "react";
import Header from "../../components/layout/Header";
import { getCurrentPlan, getTrialDaysRemaining, upgradePlan } from "../../services/billingService";
import { showErrorAlert, showInfoAlert } from "../../utils/alerts";
import "../../styles/plans/plans.css";

const PLAN_FEATURES = {
  TRIAL: ["Acesso basico da plataforma", "Ate 1 profissional", "Validade de 7 dias"],
  INDIVIDUAL: ["Ideal para atendimento solo", "Ate 1 profissional", "Sem limite de tempo"],
  TEAM: ["Para clinicas com equipe", "Multiplos profissionais", "Sem limite de tempo"],
};

function getPlanTitle(plan) {
  if (plan === "TEAM") {
    return "Plano Team";
  }

  if (plan === "INDIVIDUAL") {
    return "Plano Individual";
  }

  return "Plano Trial";
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState("");
  const [currentPlan, setCurrentPlan] = useState(null);

  const trialDaysRemaining = useMemo(
    () => getTrialDaysRemaining(currentPlan?.trialEndsAt || null),
    [currentPlan?.trialEndsAt],
  );

  async function loadPlan() {
    try {
      setLoading(true);
      const planData = await getCurrentPlan();
      setCurrentPlan(planData);
    } catch (error) {
      await showErrorAlert(error?.message || "Nao foi possivel carregar os planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, []);

  async function handleUpgrade(nextPlan) {
    if (!currentPlan || nextPlan === currentPlan.plan) {
      return;
    }

    try {
      setSavingPlan(nextPlan);
      const upgraded = await upgradePlan(nextPlan);
      setCurrentPlan(upgraded);
      await showInfoAlert(`Plano atualizado para ${getPlanTitle(upgraded.plan)}.`, {
        title: "Upgrade realizado",
      });
    } catch (error) {
      await showErrorAlert(error?.message || "Nao foi possivel atualizar o plano.");
    } finally {
      setSavingPlan("");
    }
  }

  const plans = ["TRIAL", "INDIVIDUAL", "TEAM"];

  return (
    <section className="plans-page">
      <Header
        title="Planos"
        subtitle="Gerencie o plano da sua clinica e acompanhe o periodo de trial."
      />

      <section className="plans-summary-card">
        {loading ? (
          <p>Carregando plano atual...</p>
        ) : (
          <>
            <h2>{getPlanTitle(currentPlan?.plan || "TRIAL")}</h2>
            {currentPlan?.plan === "TRIAL" ? (
              <p>
                {trialDaysRemaining > 0
                  ? `Seu trial termina em ${trialDaysRemaining} dia(s).`
                  : "Seu trial expirou. Faca upgrade para continuar criando novos registros."}
              </p>
            ) : (
              <p>Seu plano esta ativo sem prazo de expiracao.</p>
            )}
          </>
        )}
      </section>

      <section className="plans-grid">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.plan === plan;
          const isUpgradeTarget = plan === "INDIVIDUAL" || plan === "TEAM";

          return (
            <article key={plan} className={`plan-card ${isCurrent ? "active" : ""}`}>
              <header>
                <h3>{getPlanTitle(plan)}</h3>
                {isCurrent ? <span className="plan-badge">Atual</span> : null}
              </header>

              <ul>
                {PLAN_FEATURES[plan].map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              {isUpgradeTarget ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || Boolean(savingPlan) || loading}
                >
                  {savingPlan === plan ? "Atualizando..." : isCurrent ? "Plano atual" : "Escolher plano"}
                </button>
              ) : (
                <button type="button" className="btn-soft" disabled>
                  {isCurrent ? "Plano atual" : "Somente leitura"}
                </button>
              )}
            </article>
          );
        })}
      </section>
    </section>
  );
}
