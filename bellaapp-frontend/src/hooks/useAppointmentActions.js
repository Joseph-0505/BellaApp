import { useState } from "react";

export default function useAppointmentActions({ appointment, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!onUpdate || loading) return;

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

  async function handleCancel() {
    if (!onUpdate || loading) return;

    const confirm = window.confirm("Tem certeza que deseja cancelar?");
    if (!confirm) return;

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
