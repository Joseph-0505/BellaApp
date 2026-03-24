import { useState } from "react";
import FormModalShell from "./FormModalShell";

const RISK_OPTIONS = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
];

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const ICON_OPTIONS = [
  { value: "face", label: "Facial" },
  { value: "syringe", label: "Injetavel" },
  { value: "wand", label: "Laser" },
  { value: "drop", label: "Corporal" },
  { value: "lotus", label: "Relaxamento" },
  { value: "flask", label: "Quimico" },
  { value: "spark", label: "Tecnologia" },
  { value: "pulse", label: "Energia" },
  { value: "leaf", label: "Bem-estar" },
];

export default function NovoServico({
  closeOnSave = true,
  description = "Defina precificacao, duracao e risco para manter o catalogo operacional da clinica.",
  initialValues = {},
  onClose,
  onSave,
  showCatalogExtras = true,
  submitLabel = "Salvar servico",
  title = "Novo Servico",
}) {
  const defaultProfessionals = Array.isArray(initialValues.professionals)
    ? initialValues.professionals.join(", ")
    : initialValues.professionals || "";

  const [formData, setFormData] = useState(() => {
    const baseState = {
      name: "",
      professionals: "",
      price: "",
      durationMinutes: "60",
      description: "",
      risk: "baixo",
      status: "ativo",
      icon: "face",
    };

    return {
      ...baseState,
      ...initialValues,
      professionals: defaultProfessionals,
      description: initialValues.description || initialValues.notes || "",
    };
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

    const professionals = String(formData.professionals)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const result = await onSave?.({
        id: initialValues.id || Date.now(),
        name: formData.name.trim(),
        professionals: professionals.length > 0 ? professionals : ["A definir"],
        price: Number(formData.price) || 0,
        durationMinutes: Number(formData.durationMinutes) || 60,
        description: formData.description.trim(),
        risk: formData.risk,
        status: formData.status,
        icon: formData.icon,
        soldCount: Number(initialValues.soldCount) || 0,
        notes: formData.description.trim(),
      });

      if (closeOnSave && result !== false) {
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormModalShell description={description} onClose={onClose} title={title}>
      <form className="form-modal-form" onSubmit={handleSubmit}>
        <div className="form-modal-grid">
          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-servico-nome">Nome do servico</label>
            <input
              id="novo-servico-nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Massagem modeladora"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-servico-preco">Preco</label>
            <input
              id="novo-servico-preco"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              placeholder="350"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-servico-duracao">Duracao (min)</label>
            <input
              id="novo-servico-duracao"
              name="durationMinutes"
              type="number"
              min="15"
              step="5"
              value={formData.durationMinutes}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-servico-status">Status</label>
            <select id="novo-servico-status" name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showCatalogExtras ? (
            <>
              <div className="form-modal-field">
                <label htmlFor="novo-servico-risco">Nivel de risco</label>
                <select id="novo-servico-risco" name="risk" value={formData.risk} onChange={handleChange}>
                  {RISK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-servico-icone">Icone</label>
                <select id="novo-servico-icone" name="icon" value={formData.icon} onChange={handleChange}>
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-servico-profissionais">Profissionais</label>
                <input
                  id="novo-servico-profissionais"
                  name="professionals"
                  value={formData.professionals}
                  onChange={handleChange}
                  placeholder="Dra. Ana, Camila Souza"
                />
              </div>
            </>
          ) : null}

          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-servico-detalhes">{showCatalogExtras ? "Detalhes operacionais" : "Descricao"}</label>
            <textarea
              id="novo-servico-detalhes"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={
                showCatalogExtras
                  ? "Ex: exige cabine 2, anestesico topico ou preparo previo."
                  : "Descreva rapidamente o servico."
              }
            />
          </div>
        </div>

        {showCatalogExtras ? (
          <div className="form-modal-helper">
            <strong>Observacao:</strong> profissionais podem ser informados separados por virgula. O servico entra
            ativo e pode ser reutilizado em outras telas com `initialValues`.
          </div>
        ) : (
          <div className="form-modal-helper">
            <strong>API:</strong> nesta tela sao persistidos apenas nome, descricao, preco, duracao e status.
          </div>
        )}

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
