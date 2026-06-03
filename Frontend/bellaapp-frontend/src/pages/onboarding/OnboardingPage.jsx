import { Building2, Clock3, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingStep from "../../components/onboarding/OnboardingStep";
import useAuth from "../../hooks/useAuth";
import { completeOnboarding } from "../../services/onboardingService";
import { showErrorAlert, showSuccessAlert } from "../../utils/alerts";
import "../../styles/onboarding/onboarding.css";

const DEFAULT_SCHEDULE = {
  mondayToFriday: { start: "08:00", end: "18:00" },
  saturday: { start: "08:00", end: "12:00" },
  sunday: { closed: true },
};

function buildSuccessMessage(result) {
  if (result?.created?.professional) {
    return "Clinica configurada. Seu profissional inicial e a agenda base ja estao prontos no dashboard.";
  }

  return "Clinica configurada. Sua agenda base ja esta pronta e o restante do setup continua no dashboard.";
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { onboarding, refreshCurrentUser, refreshOnboardingStatus, user } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const defaultSchedule = onboarding?.defaultSchedule || DEFAULT_SCHEDULE;
  const isValid = businessName.trim().length > 0;
  const displayName = user?.name || "sua conta";

  useEffect(() => {
    const initialBusinessName = onboarding?.businessName || user?.businessProfile?.businessName || "";
    setBusinessName((current) => current || initialBusinessName);
  }, [onboarding?.businessName, user?.businessProfile?.businessName]);

  async function handleFinish() {
    if (!isValid || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await completeOnboarding({
        businessName,
      });

      await showSuccessAlert(buildSuccessMessage(result), {
        confirmButtonText: "Ir para o dashboard",
        title: "Tudo pronto",
      });

      await Promise.all([refreshCurrentUser(), refreshOnboardingStatus()]);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      await showErrorAlert(requestError.message || "Nao foi possivel concluir a configuracao inicial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-shell">
        <aside className="onboarding-brand-panel">
          <span className="onboarding-chip">Configuracao inicial</span>

          <div className="onboarding-brand-copy">
            <h2>Vamos colocar sua clinica no ar em menos de um minuto.</h2>
            <p>
              Oi, {displayName}. Defina so o nome da clinica agora. O restante do setup segue dentro do
              dashboard com uma checklist guiada, sem travar sua entrada no sistema.
            </p>
          </div>

          <div className="onboarding-brand-highlights">
            <div className="onboarding-highlight-card">
              <span>
                <Sparkles size={18} />
              </span>
              <div>
                <strong>Setup minimo</strong>
                <small>Um unico passo para liberar o produto rapidamente.</small>
              </div>
            </div>

            <div className="onboarding-highlight-card">
              <span>
                <Clock3 size={18} />
              </span>
              <div>
                <strong>Agenda base</strong>
                <small>
                  Seg a sex {defaultSchedule.mondayToFriday.start} - {defaultSchedule.mondayToFriday.end}, sab{" "}
                  {defaultSchedule.saturday.start} - {defaultSchedule.saturday.end}.
                </small>
              </div>
            </div>
          </div>

          <div className="onboarding-summary-card">
            <h3>O que fica pronto ao finalizar</h3>
            <ul>
              <li>Nome da clinica aplicado ao painel</li>
              <li>Profissional inicial vinculado a sua conta</li>
              <li>Agenda padrao das 08h as 18h para comecar a operar</li>
              <li>Checklist progressiva no dashboard para servicos, clientes e agendamentos</li>
            </ul>
          </div>
        </aside>

        <main className="onboarding-card">
          <div className="onboarding-progress">
            <div className={`onboarding-progress-item is-current ${isValid ? "is-done" : ""}`}>
              <span className="onboarding-progress-index">1</span>
              <span className="onboarding-progress-label">Nome da clinica</span>
            </div>
          </div>

          <div className="onboarding-step-shell">
            <OnboardingStep
              eyebrow="Passo unico"
              title="Como sua clinica deve aparecer no sistema?"
              description="Use o nome principal do negocio. Voce pode continuar os cadastros essenciais direto do dashboard."
            >
              <div className="onboarding-step-layout">
                <div className="onboarding-input-stack">
                  <label className="onboarding-input-label" htmlFor="onboarding-business-name">
                    Nome da clinica
                  </label>
                  <div className="onboarding-input-with-icon">
                    <Building2 size={18} />
                    <input
                      id="onboarding-business-name"
                      type="text"
                      placeholder="Ex: Bella Estetica"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      maxLength={80}
                    />
                  </div>
                </div>

                <div className="onboarding-summary-card onboarding-summary-card-side">
                  <h3>Depois voce podera:</h3>
                  <ul>
                    <li>Criar o primeiro servico</li>
                    <li>Cadastrar o primeiro cliente</li>
                    <li>Montar o primeiro agendamento</li>
                  </ul>
                </div>
              </div>
            </OnboardingStep>
          </div>

          <footer className="onboarding-footer onboarding-footer-end">
            <button
              type="button"
              className="onboarding-primary-button onboarding-primary-button-strong"
              onClick={handleFinish}
              disabled={!isValid || submitting}
            >
              {submitting ? "Finalizando..." : "Ir para o dashboard"}
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}
