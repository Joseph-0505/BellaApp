import { useState } from "react";
import { NumericFormat } from "react-number-format";
import FormModalShell from "./FormModalShell";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const ICON_OPTIONS = [
  { value: "face", label: "Facial" },
  { value: "syringe", label: "Injetável" },
  { value: "wand", label: "Laser" },
  { value: "drop", label: "Corporal" },
  { value: "lotus", label: "Relaxamento" },
  { value: "flask", label: "Químico" },
  { value: "spark", label: "Tecnologia" },
  { value: "pulse", label: "Energia" },
  { value: "leaf", label: "Bem-estar" },
];

function normalizePriceValue(value) {
  if (value === "" || value == null) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  const normalizedValue = String(value || "")
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");

  const amount = Number(normalizedValue);
  return Number.isFinite(amount) ? String(amount) : "";
}

export default function NovoServico({
  closeOnSave = true,
  description = "Defina preço, duração e status para manter o catálogo de serviços atualizado.",
  initialValues = {},
  onClose,
  onSave,
  showCatalogExtras = true,
  submitLabel = "Salvar serviço",
  title = "Novo Serviço",
}) {
  const [formData, setFormData] = useState(() => {
    const baseState = {
      name: "",
      price: "",
      durationMinutes: "60",
      description: "",
      status: "ativo",
      icon: "face",
    };

    return {
      ...baseState,
      ...initialValues,
      price: normalizePriceValue(initialValues.price ?? baseState.price),
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

    try {
      const result = await onSave?.({
        name: formData.name.trim(),
        price: Number(formData.price || 0),
        durationMinutes: Number(formData.durationMinutes) || 60,
        description: formData.description.trim(),
        status: formData.status,
        icon: formData.icon,
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
            <label htmlFor="novo-servico-nome">Nome do serviço</label>
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
            <label htmlFor="novo-servico-preco">Preço</label>
            <NumericFormat
              id="novo-servico-preco"
              name="price"
              value={formData.price}
              valueIsNumericString
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              prefix="R$ "
              inputMode="numeric"
              onValueChange={({ value }) => {
                setFormData((current) => ({
                  ...current,
                  price: value,
                }));
              }}
              placeholder="R$ 350,00"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-servico-duracao">Duração (min)</label>
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
            <div className="form-modal-field">
              <label htmlFor="novo-servico-icone">Ícone</label>
              <select id="novo-servico-icone" name="icon" value={formData.icon} onChange={handleChange}>
                {ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-servico-detalhes">{showCatalogExtras ? "Detalhes do serviço" : "Descrição"}</label>
            <textarea
              id="novo-servico-detalhes"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={
                showCatalogExtras
                  ? "Ex: combinações indicadas, preparo prévio ou observações internas."
                  : "Descreva rapidamente o serviço."
              }
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
