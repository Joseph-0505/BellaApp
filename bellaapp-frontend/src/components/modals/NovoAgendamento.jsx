import { useMemo, useState } from "react";
import FormModalShell from "./FormModalShell";

const API_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "cancelado", label: "Cancelado" },
];

const LEGACY_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "concluido", label: "Concluido" },
  { value: "cancelado", label: "Cancelado" },
];

const RISK_OPTIONS = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
];

export default function NovoAgendamento({
  apiMode = false,
  clients = [],
  closeOnSave = true,
  description = "Monte um agendamento rapido com cliente, servico e janela operacional da agenda.",
  onClose,
  onSave,
  hours = [],
  defaultDate = "",
  initialValues = {},
  services = [],
  submitLabel = "Salvar agendamento",
  title = "Novo Agendamento",
}) {
  const availableHours = hours.length > 0 ? hours : ["09:00", "10:00", "11:00", "14:00", "15:00"];
  const resolvedDate = initialValues.data || initialValues.day || defaultDate || new Date().toISOString().split("T")[0];
  const resolvedHour = initialValues.hora || initialValues.hour || availableHours[0] || "09:00";
  const statusOptions = apiMode ? API_STATUS_OPTIONS : LEGACY_STATUS_OPTIONS;

  const [formData, setFormData] = useState(() => {
    const baseState = {
      clientId: clients[0]?.id || "",
      serviceId: services[0]?.id || "",
      cliente: "",
      servico: "",
      profissional: "Nao definido",
      data: defaultDate || new Date().toISOString().split("T")[0],
      hora: availableHours[0] || "09:00",
      recurso: "",
      status: "pendente",
      riscoNoShow: "baixo",
      valorEstimado: "",
      duracaoMin: "60",
      observacoes: "",
    };

    return {
      ...baseState,
      ...initialValues,
      data: resolvedDate,
      hora: resolvedHour,
      clientId: initialValues.clientId || baseState.clientId,
      serviceId: initialValues.serviceId || baseState.serviceId,
    };
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === formData.serviceId) || null,
    [formData.serviceId, services]
  );

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
      let payload;

      if (apiMode) {
        const selectedClient = clients.find((client) => client.id === formData.clientId);

        payload = {
          id: initialValues.id || Date.now(),
          clientId: formData.clientId,
          serviceId: formData.serviceId,
          day: formData.data,
          hour: formData.hora,
          data: formData.data,
          hora: formData.hora,
          cliente: selectedClient?.name || "",
          servico: selectedService?.name || "",
          profissional: "Nao definido",
          status: formData.status,
          recurso: "Nao definido",
          riscoNoShow: "baixo",
          valorEstimado: Number(selectedService?.price || 0),
          duracaoMin: Number(selectedService?.durationMinutes || 0),
          observacoes: formData.observacoes.trim(),
          notes: formData.observacoes.trim(),
        };
      } else {
        payload = {
          id: initialValues.id || Date.now(),
          day: formData.data,
          hour: formData.hora,
          cliente: formData.cliente.trim(),
          servico: formData.servico.trim(),
          profissional: formData.profissional.trim(),
          status: formData.status,
          recurso: formData.recurso.trim() || "A definir",
          riscoNoShow: formData.riscoNoShow,
          valorEstimado: Number(formData.valorEstimado) || 0,
          duracaoMin: Number(formData.duracaoMin) || 60,
          observacoes: formData.observacoes.trim(),
        };
      }

      const result = await onSave?.(payload);
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
          {apiMode ? (
            <>
              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-cliente">Cliente</label>
                <select
                  id="novo-agendamento-cliente"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleChange}
                  required
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-servico">Servico</label>
                <select
                  id="novo-agendamento-servico"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  required
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-cliente">Cliente</label>
                <input
                  id="novo-agendamento-cliente"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  placeholder="Ex: Mariana Costa"
                  required
                />
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-servico">Servico</label>
                <input
                  id="novo-agendamento-servico"
                  name="servico"
                  value={formData.servico}
                  onChange={handleChange}
                  placeholder="Ex: Limpeza de Pele"
                  required
                />
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-profissional">Profissional</label>
                <input
                  id="novo-agendamento-profissional"
                  name="profissional"
                  value={formData.profissional}
                  onChange={handleChange}
                  placeholder="Dra. Ana"
                  required
                />
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-recurso">Recurso / sala</label>
                <input
                  id="novo-agendamento-recurso"
                  name="recurso"
                  value={formData.recurso}
                  onChange={handleChange}
                  placeholder="Cabine 1"
                />
              </div>
            </>
          )}

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-data">Data</label>
            <input
              id="novo-agendamento-data"
              name="data"
              type="date"
              value={formData.data}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-hora">Horario</label>
            <select id="novo-agendamento-hora" name="hora" value={formData.hora} onChange={handleChange}>
              {availableHours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </div>

          <div className="form-modal-field">
            <label htmlFor="novo-agendamento-status">Status inicial</label>
            <select id="novo-agendamento-status" name="status" value={formData.status} onChange={handleChange}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {apiMode ? null : (
            <>
              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-risco">Risco de no-show</label>
                <select
                  id="novo-agendamento-risco"
                  name="riscoNoShow"
                  value={formData.riscoNoShow}
                  onChange={handleChange}
                >
                  {RISK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-valor">Valor estimado</label>
                <input
                  id="novo-agendamento-valor"
                  name="valorEstimado"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorEstimado}
                  onChange={handleChange}
                  placeholder="250"
                />
              </div>

              <div className="form-modal-field">
                <label htmlFor="novo-agendamento-duracao">Duracao (min)</label>
                <input
                  id="novo-agendamento-duracao"
                  name="duracaoMin"
                  type="number"
                  min="15"
                  step="5"
                  value={formData.duracaoMin}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-modal-field form-modal-field-full">
            <label htmlFor="novo-agendamento-observacoes">Observacoes</label>
            <textarea
              id="novo-agendamento-observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Ex: confirmar com 24h de antecedencia ou levar ficha assinada."
            />
          </div>
        </div>

        <div className="form-modal-helper">
          {apiMode ? (
            <>
              <strong>API:</strong> o agendamento sera salvo com cliente, servico, data, horario, status e
              observacoes.
            </>
          ) : (
            <>
              <strong>Agenda:</strong> esse modal agora aceita `initialValues`, `hours`, `title` e `submitLabel`, entao
              pode ser reutilizado em qualquer pagina.
            </>
          )}
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
