import formatCurrency from "../utils/formatters";
import type { Appointment, AppointmentStatus } from "../types/entities";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default class AppointmentModel {
  constructor(private readonly appointment: Appointment) {}

  get clientName(): string {
    return this.appointment.cliente || "-";
  }

  get serviceName(): string {
    return this.appointment.servico || "-";
  }

  get professionalName(): string {
    return this.appointment.profissional || "Não vinculado";
  }

  get roomName(): string {
    return this.appointment.sala || "Sem sala definida";
  }

  get formattedDate(): string {
    if (!this.appointment.day) {
      return "-";
    }

    return new Intl.DateTimeFormat("pt-BR").format(
      new Date(`${this.appointment.day}T12:00:00`),
    );
  }

  get hour(): string {
    return this.appointment.hour || "-";
  }

  get statusLabel(): string {
    return (
      STATUS_LABELS[this.appointment.status] || this.appointment.status || "-"
    );
  }

  get notesLabel(): string {
    return this.appointment.observacoes || "Sem observações registradas.";
  }

  get estimatedValueLabel(): string {
    return formatCurrency(this.appointment.valorEstimado);
  }
}
