import { useState } from "react";
import "../../styles/auth.css";
import logo from "../../assets/logo.png";

export default function AuthPage() {
  const [mode, setMode] = useState("login");

  const [formData, setFormData] = useState({
    clinicName: "",
    email: "",
    cnpj: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (mode === "register") {
      if (formData.password !== formData.confirmPassword) {
        alert("As senhas não coincidem.");
        return;
      }

      const registerPayload = {
        role: "clinic",
        clinicName: formData.clinicName,
        email: formData.email,
        cnpj: formData.cnpj,
        password: formData.password,
      };

      console.log("Cadastro clínica:", registerPayload);
      return;
    }

    if (mode === "login") {
      const loginPayload = {
        email: formData.email,
        password: formData.password,
      };

      console.log("Login clínica:", loginPayload);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <img className="logo" src={logo} alt="logo"/>
          <h1 className="auth-titulo">
            Bem-vinda
          </h1>
          <p className="auth-subtitle">
            Gerencie seus horários, clientes e atendimentos de forma simples e profissional.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Entrar
            </button>

            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Criar conta
            </button>
          </div>

          

          <form onSubmit={handleSubmit} className="auth-form">

            {mode === "register" && (
              <div className="form-group">
                <label>Nome da clínica</label>
                <input
                  name="clinicName"
                  placeholder="Ex: Bella Estética"
                  value={formData.clinicName}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Digite seu email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label>CNPJ</label>
                <input
                  name="cnpj"
                  placeholder="Digite o CNPJ"
                  value={formData.cnpj}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label>Senha</label>
              <input
                name="password"
                type="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label>Confirmar senha</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            )}

            <button type="submit" className="auth-button">
              {mode === "login" ? "Entrar" : "Cadastrar clínica"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}