import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../Button";
import { colors } from "../../global/colors";
import { formatRequestError } from "../../utils/request-errors";

interface Props { onEdit: () => void; onDelete: () => Promise<void>; name: string }

export function RecordActions({ onEdit, onDelete, name }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (busy) return;
    setBusy(true); setError("");
    try { await onDelete(); }
    catch (e) { setError(formatRequestError(e, "Não foi possível excluir. Verifique se há registros vinculados.")); }
    finally { setBusy(false); }
  }
  return <View style={{ gap: 12, marginBottom: 16 }}>
    {confirming ? <>
      <Text style={{ color: colors.text }}>Excluir “{name}”? Esta ação não pode ser desfeita.</Text>
      <Button title="Confirmar exclusão" variant="danger" loading={busy} onPress={() => void remove()} />
      <Button title="Cancelar" disabled={busy} onPress={() => { setConfirming(false); setError(""); }} />
    </> : <>
      <Button title="Editar" onPress={onEdit} />
      <Button title="Excluir" variant="danger" onPress={() => setConfirming(true)} />
    </>}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error }}>{error}</Text> : null}
  </View>;
}
