import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../../services/api";
import { loginAndStoreSession, register } from "../../services/authService";
import "../../styles/auth.css";
import logo from "../../assets/logo.png";

const INITIAL_FORM_DATA = {
  businessName: "",
  cnpj: "",
  confirmPassword: "",
  cpf: "",
  email: "",
  name: "",
  password: "",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated()) {
    return <Navigate replace to="/dashboard" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "register") {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("As senhas nao coincidem.");
        }

        if (formData.cnpj.trim() && !formData.businessName.trim()) {
          throw new Error("Informe o nome do negocio ao preencher o CNPJ.");
        }

        await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          cpf: formData.cpf.trim(),
          ...(formData.businessName.trim()
            ? { businessName: formData.businessName.trim() }
            : {}),
          ...(formData.cnpj.trim() ? { cnpj: formData.cnpj.trim() } : {}),
        });
      }

      await loginAndStoreSession({
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel autenticar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <img className="logo" src={logo} alt="logo" />
          <h1 className="auth-titulo">Bem-vinda</h1>
          <p className="auth-subtitle">
            Gerencie seus horarios, clientes e atendimentos de forma simples e profissional.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-mode-toggle">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>
              Entrar
            </button>

            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Criar conta
            </button>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" ? (
              <>
                <div className="form-group">
                  <label>Seu nome</label>
                  <input
                    name="name"
                    placeholder="Ex: Jessica Almeida"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>CPF</label>
                  <input
                    name="cpf"
                    placeholder="Digite seu CPF"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nome do negocio</label>
                  <input
                    name="businessName"
                    placeholder="Ex: Bella Estetica"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>CNPJ</label>
                  <input
                    name="cnpj"
                    placeholder="Digite o CNPJ"
                    value={formData.cnpj}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : null}

            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Digite seu email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                name="password"
                type="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {mode === "register" ? (
              <div className="form-group">
                <label>Confirmar senha</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            ) : null}

            <button type="submit" className="auth-button" disabled={submitting}>
              {submitting ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
