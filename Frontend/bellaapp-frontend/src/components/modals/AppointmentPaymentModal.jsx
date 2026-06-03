import { useEffect, useMemo, useState } from "react";
import FormModalShell from "./FormModalShell";
import formatCurrency from "../../utils/formatters";
import {
  PAYMENT_METHOD_OPTIONS,
  RECEIVED_BY_OPTIONS,
  formatBillingStatusLabel,
  formatReceivedByLabel,
} from "../../utils/financeUtils";
import "../../styles/modals/payment-modal.css";

const PAYMENT_MODE_OPTIONS = [
  { value: "depois", label: "Registrar depois" },
  { value: "total", label: "Pagamento total" },
  { value: "parcial", label: "Pagamento parcial" },
];

export default function AppointmentPaymentModal({ appointment, onClose, onSave }) {
  const totalDue = useMemo(() => {
    const rawOutstanding = Number(appointment?.outstandingAmount ?? NaN);

    if (!Number.isNaN(rawOutstanding) && rawOutstanding > 0) {
      return rawOutstanding;
    }

    return Number(appointment?.billingAmount ?? appointment?.valorEstimado ?? 0);
  }, [appointment]);

  const totalAmount = Number(appointment?.billingAmount ?? appointment?.valorEstimado ?? 0);
  const alreadyPaid = Math.max(0, totalAmount - totalDue);
  const availableModes = appointment?.status === "concluido"
    ? PAYMENT_MODE_OPTIONS.filter((option) => option.value !== "depois")
    : PAYMENT_MODE_OPTIONS;

  const [formData, setFormData] = useState({
    receivedBy: appointment?.receivedBy || "clinica",
    paymentMode: appointment?.status === "concluido" ? "total" : "depois",
    paymentMethod: "pix",
    amount: totalDue > 0 ? String(totalDue.toFixed(2)) : "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      receivedBy: appointment?.receivedBy || "clinica",
      paymentMode: appointment?.status === "concluido" ? "total" : "depois",
      paymentMethod: "pix",
      amount: totalDue > 0 ? String(totalDue.toFixed(2)) : "",
      notes: "",
    });
  }, [appointment, totalDue]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const amount =
      formData.paymentMode === "parcial"
        ? Number(formData.amount || 0)
        : totalDue;

    if (formData.paymentMode === "parcial" && (!amount || amount <= 0 || amount > totalDue)) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await onSave?.({
        receivedBy: formData.receivedBy,
        paymentMode: formData.paymentMode,
        paymentMethod: formData.paymentMethod,
        amount,
        notes: formData.notes,
      });

      if (result !== false) {
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!appointment) {
    return null;
  }

  return (
    <FormModalShell
      description="Conclua o atendimento e registre o pagamento sem sair da agenda."
      onClose={onClose}
      size="wide"
      title="Receber atendimento"
    >
      <form className="form-modal-form payment-modal-form" onSubmit={handleSubmit}>
        <div className="payment-modal-layout">
          <div className="payment-modal-overview">
            <div className="payment-modal-summary">
              <div>
                <span>Cliente</span>
                <strong>{appointment.cliente || "Cliente não informado"}</strong>
              </div>
              <div>
                <span>Serviço</span>
                <strong>{appointment.servico || "Serviço não informado"}</strong>
              </div>
              <div>
                <span>Profissional</span>
                <strong>{appointment.profissional || "Profissional não vinculado"}</strong>
              </div>
              <div>
                <span>Status financeiro</span>
                <strong>{formatBillingStatusLabel(appointment.paymentStatus)}</strong>
              </div>
            </div>

            <div className="payment-modal-total-card">
              <span>Saldo para receber</span>
              <strong>{formatCurrency(totalDue)}</strong>
              {alreadyPaid > 0 ? <small>Já recebido: {formatCurrency(alreadyPaid)}</small> : null}
            </div>

            <div className="form-modal-helper payment-modal-helper-inline">
              <strong>{formatReceivedByLabel(formData.receivedBy)}</strong>
              {formData.receivedBy === "profissional"
                ? " recebe direto, então este lançamento não entra no caixa da clínica."
                : " recebe o valor, então a entrada aparece no caixa do dia."}
            </div>
          </div>

          <div className="payment-modal-controls">
            <div className="form-modal-field form-modal-field-full">
              <label>Recebido por</label>
              <div className="payment-choice-grid">
                {RECEIVED_BY_OPTIONS.map((option) => (
                  <label key={option.value} className={`payment-choice-card${formData.receivedBy === option.value ? " is-selected" : ""}`}>
                    <input
                      checked={formData.receivedBy === option.value}
                      name="receivedBy"
                      onChange={handleChange}
                      type="radio"
                      value={option.value}
                    />
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-modal-field form-modal-field-full">
              <label>Como deseja registrar</label>
              <div className="payment-choice-grid payment-choice-grid-compact">
                {availableModes.map((option) => (
                  <label key={option.value} className={`payment-choice-card${formData.paymentMode === option.value ? " is-selected" : ""}`}>
                    <input
                      checked={formData.paymentMode === option.value}
                      name="paymentMode"
                      onChange={handleChange}
                      type="radio"
                      value={option.value}
                    />
                    <strong>{option.label}</strong>
                  </label>
                ))}
              </div>
            </div>

            <div className="payment-modal-inline-grid">
              <div className="form-modal-field">
                <label htmlFor="appointment-payment-method">Forma de pagamento</label>
                <select
                  id="appointment-payment-method"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  disabled={formData.paymentMode === "depois"}
                >
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-modal-field">
                <label htmlFor="appointment-payment-amount">Valor</label>
                <input
                  id="appointment-payment-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={formData.paymentMode === "total" ? String(totalDue.toFixed(2)) : formData.amount}
                  onChange={handleChange}
                  disabled={formData.paymentMode !== "parcial"}
                />
              </div>
            </div>

            <div className="form-modal-field form-modal-field-full">
              <label htmlFor="appointment-payment-notes">Observações</label>
              <textarea
                id="appointment-payment-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ex: cliente pagou metade agora e volta amanhã para quitar."
              />
            </div>
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
            {submitting
              ? "Salvando..."
              : formData.paymentMode === "depois"
                ? "Concluir sem pagamento"
                : "Registrar pagamento"}
          </button>
        </div>
      </form>
    </FormModalShell>
  );
}