import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../../assets/logo2.png";
import AuthPasswordField from "../../components/auth/AuthPasswordField";
import { activateInvitedAccount, getActivationStatus } from "../../services/authService";
import { showSuccessAlert } from "../../utils/alerts";
import { validatePassword, validatePasswordConfirmation } from "../../utils/userValidation";
import "../../styles/auth.css";

const INITIAL_FORM_DATA = {
  confirmPassword: "",
  password: "",
};

export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get("token") || "";

  useEffect(() => {
    let active = true;

    async function loadInvite() {
      if (!token) {
        setError("Link de ativacao invalido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getActivationStatus(token);

        if (!active) {
          return;
        }

        setInvite(data);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setInvite(null);
        setError(requestError.message || "Nao foi possivel validar o convite.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInvite();

    return () => {
      active = false;
    };
  }, [token]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const passwordError = validatePassword(formData.password);

      if (passwordError) {
        throw new Error(passwordError);
      }

      const confirmationError = validatePasswordConfirmation(formData.password, formData.confirmPassword);

      if (confirmationError) {
        throw new Error(confirmationError);
      }

      await activateInvitedAccount({
        token,
        password: formData.password,
      });

      await showSuccessAlert("Acesso criado com sucesso. Agora voce ja pode entrar com seu email e senha.", {
        title: "Conta ativada",
        confirmButtonText: "Ir para login",
      });

      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel criar seu acesso.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page auth-page-activation">
      <section className="auth-left">
        <div className="auth-brand auth-brand-surface auth-brand-compact">
          <div className="auth-brand-header">
            <span className="auth-chip">Convite BellaApp</span>
          </div>

          <div className="auth-brand-media">
            <img className="logo" src={logo} alt="Bella App" />
          </div>

          <div className="auth-brand-copy">
            <h1 className="auth-titulo">Crie seu acesso</h1>
            <p className="auth-subtitle">
              Defina sua senha para acessar a BellaApp com seu proprio login.
            </p>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-card auth-card-activation">
          <div className="auth-card-header">
            <h2>Ativar conta</h2>
            <p>
              {loading
                ? "Validando seu convite..."
                : invite
                  ? "Seu acesso sera liberado assim que a senha for criada."
                  : "Nao foi possivel validar esse convite."}
            </p>
          </div>

          {invite ? (
            <div className="auth-invite-summary">
              <div>
                <span>Clinica</span>
                <strong>{invite.clinicName}</strong>
              </div>
              <div>
                <span>Nome</span>
                <strong>{invite.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{invite.email}</strong>
              </div>
            </div>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <form onSubmit={handleSubmit} className="auth-form">
            <AuthPasswordField
              fieldId="activation-password"
              fieldName="password"
              helperText="Minimo de 8 caracteres com letra maiuscula, minuscula, numero e simbolo."
              label="Senha"
              onToggleVisibility={() => setShowPassword((current) => !current)}
              onValueChange={handleChange}
              placeholder="Crie sua senha"
              showPassword={showPassword}
              toggleLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              value={formData.password}
            />

            <AuthPasswordField
              fieldId="activation-confirm-password"
              fieldName="confirmPassword"
              label="Confirmar senha"
              onToggleVisibility={() => setShowConfirmPassword((current) => !current)}
              onValueChange={handleChange}
              placeholder="Repita sua senha"
              showPassword={showConfirmPassword}
              toggleLabel={showConfirmPassword ? "Ocultar confirmacao de senha" : "Mostrar confirmacao de senha"}
              value={formData.confirmPassword}
            />

            <button type="submit" className="auth-button" disabled={loading || submitting || !invite}>
              {submitting ? "Criando acesso..." : "Criar acesso"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
