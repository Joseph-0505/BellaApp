import { useState } from "react";
import type { Appointment } from "../types/entities";
import type { AppointmentUpdateHandler } from "../types/profile";
import { showConfirmAlert } from "../utils/alerts";

interface UseAppointmentActionsProps {
  appointment: Nullable<Appointment>;
  onClose: () => void;
  onUpdate?: AppointmentUpdateHandler;
}

export default function useAppointmentActions({
  appointment,
  onClose,
  onUpdate,
}: UseAppointmentActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm(): Promise<void> {
    if (!appointment || !onUpdate || loading) {
      return;
    }

    try {
      setLoading(true);
      const result = await onUpdate(appointment.id, "confirmado");
      if (result !== false) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(): Promise<void> {
    if (!appointment || !onUpdate || loading) {
      return;
    }

    const confirmed = (await showConfirmAlert({
      title: "Cancelar agendamento?",
      text: "Tem certeza que deseja cancelar?",
      confirmButtonText: "Cancelar agendamento",
      cancelButtonText: "Voltar",
    })) as boolean;

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const result = await onUpdate(appointment.id, "cancelado");
      if (result !== false) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    handleConfirm,
    handleCancel,
  };
}
