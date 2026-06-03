import { useState } from "react";
import FormModalShell from "./FormModalShell";
import { DEFAULT_ROOM_COLOR, normalizeRoomColor } from "../../utils/roomUtils";
import "../../styles/rooms/room-form-modal.css";

const STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const ROOM_COLOR_OPTIONS = [
  {
    value: "",
    label: "Padrao",
    hint: DEFAULT_ROOM_COLOR,
    swatch: DEFAULT_ROOM_COLOR,
  },
  {
    value: "#D97EA4",
    label: "Rosa",
    hint: "#D97EA4",
    swatch: "#D97EA4",
  },
  {
    value: "#E7B96D",
    label: "Dourado",
    hint: "#E7B96D",
    swatch: "#E7B96D",
  },
  {
    value: "#8DAA9D",
    label: "Sage",
    hint: "#8DAA9D",
    swatch: "#8DAA9D",
  },
  {
    value: "#7EA8D9",
    label: "Azul",
    hint: "#7EA8D9",
    swatch: "#7EA8D9",
  },
  {
    value: "#B59AE2",
    label: "Lavanda",
    hint: "#B59AE2",
    swatch: "#B59AE2",
  },
  {
    value: "#D39A8D",
    label: "Terracota",
    hint: "#D39A8D",
    swatch: "#D39A8D",
  },
];

export default function RoomFormModal({
  closeOnSave = true,
  description = "Cadastre nome, cor de identificacao e status operacional da sala.",
  initialValues = {},
  onClose,
  onSave,
  submitLabel = "Salvar sala",
  title = "Nova Sala",
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialValues.name || "",
    color: normalizeRoomColor(initialValues.color) || "",
    status: initialValues.status || "ativo",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const selectedColorOption =
    ROOM_COLOR_OPTIONS.find((option) => normalizeRoomColor(option.value) === formData.color) || ROOM_COLOR_OPTIONS[0];

  function handleChange(event) {
    const { name, value } = event.target;

    setFormError("");
    setFormData((current) => ({
      ...current,
      [name]: name === "color" ? value.toUpperCase() : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setFormError("Informe o nome da sala.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await onSave?.({
        name: formData.name.trim(),
        color: normalizeRoomColor(formData.color),
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
            <label htmlFor="nova-sala-nome">Nome da sala</label>
            <input
              id="nova-sala-nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Sala 01"
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="nova-sala-status">Status</label>
            <select id="nova-sala-status" name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="nova-sala-cor">Cor (opcional)</label>
            <div className="room-color-select-wrap">
              <span
                className="room-color-select-swatch"
                style={{ "--room-select-color": selectedColorOption.swatch }}
                aria-hidden="true"
              />

              <select id="nova-sala-cor" name="color" value={formData.color} onChange={handleChange}>
                {ROOM_COLOR_OPTIONS.map((option) => (
                  <option key={option.label} value={normalizeRoomColor(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {formError ? (
          <div className="form-modal-helper">
            <strong>Ajuste os dados da sala.</strong> {formError}
          </div>
        ) : null}

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
