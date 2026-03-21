import { useState } from "react";

export default function useAppointmentActions({ appointment, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);

  const STATUS = {
    CONFIRMADO: "confirmado",
    CANCELADO: "cancelado",
  };

  function handleConfirm() {
    if (!onUpdate || loading) return;

    setLoading(true);

    onUpdate(appointment.id, STATUS.CONFIRMADO);
    onClose();
  }

  function handleCancel() {
    if (!onUpdate || loading) return;

    const confirm = window.confirm("Tem certeza que deseja cancelar?");
    if (!confirm) return;

    setLoading(true);

    onUpdate(appointment.id, STATUS.CANCELADO);
    onClose();
  }

  return {
    loading,
    handleConfirm,
    handleCancel,
  };
}