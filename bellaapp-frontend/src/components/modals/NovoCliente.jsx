import { useState } from "react";
import FormModalShell from "./FormModalShell";

const STATUS_OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "risco", label: "Risco alto" },
];

const AVATAR_TONES = ["rose", "sand", "sage", "stone", "mist", "plum", "mint", "steel"];

function toPtBrDate(value) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${value}T12:00:00`));
}

function pickAvatarTone(name) {
  const score = name.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_TONES[score % AVATAR_TONES.length];
}

export default function NovoCliente({
  closeOnSave = true,
  description = "Cadastre um cliente e insira as informações básicas para a equipe comercial.",
  initialValues = {},
  onClose,
  onSave,
  professionals = ["Dra. Ana", "Dra. Rafaela", "Rodrigo Lunda"],
  showCommercialFields = true,
  submitLabel = "Salvar cliente",
  title = "Novo Cliente",
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    professional: professionals[0] || "",
    nextAppointment: "",
    status: "novo",
    totalSpent: "",
    notes: "",
    ...initialValues,
  });
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

    const client = {
      id: initialValues.id || Date.now(),
      name: formData.name.trim(),
      email: formData.email.trim() || `${formData.name.trim().toLowerCase().replace(/\s+/g, ".")}@bella.com`,
      phone: formData.phone.trim(),
      cpf: formData.cpf.trim(),
      notes: formData.notes.trim(),
      latestVisit: initialValues.latestVisit || new Intl.DateTimeFormat("pt-BR").format(new Date()),
      latestVisitNote: formData.notes.trim() || initialValues.latestVisitNote || "Novo cadastro realizado",
      nextAppointment: toPtBrDate(formData.nextAppointment),
      professional: formData.professional || "A definir",
      totalSpent: Number(formData.totalSpent) || 0,
      status: formData.status,
      avatarTone: initialValues.avatarTone || pickAvatarTone(formData.name.trim()),
    };

    try {
      const result = await onSave?.(client);
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
              placeholder="cliente@bella.com"
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-cliente-telefone">Telefone</label>
            <input
              id="novo-cliente-telefone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
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
              placeholder="Digite o CPF"
            />
          </div>

          {showCommercialFields ? (
            <>
              <div className="form-modal-field">
                <label htmlFor="novo-cliente-profissional">Profissional principal</label>
                <select
                  id="novo-cliente-profissional"
                  name="professional"
                  value={formData.professional}
                  onChange={handleChange}
                >
                  {professionals.map((professional) => (
                    <option key={professional} value={professional}>
                      {professional}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-cliente-status">Status</label>
                <select id="novo-cliente-status" name="status" value={formData.status} onChange={handleChange}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-cliente-proximo">Próximo atendimento</label>
                <input
                  id="novo-cliente-proximo"
                  name="nextAppointment"
                  type="date"
                  value={formData.nextAppointment}
                  onChange={handleChange}
                />
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-cliente-gasto">Total gasto inicial</label>
                <input
                  id="novo-cliente-gasto"
                  name="totalSpent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalSpent}
                  onChange={handleChange}
                  placeholder="0,00"
                />
              </div>
            </>
          ) : null}

          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-cliente-observacoes">Observações</label>
            <textarea
              id="novo-cliente-observacoes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Anote preferencias, retorno comercial ou qualquer observacao relevante."
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
