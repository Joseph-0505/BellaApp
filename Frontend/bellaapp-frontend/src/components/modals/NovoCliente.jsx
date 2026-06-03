import { useState } from "react";
import FormModalShell from "./FormModalShell";
import { formatCpf, formatPhone, normalizeCpf, normalizeEmail } from "../../utils/formatters";

export default function NovoCliente({
  closeOnSave = true,
  description = "Edite e mantenha os dados do cliente sempre atualizados com facilidade.",
  initialValues = {},
  onClose,
  onSave,
  submitLabel = "Salvar cliente",
  title = "Novo Cliente",
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialValues.name || "",
    email: normalizeEmail(initialValues.email || ""),
    phone: formatPhone(initialValues.phone || ""),
    cpf: formatCpf(initialValues.cpf || ""),
    notes: initialValues.notes || "",
  }));
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        name === "phone"
          ? formatPhone(value)
          : name === "cpf"
            ? formatCpf(value)
            : name === "email"
              ? normalizeEmail(value)
              : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await onSave?.({
        name: formData.name.trim(),
        email: normalizeEmail(formData.email),
        phone: formatPhone(formData.phone).trim(),
        cpf: normalizeCpf(formData.cpf),
        notes: formData.notes.trim(),
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
            <label htmlFor="novo-cliente-nome">Nome completo</label>
            <input
              id="novo-cliente-nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Mariana Costa"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-cliente-email">E-mail</label>
            <input
              id="novo-cliente-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="cliente@empresa.com"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-cliente-telefone">Telefone</label>
            <input
              id="novo-cliente-telefone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              maxLength={15}
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-cliente-cpf">CPF</label>
            <input
              id="novo-cliente-cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
            />
          </div>

          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-cliente-observacoes">Observações</label>
            <textarea
              id="novo-cliente-observacoes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Anote preferências ou qualquer observação relevante."
            />
          </div>
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
