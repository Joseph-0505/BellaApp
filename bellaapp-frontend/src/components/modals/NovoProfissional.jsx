import { useState } from "react";
import FormModalShell from "./FormModalShell";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

function statusLabel(status) {
  return status === "ativo" ? "Ativo" : "Inativo";
}

export default function NovoProfissional({
  closeOnSave = true,
  description = "Cadastre nome, especialidade, contato e status operacional do profissional.",
  initialValues = {},
  onClose,
  onSave,
  submitLabel = "Salvar profissional",
  title = "Novo Profissional",
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialValues.name || "",
    specialty: initialValues.specialty || initialValues.role || "",
    email: initialValues.email || "",
    phone: initialValues.phone || "",
    status: initialValues.status || "ativo",
  }));
  const [submitting, setSubmitting] = useState(false);

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

    try {
      const result = await onSave?.({
        name: formData.name.trim(),
        specialty: formData.specialty.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        status: formData.status,
      });

      if (closeOnSave && result !== false) {
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormModalShell description={description} onClose={onClose} size="compact" title={title}>
      <form className="form-modal-form" onSubmit={handleSubmit}>
        <div className="form-modal-grid">
          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-profissional-nome">Nome completo</label>
            <input
              id="novo-profissional-nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Dra. Mariana Souza"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-especialidade">Especialidade</label>
            <input
              id="novo-profissional-especialidade"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              placeholder="Ex: Fisioterapeuta"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-status">Status</label>
            <select id="novo-profissional-status" name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-email">E-mail</label>
            <input
              id="novo-profissional-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="profissional@empresa.com"
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-profissional-telefone">Telefone</label>
            <input
              id="novo-profissional-telefone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              required
            />
          </div>
        </div>

        <div className="form-modal-preview">
          <strong>Preview:</strong> {formData.name.trim() || "Novo profissional"} |{" "}
          {formData.specialty.trim() || "Especialidade"} | {statusLabel(formData.status)}
        </div>

        <div className="form-modal-footer">
          <button
            type="button"
            className="form-modal-button form-modal-button-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>

          <button type="submit" className="form-modal-button form-modal-button-primary" disabled={submitting}>
            {submitting ? "Salvando..." : submitLabel}
          </button>
        </div>
      </form>
    </FormModalShell>
  );
}
